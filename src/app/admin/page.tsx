"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminTicketsManager } from "@/components/admin/AdminTicketsManager";
import { SetupGuideModal } from "@/components/guide/SetupGuideModal";
import { UserSwitchModal } from "@/components/auth/UserSwitchModal";
import { Client, UserWorkspace } from "@/types/whatsapp";
import { supabase } from "@/lib/supabase/client";
import {
  fetchClients,
  createClientAccount,
  deleteClientAccount,
} from "@/lib/supabase/service";
import {
  getStoredSession,
  clearStoredSession,
  isSuperAdmin,
  AuthUser,
} from "@/lib/auth-session";

export default function AdminPage() {
  const router = useRouter();
  const [authSession, setAuthSession] = useState<AuthUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [totalMessagesCount, setTotalMessagesCount] = useState<number>(0);
  const [activeAdminTab, setActiveAdminTab] = useState<"clients" | "tickets">("clients");
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);

  // 1. Check Auth & Permissions
  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }

    if (!isSuperAdmin(session)) {
      // Forbidden: clients cannot access /admin
      router.push("/app");
      return;
    }

    setAuthSession(session);
    setIsAuthorized(true);
  }, [router]);

  // 2. Load Clients & Analytics
  const loadClientsList = async () => {
    try {
      const data = await fetchClients();
      if (Array.isArray(data) && data.length > 0) {
        setClients(data);
      }

      // Count total system messages
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true });
      if (typeof count === "number") {
        setTotalMessagesCount(count);
      }
    } catch (err) {
      console.error("Error loading clients list:", err);
    }
  };

  const loadOpenTicketsCount = async () => {
    try {
      const { count } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      if (typeof count === "number") {
        setOpenTicketsCount(count);
      }
    } catch (err) {
      console.error("Error loading open tickets count:", err);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadClientsList();
      loadOpenTicketsCount();

      const channel = supabase
        .channel("admin_tickets_badge_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_tickets" },
          () => {
            loadOpenTicketsCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthorized]);

  // Admin Actions
  const handleAdminCreateClient = async (data: {
    name: string;
    businessName: string;
    email: string;
    phone?: string;
    password?: string;
  }) => {
    const created = await createClientAccount(data);
    if (created) {
      setClients((prev) => [created, ...prev]);
      // Navigate to newly created workspace
      router.push(`/app?client=${created.id}&tab=settings`);
    }
  };

  const handleAdminDeleteClient = async (clientId: string) => {
    const ok = await deleteClientAccount(clientId);
    if (ok) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    }
  };

  const handleLogout = () => {
    clearStoredSession();
    router.push("/login");
  };

  const allWorkspaces: UserWorkspace[] = clients.map((c) => ({
    id: c.id,
    name: `${c.name} (${c.businessName})`,
    email: c.email,
    role: "client",
    verifyToken: c.verifyToken,
  }));

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F7F7F2] flex items-center justify-center font-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0A504A]/20 border-t-[#00A86B] rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#0A504A]">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col lg:flex-row font-secondary antialiased text-slate-800">
      {/* Super Admin Navigation Sidebar */}
      <Sidebar
        viewMode="admin"
        onSwitchViewMode={() => router.push("/app")}
        activeTab="inbox"
        setActiveTab={() => {}}
        pendingHumanCount={0}
        currentUser={{
          id: "admin",
          name: "Platform Admin",
          email: authSession?.email || "admin@zynex.lk",
          role: "admin",
          verifyToken: "zynex_meta_webhook_secret_2026",
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
        onViewLanding={() => router.push("/")}
        onLogout={handleLogout}
        userEmail={authSession?.email}
        isOwnerAdmin={true}
        adminTab={activeAdminTab}
        onSelectAdminTab={setActiveAdminTab}
        openTicketsCount={openTicketsCount}
      />

      {/* Main Admin Control Center */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {activeAdminTab === "clients" ? (
          <AdminDashboard
            clients={clients}
            totalMessagesCount={totalMessagesCount}
            onSelectClientWorkspace={(clientId) => {
              router.push(`/app?client=${clientId}`);
            }}
            onCreateClient={handleAdminCreateClient}
            onDeleteClient={handleAdminDeleteClient}
            onRefresh={loadClientsList}
          />
        ) : (
          <AdminTicketsManager
            clients={clients}
            onSelectClientWorkspace={(clientId) => {
              router.push(`/app?client=${clientId}`);
            }}
          />
        )}
      </main>

      {/* Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        verifyToken="zynex_meta_webhook_secret_2026"
        webhookUrl="https://zynexwpp.loca.lt/api/webhook"
      />

      {/* Workspace Switcher Modal for Admin */}
      <UserSwitchModal
        isOpen={isUserSwitchOpen}
        onClose={() => setIsUserSwitchOpen(false)}
        currentUser={{
          id: "admin",
          name: "Platform Admin",
          email: authSession?.email || "admin@zynex.lk",
          role: "admin",
          verifyToken: "zynex_meta_webhook_secret_2026",
        }}
        allUsers={allWorkspaces}
        onSelectUser={(user) => {
          setIsUserSwitchOpen(false);
          router.push(`/app?client=${user.id}`);
        }}
        onCreateUser={async (newUser) => {
          await handleAdminCreateClient({
            name: newUser.name,
            businessName: newUser.name,
            email: newUser.email,
          });
        }}
      />
    </div>
  );
}

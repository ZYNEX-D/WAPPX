"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar, ActiveTab } from "@/components/navigation/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { LiveInbox } from "@/components/inbox/LiveInbox";
import { FlowBuilder } from "@/components/flow-builder/FlowBuilder";
import { WhatsAppSimulator } from "@/components/simulator/WhatsAppSimulator";
import { MetaSettings } from "@/components/settings/MetaSettings";
import { ContactsView } from "@/components/contacts/ContactsView";
import { CampaignManager } from "@/components/campaigns/CampaignManager";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { IntegrationsHub } from "@/components/integrations/IntegrationsHub";
import { SetupGuideModal } from "@/components/guide/SetupGuideModal";
import { UserSwitchModal } from "@/components/auth/UserSwitchModal";
import { CatalogManager } from "@/components/catalog/CatalogManager";
import {
  initialContacts,
  initialFlowNodes,
  initialMessages,
  initialMetaConfig,
} from "@/lib/initial-data";
import { Contact, FlowNode, Message, MetaConfig, UserWorkspace, Client, CatalogPayload, BusinessCatalog } from "@/types/whatsapp";
import { supabase } from "@/lib/supabase/client";
import {
  fetchClients,
  createClientAccount,
  fetchContacts,
  fetchMessages,
  fetchFlowNodes,
  fetchMetaConfig,
  fetchCatalogs,
  saveCatalog,
  deleteCatalog,
  saveMessage,
  saveContact,
  updateContactFields,
  saveFlowNodes,
  saveMetaConfig,
  mapMessageFromRow,
  mapContactFromRow,
} from "@/lib/supabase/service";
import {
  getStoredSession,
  clearStoredSession,
  isSuperAdmin,
  AuthUser,
} from "@/lib/auth-session";
import { Bell, ArrowRight, X } from "lucide-react";

interface ClientWorkspaceProps {
  initialClientId?: string;
  initialTab?: ActiveTab;
}

export function ClientWorkspace({
  initialClientId,
  initialTab = "inbox",
}: ClientWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameter overrides
  const clientQueryParam = searchParams.get("client");
  const tabQueryParam = (searchParams.get("tab") as ActiveTab) || initialTab;

  const [authSession, setAuthSession] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabQueryParam);
  const [currentClientId, setCurrentClientId] = useState<string>(
    clientQueryParam || initialClientId || "client-1"
  );

  // Tab switch that keeps URL in sync — preserves tab on refresh
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.replace(`/app?${params.toString()}`, { scroll: false });
  };
  const [clients, setClients] = useState<Client[]>([]);

  // Workspace data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(initialFlowNodes);
  const [isFlowsLoaded, setIsFlowsLoaded] = useState(false);
  const [metaConfig, setMetaConfig] = useState<MetaConfig>(initialMetaConfig);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [catalogs, setCatalogs] = useState<BusinessCatalog[]>([]);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);

  // Notification for incoming handoff
  const [handoffAlert, setHandoffAlert] = useState<{
    contactName: string;
    message: string;
  } | null>(null);

  // 1. Check Auth & Session
  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setAuthSession(session);

    // If client is logged in and not admin, enforce their own clientId
    if (!isSuperAdmin(session) && session.clientId) {
      setCurrentClientId(session.clientId);
    } else if (clientQueryParam) {
      setCurrentClientId(clientQueryParam);
    }
  }, [router, clientQueryParam]);

  // 2. Load Clients (for admin switching or workspace details)
  useEffect(() => {
    async function loadClients() {
      try {
        const data = await fetchClients();
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
        }
      } catch (err) {
        console.error("Error loading clients:", err);
      }
    }
    loadClients();
  }, []);

  // 3. Load workspace data for currentClientId
  useEffect(() => {
    let isMounted = true;
    setIsFlowsLoaded(false);

    // 1. Fetch flow nodes immediately from database
    fetchFlowNodes(currentClientId)
      .then((fetchedFlows) => {
        if (isMounted) {
          if (Array.isArray(fetchedFlows) && fetchedFlows.length > 0) {
            setFlowNodes(fetchedFlows);
          }
          setIsFlowsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Error loading flow nodes:", err);
        if (isMounted) setIsFlowsLoaded(true);
      });

    // 2. Fetch contacts
    fetchContacts(currentClientId)
      .then((fetchedContacts) => {
        if (isMounted) {
          if (Array.isArray(fetchedContacts) && fetchedContacts.length > 0) {
            setContacts(fetchedContacts);
            setSelectedContactId((prev) => {
              if (prev && fetchedContacts.some((c) => c.id === prev)) return prev;
              return fetchedContacts[0].id;
            });
          } else {
            setContacts([]);
            setSelectedContactId("");
          }
        }
      })
      .catch((err) => console.error("Error loading contacts:", err));

    // 3. Fetch messages
    fetchMessages(currentClientId)
      .then((fetchedMessages) => {
        if (isMounted) {
          if (fetchedMessages && Object.keys(fetchedMessages).length > 0) {
            setMessages(fetchedMessages);
          } else {
            setMessages({});
          }
        }
      })
      .catch((err) => console.error("Error loading messages:", err));

    // 4. Fetch meta config
    fetchMetaConfig(currentClientId)
      .then((fetchedMeta) => {
        if (isMounted && fetchedMeta) {
          setMetaConfig(fetchedMeta);
        }
      })
      .catch((err) => console.error("Error loading meta config:", err));

    // 5. Fetch catalogs & products
    fetchCatalogs(currentClientId)
      .then((fetchedCats) => {
        if (isMounted && Array.isArray(fetchedCats)) {
          setCatalogs(fetchedCats);
        }
      })
      .catch((err) => console.error("Error loading catalogs:", err));

    // Supabase Realtime channel for live messages & contacts
    const channel = supabase
      .channel(`wppx-realtime-${currentClientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow || !newRow.contact_id) return;
          if (newRow.user_id && newRow.user_id !== currentClientId) return;

          const mappedMsg = mapMessageFromRow(newRow);
          setMessages((prev) => {
            const list = prev[newRow.contact_id] || [];
            if (list.some((m) => m.id === mappedMsg.id)) return prev;
            return {
              ...prev,
              [newRow.contact_id]: [...list, mappedMsg],
            };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.user_id && row.user_id !== currentClientId) return;

          if (payload.eventType === "INSERT") {
            const newContact = mapContactFromRow(payload.new as any);
            setContacts((prev) => {
              if (prev.some((c) => c.id === newContact.id)) return prev;
              return [newContact, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedContact = mapContactFromRow(payload.new as any);
            setContacts((prev) =>
              prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setContacts((prev) => prev.filter((c) => c.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentClientId]);

  const activeClientObj = clients.find((c) => c.id === currentClientId) || {
    id: currentClientId,
    name: "Tharusha Damsara",
    businessName: "Apex Commerce",
    email: "tharusha@zynex.lk",
    phone: "+94 72 973 1508",
    verifyToken: metaConfig.verifyToken || "wppx_meta_webhook_secret_2026",
    status: "active" as const,
  };

  const currentWorkspaceUser: UserWorkspace = {
    id: activeClientObj.id,
    name: `${activeClientObj.name} (${activeClientObj.businessName})`,
    email: activeClientObj.email,
    role: "client",
    verifyToken: activeClientObj.verifyToken,
  };

  const allWorkspaces: UserWorkspace[] = clients.map((c) => ({
    id: c.id,
    name: `${c.name} (${c.businessName})`,
    email: c.email,
    role: "client",
    verifyToken: c.verifyToken,
  }));

  const pendingHumanCount = contacts.filter((c) => c.status === "pending_human").length;

  const handleSendMessage = async (
    contactId: string,
    text: string,
    isInternalNote = false,
    mediaUrl?: string,
    mediaType?: "image" | "audio" | "document",
    catalog?: CatalogPayload
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      senderName: `${activeClientObj.name} (Agent)`,
      text,
      timestamp: timeStr,
      status: "delivered",
      isInternalNote,
      userId: currentClientId,
      mediaUrl,
      mediaType,
      catalog,
    };

    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

    if (!isInternalNote) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                lastMessageSnippet: catalog ? `🛍️ ${catalog.catalogName || "WhatsApp Catalog"}` : text,
                lastMessageTime: timeStr,
              }
            : c
        )
      );
    }

    await saveMessage(contactId, newMsg, currentClientId);

    // If not an internal note, dispatch outbound message directly to customer's WhatsApp
    if (!isInternalNote) {
      const targetContact = contacts.find((c) => c.id === contactId);
      if (targetContact?.phone) {
        fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumberId: metaConfig.phoneNumberId,
            accessToken: metaConfig.accessToken,
            recipientPhone: targetContact.phone,
            text,
            buttons: newMsg.buttons,
            catalog,
            mediaUrl,
            mediaType,
            contactId,
            messageId: newMsg.id,
            userId: currentClientId,
          }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (!data.success && data.error) {
              console.warn("[ClientWorkspace] Outbound WhatsApp dispatch notice:", data.error);
            }
          })
          .catch((err) => {
            console.error("[ClientWorkspace] Failed to send outbound WhatsApp message:", err);
          });
      }
    }
  };

  const handleToggleBot = async (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    const newIsBotActive = !target.isBotActive;
    const newStatus = !newIsBotActive ? "active" : target.status;

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              isBotActive: newIsBotActive,
              status: newStatus,
            }
          : c
      )
    );

    await updateContactFields(
      contactId,
      {
        is_bot_active: newIsBotActive,
        status: newStatus,
      },
      currentClientId
    );
  };

  const handleAssignAgent = async (contactId: string, agentName: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, assignedAgent: agentName } : c
      )
    );

    await updateContactFields(contactId, { assigned_agent: agentName }, currentClientId);
  };

  const handleAddTag = async (contactId: string, tag: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target || target.tags.includes(tag)) return;
    const newTags = [...target.tags, tag];

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, tags: newTags } : c
      )
    );

    await updateContactFields(contactId, { tags: newTags }, currentClientId);
  };

  const handleAddNote = async (contactId: string, note: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    const newNotes = [note, ...target.notes];

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, notes: newNotes } : c
      )
    );

    await updateContactFields(contactId, { notes: newNotes }, currentClientId);
    handleSendMessage(contactId, note, true);
  };

  const handleSimulatorHandoffAlert = (customerText: string) => {
    setHandoffAlert({
      contactName: `Simulator Customer (${activeClientObj.phone || "+94 77 000 0000"})`,
      message: customerText,
    });
  };

  const handleAddContact = async (newContact: Contact) => {
    const contactWithUser: Contact = {
      ...newContact,
      userId: currentClientId,
    };

    const initMsg: Message = {
      id: `m-init-${Date.now()}`,
      sender: "bot",
      text: "👋 Contact created on platform. Inbound welcome flow ready.",
      timestamp: "Just now",
      status: "delivered",
      userId: currentClientId,
    };

    setContacts((prev) => [contactWithUser, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [newContact.id]: [initMsg],
    }));
    setSelectedContactId(newContact.id);

    await saveContact(contactWithUser, currentClientId);
    await saveMessage(newContact.id, initMsg, currentClientId);
  };

  const handleUpdateFlowNodes = async (nodes: FlowNode[]): Promise<boolean> => {
    setFlowNodes(nodes);
    return await saveFlowNodes(nodes, currentClientId);
  };

  const handleUpdateMetaConfig = async (config: MetaConfig) => {
    const configWithUser: MetaConfig = {
      ...config,
      userId: currentClientId,
    };
    setMetaConfig(configWithUser);
    await saveMetaConfig(configWithUser, currentClientId);
  };

  const handleSaveCatalog = async (updated: BusinessCatalog) => {
    try {
      const saved = await saveCatalog(updated);
      setCatalogs((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
    } catch (err: any) {
      console.error("handleSaveCatalog error:", err);
      throw err;
    }
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    try {
      await deleteCatalog(catalogId, currentClientId);
      setCatalogs((prev) => prev.filter((c) => c.id !== catalogId));
    } catch (err: any) {
      console.error("handleDeleteCatalog error:", err);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearStoredSession();
    } catch (e) {}
    router.push("/login");
  };

  const isOwner = isSuperAdmin(authSession);

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col lg:flex-row antialiased font-secondary text-[#334155] overflow-hidden">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        viewMode="client"
        onSwitchViewMode={(mode) => {
          if (mode === "admin") {
            router.push("/admin");
          }
        }}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingHumanCount={pendingHumanCount}
        currentUser={currentWorkspaceUser}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
        onViewLanding={() => router.push("/")}
        onLogout={handleLogout}
        userEmail={authSession?.email}
        isOwnerAdmin={isOwner}
      />

      {/* Main Surface View Container */}
      <div className={`flex-1 flex flex-col min-w-0 h-[calc(100vh-57px)] lg:h-screen ${
        activeTab === "inbox" || activeTab === "builder" || activeTab === "simulator" || activeTab === "catalog"
          ? "overflow-hidden"
          : "overflow-y-auto no-scrollbar"
      }`}>
        {/* Human Handoff Push Alert in Client View */}
        {handoffAlert && (
          <div className="bg-[#0A504A] text-white px-6 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2 shrink-0 border-b border-[#0A504A]/30">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#ef4444] flex items-center justify-center font-bold">
                <Bell className="w-3.5 h-3.5 text-white" />
              </span>
              <div>
                <span className="font-bold">{handoffAlert.contactName}</span>{" "}
                <span className="opacity-75">needs human agent assistance:</span>{" "}
                <span className="font-medium italic">&quot;{handoffAlert.message}&quot;</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  handleTabChange("inbox");
                  setSelectedContactId("c-2");
                  setHandoffAlert(null);
                }}
                className="px-3 py-1 bg-white text-[#0A504A] rounded-full font-bold hover:bg-[#F7F7F2] flex items-center gap-1 cursor-pointer text-[10px]"
              >
                <span>View in Live Inbox</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setHandoffAlert(null)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Surface View */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === "dashboard" && (
            <DashboardView
              currentUser={currentWorkspaceUser}
              contacts={contacts}
              messages={messages}
              metaConfig={metaConfig}
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "inbox" && (
            <LiveInbox
              contacts={contacts}
              messages={messages}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
              onSendMessage={handleSendMessage}
              onToggleBot={handleToggleBot}
              onAssignAgent={handleAssignAgent}
              onAddTag={handleAddTag}
              onAddNote={handleAddNote}
              currentUser={currentWorkspaceUser}
              catalogProducts={catalogs.flatMap((c) => c.items)}
            />
          )}

          {activeTab === "catalog" && (
            <CatalogManager
              catalogs={catalogs}
              clientId={currentClientId}
              businessName={activeClientObj.businessName || "WAPPX Commerce"}
              onSaveCatalog={handleSaveCatalog}
              onDeleteCatalog={handleDeleteCatalog}
              onSelectForChat={() => {
                handleTabChange("inbox");
              }}
            />
          )}

          {activeTab === "campaigns" && (
            <CampaignManager
              contacts={contacts}
              onSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "templates" && (
            <TemplateManager metaConfig={metaConfig} />
          )}

          {activeTab === "integrations" && (
            <IntegrationsHub metaConfig={metaConfig} />
          )}

          {activeTab === "builder" && (
            <FlowBuilder
              key={isFlowsLoaded ? `loaded-${currentClientId}` : `loading-${currentClientId}`}
              nodes={flowNodes}
              onUpdateNodes={handleUpdateFlowNodes}
              onOpenSimulator={() => handleTabChange("simulator")}
            />
          )}

          {activeTab === "simulator" && (
            <WhatsAppSimulator
              nodes={flowNodes}
              onHandoffAlert={handleSimulatorHandoffAlert}
            />
          )}

          {activeTab === "contacts" && (
            <ContactsView
              contacts={contacts}
              onSelectContactForChat={(id) => {
                setSelectedContactId(id);
                handleTabChange("inbox");
              }}
              onAddContact={handleAddContact}
            />
          )}

          {activeTab === "settings" && (
            <MetaSettings config={metaConfig} onUpdateConfig={handleUpdateMetaConfig} />
          )}
        </main>
      </div>

      {/* Bilingual Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        webhookUrl={metaConfig.webhookUrl}
        verifyToken={activeClientObj.verifyToken || metaConfig.verifyToken}
      />

      {/* Client Workspace Switcher Modal (Only if Admin is inspecting) */}
      {isOwner && (
        <UserSwitchModal
          isOpen={isUserSwitchOpen}
          onClose={() => setIsUserSwitchOpen(false)}
          currentUser={currentWorkspaceUser}
          allUsers={allWorkspaces}
          onSelectUser={(u) => {
            setCurrentClientId(u.id);
            router.push(`/app?client=${u.id}`);
            setIsUserSwitchOpen(false);
          }}
          onCreateUser={async ({ name, email }) => {
            const created = await createClientAccount({
              name,
              businessName: name,
              email,
            });
            if (created) {
              setClients((prev) => [created, ...prev]);
              setCurrentClientId(created.id);
              router.push(`/app?client=${created.id}`);
            }
            setIsUserSwitchOpen(false);
          }}
        />
      )}
    </div>
  );
}

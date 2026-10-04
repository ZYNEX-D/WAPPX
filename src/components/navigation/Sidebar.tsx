"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  GitFork,
  Smartphone,
  Users,
  Settings,
  ShieldCheck,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Crown,
  LogOut,
  Globe,
  Menu,
  X,
  Radio,
  BarChart3,
  ArrowLeft,
  ChevronRight,
  Megaphone,
  FileText,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { UserWorkspace } from "@/types/whatsapp";

export type ActiveTab =
  | "dashboard"
  | "inbox"
  | "catalog"
  | "campaigns"
  | "templates"
  | "integrations"
  | "builder"
  | "simulator"
  | "contacts"
  | "settings";

interface SidebarProps {
  viewMode: "admin" | "client";
  onSwitchViewMode: (mode: "admin" | "client") => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingHumanCount: number;
  currentUser?: UserWorkspace;
  onOpenGuide: () => void;
  onOpenUserSwitch: () => void;
  onViewLanding?: () => void;
  onLogout?: () => void;
  userEmail?: string;
  isOwnerAdmin?: boolean;
}

export function Sidebar({
  viewMode,
  onSwitchViewMode,
  activeTab,
  setActiveTab,
  pendingHumanCount,
  currentUser,
  onOpenGuide,
  onOpenUserSwitch,
  onViewLanding,
  onLogout,
  userEmail,
  isOwnerAdmin = false,
}: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      id: "dashboard" as ActiveTab,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "inbox" as ActiveTab,
      label: "Live Inbox",
      icon: MessageSquare,
      badge: pendingHumanCount > 0 ? pendingHumanCount : null,
    },
    {
      id: "catalog" as ActiveTab,
      label: "Catalog & Products",
      icon: ShoppingBag,
    },
    {
      id: "campaigns" as ActiveTab,
      label: "Campaigns & Drip",
      icon: Megaphone,
    },
    {
      id: "templates" as ActiveTab,
      label: "Meta Templates",
      icon: FileText,
    },
    {
      id: "integrations" as ActiveTab,
      label: "Integrations Hub",
      icon: Layers,
    },
    {
      id: "builder" as ActiveTab,
      label: "Flow Builder",
      icon: GitFork,
    },
    {
      id: "simulator" as ActiveTab,
      label: "WhatsApp Simulator",
      icon: Smartphone,
    },
    {
      id: "contacts" as ActiveTab,
      label: "Contacts CRM",
      icon: Users,
    },
    {
      id: "settings" as ActiveTab,
      label: "Meta Cloud API",
      icon: Settings,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR (< lg)                                                     */}
      {/* ========================================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#F7F7F2]/95 backdrop-blur-md border-b border-[#0A504A]/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#0A504A] hover:bg-[#A2E4B8]/20 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="WAPPX" className="w-7 h-7 object-contain" />
            <span className="font-medium text-lg tracking-tight text-[#0A504A]">WAPPX</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "client" && (
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#A2E4B8]/30 text-[#0A504A] max-w-[120px] truncate">
              {currentUser?.name || "Client"}
            </span>
          )}
          {viewMode === "admin" && (
            <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-[#0A504A] text-white">
              Admin
            </span>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER OVERLAY BACKDROP (< lg)                                     */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR MAIN CONTAINER (Responsive: Fixed on desktop, Drawer on mobile)    */}
      {/* ========================================================================= */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-[#F7F7F2] border-r border-[#0A504A]/10 flex flex-col justify-between transition-transform duration-300 ease-in-out font-secondary text-[13px] font-normal ${mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
          } lg:static lg:h-screen lg:shrink-0`}
      >
        {/* TOP SECTION */}
        <div className="flex flex-col overflow-y-auto no-scrollbar">
          {/* Brand & Workspace Status */}
          <div className="p-5 pb-4 border-b border-[#0A504A]/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icon.png"
                  alt="WAPPX Logo"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <span className="font-medium text-lg tracking-[13px] text-[#0A504A] block leading-none">
                    WAPPX
                  </span>
                  <span className="text-[10px] text-[#64748b] font-light tracking-tight mt-0.5 block">
                    WhatsApp Cloud API v22.0
                  </span>
                </div>
              </div>

              {/* Close button inside mobile drawer */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-[#0A504A] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Workspace Pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-white border border-[#0A504A]/10 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${viewMode === "admin"
                    ? "bg-[#0A504A] text-white"
                    : "bg-[#A2E4B8] text-[#0A504A]"
                    }`}
                >
                  {viewMode === "admin" ? (
                    <Crown className="w-4 h-4 text-[#ffe200]" />
                  ) : (
                    <Building2 className="w-4 h-4 text-[#0A504A]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-normal uppercase tracking-wider text-slate-400">
                    {viewMode === "admin" ? "Platform Control" : "Client Workspace"}
                  </p>
                  <p className="text-xs font-normal text-[#0A504A] truncate">
                    {viewMode === "admin" ? "Admin Console" : currentUser?.name || "Client Portal"}
                  </p>
                </div>
              </div>

              {/* Workspace switcher (only for Admin to toggle/switch clients) */}
              {isOwnerAdmin && (
                <button
                  onClick={onOpenUserSwitch}
                  className="p-1 text-slate-400 hover:text-[#0A504A] rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Switch Client Workspace"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* If Admin is currently inside a client's workspace, provide a prominent quick return button */}
            {isOwnerAdmin && viewMode === "client" && (
              <button
                onClick={() => onSwitchViewMode("admin")}
                className="w-full mt-2.5 py-1.5 px-3 bg-[#0A504A] hover:bg-[#00A86B] text-white rounded-xl text-xs font-normal transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Admin Console</span>
              </button>
            )}
          </div>

          {/* NAVIGATION LINKS */}
          <div className="p-3 space-y-1">
            {/* View Mode = Admin Navigation Items */}
            {viewMode === "admin" ? (
              <>
                <div className="px-3 py-1.5 text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                  Admin Management
                </div>

                <button
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium bg-[#0A504A] text-white shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-[#A2E4B8]" />
                    <span>Clients & Analytics</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                </button>

                <button
                  onClick={() => onSwitchViewMode("client")}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-light text-slate-600 hover:text-[#0A504A] hover:bg-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-[#00A86B]" />
                    <span>Open Client Portal</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </>
            ) : (
              /* View Mode = Client Workspace Navigation Items */
              <>
                <div className="px-3 py-1.5 text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                  Workspace Apps
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${isActive
                        ? "bg-[#0A504A] text-white shadow-xs font-medium"
                        : "text-slate-600 hover:text-[#0A504A] hover:bg-white/80 font-light"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? "text-[#A2E4B8]" : "text-slate-400"
                            }`}
                        />
                        <span className="tracking-tight">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-normal bg-red-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* BOTTOM UTILITIES & PROFILE */}
        <div className="p-3 border-t border-[#0A504A]/10 space-y-1 bg-white/50">
          {/* Setup Guide Button */}
          <button
            onClick={() => {
              onOpenGuide();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-light text-[#0A504A] hover:bg-[#A2E4B8]/20 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#00A86B]" />
            <span className="tracking-tight">Setup Guide / උපදෙස්</span>
          </button>

          {/* View Public Landing Page */}
          {onViewLanding && (
            <button
              onClick={() => {
                onViewLanding();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-[#0A504A] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="tracking-tight">Public Landing Page</span>
            </button>
          )}

          {/* User Profile Card & Logout */}
          <div className="pt-2 mt-1 border-t border-slate-200/80 flex items-center justify-between px-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#0A504A] text-white flex items-center justify-center font-normal text-xs shrink-0">
                {viewMode === "admin" ? "AD" : currentUser?.name?.slice(0, 2).toUpperCase() || "CL"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-normal text-[#0A504A] truncate">
                  {userEmail || (viewMode === "admin" ? "admin@zynex.lk" : currentUser?.name)}
                </p>
                <p className="text-[10px] font-light text-slate-400 capitalize">
                  {viewMode === "admin" ? "Platform Admin" : "Client Workspace"}
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

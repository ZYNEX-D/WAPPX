"use client";

import React from "react";
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
  ArrowLeft,
  Building2,
  Crown,
  LogOut,
  Globe,
} from "lucide-react";
import { UserWorkspace } from "@/types/whatsapp";

export type ActiveTab = "inbox" | "builder" | "simulator" | "contacts" | "settings";

interface NavigationProps {
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
}

export function Navigation({
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
}: NavigationProps) {
  return (
    <>
      {/* Return to Admin Banner if viewing as client */}
      {viewMode === "client" && (
        <div className="bg-[#0A504A] text-[#F7F7F2] px-6 py-2 flex items-center justify-between text-xs border-b border-[#0A504A]/30 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
            <span className="font-semibold text-[#A2E4B8]">Client Workspace:</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#A2E4B8]" />
              {currentUser?.name || "Client Portal"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onViewLanding && (
              <button
                onClick={onViewLanding}
                className="text-[#A2E4B8] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Landing Page</span>
              </button>
            )}

            <button
              onClick={() => onSwitchViewMode("admin")}
              className="px-3 py-1 bg-white/10 hover:bg-white text-white hover:text-[#0A504A] rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Crown className="w-3.5 h-3.5 text-[#ffe200]" />
              <span>Return to Super Admin</span>
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#F7F7F2]/95 backdrop-blur-md border-b border-[#0A504A]/10 px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Wordmark & Meta Provider Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/icon.png"
                alt="WAPPX Logo"
                className="w-8 h-8 rounded-lg object-contain shadow-xs"
              />
              <div>
                <span className="font-bold text-xl tracking-tight text-[#0A504A]">
                  WAPPX
                </span>
                <span className="ml-2 text-xs font-semibold text-[#64748b] hidden sm:inline font-secondary">
                  {viewMode === "admin" ? "Master Admin Console" : "WhatsApp Business Hub"}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-[#A2E4B8]/25 rounded-full text-xs font-semibold text-[#0A504A] border border-[#A2E4B8]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00A86B]" />
              <span>{viewMode === "admin" ? "Platform Control" : "Meta Cloud API v22.0"}</span>
            </div>
          </div>

          {/* Central Navigation */}
          {viewMode === "client" ? (
            <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
              <button
                onClick={() => setActiveTab("inbox")}
                className={`btn-pill-tab ${activeTab === "inbox" ? "btn-pill-tab-active" : ""}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Live Inbox</span>
                {pendingHumanCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-[#e41e3f] text-white">
                    {pendingHumanCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("builder")}
                className={`btn-pill-tab ${activeTab === "builder" ? "btn-pill-tab-active" : ""}`}
              >
                <GitFork className="w-4 h-4" />
                <span>Flow Builder</span>
              </button>

              <button
                onClick={() => setActiveTab("simulator")}
                className={`btn-pill-tab ${activeTab === "simulator" ? "btn-pill-tab-active" : ""}`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab("contacts")}
                className={`btn-pill-tab ${activeTab === "contacts" ? "btn-pill-tab-active" : ""}`}
              >
                <Users className="w-4 h-4" />
                <span>Contacts</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`btn-pill-tab ${activeTab === "settings" ? "btn-pill-tab-active" : ""}`}
              >
                <Settings className="w-4 h-4" />
                <span>Meta API</span>
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#0A504A] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-[#ffe200]" />
                <span>Super Admin Panel</span>
              </span>
              <button
                onClick={() => onSwitchViewMode("client")}
                className="px-3.5 py-1.5 bg-white hover:bg-[#A2E4B8]/20 text-[#0A504A] border border-[#0A504A]/20 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5 text-[#00A86B]" />
                <span>Open Client Workspace ({currentUser?.name || "Client"})</span>
              </button>
            </div>
          )}

          {/* Right Status, Guide & Account */}
          <div className="flex items-center gap-2.5">
            {/* View Landing Page link */}
            {onViewLanding && (
              <button
                onClick={onViewLanding}
                className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0A504A] px-3 py-1.5 rounded-full hover:bg-white transition-all cursor-pointer"
                title="View Public Landing Page"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Landing Page</span>
              </button>
            )}

            {/* Setup Guide Button with Sinhala & English */}
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0A504A] bg-[#A2E4B8]/30 hover:bg-[#A2E4B8]/50 px-3 py-1.5 rounded-full border border-[#A2E4B8] transition-all cursor-pointer shadow-xs"
              title="Open Setup Guide (සිංහල / English)"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00A86B]" />
              <span className="hidden md:inline">Setup Guide / උපදෙස්</span>
              <span className="md:hidden">Guide</span>
            </button>

            {/* User Workspace Switcher */}
            <button
              onClick={onOpenUserSwitch}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-white hover:bg-slate-50 rounded-full border border-slate-200 transition-all cursor-pointer shadow-xs"
              title="Switch Workspace / Client"
            >
              <div className="w-6 h-6 rounded-full bg-[#0A504A] text-white flex items-center justify-center text-[10px] font-bold">
                {viewMode === "admin" ? "AD" : currentUser ? currentUser.name.slice(0, 2).toUpperCase() : "TP"}
              </div>
              <span className="text-xs font-bold text-[#0A504A] max-w-[100px] truncate hidden sm:inline">
                {viewMode === "admin" ? "Super Admin" : currentUser ? currentUser.name : "Client"}
              </span>
              <ChevronDown className="w-3 h-3 text-[#64748b]" />
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-[#64748b] hover:text-[#ef4444] hover:bg-red-50 rounded-full transition-all cursor-pointer"
                title={`Sign Out (${userEmail || "current session"})`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

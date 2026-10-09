"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Zap,
  TrendingUp,
  Users,
  MessageSquare,
  Bot,
  ShieldAlert,
  Sparkles,
  Camera,
  Upload,
  Globe,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Calculator,
  Info,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Megaphone,
  Layers,
  FileText,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { Contact, Message, MetaConfig, UserWorkspace } from "@/types/whatsapp";
import { ActiveTab } from "@/components/navigation/Sidebar";

interface DashboardViewProps {
  currentUser?: UserWorkspace;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  metaConfig: MetaConfig;
  onNavigateTab: (tab: ActiveTab) => void;
}

export function DashboardView({
  currentUser,
  contacts,
  messages,
  metaConfig,
  onNavigateTab,
}: DashboardViewProps) {
  const [dashboardSection, setDashboardSection] = useState<"overview" | "profile" | "billing">("overview");
  // ---------------------------------------------------------------------------
  // Profile Picture & Business Info State
  // ---------------------------------------------------------------------------
  const [profileImage, setProfileImage] = useState<string>(
    currentUser?.avatarUrl || "/icon.png"
  );
  const [businessName, setBusinessName] = useState(
    currentUser?.name || metaConfig?.businessName || "W A P P X"
  );
  const [businessCategory, setBusinessCategory] = useState("TECH");
  const [aboutText, setAboutText] = useState(
    "Merge your ideas with our Digital Creativity"
  );
  const [businessEmail, setBusinessEmail] = useState(
    "support@zynexdev.lk"
  );
  const [businessWebsite, setBusinessWebsite] = useState("https://wappx.zynexdev.com");
  const [businessAddress, setBusinessAddress] = useState("Colombo, Sri Lanka");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState<{
    msg: string;
    isError?: boolean;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Free Credit Auto-Safety Cutoff Guard State
  // (Prevents card overcharging by pausing outbound messaging before free limit expires)
  // ---------------------------------------------------------------------------
  const [autoCutoffEnabled, setAutoCutoffEnabled] = useState<boolean>(true);
  const [cutoffThreshold, setCutoffThreshold] = useState<number>(95); // 95% default
  const [isSavingCutoff, setIsSavingCutoff] = useState<boolean>(false);

  // Load saved profile & cutoff settings from API / localStorage on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(
          `/api/whatsapp/business-profile?userId=${currentUser?.id || "client-1"}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            if (data.profile.businessName) setBusinessName(data.profile.businessName);
            if (data.profile.businessCategory) setBusinessCategory(data.profile.businessCategory);
            if (data.profile.aboutText) setAboutText(data.profile.aboutText);
            if (data.profile.businessEmail) setBusinessEmail(data.profile.businessEmail);
            if (data.profile.businessWebsite) setBusinessWebsite(data.profile.businessWebsite);
            if (data.profile.businessAddress) setBusinessAddress(data.profile.businessAddress);
            if (data.profile.profileImage) setProfileImage(data.profile.profileImage);
            if (typeof data.profile.autoCutoffEnabled === "boolean") {
              setAutoCutoffEnabled(data.profile.autoCutoffEnabled);
            }
            if (data.profile.cutoffThreshold) {
              setCutoffThreshold(data.profile.cutoffThreshold);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote profile, using workspace defaults", err);
      }
    }
    loadProfile();
  }, [currentUser]);

  // ---------------------------------------------------------------------------
  // REAL METRICS CALCULATION (Zero Dummy Hardcoded Data)
  // ---------------------------------------------------------------------------
  const allMessagesList = useMemo(() => {
    return Object.values(messages).flat();
  }, [messages]);

  const totalContactsCount = contacts.length;
  const pendingHumanCount = contacts.filter((c) => c.status === "pending_human").length;
  const botActiveCount = contacts.filter((c) => c.isBotActive).length;
  const botAutomationRate =
    totalContactsCount > 0
      ? Math.round((botActiveCount / totalContactsCount) * 100)
      : 0;

  const totalInboundMessages = useMemo(
    () => allMessagesList.filter((m) => m.sender === "customer").length,
    [allMessagesList]
  );
  const totalOutboundMessages = useMemo(
    () => allMessagesList.filter((m) => m.sender === "bot" || m.sender === "agent").length,
    [allMessagesList]
  );
  const totalMessagesCount = allMessagesList.length;

  // Real Service Conversations Calculation:
  // Each active contact represents a service conversation window in Meta API
  const freeConversationsLimit = 1000;
  const freeConversationsUsed = useMemo(() => {
    // Unique contacts with messages count towards Meta 24-hr service conversation windows
    const contactsWithMessages = Object.keys(messages).filter(
      (contactId) => messages[contactId] && messages[contactId].length > 0
    ).length;
    return Math.min(contactsWithMessages, freeConversationsLimit);
  }, [messages]);

  const freePercentageUsed = Math.min(
    100,
    Math.round((freeConversationsUsed / freeConversationsLimit) * 100)
  );

  // Has the auto-cutoff threshold been reached?
  const isCutoffTriggered =
    autoCutoffEnabled && freePercentageUsed >= cutoffThreshold;

  // ---------------------------------------------------------------------------
  // REAL RECHARTS DATA PREPARATION
  // ---------------------------------------------------------------------------
  // 1. 7-Day Trend Chart
  const trendData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(today);
      start.setDate(start.getDate() - 6 + index);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const dayMessages = allMessagesList.filter((message) => {
        const date = new Date(message.createdAt || message.timestamp);
        return date >= start && date < end;
      });
      return {
        day: start.toLocaleDateString("en", { weekday: "short" }),
        inbound: dayMessages.filter((message) => message.sender === "customer").length,
        outbound: dayMessages.filter((message) => message.sender !== "customer").length,
      };
    });
  }, [allMessagesList]);

  // Message counts by sender, without inferred billing categories.
  const categoryData = useMemo(() => {
    return [
      { name: "Customer messages", value: totalInboundMessages, color: "#0A504A" },
      { name: "Bot replies", value: allMessagesList.filter((message) => message.sender === "bot").length, color: "#6DAA9B" },
      { name: "Agent replies", value: allMessagesList.filter((message) => message.sender === "agent").length, color: "#CBD5E1" },
    ];
  }, [allMessagesList, totalInboundMessages]);

  // ---------------------------------------------------------------------------
  // Cost Calculator State
  // ---------------------------------------------------------------------------
  const [calcMarketingConvos, setCalcMarketingConvos] = useState(500);
  const [calcUtilityConvos, setCalcUtilityConvos] = useState(300);
  const [calcServiceConvos, setCalcServiceConvos] = useState(freeConversationsUsed + 200);

  const RATE_MARKETING = 0.052;
  const RATE_UTILITY = 0.014;
  const RATE_SERVICE = 0.015;
  const LKR_RATE = 310;

  const paidServiceConvos = Math.max(0, calcServiceConvos - freeConversationsLimit);
  const estMarketingCost = calcMarketingConvos * RATE_MARKETING;
  const estUtilityCost = calcUtilityConvos * RATE_UTILITY;
  const estServiceCost = paidServiceConvos * RATE_SERVICE;
  const estTotalCostUSD = estMarketingCost + estUtilityCost + estServiceCost;
  const estTotalCostLKR = estTotalCostUSD * LKR_RATE;

  // ---------------------------------------------------------------------------
  // Profile Photo Upload & Save Handlers
  // ---------------------------------------------------------------------------
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setProfileSavedToast({
          msg: "Image file exceeds 5MB limit. Please choose a smaller photo.",
          isError: true,
        });
        setTimeout(() => setProfileSavedToast(null), 3500);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/whatsapp/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "client-1",
          businessName,
          businessCategory,
          aboutText,
          businessEmail,
          businessWebsite,
          businessAddress,
          profileImage,
          autoCutoffEnabled,
          cutoffThreshold,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSavedToast({
          msg: data.metaSynced
            ? "Saved and synced directly with Meta WhatsApp Cloud API!"
            : "WhatsApp Business Profile updated and persisted successfully!",
        });
      } else {
        setProfileSavedToast({
          msg: data.error || "Could not save your profile. Please try again.",
          isError: true,
        });
      }
    } catch (err) {
      setProfileSavedToast({
        msg: "Could not reach the server. Your profile has not been saved.",
        isError: true,
      });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileSavedToast(null), 3500);
    }
  };

  const handleToggleAutoCutoff = async (enabled: boolean, threshold = cutoffThreshold) => {
    const previousEnabled = autoCutoffEnabled;
    const previousThreshold = cutoffThreshold;
    setAutoCutoffEnabled(enabled);
    setCutoffThreshold(threshold);
    setIsSavingCutoff(true);
    try {
      const response = await fetch("/api/whatsapp/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "client-1",
          businessName,
          autoCutoffEnabled: enabled,
          cutoffThreshold: threshold,
        }),
      });
      if (!response.ok) throw new Error("Could not save usage settings");
      setProfileSavedToast({
        msg: enabled
          ? `Usage settings saved with a ${threshold}% threshold.`
          : "Usage settings saved.",
      });
    } catch {
      setAutoCutoffEnabled(previousEnabled);
      setCutoffThreshold(previousThreshold);
      setProfileSavedToast({ msg: "Could not save usage settings. Please try again.", isError: true });
    } finally {
      setIsSavingCutoff(false);
      setTimeout(() => setProfileSavedToast(null), 3000);
    }
  };

  return (
    <div className="workspace-page flex-1 overflow-y-auto bg-[#F6F7F9] font-secondary text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Notification */}
      {profileSavedToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-white ${
            profileSavedToast.isError ? "bg-rose-600" : "bg-slate-900"
          }`}
        >
          {profileSavedToast.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{profileSavedToast.msg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="pb-6 border-b border-slate-200 relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Welcome back to {businessName}. Here&apos;s your workspace at a glance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab("inbox")}
              className="px-4 py-2.5 rounded-lg bg-[#0A504A] text-white font-medium text-sm hover:bg-[#073E39] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Inbox</span>
            </button>
            <button
              onClick={() => onNavigateTab("campaigns")}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-emerald-600" />
              <span>Campaigns</span>
            </button>
            <button
              onClick={() => onNavigateTab("templates")}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Templates</span>
            </button>
          </div>
        </div>
      </div>

      <nav aria-label="Dashboard views" className="flex gap-1 p-1 bg-slate-200/60 rounded-xl w-fit max-w-full">
        {([
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          { id: "profile", label: "Business profile", icon: Building },
          { id: "billing", label: "Usage & billing", icon: CreditCard },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={dashboardSection === id} onClick={() => setDashboardSection(id)}
            className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium cursor-pointer transition-colors ${dashboardSection === id ? "bg-white text-[#0A504A] shadow-none" : "text-slate-500 hover:text-slate-900"}`}>
            <Icon className="hidden sm:block w-4 h-4" />{label}
          </button>
        ))}
      </nav>

      {dashboardSection === "billing" && <>
      {/* ========================================================================= */}
      {/* FREE CREDIT AUTO-SAFETY CUTOFF GUARD BANNER (Requested by User)          */}
      {/* ========================================================================= */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          autoCutoffEnabled
            ? "bg-emerald-50/90 border-emerald-300 shadow-none"
            : "bg-amber-50/80 border-amber-300 shadow-none"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                autoCutoffEnabled
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
              }`}
            >
              {autoCutoffEnabled ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <ShieldAlert className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm font-semibold text-slate-900">
                  Free Credit Auto-Safety Cutoff Guard
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    autoCutoffEnabled
                      ? "bg-emerald-200 text-emerald-900"
                      : "bg-amber-200 text-amber-900"
                  }`}
                >
                  {autoCutoffEnabled ? "SHIELD ACTIVE" : "PAY-AS-YOU-GO"}
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Automatically halts outbound broadcasts and paid conversational triggers before the 1,000 free monthly Meta service conversations are exhausted. Protects your credit card from unwanted Meta overcharge fees.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80">
            {/* Cutoff Threshold Selector */}
            {autoCutoffEnabled && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Cutoff At:</span>
                <select
                  value={cutoffThreshold}
                  disabled={isSavingCutoff}
                  aria-label="Usage cutoff threshold"
                  onChange={(e) => handleToggleAutoCutoff(autoCutoffEnabled, Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none cursor-pointer focus:border-emerald-500"
                >
                  <option value={80}>80% (800 convos)</option>
                  <option value={90}>90% (900 convos)</option>
                  <option value={95}>95% (950 convos)</option>
                  <option value={99}>99% (990 convos)</option>
                </select>
              </div>
            )}

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleAutoCutoff(!autoCutoffEnabled)}
              disabled={isSavingCutoff}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                autoCutoffEnabled
                  ? "bg-[#0A504A] hover:bg-[#073E39] text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700"
              }`}
            >
              {autoCutoffEnabled ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Shield ON</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Shield OFF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning if triggered */}
        {isCutoffTriggered && (
          <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center gap-2 text-xs font-semibold text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Safety threshold reached ({freePercentageUsed}% used). Outbound paid messaging is safely locked. Turn off the shield above to enable pay-as-you-go messaging.
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* REAL METRIC CARDS ROW                                                     */}
      {/* ========================================================================= */}
      </>}
      {dashboardSection === "overview" && <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Free Service Tier Usage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-none space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Needs attention
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              {pendingHumanCount}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Conversations waiting for your team
            </p>
          </div>
          <button onClick={() => onNavigateTab("inbox")} className="flex items-center gap-1 text-xs font-medium text-[#0A504A] cursor-pointer hover:underline">Review inbox <ArrowUpRight className="w-3.5 h-3.5" /></button>
        </div>

        {/* Card 2: Total Real Messages */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-none space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Messages
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              {totalMessagesCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-emerald-600">
                {totalInboundMessages} in
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-sky-600">
                {totalOutboundMessages} out
              </span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>{metaConfig.isConnected ? "WhatsApp connected" : "Workspace message history"}</span>
          </div>
        </div>

        {/* Card 3: CRM Contacts & Quality */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-none space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total contacts
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              {totalContactsCount}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {pendingHumanCount} awaiting human agent
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Contacts in your workspace</span>
          </div>
        </div>

        {/* Card 4: Bot Automation Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-none space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bot coverage
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-emerald-600">
              {botAutomationRate}%
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {botActiveCount} contacts automated by Bot Engine
            </p>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{totalContactsCount === 0 ? "Add contacts to get started" : "Based on contact bot settings"}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECHARTS DATA VISUALIZATION SECTION (Requested by User)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: 7-Day Conversation Volume AreaChart (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Message activity</span>
              </h2>
              <p className="text-xs text-slate-500">
                Last 7 days · messages with available dates
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Inbound</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Outbound</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {trendData.every((day) => day.inbound === 0 && day.outbound === 0) ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
                <TrendingUp className="w-7 h-7" />
                <span>No dated messages in the last 7 days</span>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#1E293B",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInbound)"
                  name="Inbound Messages"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOutbound)"
                  name="Outbound Messages"
                />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Meta Conversation Categories Donut (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-none space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Message breakdown</span>
            </h2>
            <p className="text-xs text-slate-500">
              Customer, bot, and agent messages
            </p>
          </div>

          <div className="h-44 w-full">
            {totalMessagesCount === 0 ? <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 text-sm"><MessageSquare className="w-7 h-7" /><span>No messages yet</span></div> :
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>}
          </div>

          <div className="space-y-1.5 pt-2">
            {categoryData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-600 truncate">{cat.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WHATSAPP PROFILE DETAILS & PHOTO UPDATE (Connected to Persistent API)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {([
          { tab: "catalog", title: "Product catalog", description: "Manage products and collections", icon: Layers },
          { tab: "builder", title: "Automations", description: "Build your conversation flows", icon: Bot },
          { tab: "integrations", title: "Integrations", description: "Connect your workspace tools", icon: Zap },
        ] as const).map(({ tab, title, description, icon: Icon }) => <button key={tab} onClick={() => onNavigateTab(tab)} className="group flex items-center gap-3 text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-600 transition-colors cursor-pointer"><Icon className="w-5 h-5 text-[#0A504A] shrink-0" /><span className="flex-1"><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-slate-500 mt-1">{description}</span></span><ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" /></button>)}
      </div>
      </>}
      {dashboardSection === "profile" && <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              <span>Business profile</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Directly updates your profile photo, business vertical, and status on WhatsApp servers via Meta Cloud API.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="px-5 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#073E39] text-white text-xs font-semibold transition-all shadow-none flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            {isSavingProfile ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {isSavingProfile ? "Syncing with Meta..." : "Save Profile to WhatsApp"}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Avatar & Live WhatsApp Preview */}
          <div className="lg:col-span-4 flex flex-col items-center text-center space-y-4 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/70">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Profile Photo Preview
            </span>

            {/* Circular Profile Photo with Upload Trigger */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-sm bg-slate-200 flex items-center justify-center">
                <img
                  src={profileImage}
                  alt="WhatsApp Business Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <label
                htmlFor="profile-upload"
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold cursor-pointer"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span>Change Photo</span>
              </label>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-base text-slate-900">{businessName}</h3>
              <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Official Business Account
              </span>
              <p className="text-xs text-slate-500 italic max-w-xs mt-1">
                &quot;{aboutText}&quot;
              </p>
            </div>

            <div className="text-[11px] text-slate-400 bg-white p-2.5 rounded-xl border border-slate-200 w-full text-left space-y-1">
              <p className="font-semibold text-slate-700">Meta Photo Requirements:</p>
              <p>• Recommended: 640 x 640 px square</p>
              <p>• Max file size: 5 MB (JPG or PNG)</p>
            </div>
          </div>

          {/* Right Column: Editable Profile Fields */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Business Display Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
                  placeholder="e.g. Zynex Technologies"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Business Category (Vertical)
                </label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer"
                >
                  <option value="RETAIL">Retail & E-commerce</option>
                  <option value="SERVICES">Professional Services</option>
                  <option value="TECH">Technology & Software</option>
                  <option value="FINANCE">Finance & Banking</option>
                  <option value="HEALTHCARE">Healthcare</option>
                  <option value="EDUCATION">Education</option>
                  <option value="HOSPITALITY">Travel & Hospitality</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                WhatsApp About / Status Text (Max 139 chars)
              </label>
              <input
                type="text"
                maxLength={139}
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
                placeholder="e.g. Available 24/7 on WhatsApp for support."
              />
              <span className="text-[10px] text-slate-400 block text-right">
                {aboutText.length} / 139 characters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Public Business Email</span>
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Business Website</span>
                </label>
                <input
                  type="url"
                  value={businessWebsite}
                  onChange={(e) => setBusinessWebsite(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Business Physical Address</span>
              </label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>}

      {/* ========================================================================= */}
      {/* SECTION 4: META BILLING & INTERACTIVE COST ESTIMATOR                      */}
      {/* ========================================================================= */}
      {dashboardSection === "billing" && <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="pb-5 border-b border-slate-100 space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              How Meta Charges & Credit Limits Work
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            WhatsApp Business API uses <strong>Conversation-Based Pricing</strong> in 24-hour windows. Here is the official breakdown:
          </p>
        </div>

        {/* 4 Conversation Categories Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Category 1: Service */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-950 uppercase tracking-wide">
                1. Service Convos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 text-white">
                1,000 Free / mo
              </span>
            </div>
            <div className="text-xl font-semibold text-emerald-900">
              $0.015 <span className="text-xs font-normal text-slate-500">/ convo</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customer-initiated inquiries. Freeform bot replies allowed within 24 hours. The first 1,000 every month are 100% free!
            </p>
          </div>

          {/* Category 2: Marketing */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-950 uppercase tracking-wide">
                2. Marketing Convos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-600 text-white">
                Outbound
              </span>
            </div>
            <div className="text-xl font-semibold text-purple-900">
              $0.052 <span className="text-xs font-normal text-slate-500">/ convo</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Business-initiated promotions, discounts, product launches, or seasonal announcements via approved templates.
            </p>
          </div>

          {/* Category 3: Utility */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-950 uppercase tracking-wide">
                3. Utility Convos
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white">
                Transactional
              </span>
            </div>
            <div className="text-xl font-semibold text-blue-900">
              $0.014 <span className="text-xs font-normal text-slate-500">/ convo</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Order confirmations, shipping tracking numbers, payment receipts, and billing updates sent to customers.
            </p>
          </div>

          {/* Category 4: Free Entry Points */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-950 uppercase tracking-wide">
                4. Free Entry Points
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-600 text-white">
                72h Free
              </span>
            </div>
            <div className="text-xl font-semibold text-amber-900">
              $0.00 <span className="text-xs font-normal text-slate-500">Zero Charge</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conversations started when users click a Facebook or Instagram Click-to-WhatsApp ad are completely free for 72 hours!
            </p>
          </div>
        </div>

        {/* Interactive Cost Estimator Calculator */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>Interactive Monthly Meta Billing Estimator</span>
              </h3>
              <p className="text-xs text-slate-500">
                Adjust sliders to simulate your expected monthly Meta WhatsApp invoices:
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Estimated Monthly Meta Cost:</span>
              <span className="text-2xl font-semibold text-emerald-700">
                ${estTotalCostUSD.toFixed(2)}{" "}
                <span className="text-xs font-semibold text-slate-500">
                  (~Rs. {Math.round(estTotalCostLKR).toLocaleString()} LKR)
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Slider 1: Marketing */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Marketing Convos</span>
                <span className="font-mono font-semibold text-purple-700">{calcMarketingConvos}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={50}
                value={calcMarketingConvos}
                onChange={(e) => setCalcMarketingConvos(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0</span>
                <span>Subtotal: ${estMarketingCost.toFixed(2)}</span>
                <span>10,000</span>
              </div>
            </div>

            {/* Slider 2: Utility */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Utility (Orders/Tracking)</span>
                <span className="font-mono font-semibold text-blue-700">{calcUtilityConvos}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={50}
                value={calcUtilityConvos}
                onChange={(e) => setCalcUtilityConvos(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0</span>
                <span>Subtotal: ${estUtilityCost.toFixed(2)}</span>
                <span>10,000</span>
              </div>
            </div>

            {/* Slider 3: Service */}
            <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Service (Customer Inquiries)</span>
                <span className="font-mono font-semibold text-emerald-700">{calcServiceConvos}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10000}
                step={50}
                value={calcServiceConvos}
                onChange={(e) => setCalcServiceConvos(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>1k Free</span>
                <span>Subtotal: ${estServiceCost.toFixed(2)}</span>
                <span>10,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}

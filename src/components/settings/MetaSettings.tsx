"use client";

import React, { useState, useEffect } from "react";
import { MetaConfig } from "@/types/whatsapp";
import { DiscoveredWaba, DiscoveredPhoneNumber, PhoneNumberHealth } from "@/lib/meta-client";
import {
  ShieldCheck,
  Key,
  Copy,
  Check,
  Send,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Smartphone,
  Layers,
  ChevronRight,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Database,
  Globe,
  Radio,
  Clock,
  ArrowRight,
  CreditCard,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { DiagnosticsResponse, DiagnosticCheckItem } from "@/app/api/whatsapp/diagnostics/route";

interface MetaSettingsProps {
  config: MetaConfig;
  clientId?: string;
  onUpdateConfig: (config: MetaConfig) => void;
}

export function MetaSettings({ config, clientId = "client-1", onUpdateConfig }: MetaSettingsProps) {
  const defaultWebhook =
    process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`
      : "https://wappx.zynexdev.com/api/webhook";

  const activeWebhookUrl =
    config.webhookUrl &&
    !config.webhookUrl.includes("yourdomain.com") &&
    !config.webhookUrl.includes("ngrok")
      ? config.webhookUrl
      : defaultWebhook;

  const [formData, setFormData] = useState<MetaConfig>({
    ...config,
    webhookUrl: activeWebhookUrl,
  });
  const [activeTab, setActiveTab] = useState<"diagnostics" | "auto" | "manual" | "test">("diagnostics");
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Full Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);

  // Auto-discovery state
  const [discoverToken, setDiscoverToken] = useState(
    config.accessToken && !config.accessToken.startsWith("EAA...") ? config.accessToken : ""
  );
  const [hintWabaId, setHintWabaId] = useState(
    config.wabaId && config.wabaId !== "249018249081234" ? config.wabaId : ""
  );
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredWabas, setDiscoveredWabas] = useState<DiscoveredWaba[] | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [connectingPhoneId, setConnectingPhoneId] = useState<string | null>(null);

  // Real-time Health
  const [health, setHealth] = useState<PhoneNumberHealth | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Test Messenger state
  const [testPhone, setTestPhone] = useState("+94");
  const [testText, setTestText] = useState("Hello from WAPPX WhatsApp Platform! 🚀");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Fetch live health & full diagnostics on mount
  useEffect(() => {
    checkLiveHealth();
    runDiagnostics();
  }, [config.phoneNumberId, config.accessToken, clientId]);

  const checkLiveHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch(`/api/whatsapp/health?clientId=${clientId || config.userId || "client-1"}`);
      const data = await res.json();
      if (data.configured && data.phoneDetails) {
        setHealth(data.phoneDetails);
      } else {
        setHealth(null);
      }
    } catch {
      setHealth(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    setDiagnosticsError(null);
    try {
      const res = await fetch(`/api/whatsapp/diagnostics?clientId=${clientId || config.userId || "client-1"}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.checks)) {
        setDiagnostics(data);
      } else {
        setDiagnosticsError(data.error || "Failed to load system diagnostics.");
      }
    } catch (err: any) {
      setDiagnosticsError(err?.message || "Failed to connect to diagnostic suite.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCopy = (text: string, type: "webhook" | "token") => {
    navigator.clipboard.writeText(text);
    if (type === "webhook") {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSendResult({
      success: true,
      message: "Meta Cloud API credentials saved successfully!",
    });
    checkLiveHealth();
    setTimeout(() => setSendResult(null), 3000);
  };

  // Run automated discovery
  const handleAutoDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoverToken.trim()) {
      setDiscoverError("Please enter your Meta Permanent Access Token.");
      return;
    }

    setIsDiscovering(true);
    setDiscoverError(null);
    setDiscoveredWabas(null);

    try {
      const res = await fetch("/api/whatsapp/auto-discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: discoverToken.trim(),
          hintWabaId: hintWabaId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.wabas)) {
        setDiscoveredWabas(data.wabas);
      } else {
        setDiscoverError(
          data.error ||
            "Could not discover accounts. Ensure the System User has 'whatsapp_business_messaging' and 'whatsapp_business_management' permissions."
        );
      }
    } catch {
      setDiscoverError("Network error contacting discovery endpoint.");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Connect selected phone number with 1-click webhook auto-subscription
  const handleConnectNumber = async (wabaId: string, phone: DiscoveredPhoneNumber) => {
    setConnectingPhoneId(phone.id);
    try {
      const res = await fetch("/api/whatsapp/connect-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wabaId,
          phoneNumberId: phone.id,
          accessToken: discoverToken.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const newConfig: MetaConfig = {
          ...formData,
          wabaId,
          phoneNumberId: phone.id,
          accessToken: discoverToken.trim(),
          isConnected: true,
        };
        setFormData(newConfig);
        onUpdateConfig(newConfig);

        setSendResult({
          success: true,
          message: `Connected ${phone.verifiedName || phone.displayPhoneNumber}! Webhook automatically subscribed.`,
        });

        checkLiveHealth();
      } else {
        setSendResult({
          success: false,
          message: data.error || "Failed to auto-connect number.",
        });
      }
    } catch {
      setSendResult({
        success: false,
        message: "Failed to connect to backend server.",
      });
    } finally {
      setConnectingPhoneId(null);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testText.trim()) return;

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: formData.phoneNumberId,
          accessToken: formData.accessToken,
          recipientPhone: testPhone,
          text: testText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({
          success: true,
          message: data.simulation
            ? "Test message simulated (Add a real Meta access token to dispatch live via Cloud API)."
            : "Message dispatched via Meta Cloud API successfully!",
        });
      } else {
        setSendResult({
          success: false,
          message: data.error || "Failed to dispatch test message.",
        });
      }
    } catch {
      setSendResult({
        success: false,
        message: "Failed to connect to API route.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F7F2] p-4 sm:p-6 font-secondary">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Title & Live Status Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A504A]">
                WhatsApp Hub & Cloud API
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A2E4B8]/30 text-[#0A504A] border border-[#00A86B]/30">
                Official Meta Cloud API
              </span>
            </div>
            <p className="text-xs text-[#5d6c7b] mt-1">
              Connect your WhatsApp Business Cloud API directly to WAPPX Hub for live inbox, chatbot flows, and real-time messaging.
            </p>
          </div>

          {/* Live Health Badge */}
          <div className="bg-white border border-[#dee3e9] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                health
                  ? "bg-[#00A86B] animate-pulse"
                  : formData.accessToken && !formData.accessToken.startsWith("EAA...")
                  ? "bg-[#00A86B]"
                  : "bg-[#f2a918]"
              }`}
            />
            <div>
              <div className="text-xs font-bold text-[#0A504A]">
                {health ? health.verifiedName : formData.phoneNumberId ? "Connected" : "Not Connected"}
              </div>
              <div className="text-[11px] text-[#5d6c7b]">
                {health ? health.displayPhoneNumber : "Awaiting Meta Token"}
              </div>
            </div>
            <button
              onClick={checkLiveHealth}
              disabled={isCheckingHealth}
              className="p-1 text-[#5d6c7b] hover:text-[#0A504A] rounded-full hover:bg-[#F7F7F2]"
              title="Refresh Health"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00A86B] ${isCheckingHealth ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-[#dee3e9] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "diagnostics"
                ? "bg-[#0A504A] text-white shadow-xs"
                : "bg-white text-[#444950] border border-[#dee3e9] hover:bg-[#F7F7F2]"
            }`}
          >
            <Activity className="w-4 h-4 text-[#A2E4B8]" />
            <span>Diagnostics & Health</span>
            {diagnostics && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  diagnostics.overallStatus === "healthy"
                    ? "bg-[#00A86B] text-white"
                    : diagnostics.overallStatus === "partial"
                    ? "bg-amber-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {diagnostics.scorePercentage}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("auto")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "auto"
                ? "bg-[#00A86B] text-white shadow-xs"
                : "bg-white text-[#444950] border border-[#dee3e9] hover:bg-[#F7F7F2]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>1-Click Auto Setup (Recommended)</span>
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "manual"
                ? "bg-[#00A86B] text-white shadow-xs"
                : "bg-white text-[#444950] border border-[#dee3e9] hover:bg-[#F7F7F2]"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Manual Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("test")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "test"
                ? "bg-[#00A86B] text-white shadow-xs"
                : "bg-white text-[#444950] border border-[#dee3e9] hover:bg-[#F7F7F2]"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Test Messenger</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {sendResult && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              sendResult.success
                ? "bg-[#A2E4B8]/30 border-[#00A86B]/40 text-[#0A504A]"
                : "bg-[#e41e3f]/10 border-[#e41e3f]/30 text-[#e41e3f]"
            }`}
          >
            {sendResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{sendResult.message}</span>
          </div>
        )}

        {/* ===================== TAB 0: SYSTEM DIAGNOSTICS & HEALTH ===================== */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6">
            {/* Diagnostics Hero Status Banner */}
            <div className="bg-gradient-to-r from-[#0A504A] via-[#0d6159] to-[#0A504A] text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden border border-[#00A86B]/30">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#00A86B]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#A2E4B8]/20 text-[#A2E4B8] border border-[#A2E4B8]/30 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#A2E4B8]" />
                      Real-time System Audit
                    </span>
                    {diagnostics && (
                      <span className="text-xs text-white/70">
                        {diagnostics.passedChecks} of {diagnostics.totalChecks} Checks Passed
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    {diagnostics?.overallStatus === "healthy"
                      ? "100% Fully Configured & Operational"
                      : diagnostics?.overallStatus === "partial"
                      ? "Partially Configured"
                      : isDiagnosing
                      ? "Running Diagnostics..."
                      : "Configuration Review Needed"}
                  </h2>

                  <p className="text-xs text-white/80 max-w-xl leading-relaxed">
                    Automated end-to-end audit verifying your Meta System User Token, WABA registration, WhatsApp Phone Number, Webhooks, Commerce Catalog, and Database synchronization.
                  </p>

                  {diagnostics?.timestamp && (
                    <div className="flex items-center gap-2 text-[11px] text-white/60 pt-1">
                      <Clock className="w-3 h-3" />
                      <span>Last checked: {new Date(diagnostics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full md:w-auto">
                  {diagnostics && (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 w-full sm:w-auto justify-center">
                      <div className="text-right">
                        <div className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Health Score</div>
                        <div className="text-2xl font-black text-[#A2E4B8]">
                          {diagnostics.scorePercentage}%
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border-3 border-[#00A86B] flex items-center justify-center bg-black/20">
                        <CheckCircle2 className="w-5 h-5 text-[#A2E4B8]" />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={runDiagnostics}
                    disabled={isDiagnosing}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isDiagnosing ? "animate-spin" : ""}`} />
                    <span>{isDiagnosing ? "Auditing Systems..." : "Run Full Diagnostic"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error notice if diagnostics failed */}
            {diagnosticsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <span className="font-bold">Diagnostic test failed: </span>
                  <span>{diagnosticsError}</span>
                </div>
                <button
                  onClick={runDiagnostics}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Diagnostics Cards Grid */}
            {diagnostics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnostics.checks.map((item) => {
                  const isSuccess = item.status === "success";
                  const isWarning = item.status === "warning";
                  const isError = item.status === "error";

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                        isSuccess
                          ? "bg-white border-emerald-200/80 shadow-xs hover:border-emerald-300"
                          : isWarning
                          ? "bg-amber-50/50 border-amber-200 shadow-xs"
                          : "bg-red-50/50 border-red-200 shadow-xs"
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Icon + Category Badge + Status Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isSuccess
                                  ? "bg-emerald-100/70 text-[#00A86B]"
                                  : isWarning
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {item.category === "auth" && <Key className="w-4 h-4" />}
                              {item.category === "phone" && <Smartphone className="w-4 h-4" />}
                              {item.category === "waba" && <ShieldCheck className="w-4 h-4" />}
                              {item.category === "billing" && <CreditCard className="w-4 h-4" />}
                              {item.category === "profile" && <Globe className="w-4 h-4" />}
                              {item.category === "webhook" && <Radio className="w-4 h-4" />}
                              {item.category === "catalog" && <ShoppingBag className="w-4 h-4" />}
                              {item.category === "database" && <Database className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {item.category}
                              </span>
                              <h3 className="text-xs font-bold text-slate-800 leading-snug">
                                {item.name}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                              isSuccess
                                ? "bg-emerald-100 text-emerald-800"
                                : isWarning
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isSuccess && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                            {isWarning && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {isError && <XCircle className="w-3 h-3 text-red-600" />}
                            <span>{isSuccess ? "CONFIGURED" : isWarning ? "NOTICE" : "ACTION NEEDED"}</span>
                          </span>
                        </div>

                        {/* Summary description */}
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.summary}
                        </p>

                        {/* Details Badges */}
                        {item.details && Object.keys(item.details).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.entries(item.details)
                              .filter(([k, v]) => v !== undefined && v !== null && typeof v !== "object")
                              .slice(0, 4)
                              .map(([k, v]) => (
                                <span
                                  key={k}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px] font-mono border border-slate-200/60"
                                >
                                  <strong className="text-slate-500 font-sans capitalize">{k.replace(/([A-Z])/g, " $1")}:</strong> {String(v)}
                                </span>
                              ))}
                          </div>
                        )}

                        {/* Recommendation if any */}
                        {item.recommendation && (
                          <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200/60 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{item.recommendation}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        {item.actionUrl ? (
                          <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#00A86B] hover:text-[#0A504A] font-bold text-[11px] flex items-center gap-1"
                          >
                            <span>{item.actionText || "Manage in Meta"}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">Verified by Meta Graph API</span>
                        )}

                        {item.category === "phone" && (
                          <button
                            onClick={() => setActiveTab("test")}
                            className="text-[11px] font-bold text-[#0A504A] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Send Test Message</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {item.category === "webhook" && (
                          <button
                            onClick={() => setActiveTab("manual")}
                            className="text-[11px] font-bold text-[#0A504A] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>View Webhook Config</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* WhatsApp Billing & Payment Method Explanatory Guide Box */}
            <div className="p-5 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 border border-emerald-200/80 rounded-2xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#00A86B]/15 text-[#0A504A] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#0A504A]">
                      Meta WhatsApp Payment Method & Conversation Tier Guide
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Why does WhatsApp Manager show &quot;Missing valid payment method&quot; and how to link it?
                    </p>
                  </div>
                </div>

                <a
                  href={`https://business.facebook.com/latest/whatsapp_manager/overview/?asset_id=${formData.wabaId || ""}&nav_ref=whatsapp_manager`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A504A] hover:bg-[#00A86B] text-white rounded-xl text-[11px] font-bold transition-colors w-fit shrink-0"
                >
                  <span>Open WhatsApp Manager</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-mono">1</span>
                    Two Different Payment Places
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Meta has <strong>Meta Ad Account Payment</strong> (for Facebook/Instagram Ads) and <strong>WhatsApp WABA Payment</strong>. Adding a card for Ads does <em>not</em> auto-link to WhatsApp.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-mono">2</span>
                    Why is it currently working?
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    When customers message you first, Meta opens a <strong>free 24-hr service window</strong>. However, initiating outbound broadcasts or sending templates after 24 hrs requires a card.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-mono">3</span>
                    1,000 Free Conversations / Mo
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Adding a card does not charge you upfront. Every WABA receives <strong>1,000 free customer-service conversations</strong> monthly. Only paid template categories incur billing.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600 border-t border-emerald-50">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>
                    <strong>Quick Fix:</strong> WhatsApp Manager &gt; Settings &gt; Payment Methods &gt; Select existing Business Card or enter new card.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/updates-to-pricing"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00A86B] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Meta Pricing Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Strip */}
            <div className="p-4 bg-white border border-[#dee3e9] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                <span className="font-bold text-slate-800">Need to modify or test your setup?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("test")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Send Live Test Message
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white font-bold transition-colors cursor-pointer"
                >
                  Edit API Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 1: 1-CLICK AUTO SETUP ===================== */}
        {activeTab === "auto" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#dee3e9] rounded-2xl p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#dee3e9]">
                <Zap className="w-5 h-5 text-[#00A86B]" />
                <div>
                  <h2 className="font-bold text-sm text-[#0A504A]">
                    Auto-Detect & Connect WhatsApp Number
                  </h2>
                  <p className="text-xs text-[#5d6c7b]">
                    Paste your Meta System User Permanent Token. WAPPX will auto-discover your WhatsApp Business accounts, phone numbers, and auto-subscribe webhooks.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAutoDiscover} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#0A504A]">
                      Meta System User Permanent Token
                    </label>
                    <a
                      href="https://business.facebook.com/settings/system-users"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#00A86B] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Get Token in Business Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={discoverToken}
                    onChange={(e) => setDiscoverToken(e.target.value)}
                    placeholder="EAAG..."
                    className="meta-input w-full font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-[#5d6c7b] mt-1">
                    Needs permissions: <code className="bg-[#F7F7F2] px-1 py-0.5 rounded text-[#0A504A]">whatsapp_business_messaging</code> and <code className="bg-[#F7F7F2] px-1 py-0.5 rounded text-[#0A504A]">whatsapp_business_management</code>.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    WhatsApp Business Account ID (WABA ID) <span className="text-[#5d6c7b] font-normal font-secondary">(Optional / Quick Hint)</span>
                  </label>
                  <input
                    type="text"
                    value={hintWabaId}
                    onChange={(e) => setHintWabaId(e.target.value)}
                    placeholder="e.g. WABA ID from Meta Developer Console (e.g. WAPPX Developer account ID)"
                    className="meta-input w-full font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-[#5d6c7b] mt-1">
                    Found in Meta Developer Portal &gt; Production Setup &gt; Under your WhatsApp account name.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isDiscovering}
                    className="px-5 py-2.5 bg-[#00A86B] text-white rounded-full font-bold hover:bg-[#0A504A] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isDiscovering ? "animate-spin" : ""}`} />
                    <span>{isDiscovering ? "Auto-Detecting Accounts..." : "Auto-Detect My WhatsApp Numbers"}</span>
                  </button>
                </div>
              </form>

              {discoverError && (
                <div className="p-3.5 bg-[#e41e3f]/10 border border-[#e41e3f]/30 rounded-xl text-xs text-[#e41e3f] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{discoverError}</span>
                </div>
              )}
            </div>

            {/* Discovered Numbers Result */}
            {discoveredWabas && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A504A] px-1">
                  Discovered WhatsApp Accounts ({discoveredWabas.length})
                </h3>

                {discoveredWabas.map((waba) => (
                  <div
                    key={waba.wabaId}
                    className="bg-white border border-[#dee3e9] rounded-2xl p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#dee3e9]">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#00A86B]" />
                        <span className="font-bold text-sm text-[#0A504A]">
                          {waba.wabaName}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#5d6c7b] bg-[#F7F7F2] px-2 py-0.5 rounded">
                        WABA: {waba.wabaId}
                      </span>
                    </div>

                    {waba.phoneNumbers.length === 0 ? (
                      <div className="text-xs text-[#5d6c7b] italic py-2">
                        No phone numbers found under this WABA. Go to Meta Developer Portal &gt; Production Setup &gt; Add phone number.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {waba.phoneNumbers.map((phone) => {
                          const isConnected = formData.phoneNumberId === phone.id;
                          const isConnecting = connectingPhoneId === phone.id;

                          return (
                            <div
                              key={phone.id}
                              className={`p-4 rounded-xl border transition-all ${
                                isConnected
                                  ? "border-[#00A86B] bg-[#A2E4B8]/20 ring-2 ring-[#00A86B]/30"
                                  : "border-[#dee3e9] bg-[#F7F7F2]/40 hover:border-[#00A86B]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-4 h-4 text-[#00A86B]" />
                                  <span className="font-bold text-sm text-[#0A504A]">
                                    {phone.displayPhoneNumber || phone.verifiedName}
                                  </span>
                                </div>
                                {isConnected ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00A86B] text-white flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-[#444950] border border-gray-200">
                                    Ready
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-[#5d6c7b] space-y-0.5 mb-3">
                                <div>
                                  <span className="font-semibold text-[#0A504A]">Verified Name:</span>{" "}
                                  {phone.verifiedName}
                                </div>
                                <div className="font-mono text-[10px]">
                                  ID: {phone.id}
                                </div>
                              </div>

                              <button
                                onClick={() => handleConnectNumber(waba.wabaId, phone)}
                                disabled={isConnecting}
                                className={`w-full py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  isConnected
                                    ? "bg-[#00A86B] text-white cursor-default"
                                    : "bg-[#0A504A] text-white hover:bg-[#00A86B]"
                                }`}
                              >
                                {isConnecting ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Connecting &amp; Subscribing Webhook...</span>
                                  </>
                                ) : isConnected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Connected &amp; Webhook Synced</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Connect This Number</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: MANUAL SETTINGS ===================== */}
        {activeTab === "manual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: API Credentials */}
            <div className="bg-white border border-[#dee3e9] rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#dee3e9]">
                <Key className="w-4 h-4 text-[#00A86B]" />
                <h2 className="font-bold text-sm text-[#0A504A]">
                  Meta Cloud API Credentials
                </h2>
              </div>

              <form onSubmit={handleManualSave} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    value={formData.phoneNumberId}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumberId: e.target.value })
                    }
                    placeholder="e.g. 108923485719321"
                    className="meta-input w-full"
                  />
                  <p className="text-[11px] text-[#5d6c7b] mt-1">
                    Found in Meta Developer Portal &gt; Production setup &gt; Phone numbers.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    value={formData.wabaId}
                    onChange={(e) =>
                      setFormData({ ...formData, wabaId: e.target.value })
                    }
                    placeholder="e.g. 249018249081234"
                    className="meta-input w-full"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    Permanent Access Token
                  </label>
                  <input
                    type="password"
                    value={formData.accessToken}
                    onChange={(e) =>
                      setFormData({ ...formData, accessToken: e.target.value })
                    }
                    placeholder="EAAG..."
                    className="meta-input w-full font-mono text-[11px]"
                  />
                  <p className="text-[11px] text-[#5d6c7b] mt-1">
                    System User token with <code className="bg-[#F7F7F2] px-1 py-0.5 rounded text-[#0A504A]">Never</code> expiry.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#00A86B] text-white rounded-full font-bold hover:bg-[#0A504A] transition-colors cursor-pointer"
                >
                  Save Configuration
                </button>
              </form>
            </div>

            {/* Card 2: Webhook Endpoint */}
            <div className="bg-white border border-[#dee3e9] rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#dee3e9]">
                <ShieldCheck className="w-4 h-4 text-[#00A86B]" />
                <h2 className="font-bold text-sm text-[#0A504A]">
                  Inbound Webhook Verification
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    Callback URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.webhookUrl}
                      className="meta-input w-full bg-[#F7F7F2] font-mono text-[11px]"
                    />
                    <button
                      onClick={() => handleCopy(formData.webhookUrl, "webhook")}
                      className="px-3 py-1.5 bg-[#0A504A] text-white rounded-lg hover:bg-[#00A86B] transition-colors shrink-0 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-[#A2E4B8]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-[#0A504A] block mb-1">
                    Verify Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.verifyToken}
                      className="meta-input w-full bg-[#F7F7F2] font-mono text-[11px]"
                    />
                    <button
                      onClick={() => handleCopy(formData.verifyToken, "token")}
                      className="px-3 py-1.5 bg-[#0A504A] text-white rounded-lg hover:bg-[#00A86B] transition-colors shrink-0 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-[#A2E4B8]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F7F7F2] rounded-xl text-[11px] text-[#444950] space-y-1.5 border border-[#dee3e9]">
                  <div className="font-bold text-[#0A504A] flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>How it works:</span>
                  </div>
                  <p>
                    Paste the Callback URL and Verify Token in Meta Developer Console &gt; Webhooks, then click <strong>Verify and save</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: TEST MESSENGER ===================== */}
        {activeTab === "test" && (
          <div className="bg-white border border-[#dee3e9] rounded-2xl p-6 space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#dee3e9]">
              <Send className="w-4 h-4 text-[#00A86B]" />
              <h2 className="font-bold text-sm text-[#0A504A]">
                Send WhatsApp Test Message
              </h2>
            </div>

            <p className="text-xs text-[#5d6c7b]">
              Verify that Meta Cloud API can send WhatsApp messages to your real phone number.
            </p>

            <form onSubmit={handleSendTestMessage} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  Recipient WhatsApp Number (with country code)
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+94771234567"
                  className="meta-input w-full font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="meta-input w-full resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2.5 bg-[#00A86B] text-white rounded-full font-bold hover:bg-[#0A504A] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? "Sending via Meta Cloud API..." : "Send Test Message"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

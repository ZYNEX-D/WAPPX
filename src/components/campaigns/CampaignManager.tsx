"use client";

import React, { useState } from "react";
import {
  Send,
  Users,
  Upload,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Play,
  Pause,
  BarChart3,
  Calendar,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Contact, Message } from "@/types/whatsapp";
import { WorkspaceListToolbar } from "@/components/ui/WorkspaceListToolbar";

interface Campaign {
  id: string;
  name: string;
  templateName: string;
  status: "completed" | "running" | "scheduled" | "paused";
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  createdAt: string;
  scheduledTime?: string;
  category: "Marketing" | "Utility";
}

interface CampaignManagerProps {
  contacts: Contact[];
  onSendMessage?: (contactId: string, text: string) => void;
  autoCutoffEnabled?: boolean;
}

export function CampaignManager({
  contacts,
  autoCutoffEnabled = true,
}: CampaignManagerProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "camp-1",
      name: "Avurudu Special Promo 2026",
      templateName: "promo_avurudu_discount",
      status: "completed",
      targetCount: contacts.length,
      sentCount: contacts.length,
      deliveredCount: Math.round(contacts.length * 0.98),
      readCount: Math.round(contacts.length * 0.86),
      repliedCount: Math.round(contacts.length * 0.32),
      createdAt: "Yesterday, 10:30 AM",
      category: "Marketing",
    },
    {
      id: "camp-2",
      name: "Order Delivery Status Broadcast",
      templateName: "order_dispatch_alert",
      status: "running",
      targetCount: 150,
      sentCount: 94,
      deliveredCount: 91,
      readCount: 78,
      repliedCount: 22,
      createdAt: "Today, 09:15 AM",
      category: "Utility",
    },
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [customMessage, setCustomMessage] = useState(
    "👋 Hello {{name}}! Exclusive weekend offer: Enjoy 20% off on all items using code 'WAPPX20'. Order now: https://zynex.lk"
  );
  const [dripRate, setDripRate] = useState<number>(50); // msgs per minute
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  const targetedContacts =
    selectedTag === "all"
      ? contacts
      : contacts.filter((c) => c.tags.includes(selectedTag));

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      name: campaignName.trim(),
      templateName: "custom_marketing_blast",
      status: "running",
      targetCount: csvFile ? 250 : targetedContacts.length,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliedCount: 0,
      createdAt: "Just now",
      category: "Marketing",
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setIsSubmitting(false);
    setShowNewModal(false);
    setCampaignName("");
    setCsvFile(null);
    showToast(`Campaign "${newCamp.name}" launched with Anti-Ban rate limiting!`);
  };

  const visibleCampaigns = campaigns.filter((campaign) =>
    (statusFilter === "all" || campaign.status === statusFilter) &&
    `${campaign.name} ${campaign.templateName}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="workspace-page flex-1 overflow-y-auto bg-[#F6F7F9] font-secondary text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
              Campaigns
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reach your audience with targeted broadcasts and follow-ups.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0A504A] hover:bg-[#073E39] text-white font-semibold text-xs shadow-none flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New campaign</span>
        </button>
      </div>

      {/* Auto-Cutoff Safety Guard Notice */}
      {autoCutoffEnabled && (
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-4 text-xs text-emerald-950">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold block">Free Tier Auto-Safety Cutoff Guard Active</span>
              <span className="text-slate-600">
                Outbound campaigns will automatically pause before exceeding Meta&apos;s free 1,000 monthly service conversations limit.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full font-semibold bg-emerald-600 text-white text-[11px] shrink-0">
            Protected
          </span>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-4">
        <WorkspaceListToolbar query={query} onQueryChange={setQuery} status={statusFilter} onStatusChange={setStatusFilter} statuses={["running", "scheduled", "paused", "completed"]} noun="campaigns" count={visibleCampaigns.length} />
        {visibleCampaigns.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center"><Send className="w-6 h-6 mx-auto text-slate-400" /><p className="text-sm font-medium mt-3">No matching campaigns</p><p className="text-xs text-slate-500 mt-1">Try a different search or status.</p></div>}

        <div className="grid grid-cols-1 gap-4">
          {visibleCampaigns.map((camp) => {
            const deliveryRate = camp.sentCount > 0 ? Math.round((camp.deliveredCount / camp.sentCount) * 100) : 0;
            const readRate = camp.deliveredCount > 0 ? Math.round((camp.readCount / camp.deliveredCount) * 100) : 0;

            return (
              <div
                key={camp.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-none hover:border-emerald-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-slate-900">{camp.name}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        camp.status === "completed"
                          ? "bg-slate-100 text-slate-600"
                          : camp.status === "running"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {camp.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Template: <code className="font-mono text-emerald-700">{camp.templateName}</code></span>
                      <span>·</span>
                      <span>{camp.createdAt}</span>
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold self-start sm:self-auto ${
                    camp.category === "Marketing" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                  }`}>
                    {camp.category}
                  </span>
                </div>

                {/* Progress / Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Audience</span>
                    <span className="text-base font-semibold text-slate-900">{camp.targetCount}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Sent</span>
                    <span className="text-base font-semibold text-slate-900">{camp.sentCount}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Delivered</span>
                    <span className="text-base font-semibold text-emerald-600">{deliveryRate}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Read Rate</span>
                    <span className="text-base font-semibold text-emerald-600">{readRate}%</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Replies</span>
                    <span className="text-base font-semibold text-sky-600">{camp.repliedCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Campaign Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-base text-slate-900">New WhatsApp Broadcast</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sinhala & Tamil New Year Promo"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Select Target Audience</label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium cursor-pointer"
                >
                  <option value="all">All Contacts ({contacts.length} recipients)</option>
                  {allTags.map((t) => (
                    <option key={t} value={t}>
                      Tagged with &quot;{t}&quot; ({contacts.filter((c) => c.tags.includes(t)).length} recipients)
                    </option>
                  ))}
                </select>
              </div>

              {/* CSV Upload Option */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Or Upload Customer CSV List</span>
                  <span className="text-[10px] text-slate-400 font-normal">Phone, Name columns</span>
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 text-center transition-colors cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <span className="text-[11px] text-slate-600 font-medium block">
                      {csvFile ? csvFile.name : "Click to upload .csv customer file"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Message Text with Variables</label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium resize-none"
                />
              </div>

              {/* Anti-Ban Drip Rate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Anti-Ban Drip Rate (Throttling)
                  </span>
                  <span className="font-mono font-semibold text-emerald-700">{dripRate} msgs/min</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={10}
                  value={dripRate}
                  onChange={(e) => setDripRate(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Protects your phone number Quality Rating and avoids WhatsApp spam blocks.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0A504A] hover:bg-[#073E39] text-white font-semibold flex items-center gap-2 cursor-pointer shadow-none disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Launching..." : "Launch Campaign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

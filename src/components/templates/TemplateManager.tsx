"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Send,
  Sparkles,
  X,
  ExternalLink,
  Phone,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { MetaConfig } from "@/types/whatsapp";

interface Template {
  id: string;
  name: string;
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  status: "APPROVED" | "PENDING" | "REJECTED";
  language: string;
  headerType?: "TEXT" | "IMAGE" | "NONE";
  bodyText: string;
  footerText?: string;
  buttons?: { type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER"; text: string; value?: string }[];
  updatedAt: string;
}

interface TemplateManagerProps {
  metaConfig: MetaConfig;
}

export function TemplateManager({ metaConfig }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "tpl-1",
      name: "order_confirmation_v1",
      category: "UTILITY",
      status: "APPROVED",
      language: "en",
      headerType: "NONE",
      bodyText: "Hi {{1}}, your order #{{2}} of Rs. {{3}} has been confirmed and is being processed for dispatch.",
      footerText: "Thank you for shopping with us.",
      buttons: [
        { type: "URL", text: "Track Order", value: "https://zynex.lk/track/{{2}}" },
        { type: "QUICK_REPLY", text: "Contact Support" },
      ],
      updatedAt: "2 days ago",
    },
    {
      id: "tpl-2",
      name: "seasonal_discount_blast",
      category: "MARKETING",
      status: "APPROVED",
      language: "en",
      headerType: "IMAGE",
      bodyText: "Celebrate this season with up to 40% OFF across all items! Use code 'SALE40' at checkout.",
      footerText: "Reply STOP to unsubscribe",
      buttons: [
        { type: "URL", text: "Shop Now", value: "https://zynex.lk" },
      ],
      updatedAt: "Yesterday",
    },
    {
      id: "tpl-3",
      name: "otp_verification_code",
      category: "AUTHENTICATION",
      status: "APPROVED",
      language: "en",
      headerType: "NONE",
      bodyText: "{{1}} is your verification security code. For your protection, do not share this code.",
      footerText: "Expires in 10 minutes",
      updatedAt: "1 week ago",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("MARKETING");
  const [bodyText, setBodyText] = useState("Hello {{1}}, we are pleased to inform you about {{2}}.");
  const [footerText, setFooterText] = useState("Zynex Support");
  const [buttonText, setButtonText] = useState("View Details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    const newTpl: Template = {
      id: `tpl-${Date.now()}`,
      name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      category,
      status: "APPROVED", // Meta instant approval simulation
      language: "en",
      headerType: "NONE",
      bodyText: bodyText.trim(),
      footerText: footerText.trim(),
      buttons: buttonText ? [{ type: "QUICK_REPLY", text: buttonText.trim() }] : [],
      updatedAt: "Just now",
    };

    setTemplates((prev) => [newTpl, ...prev]);
    setIsSubmitting(false);
    setShowCreateModal(false);
    setName("");
    showToast(`Template "${newTpl.name}" created and approved by Meta!`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] font-secondary text-slate-800 p-4 sm:p-6 lg:p-8 space-y-6 no-scrollbar">
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
            <FileText className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Meta WhatsApp Templates
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pre-approved Meta templates required for business-initiated outbound messages outside the 24h window.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Template</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-slate-900 truncate">
                  {tpl.name}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  tpl.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : tpl.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-rose-50 text-rose-700"
                }`}>
                  {tpl.status}
                </span>
              </div>

              {/* Category Tag */}
              <div className="flex items-center gap-2 text-[11px]">
                <span className={`px-2 py-0.5 rounded-md font-semibold ${
                  tpl.category === "MARKETING"
                    ? "bg-purple-50 text-purple-700"
                    : tpl.category === "UTILITY"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {tpl.category}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 uppercase">{tpl.language}</span>
              </div>

              {/* Message Bubble Preview */}
              <div className="bg-[#DCFCE7]/70 border border-[#86EFAC]/50 rounded-xl p-3 text-xs text-slate-800 space-y-2">
                {tpl.headerType === "IMAGE" && (
                  <div className="w-full h-24 rounded-lg bg-emerald-100/60 border border-emerald-200 flex items-center justify-center text-emerald-700 text-xs font-semibold gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Header Image</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{tpl.bodyText}</p>
                {tpl.footerText && (
                  <span className="text-[10px] text-slate-400 block pt-1 border-t border-black/5">
                    {tpl.footerText}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              {tpl.buttons && tpl.buttons.length > 0 && (
                <div className="space-y-1">
                  {tpl.buttons.map((b, idx) => (
                    <div
                      key={idx}
                      className="py-1 px-2.5 rounded-lg bg-white border border-emerald-200 text-center text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1.5"
                    >
                      {b.type === "URL" ? <ExternalLink className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      <span>{b.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span>Updated {tpl.updatedAt}</span>
              <span className="font-semibold text-emerald-700">Meta API Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Create Meta WhatsApp Template</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Template Name (Lowercase & Underscores)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. order_delivered_feedback"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="MARKETING">Marketing (Promotions, Offers)</option>
                    <option value="UTILITY">Utility (Orders, Account Alerts)</option>
                    <option value="AUTHENTICATION">Authentication (OTP codes)</option>
                  </select>
                </div>
              </div>

              {/* Body Text */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Template Body Content</span>
                  <span className="text-[10px] text-slate-400 font-normal">Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for dynamic variables</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Footer Text (Optional)</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    placeholder="e.g. Zynex Technologies"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Quick Reply Button Label</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500"
                    placeholder="e.g. Confirm Order"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting to Meta..." : "Submit to Meta for Approval"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

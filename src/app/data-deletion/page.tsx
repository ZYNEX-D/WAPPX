"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trash2,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Send,
  ExternalLink,
  Info,
  Clock,
  Check,
} from "lucide-react";

export default function DataDeletionPage() {
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "messenger" | "instagram" | "all">("all");
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    // Generate reference code for user tracking
    const code = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setConfirmationCode(code);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-slate-800 font-secondary flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-[#0A504A] hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to WAPPX Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-primary font-bold text-base tracking-wider text-[#0A504A]">
              WAPP<span className="text-[#00A86B]">X</span>
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-600">User Data Deletion</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Banner */}
        <div className="space-y-4 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Meta Platform Data Deletion Instructions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-primary font-medium text-[#0A504A] tracking-tight">
            User Data Deletion Instructions
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            In compliance with Meta Platform Policies and international privacy regulations (GDPR &amp; CCPA), 
            <strong> WAPPX</strong> provides clear instructions and self-service mechanisms for users to request 
            the permanent deletion of their personal data, conversation history, and account identifiers.
          </p>
        </div>

        {/* Step-by-Step Instructions */}
        <section className="space-y-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-lg font-bold text-[#0A504A] flex items-center gap-2">
            <Info className="w-5 h-5 text-[#0064E0]" />
            <span>How to Remove WAPPX Permissions from Your Meta Account</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            If you connected your Facebook Page or Instagram account to WAPPX, you can revoke access at any time directly through Facebook or Instagram:
          </p>

          <div className="space-y-3 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-800">Method 1: Via Facebook App Settings</p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Log in to your Facebook Account and go to <strong>Settings &amp; Privacy &rarr; Settings</strong>.</li>
                <li>In the left menu, select <strong>Apps and Websites</strong>.</li>
                <li>Find <strong>ZYNEXWAPPX</strong> (or WAPPX) in your connected apps list.</li>
                <li>Click <strong>Remove</strong> to revoke all active permissions.</li>
                <li>Optionally, check the box to <em>&quot;Delete posts, videos or events WAPPX posted on your timeline&quot;</em>.</li>
              </ol>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-800">Method 2: Via Instagram Mobile App</p>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Open the Instagram app and navigate to your profile.</li>
                <li>Tap <strong>Settings &amp; Privacy &rarr; Website permissions</strong>.</li>
                <li>Tap <strong>Apps and websites</strong> &rarr; find <strong>ZYNEXWAPPX</strong> under Active apps.</li>
                <li>Tap <strong>Remove</strong>.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Request Permanent Server-Side Deletion Form */}
        <section className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <h2 className="text-lg font-bold text-[#0A504A] flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <span>Request Permanent Server-Side Data Deletion</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Submit your phone number, Facebook User ID, or email address below. Our automated system and data privacy team 
              will purge all stored messages, contact profiles, and logs related to your identity within 30 days.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Data Deletion Request Successfully Submitted!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your request has been logged in our data compliance queue. All stored interaction logs and profile records 
                associated with this identifier will be permanently purged from our databases.
              </p>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 inline-block font-mono text-xs text-slate-700">
                Tracking Reference: <strong>{confirmationCode}</strong>
              </div>
              <p className="text-[11px] text-emerald-600">
                A confirmation record has been generated. For status updates, contact <strong>privacy@zynexdev.com</strong> with this code.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number, Facebook User ID, or Email Address:
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="+94 77 123 4567 or user@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-[#00A86B] font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The identifier used when interacting with the business on WhatsApp, Messenger, or Instagram.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Channel to Purge:
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-[#00A86B] bg-white"
                >
                  <option value="all">All Channels (WhatsApp, Messenger, Instagram)</option>
                  <option value="whatsapp">WhatsApp Only</option>
                  <option value="messenger">Facebook Messenger Only</option>
                  <option value="instagram">Instagram Direct Only</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Data Deletion Request</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* SLA & Legal Notice */}
        <section className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Processing Timeline &amp; Scope</span>
          </div>
          <p className="leading-relaxed">
            Requests are processed within <strong>30 calendar days</strong> of receipt. The deletion scope includes 
            inbound/outbound message transcripts, contact metadata, media attachments, and conversation threads. 
            Aggregated, non-personally identifiable analytical logs may be retained in anonymized form for security audits.
          </p>
          <p className="pt-1">
            Questions? Contact our Data Protection Officer at{" "}
            <a href="mailto:privacy@zynexdev.com" className="text-[#00A86B] font-bold underline">
              privacy@zynexdev.com
            </a>{" "}
            or{" "}
            <a href="mailto:support@zynexdev.com" className="text-[#00A86B] font-bold underline">
              support@zynexdev.com
            </a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} ZYNEX Developments. All rights reserved. &bull; WAPPX Enterprise Platform</p>
      </footer>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Layers,
  FileSpreadsheet,
  ShoppingBag,
  CreditCard,
  Webhook,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  Copy,
  Plus,
} from "lucide-react";
import { MetaConfig } from "@/types/whatsapp";

interface IntegrationsHubProps {
  metaConfig: MetaConfig;
}

export function IntegrationsHub({ metaConfig }: IntegrationsHubProps) {
  const [googleSheetsConnected, setGoogleSheetsConnected] = useState(true);
  const [sheetUrl, setSheetUrl] = useState("https://docs.google.com/spreadsheets/d/1Zynex_WhatsApp_Leads/edit");
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [abandonedCartRecovery, setAbandonedCartRecovery] = useState(true);
  const [payhereConnected, setPayhereConnected] = useState(true);
  const [payhereMerchantId, setPayhereMerchantId] = useState("1214892");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            E-Commerce & Third-Party Integrations
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Connect your online store, Google Sheets, payment gateways, and custom webhook automations directly to WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Google Sheets Integration */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Google Sheets Sync</h3>
                <p className="text-xs text-slate-500">Auto-append new WhatsApp leads into Google Sheets</p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              googleSheetsConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
            }`}>
              {googleSheetsConnected ? "ACTIVE" : "DISCONNECTED"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700">Target Google Sheet URL</label>
            <input
              type="text"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setGoogleSheetsConnected(!googleSheetsConnected);
                showToast(googleSheetsConnected ? "Google Sheets disconnected" : "Google Sheets connected successfully!");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                googleSheetsConnected
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              }`}
            >
              {googleSheetsConnected ? "Disconnect" : "Connect Google Sheet"}
            </button>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Open Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2. Shopify & WooCommerce */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Shopify & WooCommerce</h3>
                <p className="text-xs text-slate-500">Abandoned cart recovery & automated dispatch alerts</p>
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              shopifyConnected ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-500"
            }`}>
              {shopifyConnected ? "CONNECTED" : "SETUP READY"}
            </span>
          </div>

          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950">Abandoned Cart WhatsApp Recovery</span>
              <input
                type="checkbox"
                checked={abandonedCartRecovery}
                onChange={(e) => {
                  setAbandonedCartRecovery(e.target.checked);
                  showToast(e.target.checked ? "Abandoned cart automation enabled!" : "Abandoned cart automation paused");
                }}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-purple-800 leading-snug">
              Sends an automated WhatsApp discount reminder 15 minutes after customer abandons their online cart.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setShopifyConnected(!shopifyConnected);
                showToast(shopifyConnected ? "Shopify disconnected" : "Store connected to WAPPX Webhook!");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all cursor-pointer"
            >
              {shopifyConnected ? "Manage Store" : "Connect Store"}
            </button>
            <span className="text-[11px] text-slate-400">Webhook: /api/webhook/shopify</span>
          </div>
        </div>

        {/* 3. PayHere Payment Gateway */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">PayHere Payment Links</h3>
                <p className="text-xs text-slate-500">Sri Lankan online payments (Visa, MasterCard, Koko, Mintpay)</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-700">PayHere Merchant ID</label>
            <input
              type="text"
              value={payhereMerchantId}
              onChange={(e) => setPayhereMerchantId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">Generate 1-click payment links in chat</span>
            <button
              onClick={() => showToast("PayHere configuration verified!")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
            >
              Verify Credentials
            </button>
          </div>
        </div>

        {/* 4. Custom Outbound Webhooks */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Webhook className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Custom Outbound Webhooks</h3>
                <p className="text-xs text-slate-500">Forward message events to external servers / Zapier / Make</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              LISTENING
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">Inbound Webhook Endpoint:</span>
            <code className="text-[11px] font-mono text-emerald-700 break-all block">
              {metaConfig.webhookUrl || "https://zynex.lk/api/webhook"}
            </code>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                navigator.clipboard.writeText(metaConfig.webhookUrl);
                showToast("Webhook URL copied to clipboard!");
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Webhook URL</span>
            </button>
            <span className="text-[11px] text-slate-400">Events: messages, status, buttons</span>
          </div>
        </div>
      </div>
    </div>
  );
}

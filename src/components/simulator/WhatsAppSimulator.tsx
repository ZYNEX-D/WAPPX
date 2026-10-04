"use client";

import React, { useState, useRef, useEffect } from "react";
import { FlowNode, MessageSenderType, CatalogPayload, CatalogItem } from "@/types/whatsapp";
import { processBotInteraction } from "@/lib/bot-engine";
import {
  Send,
  RotateCcw,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  ArrowLeft,
  ChevronRight,
  Zap,
  Bot,
  User,
  ShoppingBag,
  Store,
  ExternalLink,
  FileText,
  X,
  CheckCircle2,
} from "lucide-react";

interface SimMessage {
  id: string;
  sender: MessageSenderType | "user";
  text: string;
  timestamp: string;
  buttons?: { id: string; title: string }[];
  catalog?: CatalogPayload;
  status?: "sent" | "delivered" | "read";
}

interface WhatsAppSimulatorProps {
  nodes: FlowNode[];
  onHandoffAlert?: (customerText: string) => void;
}

function TickSVG({ status }: { status: "sent" | "delivered" | "read" }) {
  const color = status === "read" ? "#53bdeb" : "#8696a0";
  if (status === "sent") {
    return (
      <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
        <path d="M1 4.5L4 7.5L11 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
      <path d="M1 4.5L4 7.5L11 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 4.5L9 7.5L16 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div
        className="relative flex items-center gap-1 px-3 py-2.5"
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px 12px 12px 2px",
          boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[6px] h-[6px] rounded-full"
            style={{
              backgroundColor: "#8696a0",
              display: "inline-block",
              animation: "waDot 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        {/* Tail */}
        <svg width="8" height="13" viewBox="0 0 8 13" className="absolute -left-[7px] bottom-0" fill="#fff">
          <path d="M8 13C6 13 0 13 0 13C0 13 0 0 8 0V13Z" />
        </svg>
      </div>
    </div>
  );
}

const TRIGGERS = [
  { label: "Send “Hello”", sub: "Welcome flow", msg: "Hello", btnId: undefined as string | undefined, danger: false },
  { label: "🛍️ View Catalog", sub: "Interactive catalog", msg: "View Catalog", btnId: "btn-catalog", danger: false },
  { label: "💼 Packages & Pricing", sub: "Pricing step", msg: "💼 Packages & Pricing", btnId: "btn-pricing", danger: false },
  { label: "📦 Track Order", sub: "Order lookup", msg: "📦 Track Order", btnId: "btn-order", danger: false },
  { label: "👤 Talk to Agent", sub: "Human handoff", msg: "👤 Talk to Agent", btnId: "btn-agent", danger: true },
];

export function WhatsAppSimulator({ nodes, onHandoffAlert }: WhatsAppSimulatorProps) {
  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: "sim-1",
      sender: "bot",
      text: "👋 Welcome to WAPPX Automation! How can we assist your business today?",
      timestamp: "14:40",
      buttons: [
        { id: "btn-catalog", title: "🛍️ View Catalog" },
        { id: "btn-pricing", title: "💼 Packages & Pricing" },
        { id: "btn-agent", title: "👤 Talk to Agent" },
      ],
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeCatalogSheet, setActiveCatalogSheet] = useState<CatalogPayload | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string, buttonId?: string) => {
    if (!text.trim()) return;
    const ts = now();

    setMessages((p) => [...p, { id: `u-${Date.now()}`, sender: "user", text, timestamp: ts, status: "read" }]);
    setInputText("");

    if (isBotPaused) { onHandoffAlert?.(text); return; }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const result = processBotInteraction({
        incomingText: text,
        buttonId,
        contact: { id: "sim", name: "Test User", phone: "+94770000000", status: "active", tags: [], unreadCount: 0, lastMessageSnippet: "", lastMessageTime: ts, isBotActive: true, notes: [] },
        nodes,
      });
      if (result) {
        setMessages((p) => [
          ...p,
          {
            id: result.replyMessage.id,
            sender: result.replyMessage.sender,
            text: result.replyMessage.text,
            timestamp: result.replyMessage.timestamp,
            buttons: result.replyMessage.buttons,
            catalog: result.replyMessage.catalog,
          },
        ]);
        if (result.handoffTriggered) { setIsBotPaused(true); onHandoffAlert?.("User requested Human Agent transfer."); }
      }
    }, 1100);
  };

  const handleReset = () => {
    setIsBotPaused(false);
    setIsTyping(false);
    setActiveCatalogSheet(null);
    setMessages([{ id: `r-${Date.now()}`, sender: "bot", text: "👋 Welcome to WAPPX Automation! How can we assist your business today?", timestamp: now(), buttons: [{ id: "btn-catalog", title: "🛍️ View Catalog" }, { id: "btn-pricing", title: "💼 Packages & Pricing" }, { id: "btn-agent", title: "👤 Talk to Agent" }] }]);
  };

  return (
    <>
      <style>{`
        @keyframes waDot {
          0%,60%,100% { transform:translateY(0); opacity:.4 }
          30% { transform:translateY(-5px); opacity:1 }
        }
      `}</style>

      {/* Outer wrapper — fills the workspace area exactly, no overflow */}
      <div className="flex h-full w-full overflow-hidden bg-[#f1f5f9] font-secondary">

        {/* ═══════════════════════════════════════════════════════════════
            LEFT PANEL — Premium Controls
        ═══════════════════════════════════════════════════════════════ */}
        <div className="w-80 xl:w-96 shrink-0 flex flex-col h-full border-r border-slate-200 bg-white">

          {/* Panel header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00A86B]/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#00A86B]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 leading-tight">Bot Simulator</h2>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">WhatsApp Preview</p>
                </div>
              </div>
              {/* Live status badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isBotPaused ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBotPaused ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                {isBotPaused ? "Handoff" : "Active"}
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">

            {/* State description */}
            <div className={`rounded-xl p-3.5 text-xs leading-relaxed ${isBotPaused ? "bg-red-50 border border-red-100 text-red-700" : "bg-emerald-50 border border-emerald-100 text-emerald-700"}`}>
              {isBotPaused
                ? "Human handoff is active. Incoming messages bypass the bot and route to your Live Team Inbox."
                : "The automation engine is live, matching every incoming message to your Flow Builder triggers."}
            </div>

            {/* Quick triggers */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5 text-[#00A86B]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Triggers</span>
              </div>
              <div className="space-y-2">
                {TRIGGERS.map((t) => (
                  <button
                    key={t.msg}
                    onClick={() => handleSend(t.msg, t.btnId)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer group border ${
                      t.danger
                        ? "border-red-100 bg-red-50 hover:bg-red-100 text-red-600"
                        : "border-slate-100 bg-slate-50 hover:bg-[#00A86B]/5 hover:border-[#00A86B]/20 text-slate-700"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold leading-tight">{t.label}</div>
                      <div className={`text-[10px] mt-0.5 ${t.danger ? "text-red-400" : "text-slate-400"}`}>{t.sub}</div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0 ${t.danger ? "text-red-400" : "text-[#00A86B]"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-slate-800">{messages.filter(m => m.sender === "user").length}</div>
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1 mt-0.5">
                  <User className="w-2.5 h-2.5" /> Sent
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-[#00A86B]">{messages.filter(m => m.sender === "bot").length}</div>
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1 mt-0.5">
                  <Bot className="w-2.5 h-2.5" /> Bot Replies
                </div>
              </div>
            </div>

          </div>

          {/* Panel footer */}
          <div className="px-5 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-[#00A86B]/40 hover:text-[#0A504A] hover:bg-[#00A86B]/5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Session
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            RIGHT — Phone Mockup, perfectly centered, no page scroll
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex items-center justify-center h-full overflow-hidden">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              opacity: 0.45,
            }}
          />

          {/* Phone shell */}
          <div
            className="relative z-10 flex flex-col overflow-hidden"
            style={{
              width: "min(330px, 90vw)",
              // Height: fill available space minus padding, capped at WhatsApp's real proportions
              height: "min(calc(100vh - 100px), 660px)",
              borderRadius: "40px",
              boxShadow: "0 0 0 10px #1a1a1a, 0 0 0 11px #3a3a3a, 0 40px 80px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)",
              backgroundColor: "#075e54",
            }}
          >
            {/* Side buttons */}
            <div className="absolute -right-[13px] top-[100px] w-[4px] h-[60px] rounded-r-full" style={{ backgroundColor: "#2a2a2a" }} />
            <div className="absolute -left-[13px] top-[80px] w-[4px] h-[40px] rounded-l-full" style={{ backgroundColor: "#2a2a2a" }} />
            <div className="absolute -left-[13px] top-[130px] w-[4px] h-[40px] rounded-l-full" style={{ backgroundColor: "#2a2a2a" }} />
            <div className="absolute -left-[13px] top-[180px] w-[4px] h-[40px] rounded-l-full" style={{ backgroundColor: "#2a2a2a" }} />

            {/* Screen area — fills shell */}
            <div
              className="flex-1 flex flex-col overflow-hidden"
              style={{
                margin: "10px",
                borderRadius: "32px",
                overflow: "hidden",
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
              }}
            >
              {/* ── iOS Status Bar ── */}
              <div
                className="shrink-0 flex items-center justify-between px-5"
                style={{ backgroundColor: "#075e54", paddingTop: "10px", paddingBottom: "4px" }}
              >
                <span className="text-white text-[11px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>9:41</span>
                {/* Dynamic Island placeholder */}
                <div className="w-[80px] h-[22px] bg-black rounded-full" />
                <div className="flex items-center gap-1.5">
                  <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
                    <rect x="0" y="8" width="2.5" height="3" rx="0.4" />
                    <rect x="3.5" y="5.5" width="2.5" height="5.5" rx="0.4" />
                    <rect x="7" y="3" width="2.5" height="8" rx="0.4" />
                    <rect x="10.5" y="0" width="2.5" height="11" rx="0.4" opacity="0.35" />
                  </svg>
                  <svg width="14" height="10" viewBox="0 0 20 15" fill="white">
                    <circle cx="10" cy="13" r="2" />
                    <path d="M5.75 9.5a6 6 0 018.5 0" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M2.5 6.5a10.5 10.5 0 0115 0" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  </svg>
                  <div className="flex items-center">
                    <div className="w-[19px] h-[10px] border border-white/80 rounded-[2px] p-[1.5px] flex items-center">
                      <div className="h-full rounded-[1px] bg-white" style={{ width: "80%" }} />
                    </div>
                    <div className="w-[2px] h-[5px] bg-white/50 rounded-r-[1px] ml-[1px]" />
                  </div>
                </div>
              </div>

              {/* ── WhatsApp Header ── */}
              <div
                className="shrink-0 flex items-center px-3 py-2 gap-2"
                style={{ backgroundColor: "#075e54" }}
              >
                <ArrowLeft className="w-[18px] h-[18px] text-white shrink-0" />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ backgroundColor: "#128C7E" }}
                >
                  <img src="/icon.png" alt="" className="w-5 h-5 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate" style={{ fontSize: "13px" }}>WAPPX Support</div>
                  <div style={{ fontSize: "10px", color: "#b2dfdb" }}>online</div>
                </div>
                <div className="flex items-center gap-[14px] text-white shrink-0">
                  <Video className="w-[18px] h-[18px]" />
                  <Phone className="w-[17px] h-[17px]" />
                  <MoreVertical className="w-[18px] h-[18px]" />
                </div>
              </div>

              {/* ── Chat Area ── */}
              <div
                className="flex-1 overflow-y-auto px-2 py-2 space-y-[3px] min-h-0"
                style={{
                  backgroundColor: "#efeae2",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c9b99a' fill-opacity='0.13' fill-rule='evenodd'%3E%3Cpath d='M26 0C11.64 0 0 11.64 0 26s11.64 26 26 26 26-11.64 26-26S40.36 0 26 0zm0 3.5C38.43 3.5 48.5 13.57 48.5 26S38.43 48.5 26 48.5 3.5 38.43 3.5 26 13.57 3.5 26 3.5z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {/* Encryption banner */}
                <div className="flex justify-center my-1.5">
                  <div
                    className="text-center px-3 py-[7px] rounded-lg max-w-[90%] leading-[1.4]"
                    style={{ backgroundColor: "#fffde7", color: "#706e6e", fontSize: "9.5px" }}
                  >
                    🔒 Messages are end-to-end encrypted. No one outside can read them.{" "}
                    <span style={{ color: "#128C7E" }}>Tap to learn more</span>
                  </div>
                </div>

                {/* Date pill */}
                <div className="flex justify-center my-2">
                  <div className="px-3 py-0.5 rounded-full text-[10px]" style={{ backgroundColor: "#e1f2fb", color: "#54656f" }}>
                    TODAY
                  </div>
                </div>

                {/* Messages */}
                {messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <div key={m.id} className={`flex mb-[2px] ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className="relative max-w-[80%]"
                        style={{
                          backgroundColor: isUser ? "#d9fdd3" : "#ffffff",
                          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          boxShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
                          padding: "5px 10px 18px 9px",
                          minWidth: "60px",
                        }}
                      >
                        {/* Text */}
                        <p className="whitespace-pre-wrap leading-[1.4]" style={{ fontSize: "12px", color: "#111b21", wordBreak: "break-word" }}>
                          {m.text}
                        </p>

                        {/* Interactive Catalog Card Preview */}
                        {m.catalog && (
                          <div className="mt-2 mb-1 rounded-xl overflow-hidden border border-slate-200/80 bg-slate-50/70 text-slate-800 shadow-xs">
                            {/* Hero Image / Header */}
                            {m.catalog.type === "pdf" ? (
                              <div className="p-3 bg-red-50/80 border-b border-red-100 flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-red-950 truncate">
                                    {m.catalog.catalogName || "Product Catalog.pdf"}
                                  </div>
                                  <div className="text-[10px] text-red-600 font-medium">WhatsApp PDF Brochure</div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                {m.catalog.products?.[0]?.imageUrl ? (
                                  <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={m.catalog.products[0].imageUrl}
                                      alt="Product"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-xs text-[9px] font-semibold text-white flex items-center gap-1">
                                      <Store className="w-2.5 h-2.5 text-emerald-400" />
                                      Catalog
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-20 bg-gradient-to-r from-emerald-600 to-teal-700 p-3 flex items-center justify-between text-white">
                                    <div>
                                      <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                                        <Store className="w-3 h-3" /> Meta Commerce
                                      </div>
                                      <div className="text-xs font-bold leading-tight mt-0.5">
                                        {m.catalog.catalogName || "Product Catalog"}
                                      </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center">
                                      <ShoppingBag className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                )}

                                <div className="p-2.5 space-y-1 bg-white">
                                  <div className="flex items-baseline justify-between gap-2">
                                    <div className="text-xs font-bold text-slate-900 truncate">
                                      {m.catalog.catalogName || m.catalog.products?.[0]?.title || "WhatsApp Catalog"}
                                    </div>
                                    {m.catalog.products?.[0]?.price && (
                                      <div className="text-[11px] font-bold text-emerald-600 shrink-0">
                                        {m.catalog.products[0].price}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                                    {m.catalog.bodyText || m.catalog.products?.[0]?.description || "Tap below to view full items and details."}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Catalog Action Button */}
                            <button
                              type="button"
                              onClick={() => setActiveCatalogSheet(m.catalog!)}
                              className="w-full py-2 px-3 border-t border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center gap-1.5 text-xs font-bold text-[#00A86B] cursor-pointer transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              {m.catalog.type === "pdf"
                                ? "Open Catalog PDF"
                                : m.catalog.type === "product"
                                ? "View Product"
                                : "View Catalog"}
                            </button>
                          </div>
                        )}

                        {/* Buttons (WA list style) */}
                        {m.buttons && m.buttons.length > 0 && (
                          <div className="mt-1.5" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                            {m.buttons.map((btn, i) => (
                              <button
                                key={btn.id}
                                onClick={() => handleSend(btn.title, btn.id)}
                                className="w-full py-[7px] cursor-pointer active:opacity-60 transition-opacity text-center"
                                style={{
                                  fontSize: "11.5px",
                                  color: "#0a80eb",
                                  fontWeight: 500,
                                  borderTop: i > 0 ? "1px solid rgba(0,0,0,0.07)" : "none",
                                }}
                              >
                                {btn.title}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Timestamp + ticks — absolutely positioned inside bubble */}
                        <div
                          className="absolute flex items-center gap-[3px]"
                          style={{ bottom: "4px", right: "8px", color: "#8696a0", fontSize: "9.5px", whiteSpace: "nowrap" }}
                        >
                          <span>{m.timestamp}</span>
                          {isUser && <TickSVG status={m.status ?? "read"} />}
                        </div>

                        {/* Tail */}
                        {isUser ? (
                          <svg width="8" height="13" viewBox="0 0 8 13" className="absolute -right-[7px] bottom-0" fill="#d9fdd3">
                            <path d="M0 13C2 13 8 13 8 13C8 13 8 0 0 0V13Z" />
                          </svg>
                        ) : (
                          <svg width="8" height="13" viewBox="0 0 8 13" className="absolute -left-[7px] bottom-0" fill="#ffffff">
                            <path d="M8 13C6 13 0 13 0 13C0 13 0 0 8 0V13Z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isTyping && <TypingDots />}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input Bar ── */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
                className="shrink-0 flex items-center gap-2 px-2 py-2"
                style={{ backgroundColor: "#f0f2f5" }}
              >
                <div
                  className="flex-1 flex items-center gap-2 px-3 rounded-full"
                  style={{ backgroundColor: "#fff", minHeight: "36px" }}
                >
                  <Smile className="w-[18px] h-[18px] shrink-0" style={{ color: "#8696a0" }} />
                  <input
                    type="text"
                    placeholder="Message"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-transparent outline-none min-w-0"
                    style={{ fontSize: "12.5px", color: "#111b21" }}
                  />
                  {!inputText && (
                    <Paperclip className="w-[17px] h-[17px] shrink-0" style={{ color: "#8696a0" }} />
                  )}
                </div>
                <button
                  type={inputText.trim() ? "submit" : "button"}
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: "#00a884" }}
                >
                  {inputText.trim()
                    ? <Send className="w-[16px] h-[16px] text-white" style={{ marginLeft: "1px" }} />
                    : <Mic className="w-[16px] h-[16px] text-white" />
                  }
                </button>
              </form>

              {/* Home indicator */}
              <div className="shrink-0 flex justify-center py-1.5" style={{ backgroundColor: "#f0f2f5" }}>
                <div className="w-20 h-[4px] rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.2)" }} />
              </div>

              {/* WhatsApp In-App Catalog Sheet Overlay */}
              {activeCatalogSheet && (
                <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
                  <div className="bg-white rounded-t-2xl max-h-[82%] flex flex-col overflow-hidden shadow-2xl border-t border-slate-200">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {activeCatalogSheet.catalogName || "Business Catalog"}
                          </div>
                          <div className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Official WhatsApp Store
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveCatalogSheet(null)}
                        className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Sheet Content */}
                    <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
                      {activeCatalogSheet.bodyText && (
                        <p className="text-slate-600 leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {activeCatalogSheet.bodyText}
                        </p>
                      )}

                      {/* Items */}
                      <div className="space-y-2">
                        {((activeCatalogSheet.products && activeCatalogSheet.products.length > 0
                          ? activeCatalogSheet.products
                          : [
                              {
                                id: "p1",
                                title: activeCatalogSheet.catalogName || "Featured Product",
                                price: "$49.00 USD",
                                description: "Official item from WhatsApp Business Commerce catalog.",
                                retailerId: "SKU-001",
                              },
                            ]) as CatalogItem[]
                        ).map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-[#00A86B]/40 transition-colors flex gap-3"
                          >
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-14 h-14 rounded-lg object-cover shrink-0 bg-slate-100"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-1">
                                <div className="font-bold text-slate-800 truncate text-xs">{item.title}</div>
                                {item.price && (
                                  <div className="font-bold text-emerald-600 text-xs shrink-0">{item.price}</div>
                                )}
                              </div>
                              {item.retailerId && (
                                <div className="text-[9.5px] text-slate-400 font-mono">SKU: {item.retailerId}</div>
                              )}
                              <p className="text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                                {item.description || "In stock & ready to dispatch"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom action */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const itemTitle = activeCatalogSheet.products?.[0]?.title || activeCatalogSheet.catalogName || "catalog";
                          setActiveCatalogSheet(null);
                          handleSend(`I'm interested in ${itemTitle}`);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Message Business About This
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

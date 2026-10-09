"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  X,
  FileText,
  Tag,
  Calendar,
  Building,
  Mail,
  Check,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import {
  SupportTicket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  UserWorkspace,
} from "@/types/whatsapp";
import { supabase } from "@/lib/supabase/client";

interface SupportTicketsViewProps {
  currentUser?: UserWorkspace;
  clientId: string;
}

const CATEGORY_LABELS: Record<TicketCategory, { label: string; color: string }> = {
  technical: { label: "Technical Issue", color: "bg-blue-50 text-blue-700 border-blue-200" },
  meta_api: { label: "Meta Cloud API", color: "bg-purple-50 text-purple-700 border-purple-200" },
  flows: { label: "Chatbot & Flows", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  catalog: { label: "Catalog & Products", color: "bg-amber-50 text-amber-700 border-amber-200" },
  billing: { label: "Billing & Plans", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  other: { label: "General Inquiry", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

const PRIORITY_BADGES: Record<TicketPriority, { label: string; color: string; icon: any }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock },
  medium: { label: "Medium", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
  high: { label: "High", color: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle },
  urgent: { label: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse", icon: AlertCircle },
};

const STATUS_BADGES: Record<TicketStatus, { label: string; color: string; dot: string }> = {
  open: { label: "Open", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  in_progress: { label: "In Progress", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  waiting_client: { label: "Awaiting Your Reply", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

export function SupportTicketsView({ currentUser, clientId }: SupportTicketsViewProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formSubject, setFormSubject] = useState("");
  const [formCategory, setFormCategory] = useState<TicketCategory>("technical");
  const [formPriority, setFormPriority] = useState<TicketPriority>("medium");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply Input
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Load tickets
  const loadTickets = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch(`/api/support/tickets?clientId=${clientId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        if (!selectedTicketId && data.tickets.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`support-tickets-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.client_id && row.client_id === clientId) {
            loadTickets(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  // Selected Ticket object
  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Ticket stats
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const waitingCount = tickets.filter((t) => t.status === "waiting_client").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  // 2. Submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientName: currentUser?.name || "Client",
          businessName: currentUser?.businessName || "",
          clientEmail: currentUser?.email || "client@zynex.lk",
          subject: formSubject.trim(),
          category: formCategory,
          priority: formPriority,
          description: formDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to create ticket");
        return;
      }

      setTickets((prev) => [data.ticket, ...prev]);
      setSelectedTicketId(data.ticket.id);
      setIsCreateModalOpen(false);
      setFormSubject("");
      setFormDescription("");
      showToast("Support ticket created successfully!");
    } catch (err: any) {
      console.error("Create ticket error:", err);
      showToast(err.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Send client reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    try {
      setIsSendingReply(true);
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          replyMessage: {
            sender: "client",
            senderName: currentUser?.name || "You",
            senderEmail: currentUser?.email,
            text: replyText.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to send reply");
        return;
      }

      setTickets((prev) => prev.map((t) => (t.id === data.ticket.id ? data.ticket : t)));
      setReplyText("");
      showToast("Reply sent to Support Team");
    } catch (err: any) {
      console.error("Send reply error:", err);
      showToast(err.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F7F2] overflow-hidden font-secondary">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center shadow-xs">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Help & Support Center</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Direct Team Assistance
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request technical help, API setup assistance, catalog reviews, and billing inquiries directly with our engineering team.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setIsRefreshing(true);
                loadTickets(false);
              }}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs"
              title="Refresh tickets"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#00A86B]" : ""}`} />
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Support Ticket</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">Total Tickets</span>
            <span className="text-sm font-extrabold text-slate-900">{totalCount}</span>
          </div>
          <div className="bg-blue-50/60 rounded-xl p-2.5 border border-blue-200/60 flex items-center justify-between">
            <span className="text-xs text-blue-700 font-medium">Open / Active</span>
            <span className="text-sm font-extrabold text-blue-800">{openCount}</span>
          </div>
          <div className="bg-purple-50/60 rounded-xl p-2.5 border border-purple-200/60 flex items-center justify-between">
            <span className="text-xs text-purple-700 font-medium">Action Needed</span>
            <span className="text-sm font-extrabold text-purple-800">{waitingCount}</span>
          </div>
          <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-200/60 flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-medium">Resolved</span>
            <span className="text-sm font-extrabold text-emerald-800">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* Main Content: Split Ticket List & Conversation Thread */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Ticket List */}
        <div className="w-full lg:w-96 border-r border-slate-200/80 bg-white flex flex-col shrink-0">
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket ID or subject..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-[#00A86B] outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_client">Awaiting Reply</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="meta_api">Meta API</option>
                <option value="flows">Flows</option>
                <option value="catalog">Catalog</option>
                <option value="billing">Billing</option>
                <option value="other">General</option>
              </select>
            </div>
          </div>

          {/* Ticket Items Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span>Loading support tickets...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#00A86B] mx-auto flex items-center justify-center">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No support tickets found</p>
                <p className="text-[11px] text-slate-400">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search filters."
                    : "Have an issue or question? Click 'New Support Ticket' to message our team."}
                </p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                const statusInfo = STATUS_BADGES[t.status] || STATUS_BADGES.open;
                const priorityInfo = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;
                const lastMsg = t.messages[t.messages.length - 1];

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 text-left ${
                      isSelected
                        ? "bg-emerald-50/60 border-l-4 border-[#00A86B] pl-2.5"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {t.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                      {t.subject}
                    </h4>

                    <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                      {lastMsg ? lastMsg.text : t.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className={`px-1.5 py-0.2 rounded border font-semibold ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                      <span>
                        {new Date(t.updatedAt || t.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="flex-1 bg-[#F7F7F2] flex flex-col overflow-hidden">
          {activeTicket ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Ticket Details Bar */}
              <div className="p-4 bg-white border-b border-slate-200/80 shrink-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {activeTicket.id}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      {activeTicket.subject}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${STATUS_BADGES[activeTicket.status]?.color}`}>
                      <span className={`w-2 h-2 rounded-full ${STATUS_BADGES[activeTicket.status]?.dot}`} />
                      <span>{STATUS_BADGES[activeTicket.status]?.label}</span>
                    </span>

                    <span className={`px-2 py-1 rounded-xl text-xs font-bold border ${PRIORITY_BADGES[activeTicket.priority]?.color}`}>
                      Priority: {PRIORITY_BADGES[activeTicket.priority]?.label}
                    </span>
                  </div>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>{CATEGORY_LABELS[activeTicket.category]?.label || activeTicket.category}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned: <strong className="text-slate-700">{activeTicket.assignedAdmin || "Platform Team"}</strong></span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Submitted on {new Date(activeTicket.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                  </span>
                </div>
              </div>

              {/* Message History Thread */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Initial Description Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {activeTicket.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{activeTicket.clientName}</p>
                        <p className="text-[10px] text-slate-400">Original Inquiry</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pt-1">
                    {activeTicket.description}
                  </p>
                </div>

                {/* Follow-up Messages & Admin Responses */}
                {activeTicket.messages.slice(1).map((msg) => {
                  const isAdmin = msg.sender === "admin";

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${isAdmin ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAdmin
                            ? "bg-[#0A504A] text-white shadow-sm"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div
                        className={`rounded-2xl p-4 text-xs leading-relaxed space-y-1.5 shadow-xs ${
                          isAdmin
                            ? "bg-white text-slate-800 border border-emerald-200/70 ring-1 ring-emerald-500/10"
                            : "bg-[#00A86B] text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 border-b pb-1.5 opacity-80 text-[10px]">
                          <span className="font-bold">
                            {isAdmin ? "Platform Support Team" : "You"}
                          </span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {activeTicket.status !== "closed" ? (
                <div className="p-4 bg-white border-t border-slate-200/80 shrink-0">
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a follow-up message to the support team..."
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-none transition-all resize-none"
                    />
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="px-5 bg-[#00A86B] hover:bg-[#0A504A] disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSendingReply ? "Sending..." : "Reply"}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                  This ticket has been marked as closed. Need further help? Submit a new ticket.
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center">
                <LifeBuoy className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Select a support ticket to view conversation</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a ticket from the left panel, or create a new ticket to get assistance from our team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Submit Support Request</h3>
                  <p className="text-xs text-slate-500">Directly dispatched to engineering support</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Summary *</label>
                <input
                  type="text"
                  required
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="e.g. Catalog Approval Issue or Webhook Configuration"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TicketCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-none"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="meta_api">Meta Cloud API</option>
                    <option value="catalog">Catalog & Products</option>
                    <option value="flows">Chatbot & Flows</option>
                    <option value="billing">Billing & Plan</option>
                    <option value="other">General Question</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-none"
                  >
                    <option value="low">Low (General inquiry)</option>
                    <option value="medium">Medium (Standard request)</option>
                    <option value="high">High (Production feature blocked)</option>
                    <option value="urgent">Urgent (System down / Critical)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Please describe what you are experiencing, including any steps, phone numbers, or error codes..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

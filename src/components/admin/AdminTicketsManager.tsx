"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LifeBuoy,
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
  ExternalLink,
  ChevronDown,
  Phone,
  UserCheck,
} from "lucide-react";
import {
  SupportTicket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
  TicketCategory,
  Client,
} from "@/types/whatsapp";
import { supabase } from "@/lib/supabase/client";

interface AdminTicketsManagerProps {
  clients: Client[];
  onSelectClientWorkspace?: (clientId: string) => void;
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
  open: { label: "Open", color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  in_progress: { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  waiting_client: { label: "Waiting on Client", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const CANNED_RESPONSES = [
  "Hello! We are currently investigating your request and will update you shortly.",
  "We have re-verified your Meta Cloud API connection and test messages are working.",
  "Your product catalog has been refreshed. Could you please check your WhatsApp inbox?",
  "Please test once again and confirm if everything is operating as expected.",
  "This issue has now been resolved. Please don't hesitate to reach back out if you need anything else!",
];

export function AdminTicketsManager({ clients, onSelectClientWorkspace }: AdminTicketsManagerProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Admin reply form
  const [replyText, setReplyText] = useState("");
  const [adminName, setAdminName] = useState("Admin Support");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Resolution note state
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  // Mobile detail view toggle
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch tickets from server
  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/support/tickets?clientId=all");
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        // Auto select first ticket if none selected
        if (!selectedTicketId && data.tickets.length > 0) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching admin support tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // 2. Realtime listener for support tickets table
  useEffect(() => {
    const channel = supabase
      .channel("admin_support_tickets_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_tickets",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const raw = payload.new as any;
            const newTicket: SupportTicket = {
              id: raw.id,
              clientId: raw.client_id,
              clientName: raw.client_name,
              businessName: raw.business_name,
              clientEmail: raw.client_email,
              subject: raw.subject,
              category: raw.category,
              priority: raw.priority,
              status: raw.status,
              description: raw.description,
              messages: Array.isArray(raw.messages) ? raw.messages : [],
              assignedAdmin: raw.assigned_admin,
              resolutionNotes: raw.resolution_notes,
              createdAt: raw.created_at,
              updatedAt: raw.updated_at,
            };
            setTickets((prev) => [newTicket, ...prev.filter((t) => t.id !== newTicket.id)]);
          } else if (payload.eventType === "UPDATE") {
            const raw = payload.new as any;
            setTickets((prev) =>
              prev.map((t) => {
                if (t.id === raw.id) {
                  return {
                    id: raw.id,
                    clientId: raw.client_id,
                    clientName: raw.client_name,
                    businessName: raw.business_name,
                    clientEmail: raw.client_email,
                    subject: raw.subject,
                    category: raw.category,
                    priority: raw.priority,
                    status: raw.status,
                    description: raw.description,
                    messages: Array.isArray(raw.messages) ? raw.messages : [],
                    assignedAdmin: raw.assigned_admin,
                    resolutionNotes: raw.resolution_notes,
                    createdAt: raw.created_at,
                    updatedAt: raw.updated_at,
                  };
                }
                return t;
              })
            );
          } else if (payload.eventType === "DELETE") {
            const raw = payload.old as any;
            setTickets((prev) => prev.filter((t) => t.id !== raw.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  // Sync resolution notes state when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      setResolutionNotes(selectedTicket.resolutionNotes || "");
    }
  }, [selectedTicket?.id]);

  // Scroll messages to bottom
  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages.length, selectedTicketId]);

  // Handle Quick Status Change
  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
      }
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    }
  };

  // Handle Priority Change
  const handleUpdatePriority = async (priority: TicketPriority) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          priority,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
      }
    } catch (err) {
      console.error("Failed to update ticket priority:", err);
    }
  };

  // Handle Assigned Admin Update
  const handleUpdateAssignedAdmin = async (newAdmin: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          assignedAdmin: newAdmin,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
      }
    } catch (err) {
      console.error("Failed to assign admin:", err);
    }
  };

  // Handle Save Resolution Notes
  const handleSaveResolutionNotes = async () => {
    if (!selectedTicket) return;
    setIsSavingResolution(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          resolutionNotes: resolutionNotes.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
      }
    } catch (err) {
      console.error("Failed to save resolution notes:", err);
    } finally {
      setIsSavingResolution(false);
    }
  };

  // Handle Send Admin Reply
  const handleSendReply = async (transitionStatus?: TicketStatus) => {
    if (!selectedTicket || !replyText.trim() || isSubmittingReply) return;

    setIsSubmittingReply(true);
    try {
      const payload: any = {
        ticketId: selectedTicket.id,
        replyMessage: {
          sender: "admin",
          senderName: adminName.trim() || "Zynex Support",
          text: replyText.trim(),
        },
      };

      if (transitionStatus) {
        payload.status = transitionStatus;
      }

      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id ? data.ticket : t))
        );
        setReplyText("");
      }
    } catch (err) {
      console.error("Failed to send admin reply:", err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const waitingClientCount = tickets.filter((t) => t.status === "waiting_client").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.businessName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesClient = filterClient === "all" || t.clientId === filterClient;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;

    return matchesSearch && matchesClient && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F7F2] p-4 sm:p-6 space-y-6 font-secondary">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* TOP BAR / HEADER                                                         */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0A504A] text-white flex items-center justify-center shadow-md">
                <LifeBuoy className="w-5 h-5 text-[#A2E4B8]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0A504A]">
                  Client Support Desk
                </h1>
                <p className="text-xs text-slate-500">
                  Manage inquiries, troubleshoot Meta API & catalog issues, and reply to client workspaces in real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <button
              onClick={fetchTickets}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-white border border-[#0A504A]/10 hover:bg-slate-50 hover:text-[#0A504A] shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#00A86B] ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh Desk</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Sync</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATS OVERVIEW CARDS                                                      */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Tickets */}
          <div className="bg-white border border-[#0A504A]/10 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Tickets
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-[#0A504A]">{totalCount}</p>
              <LifeBuoy className="w-5 h-5 text-slate-300" />
            </div>
          </div>

          {/* Open / Action Needed */}
          <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-rose-600 uppercase tracking-wider">
                Needs Attention
              </p>
              {openCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-rose-600">{openCount}</p>
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider">
              In Progress
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          {/* Waiting on Client */}
          <div className="bg-white border border-purple-200 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium text-purple-600 uppercase tracking-wider">
              Waiting on Client
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-purple-600">{waitingClientCount}</p>
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Resolved */}
          <div className="col-span-2 lg:col-span-1 bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs">
            <p className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
              Resolved & Closed
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl font-bold text-emerald-600">{resolvedCount}</p>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FILTER BAR                                                               */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#0A504A]/10 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, subject, client, email, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#F7F7F2]/60 border border-[#0A504A]/10 rounded-xl text-xs focus:outline-none focus:border-[#00A86B] focus:bg-white transition-all text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Client Filter */}
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-3 py-2 bg-[#F7F7F2]/60 border border-[#0A504A]/10 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#00A86B] cursor-pointer"
            >
              <option value="all">All Workspaces ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.businessName || "Workspace"})
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-[#F7F7F2]/60 border border-[#0A504A]/10 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#00A86B] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="open">🔴 Open ({openCount})</option>
              <option value="in_progress">🔵 In Progress ({inProgressCount})</option>
              <option value="waiting_client">🟣 Waiting Client ({waitingClientCount})</option>
              <option value="resolved">🟢 Resolved</option>
              <option value="closed">⚪ Closed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-[#F7F7F2]/60 border border-[#0A504A]/10 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#00A86B] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔥 Urgent</option>
              <option value="high">⚠️ High</option>
              <option value="medium">🔷 Medium</option>
              <option value="low">☕ Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-[#F7F7F2]/60 border border-[#0A504A]/10 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#00A86B] cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical Issue</option>
              <option value="meta_api">Meta Cloud API</option>
              <option value="flows">Chatbot & Flows</option>
              <option value="catalog">Catalog & Products</option>
              <option value="billing">Billing & Plans</option>
              <option value="other">General Inquiry</option>
            </select>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TWO-COLUMN MANAGEMENT WORKSPACE                                          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
          {/* ========================================================================= */}
          {/* LEFT LIST COLUMN (TICKETS LIST)                                           */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-5 flex flex-col bg-white border border-[#0A504A]/10 rounded-2xl shadow-xs overflow-hidden ${
              isMobileDetailOpen ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* List Header */}
            <div className="p-4 border-b border-[#0A504A]/10 flex items-center justify-between bg-[#F7F7F2]/30">
              <span className="text-xs font-semibold text-[#0A504A]">
                Tickets ({filteredTickets.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Sorted by latest update
              </span>
            </div>

            {/* Tickets Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[700px]">
              {isLoading && tickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <div className="w-8 h-8 border-2 border-[#0A504A]/20 border-t-[#00A86B] rounded-full animate-spin mx-auto mb-3" />
                  Loading tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <LifeBuoy className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No support tickets match filters</p>
                  <p className="text-[11px] text-slate-400">Try adjusting your search criteria or status filter.</p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = ticket.id === selectedTicketId;
                  const cat = CATEGORY_LABELS[ticket.category] || CATEGORY_LABELS.other;
                  const prio = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.medium;
                  const stat = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
                  const PrioIcon = prio.icon;
                  const lastMsg = ticket.messages[ticket.messages.length - 1];

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setIsMobileDetailOpen(true);
                      }}
                      className={`p-4 transition-all cursor-pointer border-l-4 ${
                        isSelected
                          ? "bg-[#0A504A]/5 border-l-[#00A86B]"
                          : "hover:bg-slate-50 border-l-transparent"
                      }`}
                    >
                      {/* Row 1: ID, Priority, Status */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-mono font-semibold text-[#0A504A]">
                          #{ticket.id}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Priority badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${prio.color}`}
                          >
                            <PrioIcon className="w-3 h-3" />
                            {prio.label}
                          </span>

                          {/* Status badge */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stat.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                            {stat.label}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Subject */}
                      <h4 className="text-xs font-semibold text-slate-900 truncate mb-1">
                        {ticket.subject}
                      </h4>

                      {/* Row 3: Client Info */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                        <span className="font-medium text-[#0A504A] truncate max-w-[140px]">
                          {ticket.businessName || ticket.clientName}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{ticket.clientEmail}</span>
                      </div>

                      {/* Row 4: Last Message Snippet */}
                      {lastMsg && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          <span className="font-medium text-slate-700">
                            {lastMsg.sender === "admin" ? "Staff: " : "Client: "}
                          </span>
                          {lastMsg.text}
                        </p>
                      )}

                      {/* Footer Row: Category & Updated time */}
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className={`px-2 py-0.5 rounded-md border ${cat.color} font-medium`}>
                          {cat.label}
                        </span>
                        <span>
                          {new Date(ticket.updatedAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT DETAIL & MANAGEMENT COLUMN                                         */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-7 flex flex-col bg-white border border-[#0A504A]/10 rounded-2xl shadow-xs overflow-hidden ${
              isMobileDetailOpen ? "flex" : "hidden lg:flex"
            }`}
          >
            {selectedTicket ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Back Button */}
                <div className="lg:hidden p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <button
                    onClick={() => setIsMobileDetailOpen(false)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0A504A]"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    <span>Back to Tickets List</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    #{selectedTicket.id}
                  </span>
                </div>

                {/* Header Bar */}
                <div className="p-5 border-b border-[#0A504A]/10 bg-[#F7F7F2]/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0A504A] bg-[#A2E4B8]/20 px-2 py-0.5 rounded-md">
                          #{selectedTicket.id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Created {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                        {selectedTicket.subject}
                      </h2>
                    </div>

                    {/* Quick workspace link */}
                    {onSelectClientWorkspace && (
                      <button
                        onClick={() => onSelectClientWorkspace(selectedTicket.clientId)}
                        className="px-3 py-1.5 bg-white border border-[#0A504A]/15 text-[#0A504A] hover:bg-[#0A504A] hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-center cursor-pointer"
                        title="Jump to this client's active workspace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Workspace</span>
                      </button>
                    )}
                  </div>

                  {/* Client Metadata Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-white border border-[#0A504A]/10 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Building className="w-4 h-4 text-[#00A86B] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase">Business</p>
                        <p className="font-semibold text-slate-800 truncate">
                          {selectedTicket.businessName || selectedTicket.clientName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-[#00A86B] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase">Client Email</p>
                        <p className="font-semibold text-slate-800 truncate">
                          {selectedTicket.clientEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 truncate">
                      <UserCheck className="w-4 h-4 text-[#00A86B] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase">Workspace ID</p>
                        <p className="font-semibold text-slate-800 truncate">
                          {selectedTicket.clientId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Controls: Status, Priority, Category, Assigned Admin */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {/* Status Changer */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">Status:</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00A86B] cursor-pointer"
                      >
                        <option value="open">🔴 Open</option>
                        <option value="in_progress">🔵 In Progress</option>
                        <option value="waiting_client">🟣 Waiting on Client</option>
                        <option value="resolved">🟢 Resolved</option>
                        <option value="closed">⚪ Closed</option>
                      </select>
                    </div>

                    {/* Priority Changer */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">Priority:</span>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#00A86B] cursor-pointer"
                      >
                        <option value="urgent">🔥 Urgent</option>
                        <option value="high">⚠️ High</option>
                        <option value="medium">🔷 Medium</option>
                        <option value="low">☕ Low</option>
                      </select>
                    </div>

                    {/* Assigned Admin Input */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">Assignee:</span>
                      <input
                        type="text"
                        value={selectedTicket.assignedAdmin || "Unassigned"}
                        onBlur={(e) => handleUpdateAssignedAdmin(e.target.value)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTickets((prev) =>
                            prev.map((t) => (t.id === selectedTicket.id ? { ...t, assignedAdmin: val } : t))
                          );
                        }}
                        placeholder="Admin name"
                        className="w-28 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[380px] bg-slate-50/50">
                  {/* Original ticket issue card */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-amber-800 font-semibold">
                      <span>Initial Client Request</span>
                      <span>{new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Message Thread */}
                  {selectedTicket.messages.map((msg) => {
                    const isAdmin = msg.sender === "admin";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isAdmin ? (
                            <>
                              <span className="text-[10px] font-bold text-[#00A86B] uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-[#00A86B]" />
                                {msg.senderName || "Admin Support"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {msg.senderName || selectedTicket.clientName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${
                            isAdmin
                              ? "bg-[#0A504A] text-white rounded-tr-none"
                              : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Resolution Notes Drawer / Accordion */}
                <div className="p-3 border-t border-slate-200/80 bg-slate-50/70">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
                      <span>Resolution / Internal Action Notes</span>
                    </div>
                    {resolutionNotes !== (selectedTicket.resolutionNotes || "") && (
                      <button
                        onClick={handleSaveResolutionNotes}
                        disabled={isSavingResolution}
                        className="text-[11px] font-semibold text-[#00A86B] hover:text-[#0A504A] cursor-pointer"
                      >
                        {isSavingResolution ? "Saving..." : "Save Note"}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g. Verified Meta phone certificate, catalog token renewed, solved on 2026-10-04"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00A86B]"
                  />
                </div>

                {/* Canned Responses Chips */}
                <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    Quick Reply:
                  </span>
                  {CANNED_RESPONSES.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => setReplyText(res)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#A2E4B8]/20 hover:text-[#0A504A] text-slate-600 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
                    >
                      {res.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Reply Form */}
                <div className="p-4 border-t border-[#0A504A]/10 bg-white space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Reply to Client</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Replying as:</span>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="px-2 py-0.5 border border-slate-200 rounded text-xs text-slate-700 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      placeholder="Type official admin response to client..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          handleSendReply();
                        }
                      }}
                      className="w-full p-3 bg-[#F7F7F2]/60 border border-[#0A504A]/10 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00A86B] focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-400">
                      Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">Ctrl+Enter</kbd> to send
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendReply("waiting_client")}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reply & Wait Client
                      </button>

                      <button
                        onClick={() => handleSendReply("resolved")}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reply & Resolve
                      </button>

                      <button
                        onClick={() => handleSendReply()}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-4 py-1.5 bg-[#0A504A] hover:bg-[#00A86B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingReply ? "Sending..." : "Send Reply"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <LifeBuoy className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">No Ticket Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Select a support ticket from the list to view client inquiries, chat history, and update resolutions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

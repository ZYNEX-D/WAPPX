"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Contact,
  Message,
  UserWorkspace,
  CatalogPayload,
  CatalogItem,
} from "@/types/whatsapp";
import {
  Search,
  Send,
  UserCheck,
  Bot,
  AlertCircle,
  Check,
  CheckCheck,
  Tag,
  FileText,
  User,
  Plus,
  MessageSquare,
  Sparkles,
  Zap,
  Lock,
  ArrowLeft,
  Smile,
  Paperclip,
  ShoppingBag,
  X,
  Mic,
  ShieldCheck,
  Copy,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
  Reply,
  BookmarkPlus,
  Languages,
  BookOpen,
  ChevronDown,
  CornerDownRight,
  MoreVertical,
  Clock,
  Timer,
  Package,
  ArrowUpRight,
  Upload,
  ImageIcon,
  FileText as FileIcon,
  Music,
  ExternalLink,
} from "lucide-react";
import {
  transliterateSinglishToSinhala,
  COMMON_SINHALA_PHRASES,
} from "@/lib/sinhala-unicode";
import {
  EMOJI_CATEGORIES,
  QUICK_REACTIONS,
} from "@/lib/emoji-data";
import { SendCatalogModal } from "./SendCatalogModal";

export interface ProfessionalSnippet {
  id: string;
  title: string;
  category: "General" | "Commerce" | "Orders" | "Support";
  shortcut: string;
  text: string;
  action?: "catalog";
}

export const PROFESSIONAL_SNIPPETS: ProfessionalSnippet[] = [
  {
    id: "greet",
    title: "Standard Greeting",
    category: "General",
    shortcut: "/greet",
    text: "Hello! Thank you for connecting with us. How can we help you today?",
  },
  {
    id: "catalog",
    title: "Send WhatsApp Catalog",
    category: "Commerce",
    shortcut: "/catalog",
    action: "catalog",
    text: "Open verified WhatsApp Business product catalog and interactive collection cards.",
  },
  {
    id: "order_check",
    title: "Order Status Verification",
    category: "Orders",
    shortcut: "/order",
    text: "Could you please confirm your order reference number (e.g. ORD-XXXXXX) or registered phone number so I can check your order status?",
  },
  {
    id: "payment",
    title: "Bank Transfer Instructions",
    category: "Orders",
    shortcut: "/payment",
    text: "Please find our official bank account details below. Once completed, kindly attach the deposit slip or transaction confirmation receipt here.",
  },
  {
    id: "pricing",
    title: "Product & Solution Pricing",
    category: "Commerce",
    shortcut: "/pricing",
    text: "We offer tailored plans and custom quotes. Would you like a detailed breakdown of specifications and pricing tiers?",
  },
  {
    id: "agent",
    title: "Human Support Handoff",
    category: "Support",
    shortcut: "/agent",
    text: "You are now connected with a customer support representative. Please share any questions and we will gladly assist you.",
  },
  {
    id: "close",
    title: "Closing & Resolution",
    category: "Support",
    shortcut: "/close",
    text: "Thank you for reaching out to us today! If you need any further assistance, feel free to contact us anytime.",
  },
];

interface LiveInboxProps {
  contacts: Contact[];
  messages: Record<string, Message[]>;
  selectedContactId: string;
  onSelectContact: (id: string) => void;
  onSendMessage: (
    contactId: string,
    text: string,
    isInternalNote?: boolean,
    mediaUrl?: string,
    mediaType?: "image" | "audio" | "document",
    catalog?: CatalogPayload
  ) => void;
  onToggleBot: (contactId: string) => void;
  onAssignAgent: (contactId: string, agentName: string) => void;
  onAddTag: (contactId: string, tag: string) => void;
  onAddNote: (contactId: string, note: string) => void;
  currentUser?: UserWorkspace;
  catalogProducts?: CatalogItem[];
  defaultCatalogId?: string;
  onNavigateToOrders?: () => void;
}

export function LiveInbox({
  contacts,
  messages,
  selectedContactId,
  onSelectContact,
  onSendMessage,
  onToggleBot,
  onAssignAgent,
  onAddTag,
  onAddNote,
  currentUser,
  catalogProducts,
  defaultCatalogId,
  onNavigateToOrders,
}: LiveInboxProps) {
  const myAgentName = currentUser?.name
    ? `${currentUser.name.split(" ")[0]} (You)`
    : "You";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "human" | "bot" | "mine">("all");
  const [inputText, setInputText] = useState("");
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [showCrmPanel, setShowCrmPanel] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Feature 1: Right Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);

  // Message Reactions & Reply To
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

  // Feature 2: Full Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("smileys");
  const [emojiSearch, setEmojiSearch] = useState("");

  // Feature 3: Sinhala Unicode Typing State
  const [sinhalaTypingEnabled, setSinhalaTypingEnabled] = useState(false);
  const [showSinhalaPhrases, setShowSinhalaPhrases] = useState(false);
  const [showSinhalaCheatSheet, setShowSinhalaCheatSheet] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Feature 4: WhatsApp Catalog Modal State
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // 24h Customer Service Window Live Countdown Timer
  const [windowSecondsLeft, setWindowSecondsLeft] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const quickSnippetsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showQuickSnippets, setShowQuickSnippets] = useState<boolean>(false);
  const [snippetSearch, setSnippetSearch] = useState<string>("");
  const [selectedSnippetCategory, setSelectedSnippetCategory] = useState<string>("all");

  // Drag-and-drop + file upload state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredSnippets = useMemo(() => {
    let list = PROFESSIONAL_SNIPPETS;
    if (selectedSnippetCategory !== "all") {
      list = list.filter((s) => s.category.toLowerCase() === selectedSnippetCategory.toLowerCase());
    }
    if (!snippetSearch.trim()) return list;
    const q = snippetSearch.toLowerCase().replace(/^\//, "");
    return list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.shortcut.toLowerCase().includes(q) ||
        s.text.toLowerCase().includes(q)
    );
  }, [snippetSearch, selectedSnippetCategory]);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const activeMessages = selectedContact ? messages[selectedContact.id] || [] : [];

  // Calculate real remaining seconds in Meta 24-hour service window based on actual customer message timestamp
  const calculateRealWindowSeconds = (msgs: Message[]): number => {
    const customerMsgs = [...msgs].reverse().filter((m) => m.sender === "customer");
    if (customerMsgs.length === 0) {
      return 0; // No customer message has opened a service window
    }
    const lastMsg = customerMsgs[0];

    let lastCustomerTimeMs: number | null = null;
    if (lastMsg.createdAt) {
      const parsed = new Date(lastMsg.createdAt).getTime();
      if (!isNaN(parsed)) lastCustomerTimeMs = parsed;
    }

    if (!lastCustomerTimeMs && lastMsg.timestamp) {
      if (lastMsg.timestamp.includes(":")) {
        const [hours, minutes] = lastMsg.timestamp.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const d = new Date();
          d.setHours(hours, minutes, 0, 0);
          if (d.getTime() > Date.now()) {
            d.setDate(d.getDate() - 1);
          }
          lastCustomerTimeMs = d.getTime();
        }
      }
    }

    if (!lastCustomerTimeMs) {
      return 0;
    }

    const elapsedMs = Date.now() - lastCustomerTimeMs;
    const windowTotalMs = 24 * 60 * 60 * 1000; // 86,400,000 ms
    const remainingMs = windowTotalMs - elapsedMs;

    return Math.max(0, Math.floor(remainingMs / 1000));
  };

  // Recalculate countdown when switching contact or receiving messages
  useEffect(() => {
    const realSeconds = calculateRealWindowSeconds(activeMessages);
    setWindowSecondsLeft(realSeconds);
  }, [selectedContactId, activeMessages]);

  // Live second-by-second ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setWindowSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWindowTimer = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00h 00m 00s (Expired)";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  };

  const windowPercent = Math.max(0, Math.min(100, Math.round((windowSecondsLeft / (24 * 3600)) * 100)));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Close context menu and popups on outside click or escape
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      setContextMenu(null);
      if (
        quickSnippetsRef.current &&
        !quickSnippetsRef.current.contains(e.target as Node)
      ) {
        setShowQuickSnippets(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
        setShowEmojiPicker(false);
        setShowQuickSnippets(false);
        setShowSinhalaPhrases(false);
        setShowSinhalaCheatSheet(false);
      }
    };

    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, selectedContactId]);

  // Filter conversations
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterTab === "human") return c.status === "pending_human";
    if (filterTab === "bot") return c.isBotActive;
    if (filterTab === "mine") return c.assignedAgent?.includes("You");
    return true;
  });

  const handleSelectContactMobile = (id: string) => {
    onSelectContact(id);
    setMobileView("chat");
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    let textToSend = inputText.trim();
    if (replyingToMessage) {
      textToSend = `[Replying to: "${replyingToMessage.text.slice(0, 45)}..."]\n${textToSend}`;
    }

    onSendMessage(selectedContact.id, textToSend, isNoteMode);
    setInputText("");
    setReplyingToMessage(null);
    setWindowSecondsLeft(24 * 3600); // Refreshes 24h window on reply
    if (isNoteMode) setIsNoteMode(false);
  };

  // Input change with Sinhala Singlish transliteration support
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (sinhalaTypingEnabled) {
      const converted = transliterateSinglishToSinhala(val);
      setInputText(converted);
    } else {
      setInputText(val);
    }

    // Auto-detect slash command for quick professional snippets
    if (val.startsWith("/")) {
      setShowQuickSnippets(true);
      setSnippetSearch(val.slice(1));
    } else if (showQuickSnippets && !val.trim()) {
      setShowQuickSnippets(false);
    }
  };

  const handleConvertCurrentTextToSinhala = () => {
    if (!inputText.trim()) return;
    const converted = transliterateSinglishToSinhala(inputText);
    setInputText(converted);
    showToast("Converted to Sinhala Unicode!");
    inputRef.current?.focus();
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSelectSinhalaPhrase = (phrase: string) => {
    setInputText((prev) => (prev ? prev + " " + phrase : phrase));
    setShowSinhalaPhrases(false);
    inputRef.current?.focus();
    showToast("Sinhala phrase added!");
  };

  // Message Context Menu Actions
  const handleOpenContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();

    // Clamp coordinates to viewport
    const menuWidth = 220;
    const menuHeight = 280;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 20);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 20);

    setContextMenu({ x, y, message: msg });
  };

  const handleReactToMessage = (emoji: string) => {
    if (contextMenu) {
      setMessageReactions((prev) => ({
        ...prev,
        [contextMenu.message.id]: emoji,
      }));
      showToast(`Reacted with ${emoji}`);
      setContextMenu(null);
    }
  };

  const handleCopyMessageText = () => {
    if (contextMenu) {
      navigator.clipboard.writeText(contextMenu.message.text);
      showToast("Message text copied to clipboard!");
      setContextMenu(null);
    }
  };

  const handleReplyToMessage = () => {
    if (contextMenu) {
      setReplyingToMessage(contextMenu.message);
      setContextMenu(null);
      inputRef.current?.focus();
    }
  };

  const handleSaveAsNote = () => {
    if (contextMenu && selectedContact) {
      const noteText = `[Customer Quote]: "${contextMenu.message.text}"`;
      onAddNote(selectedContact.id, noteText);
      showToast("Saved as private team note!");
      setContextMenu(null);
    }
  };

  const handleTransliterateMessageToSinhala = () => {
    if (contextMenu) {
      const sinhalaText = transliterateSinglishToSinhala(contextMenu.message.text);
      setInputText(sinhalaText);
      showToast("Sinhala transliteration loaded into input!");
      setContextMenu(null);
      inputRef.current?.focus();
    }
  };

  const handleQuickResponse = (snippet: string) => {
    setInputText(snippet);
    inputRef.current?.focus();
  };

  // File selection helper
  const handleFileSelected = (file: File) => {
    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPendingPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPendingPreview(null);
    }
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    setPendingPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload pending file to storage and send
  const handleUploadAndSend = async () => {
    if (!pendingFile || !selectedContact) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", pendingFile);
      form.append("userId", selectedContact.userId || "shared");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      const caption = inputText.trim() || "";
      onSendMessage(selectedContact.id, caption || pendingFile.name, false, data.url, data.mediaType);
      setInputText("");
      clearPendingFile();
      showToast("File sent!");
    } catch (err) {
      console.error("[Upload]", err);
      showToast("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop handlers for chat area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  const handleDragLeave = () => setIsDraggingOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !selectedContact) return;
    onAddTag(selectedContact.id, newTagInput.trim());
    setNewTagInput("");
    setShowAddTag(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !selectedContact) return;
    onAddNote(selectedContact.id, newNoteInput.trim());
    setNewNoteInput("");
  };

  const handleCopyPhone = () => {
    if (selectedContact) {
      navigator.clipboard.writeText(selectedContact.phone);
      setCopiedPhone(true);
      showToast("Phone number copied!");
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const currentCategoryObj =
    EMOJI_CATEGORIES.find((c) => c.id === activeEmojiCategory) || EMOJI_CATEGORIES[0];

  const filteredEmojis = emojiSearch.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis)
    : currentCategoryObj.emojis;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full w-full max-h-full overflow-hidden bg-[#F8FAFC] font-secondary text-slate-800 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COLUMN 1: CONVERSATIONS LIST                                             */}
      {/* ========================================================================= */}
      <div
        className={`w-full md:w-80 lg:w-[360px] border-r border-slate-200/90 flex flex-col bg-white shrink-0 h-full overflow-hidden z-10 ${mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Inbox
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {contacts.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {contacts.some((c) => c.status === "pending_human") && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{contacts.filter((c) => c.status === "pending_human").length} Handoff</span>
              </span>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-slate-100 space-y-2.5 bg-white shrink-0">
          <div className="relative flex items-center bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white rounded-xl px-3 py-2 border border-slate-200/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${filterTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTab("human")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${filterTab === "human"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-600 hover:bg-rose-100/80 border border-rose-200/60"
                }`}
            >
              <span>Needs Human</span>
              <span className={`text-[10px] px-1 rounded-full ${filterTab === "human" ? "bg-white/25" : "bg-rose-200/60"
                }`}>
                {contacts.filter((c) => c.status === "pending_human").length}
              </span>
            </button>
            <button
              onClick={() => setFilterTab("bot")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${filterTab === "bot"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Bot Active
            </button>
            <button
              onClick={() => setFilterTab("mine")}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${filterTab === "mine"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
            >
              Assigned to Me
            </button>
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 no-scrollbar">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              No conversations found.
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContact?.id === contact.id;
              const isNeedsHuman = contact.status === "pending_human";

              return (
                <div
                  key={contact.id}
                  onClick={() => handleSelectContactMobile(contact.id)}
                  className={`px-3.5 py-3 flex items-start gap-3 cursor-pointer transition-all ${isSelected
                    ? "bg-emerald-50/70 border-l-[3px] border-emerald-600"
                    : "hover:bg-slate-50/80"
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100/80 to-emerald-200/60 text-emerald-900 border border-emerald-200 flex items-center justify-center font-medium text-xs select-none">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    {contact.isBotActive ? (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] ring-2 ring-white"
                        title="Bot engine active"
                      >
                        <Bot className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                        title="Online"
                      />
                    )}
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h2 className="text-[13.5px] font-medium text-slate-900 truncate">
                        {contact.name}
                      </h2>
                      <span className={`text-[11px] shrink-0 font-medium ${isNeedsHuman ? "text-rose-600 font-bold" : "text-slate-400"
                        }`}>
                        {contact.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {contact.lastMessageSnippet}
                    </p>

                    {/* Status & Tag Chips */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {isNeedsHuman ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          Handoff
                        </span>
                      ) : contact.isBotActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Bot
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          {contact.assignedAgent || "Agent"}
                        </span>
                      )}

                      {contact.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200/60 truncate"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUMN 2: ACTIVE CHAT STREAM                                             */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col h-full min-w-0 bg-[#F8FAFC] relative overflow-hidden ${mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
      >
        {selectedContact ? (
          <>
            {/* Clean Top Header */}
            <div className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 z-20 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                  aria-label="Back to chat list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200/80 text-emerald-900 border border-emerald-200 font-bold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                  {selectedContact.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold text-slate-900 truncate">
                      {selectedContact.name}
                    </h2>
                    {selectedContact.status === "pending_human" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                        Needs Attention
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span>{selectedContact.phone}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>24h Window: {formatWindowTimer(windowSecondsLeft)}</span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Bot Toggle Button */}
                <button
                  onClick={() => onToggleBot(selectedContact.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${selectedContact.isBotActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70"
                    }`}
                  title={selectedContact.isBotActive ? "Pause bot" : "Resume bot"}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {selectedContact.isBotActive ? "Bot Active" : "Bot Paused"}
                  </span>
                </button>

                {/* Assign to Me Button */}
                <button
                  onClick={() => onAssignAgent(selectedContact.id, myAgentName)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Assign this conversation to yourself"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Assign Me</span>
                </button>

                {/* Toggle CRM Details Panel */}
                <button
                  onClick={() => setShowCrmPanel(!showCrmPanel)}
                  className={`p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer hidden xl:flex ${showCrmPanel ? "text-emerald-700 bg-slate-100" : ""
                    }`}
                  title={showCrmPanel ? "Hide contact profile" : "Show contact profile"}
                >
                  {showCrmPanel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Clean Solid Chat Background + Drag-and-Drop Zone */}
            <div
              className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 relative z-10 bg-[#F8FAFC] transition-colors ${
                isDraggingOver ? "bg-emerald-50 ring-2 ring-inset ring-emerald-400" : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Drop overlay hint */}
              {isDraggingOver && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm border-2 border-dashed border-emerald-400 rounded-2xl px-10 py-8 text-center shadow-xl">
                    <Upload className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-700">Drop file to attach</p>
                    <p className="text-xs text-slate-500 mt-1">Images, documents, and audio supported</p>
                  </div>
                </div>
              )}
              {/* WhatsApp 24h Window Live Timer Banner */}
              <div className="flex justify-center my-1">
                <div
                  className={`backdrop-blur-xs border text-xs font-medium px-4 py-1.5 rounded-full shadow-2xs flex items-center gap-2.5 transition-colors ${windowSecondsLeft > 4 * 3600
                    ? "bg-white/95 border-emerald-200 text-slate-700"
                    : windowSecondsLeft > 0
                      ? "bg-amber-50/95 border-amber-300 text-amber-900"
                      : "bg-rose-50/95 border-rose-300 text-rose-900"
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${windowSecondsLeft > 0 ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${windowSecondsLeft > 0 ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                      />
                    </span>
                    <span className="font-semibold text-slate-900">
                      24h Service Window Active
                    </span>
                  </div>

                  <span className="text-slate-300">|</span>

                  <div className="flex items-center gap-1.5 font-mono font-bold text-emerald-700">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatWindowTimer(windowSecondsLeft)}</span>
                  </div>

                  <span className="text-slate-300 hidden sm:inline">|</span>

                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Freeform replies enabled
                  </span>
                </div>
              </div>

              {/* Date Divider */}
              <div className="flex justify-center my-2">
                <span className="bg-slate-200/70 text-slate-600 text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Today
                </span>
              </div>

              {/* Messages Stream with Right Click Menu support */}
              {activeMessages.map((msg) => {
                const isIncoming = msg.sender === "customer";
                const isInternal = msg.isInternalNote;
                const reaction = messageReactions[msg.id];

                // Internal Team Note
                if (isInternal) {
                  return (
                    <div
                      key={msg.id}
                      onContextMenu={(e) => handleOpenContextMenu(e, msg)}
                      className="max-w-md mx-auto bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1 shadow-2xs group relative"
                    >
                      <div className="flex items-center justify-between text-amber-800 font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          Internal Note (Private to team)
                        </span>
                        <span className="text-slate-400 font-normal">{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-slate-700 text-xs leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  );
                }

                // WhatsApp Message Bubble (Right-clickable!)
                const hasMedia = !!msg.mediaUrl;
                const hasTextContent = !!msg.text?.trim();
                const isOrder = !!msg.order || (msg.text && msg.text.includes("🛍️ WhatsApp Catalog Order"));

                // Filter out empty ghost messages
                if (!hasMedia && !hasTextContent && !isOrder && !msg.catalog && (!msg.buttons || msg.buttons.length === 0)) {
                  return null;
                }
                if (msg.sender === "bot" && !hasTextContent && !msg.catalog && (!msg.buttons || msg.buttons.length === 0)) {
                  return null;
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col group ${isIncoming ? "items-start" : "items-end"}`}
                  >
                    <div
                      onContextMenu={(e) => handleOpenContextMenu(e, msg)}
                      className={`relative w-fit max-w-[85%] sm:max-w-[65%] rounded-2xl shadow-[0_1px_1.5px_rgba(0,0,0,0.06)] transition-all cursor-context-menu overflow-hidden ${
                        hasMedia && !hasTextContent
                          ? "p-0"
                          : isOrder
                          ? "p-1.5"
                          : "px-3 py-1.5 sm:px-3.5 sm:py-2"
                      } ${isIncoming
                        ? "bg-white text-slate-900 border border-slate-200/70 rounded-tl-xs"
                        : "bg-[#DCFCE7] text-slate-900 border border-[#86EFAC]/50 rounded-tr-xs"
                        }`}
                    >
                      {/* Media Content (image / audio / document) */}
                      {msg.mediaUrl && msg.mediaType === "image" && (
                        <div className={hasTextContent ? "mb-1.5 -mx-3 -mt-1.5 overflow-hidden" : "w-full max-w-[320px]"}>
                          <img
                            src={msg.mediaUrl}
                            alt="Media"
                            className="w-full max-h-72 object-cover block rounded-t-xl"
                            style={{ display: "block" }}
                          />
                        </div>
                      )}

                      {msg.mediaUrl && msg.mediaType === "audio" && (
                        <div className="flex items-center gap-2 bg-slate-100/60 rounded-xl px-2.5 py-1.5 my-1">
                          <Music className="w-4 h-4 text-slate-500 shrink-0" />
                          <audio controls src={msg.mediaUrl} className="h-7 max-w-[190px]" />
                        </div>
                      )}

                      {msg.mediaUrl && msg.mediaType === "document" && (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 bg-slate-100/60 hover:bg-slate-100 rounded-xl px-3 py-2 my-1 transition-colors group/doc"
                        >
                          <FileIcon className="w-5 h-5 text-slate-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-700 block truncate">{msg.text || "Document"}</span>
                            <span className="text-[10px] text-slate-400">Tap to open</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/doc:text-slate-700 shrink-0 ml-auto" />
                        </a>
                      )}

                      {/* WhatsApp Catalog Order Card — Sleek WhatsApp Web style */}
                      {isOrder && (
                        <div className="rounded-xl bg-white border border-slate-200/90 overflow-hidden shadow-xs w-full max-w-[280px]">
                          <div className="p-2.5 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                              {msg.order?.items?.[0]?.imageUrl ? (
                                <img
                                  src={msg.order.items[0].imageUrl}
                                  alt="Product"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>
                                  {msg.order?.items?.reduce((sum, i) => sum + i.quantity, 0) || 1} {
                                    (msg.order?.items?.reduce((sum, i) => sum + i.quantity, 0) || 1) === 1 ? "item" : "items"
                                  }
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-900 mt-0.5">
                                {msg.order?.currency || "LKR"} {(msg.order?.subtotal || 0).toLocaleString()}{" "}
                                <span className="text-[10px] font-normal text-slate-500">(estimated total)</span>
                              </p>
                              {msg.order?.customerNote && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                                  "{msg.order.customerNote}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-1.5 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => onNavigateToOrders && onNavigateToOrders()}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>View details</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400">
                              <span>{msg.timestamp}</span>
                              {!isIncoming && <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Regular Message Text with WhatsApp-like inline Timestamp */}
                      {!isOrder && !msg.catalog && (
                        <div className="flex flex-wrap items-baseline justify-end gap-x-2.5 gap-y-0.5">
                          {hasTextContent && msg.mediaType !== "document" && (
                            <p className="text-[13.5px] sm:text-[14px] leading-snug whitespace-pre-wrap break-words text-slate-900 flex-1 min-w-[40px]">
                              {msg.text}
                            </p>
                          )}
                          <div className={`flex items-center gap-1 text-[10.5px] text-slate-400 select-none shrink-0 self-end ml-auto ${
                            hasMedia && !hasTextContent ? "px-2 py-0.5 bg-black/50 text-white/90 rounded-md absolute bottom-1.5 right-1.5" : "translate-y-0.5"
                          }`}>
                            <span>{msg.timestamp}</span>
                            {!isIncoming && (
                              <span>
                                {msg.status === "read" ? (
                                  <CheckCheck className={`w-3.5 h-3.5 ${hasMedia && !hasTextContent ? "text-emerald-400" : "text-emerald-600"}`} />
                                ) : msg.status === "delivered" ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* WhatsApp Interactive Catalog / Product Card */}
                      {msg.catalog && (
                        <div className="rounded-xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
                          {/* Card Header Badge */}
                          <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0A504A]">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBag className="w-3.5 h-3.5 text-[#00A86B]" />
                              <span>{msg.catalog.catalogName || "WhatsApp Catalog"}</span>
                            </div>
                            <span className="text-[9.5px] font-mono uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              {msg.catalog.type === "catalog_message" ? "Catalog Card" : "Product Item"}
                            </span>
                          </div>

                          {/* Hero Product Image or Thumbnail */}
                          {msg.catalog.products && msg.catalog.products[0]?.imageUrl && (
                            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                              <img
                                src={msg.catalog.products[0].imageUrl}
                                alt={msg.catalog.products[0].title}
                                className="w-full h-full object-cover"
                              />
                              {msg.catalog.products[0].price && (
                                <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/95 backdrop-blur-xs rounded-xl text-xs font-black text-[#00A86B] shadow-sm border border-slate-200/80">
                                  {msg.catalog.products[0].price}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Product / Catalog Description */}
                          <div className="p-3 space-y-1">
                            {msg.catalog.products && msg.catalog.products[0]?.title && (
                              <p className="text-xs font-bold text-slate-800">
                                {msg.catalog.products[0].title}
                              </p>
                            )}
                            <p className="text-[11.5px] text-slate-600 leading-relaxed">
                              {msg.catalog.bodyText || msg.catalog.products?.[0]?.description}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setToastMessage("WhatsApp Catalog opened! (Simulated Meta Commerce viewer)");
                                setTimeout(() => setToastMessage(null), 3000);
                              }}
                              className="w-full py-1.5 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>
                                {msg.catalog.type === "catalog_message"
                                  ? "View Catalog"
                                  : msg.catalog.type === "product_list"
                                    ? `View Products (${msg.catalog.products?.length || 0})`
                                    : "View Product"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* WhatsApp Interactive Buttons */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="pt-2 mt-1 border-t border-slate-900/5 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                            Quick Replies:
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {msg.buttons.map((btn) => (
                              <button
                                key={btn.id}
                                onClick={() => onSendMessage(selectedContact.id, btn.title)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${msg.selectedButtonId === btn.id
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-white/90 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white"
                                  }`}
                              >
                                <span>{btn.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Emoji Reaction Badge if reacted */}
                      {reaction && (
                        <div className="absolute -bottom-2 right-3 bg-white border border-slate-200/90 rounded-full px-1.5 py-0.5 text-xs shadow-xs animate-in zoom-in-50">
                          {reaction}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Professional Quick Snippets — slash-command popover */}
            {showQuickSnippets && (
              <div
                ref={quickSnippetsRef}
                className="absolute bottom-24 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-2"
              >
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">Quick Replies</span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">/command</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowQuickSnippets(false); setSnippetSearch(""); setInputText(""); inputRef.current?.focus(); }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Category tabs */}
                <div className="px-3 pt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {["all", "General", "Commerce", "Orders", "Support"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedSnippetCategory(cat)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${selectedSnippetCategory === cat
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                    >
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>

                {/* Snippet list */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100/80 p-1.5 no-scrollbar">
                  {filteredSnippets.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No matching snippets</div>
                  ) : (
                    filteredSnippets.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (s.action === "catalog") {
                            setShowCatalogModal(true);
                          } else {
                            setInputText(s.text);
                          }
                          setShowQuickSnippets(false);
                          setSnippetSearch("");
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 block">{s.title}</span>
                            <span className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 block">{s.action === "catalog" ? "Opens product catalog selector" : s.text}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">{s.shortcut}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Quoted Message Preview if Replying */}
            {replyingToMessage && (
              <div className="px-4 py-2 bg-emerald-50/90 border-t border-emerald-200 flex items-center justify-between text-xs z-20 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CornerDownRight className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-emerald-900 block truncate">
                      Replying to {replyingToMessage.sender === "customer" ? selectedContact.name : "Message"}:
                    </span>
                    <span className="text-slate-600 truncate block text-[11px]">
                      {replyingToMessage.text}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingToMessage(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ========================================================================= */}
            {/* FULL EMOJI PICKER POPOVER                                                 */}
            {/* ========================================================================= */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-24 left-4 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
              >
                {/* Header with Search and Close */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80">
                  <div className="flex-1 relative flex items-center bg-white rounded-xl px-2.5 py-1.5 border border-slate-200/80">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search emojis..."
                      value={emojiSearch}
                      onChange={(e) => setEmojiSearch(e.target.value)}
                      className="w-full text-xs bg-transparent outline-none text-slate-800"
                      autoFocus
                    />
                    {emojiSearch && (
                      <button onClick={() => setEmojiSearch("")} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Category Tabs */}
                {!emojiSearch && (
                  <div className="flex items-center justify-around border-b border-slate-100 bg-slate-50/50 py-1.5 px-2">
                    {EMOJI_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveEmojiCategory(cat.id)}
                        className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer ${activeEmojiCategory === cat.id
                          ? "bg-white shadow-xs border border-slate-200 scale-110"
                          : "opacity-60 hover:opacity-100"
                          }`}
                        title={cat.name}
                      >
                        {cat.icon}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Reactions Bar */}
                <div className="px-3 py-1.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick:</span>
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="text-base hover:scale-125 transition-transform p-1 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div className="p-3 max-h-56 overflow-y-auto grid grid-cols-8 gap-1.5 no-scrollbar">
                  {filteredEmojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-lg hover:scale-120 transition-all cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SINHALA BUSINESS PHRASES MODAL / POPOVER                                  */}
            {/* ========================================================================= */}
            {showSinhalaPhrases && (
              <div className="absolute bottom-24 left-10 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇱🇰</span>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Sinhala Quick Phrases (සිංහල වාක්‍ය)</h4>
                      <p className="text-[10px] text-emerald-700">Click to insert directly into chat</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSinhalaPhrases(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2 max-h-64 overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                  {COMMON_SINHALA_PHRASES.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSinhalaPhrase(item.sinhala)}
                      className="p-2.5 hover:bg-emerald-50/60 rounded-xl cursor-pointer transition-colors space-y-0.5"
                    >
                      <p className="text-xs font-semibold text-slate-900 leading-snug">{item.sinhala}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{item.desc}</span>
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-1 rounded">{item.singlish}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SINHALA TYPING PHONETIC CHEAT SHEET MODAL                                 */}
            {/* ========================================================================= */}
            {showSinhalaCheatSheet && (
              <div className="absolute bottom-24 left-16 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Singlish Phonetic Guide (සිංහල යතුරුලියනය)</span>
                  </div>
                  <button
                    onClick={() => setShowSinhalaCheatSheet(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 max-h-60 overflow-y-auto text-xs space-y-2.5 text-slate-700 no-scrollbar">
                  <div>
                    <h5 className="font-bold text-[11px] text-slate-900 mb-1">Vowels (ස්වර):</h5>
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-mono bg-slate-50 p-2 rounded-lg">
                      <span>a = අ</span>
                      <span>aa = ආ</span>
                      <span>ae = ඇ</span>
                      <span>aae = ඈ</span>
                      <span>i = ඉ</span>
                      <span>ee = ඊ</span>
                      <span>u = උ</span>
                      <span>oo = ඌ</span>
                      <span>e = එ</span>
                      <span>ea = ඒ</span>
                      <span>o = ඔ</span>
                      <span>oe = ඕ</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-[11px] text-slate-900 mb-1">Consonants (ව්‍යංජන):</h5>
                    <div className="grid grid-cols-4 gap-1 text-[11px] font-mono bg-slate-50 p-2 rounded-lg">
                      <span>k = ක්</span>
                      <span>ka = ක</span>
                      <span>kaa = කා</span>
                      <span>ki = කි</span>
                      <span>ke = කෙ</span>
                      <span>ko = කො</span>
                      <span>th = ත</span>
                      <span>dh = ද</span>
                      <span>sh = ශ</span>
                      <span>ch = ච</span>
                      <span>y = ය</span>
                      <span>r = ර</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Example: Type &quot;ayubowan&quot; → &quot;ආයුබෝවන්&quot;, &quot;karunakara&quot; → &quot;කරුණාකර&quot;
                  </p>
                </div>
              </div>
            )}

            {/* Modern Bottom Input Bar */}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelected(file);
              }}
            />
            <form
              onSubmit={(e) => {
                if (pendingFile) {
                  e.preventDefault();
                  handleUploadAndSend();
                } else {
                  handleSend(e);
                }
              }}
              className="p-3.5 bg-white border-t border-slate-200/80 flex flex-col gap-2 shrink-0 z-20"
            >
              {/* Toolbar: Mode Switcher + Sinhala Unicode Typing Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* WhatsApp Reply / Internal Note toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setIsNoteMode(false)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${!isNoteMode
                        ? "bg-white text-emerald-800 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp Reply</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNoteMode(true)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${isNoteMode
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>Internal Note</span>
                    </button>
                  </div>

                  {/* Feature 3: Sinhala Unicode Typing Switcher */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !sinhalaTypingEnabled;
                        setSinhalaTypingEnabled(nextState);
                        showToast(nextState ? "Sinhala Unicode typing activated! (සිංහල)" : "English typing mode");
                        inputRef.current?.focus();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${sinhalaTypingEnabled
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      title="Toggle real-time Singlish to Sinhala Unicode typing"
                    >
                      <span>{sinhalaTypingEnabled ? "සිං" : "En"}</span>
                    </button>

                    {/* Sinhala Quick Phrases trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowSinhalaPhrases(!showSinhalaPhrases);
                        setShowEmojiPicker(false);
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                      title="Sinhala Business Phrases (වාක්‍ය)"
                    >
                      වාක්‍ය
                    </button>

                    {/* Manual Convert current input to Sinhala */}
                    {inputText && (
                      <button
                        type="button"
                        onClick={handleConvertCurrentTextToSinhala}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                        title="Transliterate current text into Sinhala Unicode"
                      >
                        → සිංහල
                      </button>
                    )}

                    {/* Sinhala Typing Cheat Sheet Guide */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowSinhalaCheatSheet(!showSinhalaCheatSheet);
                        setShowSinhalaPhrases(false);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      title="Sinhala phonetic typing guide"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Type <kbd className="font-semibold bg-slate-100 border border-slate-200 px-1 rounded text-slate-600 font-mono">/</kbd> for snippets</span>
                  <span className="text-slate-300">·</span>
                  <span><kbd className="font-semibold bg-slate-100 border border-slate-200 px-1 rounded text-slate-600">Enter</kbd> to send</span>
                </div>
              </div>

              {/* File Preview Bar (shows when a file is staged) */}
              {pendingFile && (
                <div className="flex items-center gap-2.5 px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs animate-in fade-in slide-in-from-bottom-2">
                  {pendingPreview ? (
                    <img src={pendingPreview} alt="preview" className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                      <FileIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{pendingFile.name}</p>
                    <p className="text-slate-400 text-[10px]">{(pendingFile.size / 1024).toFixed(1)} KB · {pendingFile.type || "file"}</p>
                  </div>
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <button
                      type="button"
                      onClick={clearPendingFile}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Input Row */}
              <div className="flex items-center gap-2 bg-slate-50 focus-within:bg-white rounded-xl px-3 py-1.5 border border-slate-200/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                {/* Emoji Picker Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowSinhalaPhrases(false);
                    setShowSinhalaCheatSheet(false);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${showEmojiPicker
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  title="Choose Emoji (Full Emoji Menu)"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {/* Paperclip / File Attach */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${pendingFile
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  title="Attach image, document, or audio"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Send WhatsApp Catalog Button */}
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(true)}
                  className="p-1.5 text-slate-400 hover:text-[#00A86B] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Send WhatsApp Catalog or Products"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    pendingFile
                      ? "Add a caption (optional)..."
                      : isNoteMode
                        ? "Write an internal team note..."
                        : sinhalaTypingEnabled
                          ? "සිංහලෙන් ලියන්න (Type Singlish e.g. 'ayubowan' for ආයුබෝවන්)..."
                          : "Type a WhatsApp message to customer..."
                  }
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-slate-800 placeholder-slate-400 outline-none"
                />

                {/* Send Button */}
                {(inputText.trim() || pendingFile) ? (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs disabled:opacity-60 ${isNoteMode
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    title="Send message"
                  >
                    {isUploading
                      ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    title="Voice note"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <MessageSquare className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Chat Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Choose a contact from the inbox list to read messages and start replying.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FEATURE 1: RIGHT-CLICK CONTEXT MENU MODAL                                 */}
      {/* ========================================================================= */}
      {
        contextMenu && (
          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 backdrop-blur-md"
          >
            {/* Reaction Bar */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-xl mb-1 border border-slate-100">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactToMessage(emoji)}
                  className="text-base hover:scale-130 transition-transform cursor-pointer"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Context Options */}
            <button
              onClick={handleReplyToMessage}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <Reply className="w-4 h-4 text-emerald-600" />
              <span>Reply / Quote Message</span>
            </button>

            <button
              onClick={handleCopyMessageText}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Text</span>
            </button>

            <button
              onClick={handleSaveAsNote}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-amber-500" />
              <span>Save to Internal Team Notes</span>
            </button>

            <button
              onClick={handleTransliterateMessageToSinhala}
              className="w-full px-3 py-2 rounded-xl hover:bg-slate-100 flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <Languages className="w-4 h-4 text-sky-500" />
              <span>Transliterate to Sinhala (සිංහල)</span>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              onClick={() => setContextMenu(null)}
              className="w-full px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-[11px]"
            >
              Cancel
            </button>
          </div>
        )
      }

      {/* ========================================================================= */}
      {/* COLUMN 3: CONTACT PROFILE & CRM PANEL                                     */}
      {/* ========================================================================= */}
      {
        selectedContact && showCrmPanel && (
          <div className="hidden xl:flex w-80 lg:w-[320px] flex-col bg-white border-l border-slate-200/90 h-full overflow-hidden shrink-0 z-10">
            {/* Header */}
            <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <span className="text-sm font-bold text-slate-900">Contact Details</span>
              <button
                onClick={() => setShowCrmPanel(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CRM Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
              {/* Contact Profile Hero */}
              <div className="text-center space-y-2 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200/80 text-emerald-900 border-2 border-emerald-300 mx-auto flex items-center justify-center text-lg font-bold shadow-2xs">
                  {selectedContact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {selectedContact.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono">{selectedContact.phone}</span>
                    <button
                      onClick={handleCopyPhone}
                      className="text-slate-400 hover:text-emerald-700 p-0.5 rounded cursor-pointer transition-colors"
                      title="Copy phone"
                    >
                      {copiedPhone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 24-Hour Service Window Live Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    24h Service Window
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatWindowTimer(windowSecondsLeft)}
                  </span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${windowPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-800">
                  <span>Freeform session active</span>
                  <span className="font-semibold">{windowPercent}% left</span>
                </div>
              </div>

              {/* Assigned Agent */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Assigned Agent
                </label>
                <select
                  value={selectedContact.assignedAgent || "Unassigned"}
                  onChange={(e) => onAssignAgent(selectedContact.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Unassigned">Unassigned</option>
                  <option value={myAgentName}>{myAgentName}</option>
                  <option value="WAPPX Bot Engine">WAPPX Bot Engine</option>
                  <option value="Support Agent">Support Agent</option>
                </select>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Contact Tags
                  </span>
                  <button
                    onClick={() => setShowAddTag(!showAddTag)}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>

                {showAddTag && (
                  <form onSubmit={handleAddTagSubmit} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="meta-input h-8 text-xs flex-1"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs px-3 py-1 font-semibold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {selectedContact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Internal Team Notes */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Team Notes ({selectedContact.notes.length})
                </span>
                <form onSubmit={handleAddNoteSubmit} className="space-y-1.5">
                  <textarea
                    placeholder="Add a private note about this customer..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white resize-none transition-all"
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={!newNoteInput.trim()}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Save Note
                  </button>
                </form>

                <div className="space-y-2 pt-1">
                  {selectedContact.notes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200/60 leading-relaxed"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Send Catalog & Products Modal */}
      <SendCatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        contactName={selectedContact?.name || "Customer"}
        businessName={currentUser?.name || "ZYNEX Developments"}
        customProducts={catalogProducts}
        defaultCatalogId={defaultCatalogId}
        onSendCatalog={(catalog, customText) => {
          onSendMessage(
            selectedContact.id,
            customText || "🛍️ View our official WhatsApp Catalog",
            false,
            undefined,
            undefined,
            catalog
          );
          setToastMessage("WhatsApp Catalog sent to customer!");
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    </div>
  );
}

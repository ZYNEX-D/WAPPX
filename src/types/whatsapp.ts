export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export type MessageSenderType = "customer" | "bot" | "agent";

export interface InteractiveButton {
  id: string;
  title: string;
}

export type MetaReviewStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "NO_REVIEW"
  | "NOT_SYNCED"
  | "OUTDATED";

export interface CatalogItem {
  id: string;
  title: string;
  description?: string;
  price?: string;
  currency?: string;
  imageUrl?: string;
  retailerId?: string;
  category?: string;
  status?: "active" | "out_of_stock" | "draft";
  url?: string;
  reviewStatus?: MetaReviewStatus;
  metaProductId?: string;
}

export interface BusinessCatalog {
  id: string;
  clientId: string;
  name: string;
  catalogId?: string;
  description?: string;
  items: CatalogItem[];
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CatalogPayload {
  type: "catalog_message" | "product" | "product_list" | "pdf";
  catalogId?: string;
  catalogName?: string;
  thumbnailProductId?: string;
  bodyText?: string;
  footerText?: string;
  products?: CatalogItem[];
}

export interface Message {
  id: string;
  sender: MessageSenderType;
  senderName?: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  status: MessageStatus;
  buttons?: InteractiveButton[];
  selectedButtonId?: string;
  mediaUrl?: string;
  mediaType?: "image" | "audio" | "document";
  catalog?: CatalogPayload;
  isInternalNote?: boolean;
  userId?: string;
  reaction?: string;
  replyTo?: { id: string; text: string; senderName?: string };
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  status: "active" | "pending_human" | "resolved";
  assignedAgent?: string;
  tags: string[];
  unreadCount: number;
  lastMessageSnippet: string;
  lastMessageTime: string;
  createdAt?: string;
  updatedAt?: string;
  currentFlowNodeId?: string;
  isBotActive: boolean;
  notes: string[];
  userId?: string;
}

export type FlowNodeType =
  | "trigger"
  | "message"
  | "delay"
  | "template"
  | "image"
  | "video"
  | "document"
  | "audio"
  | "list"
  | "url_cta"
  | "location"
  | "buttons"
  | "catalog"
  | "notify_team"
  | "human_handoff"
  | "sub_flow"
  | "end_conversation"
  | "condition"
  | "ai_reply";

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  title: string;
  content: string;
  triggerKeywords?: string[];
  contactType?: "any_contact" | "new_contact" | "existing_contact";
  triggerType?: "new_message" | "keyword_match";
  buttons?: { id: string; title: string; nextNodeId?: string }[];
  mediaUrl?: string;
  caption?: string;
  delayDuration?: string;
  templateName?: string;
  listItems?: { id: string; title: string; description?: string; nextNodeId?: string }[];
  url?: string;
  urlButtonText?: string;
  location?: { lat: number; lng: number; name?: string; address?: string };
  catalog?: CatalogPayload;
  targetFlowId?: string;
  notifyChannel?: "whatsapp" | "email";
  notifyTarget?: string;
  nextNodeId?: string;
  fallbackNodeId?: string;
  position: { x: number; y: number };
  userId?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface MetaConfig {
  id?: string;
  userId?: string;
  businessName?: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
  isConnected: boolean;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  verifyToken: string;
  status: "active" | "suspended" | "pending";
  createdAt?: string;
  metaConfig?: MetaConfig;
}

export interface UserWorkspace {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  verifyToken: string;
  avatarUrl?: string;
  businessName?: string;
  phone?: string;
}

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting_client" | "resolved" | "closed";
export type TicketCategory = "technical" | "billing" | "meta_api" | "flows" | "catalog" | "other";

export interface TicketMessage {
  id: string;
  sender: "client" | "admin";
  senderName: string;
  senderEmail?: string;
  text: string;
  timestamp: string;
  attachments?: string[];
}

export interface SupportTicket {
  id: string;
  clientId: string;
  clientName: string;
  businessName?: string;
  clientEmail: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  messages: TicketMessage[];
  assignedAdmin?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}


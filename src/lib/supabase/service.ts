import { supabase } from "./client";
import { Contact, FlowNode, Message, MetaConfig, FlowNodeType, Client, BusinessCatalog, CatalogItem } from "@/types/whatsapp";
import { Database, Json } from "./types";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type FlowNodeRow = Database["public"]["Tables"]["flow_nodes"]["Row"];
type MetaConfigRow = Database["public"]["Tables"]["meta_config"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

export function mapContactFromRow(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    avatarUrl: row.avatar_url || undefined,
    status: row.status,
    assignedAgent: row.assigned_agent || "Unassigned",
    tags: Array.isArray(row.tags) ? row.tags : [],
    unreadCount: row.unread_count || 0,
    lastMessageSnippet: row.last_message_snippet || "",
    lastMessageTime: row.last_message_time || "",
    createdAt: row.created_at || undefined,
    updatedAt: row.updated_at || undefined,
    currentFlowNodeId: row.current_flow_node_id || undefined,
    isBotActive: row.is_bot_active,
    notes: Array.isArray(row.notes) ? row.notes : [],
    userId: row.user_id,
  };
}

export function mapMessageFromRow(row: MessageRow): Message {
  return {
    id: row.id,
    sender: row.sender,
    senderName: row.sender_name || undefined,
    text: row.text,
    timestamp: row.timestamp,
    createdAt: row.created_at || undefined,
    status: row.status,
    buttons: Array.isArray(row.buttons) ? (row.buttons as any) : undefined,
    selectedButtonId: row.selected_button_id || undefined,
    mediaUrl: row.media_url || undefined,
    mediaType: row.media_type || undefined,
    catalog: (row as any).catalog || undefined,
    isInternalNote: row.is_internal_note || false,
    userId: row.user_id,
  };
}

export function mapFlowNodeFromRow(row: FlowNodeRow): FlowNode {
  const rawButtons = row.buttons as any;
  const isWrapped =
    rawButtons &&
    typeof rawButtons === "object" &&
    !Array.isArray(rawButtons) &&
    "metaPayload" in rawButtons;
  const meta = isWrapped ? rawButtons.metaPayload : {};
  const buttons = isWrapped
    ? rawButtons.buttons
    : Array.isArray(rawButtons)
    ? rawButtons
    : [];

  return {
    id: row.id,
    type: row.type as FlowNodeType,
    title: row.title,
    content: row.content,
    triggerKeywords: Array.isArray(row.trigger_keywords) ? row.trigger_keywords : [],
    buttons,
    listItems: meta?.listItems,
    mediaUrl: meta?.mediaUrl,
    caption: meta?.caption,
    delayDuration: meta?.delayDuration,
    templateName: meta?.templateName,
    url: meta?.url,
    urlButtonText: meta?.urlButtonText,
    location: meta?.location,
    catalog: meta?.catalog,
    notifyChannel: meta?.notifyChannel,
    notifyTarget: meta?.notifyTarget,
    contactType: meta?.contactType,
    triggerType: meta?.triggerType,
    targetFlowId: meta?.targetFlowId,
    nextNodeId: row.next_node_id || undefined,
    fallbackNodeId: row.fallback_node_id || undefined,
    position: (row.position as any) || { x: 0, y: 0 },
    userId: row.user_id,
  };
}

export function mapMetaConfigFromRow(row: MetaConfigRow): MetaConfig {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name || "My Business",
    phoneNumberId: row.phone_number_id,
    wabaId: row.waba_id,
    accessToken: row.access_token,
    verifyToken: row.verify_token,
    webhookUrl: row.webhook_url,
    isConnected: row.is_connected,
  };
}

export function mapClientFromRow(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    businessName: row.business_name,
    email: row.email,
    phone: row.phone || undefined,
    verifyToken: row.verify_token,
    status: row.status,
    createdAt: row.created_at,
  };
}

// ==================== CLIENT MANAGEMENT ====================

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    console.error("Error fetching clients from Supabase:", error);
    return [];
  }

  const clients = data.map(mapClientFromRow);

  // Attach meta_config to each client
  const { data: configs } = await supabase.from("meta_config").select("*");
  if (configs && Array.isArray(configs)) {
    for (const c of clients) {
      const match = configs.find((cfg) => cfg.user_id === c.id || cfg.id === c.id);
      if (match) {
        c.metaConfig = mapMetaConfigFromRow(match);
      }
    }
  }

  return clients;
}

export async function createClientAccount(params: {
  name: string;
  businessName: string;
  email: string;
  phone?: string;
}): Promise<Client | null> {
  const clientId = `client-${Date.now()}`;
  const randomStr = Math.random().toString(36).substring(2, 8);
  const verifyToken = `zynex_vt_${clientId}_${randomStr}`;

  const { data: created, error } = await supabase
    .from("clients")
    .insert({
      id: clientId,
      name: params.name,
      business_name: params.businessName,
      email: params.email,
      phone: params.phone || "",
      verify_token: verifyToken,
      status: "active",
    })
    .select()
    .single();

  if (error || !created) {
    console.error("Error creating client in Supabase:", error);
    return null;
  }

  // Also initialize their meta_config
  await supabase.from("meta_config").insert({
    id: clientId,
    user_id: clientId,
    business_name: params.businessName,
    phone_number_id: "",
    waba_id: "",
    access_token: "",
    verify_token: verifyToken,
    webhook_url: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`
      : "https://wappx.zynexdev.com/api/webhook",
    is_connected: false,
  });

  return mapClientFromRow(created);
}

export async function deleteClientAccount(clientId: string): Promise<boolean> {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) {
    console.error("Error deleting client from Supabase:", error);
    return false;
  }
  await supabase.from("meta_config").delete().eq("user_id", clientId);
  await supabase.from("contacts").delete().eq("user_id", clientId);
  await supabase.from("messages").delete().eq("user_id", clientId);
  await supabase.from("flow_nodes").delete().eq("user_id", clientId);
  return true;
}

// ==================== DATA FETCHING ====================

export async function fetchContacts(userId: string = "client-1"): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    console.error("Error fetching contacts from Supabase:", error);
    return [];
  }

  return data.map(mapContactFromRow);
}

export async function fetchMessages(userId: string = "client-1"): Promise<Record<string, Message[]>> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) {
    console.error("Error fetching messages from Supabase:", error);
    return {};
  }

  const grouped: Record<string, Message[]> = {};
  for (const row of data) {
    const msg = mapMessageFromRow(row);
    const cid = row.contact_id;
    if (!grouped[cid]) grouped[cid] = [];
    grouped[cid].push(msg);
  }

  return grouped;
}

export async function fetchFlowNodes(userId: string = "client-1"): Promise<FlowNode[]> {
  const { data, error } = await supabase
    .from("flow_nodes")
    .select("*")
    .eq("user_id", userId)
    .order("id", { ascending: true });

  if (error || !Array.isArray(data)) {
    console.error("Error fetching flow nodes from Supabase:", error);
    return [];
  }

  return data.map(mapFlowNodeFromRow);
}

export async function fetchMetaConfig(userId: string = "client-1"): Promise<MetaConfig | null> {
  const { data, error } = await supabase
    .from("meta_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching meta config from Supabase:", error);
    return null;
  }

  // If this client does not have a meta_config yet, create one
  if (!data) {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const newVerifyToken = `zynex_vt_${userId}_${randomSuffix}`;

    const { data: created, error: insertError } = await supabase
      .from("meta_config")
      .insert({
        id: userId,
        user_id: userId,
        business_name: "WhatsApp Business",
        phone_number_id: "",
        waba_id: "",
        access_token: "",
        verify_token: newVerifyToken,
        webhook_url: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`
          : "https://wappx.zynexdev.com/api/webhook",
        is_connected: false,
      })
      .select()
      .single();

    if (insertError || !created) {
      console.error("Failed to initialize meta_config for user:", insertError);
      return null;
    }

    return mapMetaConfigFromRow(created);
  }

  return mapMetaConfigFromRow(data);
}

// ==================== DATA MUTATIONS ====================

export async function saveMessage(
  contactId: string,
  message: Message,
  userId: string = "client-1"
): Promise<boolean> {
  const { error } = await supabase.from("messages").insert({
    id: message.id,
    user_id: userId,
    contact_id: contactId,
    sender: message.sender,
    sender_name: message.senderName || null,
    text: message.text,
    timestamp: message.timestamp,
    status: message.status,
    buttons: message.buttons ? (message.buttons as any) : null,
    selected_button_id: message.selectedButtonId || null,
    media_url: message.mediaUrl || null,
    media_type: message.mediaType || null,
    catalog: message.catalog ? (message.catalog as any) : null,
    is_internal_note: message.isInternalNote || false,
  });

  if (error) {
    console.error("Error saving message to Supabase:", error);
    return false;
  }

  // Update contact last message if not internal note
  if (!message.isInternalNote) {
    await supabase
      .from("contacts")
      .update({
        last_message_snippet: message.text,
        last_message_time: message.timestamp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .eq("user_id", userId);
  }

  return true;
}

export async function saveContact(contact: Contact, userId: string = "client-1"): Promise<boolean> {
  const { error } = await supabase.from("contacts").upsert({
    id: contact.id,
    user_id: userId,
    name: contact.name,
    phone: contact.phone,
    avatar_url: contact.avatarUrl || null,
    status: contact.status,
    assigned_agent: contact.assignedAgent || null,
    tags: contact.tags,
    unread_count: contact.unreadCount,
    last_message_snippet: contact.lastMessageSnippet,
    last_message_time: contact.lastMessageTime,
    current_flow_node_id: contact.currentFlowNodeId || null,
    is_bot_active: contact.isBotActive,
    notes: contact.notes,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving contact to Supabase:", error);
    return false;
  }
  return true;
}

export async function updateContactFields(
  contactId: string,
  fields: Partial<{
    status: "active" | "pending_human" | "resolved";
    assigned_agent: string;
    is_bot_active: boolean;
    tags: string[];
    notes: string[];
    unread_count: number;
    last_message_snippet: string;
    last_message_time: string;
  }>,
  userId: string = "client-1"
): Promise<boolean> {
  const { error } = await supabase
    .from("contacts")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating contact in Supabase:", error);
    return false;
  }
  return true;
}

export async function saveFlowNodes(nodes: FlowNode[], userId: string = "client-1"): Promise<boolean> {
  try {
    // 1. Delete removed nodes for this user
    const { data: existing } = await supabase
      .from("flow_nodes")
      .select("id")
      .eq("user_id", userId);

    if (existing && existing.length > 0) {
      const activeIds = new Set(nodes.map((n) => n.id));
      const toDelete = existing.map((e) => e.id).filter((id) => !activeIds.has(id));
      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from("flow_nodes")
          .delete()
          .in("id", toDelete)
          .eq("user_id", userId);

        if (delError) {
          console.error("Error deleting removed flow nodes:", delError);
        }
      }
    }

    // 2. Upsert current nodes
    if (nodes.length > 0) {
      const rows = nodes.map((node) => ({
        id: node.id,
        user_id: userId,
        type: node.type,
        title: node.title,
        content: node.content,
        trigger_keywords: node.triggerKeywords || [],
        buttons: {
          buttons: node.buttons || [],
          metaPayload: {
            listItems: node.listItems,
            mediaUrl: node.mediaUrl,
            caption: node.caption,
            delayDuration: node.delayDuration,
            templateName: node.templateName,
            url: node.url,
            urlButtonText: node.urlButtonText,
            location: node.location,
            catalog: node.catalog,
            notifyChannel: node.notifyChannel,
            notifyTarget: node.notifyTarget,
            contactType: node.contactType,
            triggerType: node.triggerType,
            targetFlowId: node.targetFlowId,
          },
        } as any,
        next_node_id: node.nextNodeId || null,
        fallback_node_id: node.fallbackNodeId || null,
        position: node.position as any,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("flow_nodes").upsert(rows);
      if (error) {
        console.error("Error updating flow nodes in Supabase:", error);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("saveFlowNodes exception:", err);
    return false;
  }
}

export async function saveMetaConfig(config: MetaConfig, userId: string = "client-1"): Promise<boolean> {
  const configId = config.id || userId;

  const { error } = await supabase.from("meta_config").upsert({
    id: configId,
    user_id: userId,
    business_name: config.businessName || "My Business",
    phone_number_id: config.phoneNumberId,
    waba_id: config.wabaId,
    access_token: config.accessToken,
    verify_token: config.verifyToken,
    webhook_url: config.webhookUrl,
    is_connected: config.isConnected,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error updating meta config in Supabase:", error);
    return false;
  }
  return true;
}

export const INITIAL_DEFAULT_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: "item-1",
    retailerId: "WPP-STARTER",
    title: "WhatsApp Automation Starter",
    description: "1,000 automated bot chats/mo, 1 live agent seat, flow triggers, and interactive reply menus.",
    price: "$29.00",
    currency: "USD",
    category: "Software Plans",
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "item-2",
    retailerId: "WPP-GROWTH",
    title: "Growth Commerce & CRM Suite",
    description: "5,000 chats/mo, 5 agents, Shopify & Google Sheets webhooks, full analytics, and drip campaigns.",
    price: "$79.00",
    currency: "USD",
    category: "Software Plans",
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "item-3",
    retailerId: "WPP-SCALE",
    title: "Enterprise AI & Multi-Agent Engine",
    description: "Unlimited flows, OpenAI smart replies, team routing, custom domain, and 99.9% uptime SLA.",
    price: "$199.00",
    currency: "USD",
    category: "Enterprise",
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "item-4",
    retailerId: "WPP-CUSTOM-ERP",
    title: "Custom ERP & WhatsApp Sync",
    description: "Tailored webhook pipeline connecting SAP, Odoo, or Zoho to WhatsApp interactive carts.",
    price: "$349.00",
    currency: "USD",
    category: "Custom Solutions",
    status: "active",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  },
];

export async function fetchCatalogs(clientId: string): Promise<BusinessCatalog[]> {
  try {
    const { data, error } = await supabase
      .from("catalogs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Supabase fetchCatalogs warning, falling back to local store:", error.message);
      return getLocalCatalogs(clientId);
    }

    if (!data || data.length === 0) {
      // Seed default catalog for this workspace
      const defaultCatalog: BusinessCatalog = {
        id: `cat-${clientId}-default`,
        clientId,
        name: "Main Product Catalog",
        catalogId: `meta_${clientId.replace(/[^a-zA-Z0-9]/g, "")}_cat`,
        description: "Official WhatsApp Commerce products and subscription packages.",
        items: INITIAL_DEFAULT_CATALOG_ITEMS,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveCatalog(defaultCatalog);
      return [defaultCatalog];
    }

    return data.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      catalogId: row.catalog_id || undefined,
      description: row.description || undefined,
      items: Array.isArray(row.items) ? (row.items as unknown as CatalogItem[]) : [],
      isDefault: row.is_default,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error("fetchCatalogs error:", err);
    return getLocalCatalogs(clientId);
  }
}

export async function saveCatalog(catalog: BusinessCatalog): Promise<BusinessCatalog> {
  const now = new Date().toISOString();
  const catalogToSave: BusinessCatalog = {
    ...catalog,
    updatedAt: now,
    createdAt: catalog.createdAt || now,
  };

  // Sync to localStorage as immediate offline cache
  saveLocalCatalog(catalogToSave);

  try {
    const { error } = await supabase.from("catalogs").upsert({
      id: catalogToSave.id,
      client_id: catalogToSave.clientId,
      name: catalogToSave.name,
      catalog_id: catalogToSave.catalogId || null,
      description: catalogToSave.description || null,
      items: catalogToSave.items as unknown as Json,
      is_default: catalogToSave.isDefault ?? false,
      created_at: catalogToSave.createdAt,
      updated_at: catalogToSave.updatedAt,
    });

    if (error) {
      console.error("Supabase saveCatalog error:", error.message);
    }
  } catch (err) {
    console.error("saveCatalog exception:", err);
  }

  return catalogToSave;
}

export async function deleteCatalog(catalogId: string, clientId?: string): Promise<boolean> {
  if (clientId) {
    deleteLocalCatalog(catalogId, clientId);
  }
  try {
    const { error } = await supabase.from("catalogs").delete().eq("id", catalogId);
    if (error) {
      console.error("Supabase deleteCatalog error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deleteCatalog exception:", err);
    return false;
  }
}

// Local Storage helpers for zero-delay UX & offline resilience
function getLocalKey(clientId: string) {
  return `zynex_catalogs_${clientId}`;
}

function getLocalCatalogs(clientId: string): BusinessCatalog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getLocalKey(clientId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  // Return default starter
  const defaultCat: BusinessCatalog = {
    id: `cat-${clientId}-default`,
    clientId,
    name: "Main Product Catalog",
    catalogId: `meta_${clientId.replace(/[^a-zA-Z0-9]/g, "")}_cat`,
    description: "Official WhatsApp Commerce products and packages.",
    items: INITIAL_DEFAULT_CATALOG_ITEMS,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveLocalCatalog(defaultCat);
  return [defaultCat];
}

function saveLocalCatalog(catalog: BusinessCatalog) {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalCatalogs(catalog.clientId).filter((c) => c.id !== catalog.id);
    list.unshift(catalog);
    localStorage.setItem(getLocalKey(catalog.clientId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

function deleteLocalCatalog(catalogId: string, clientId: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalCatalogs(clientId).filter((c) => c.id !== catalogId);
    localStorage.setItem(getLocalKey(clientId), JSON.stringify(list));
  } catch {
    // ignore
  }
}

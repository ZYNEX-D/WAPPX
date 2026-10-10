import { supabase } from "./client";
import { Contact, FlowNode, Message, MetaConfig, FlowNodeType, Client, BusinessCatalog, CatalogItem, SupportTicket, TicketMessage, TicketStatus, BotFlow, CatalogOrder, CatalogOrderStatus, CatalogOrderItem } from "@/types/whatsapp";
import { initialFlowNodes } from "@/lib/initial-data";
import { Database, Json } from "./types";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
type FlowNodeRow = Database["public"]["Tables"]["flow_nodes"]["Row"];
type FlowRow = Database["public"]["Tables"]["flows"]["Row"];
type MetaConfigRow = Database["public"]["Tables"]["meta_config"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type CatalogOrderRow = Database["public"]["Tables"]["catalog_orders"]["Row"];

export function mapContactFromRow(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    channel: (row.channel as any) || "whatsapp",
    externalId: row.external_id || undefined,
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
    channel: (row.channel as any) || "whatsapp",
    buttons: Array.isArray(row.buttons) ? (row.buttons as any) : undefined,
    selectedButtonId: row.selected_button_id || undefined,
    mediaUrl: row.media_url || undefined,
    mediaType: row.media_type || undefined,
    catalog: (row as any).catalog || undefined,
    order:
      (row as any).order ||
      (row.buttons && typeof row.buttons === "object" && !Array.isArray(row.buttons) && (row.buttons as any).order
        ? (row.buttons as any).order
        : undefined),
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

export function mapFlowFromRow(row: FlowRow): BotFlow {
  let nodes: FlowNode[] = [];
  if (Array.isArray(row.nodes)) {
    nodes = row.nodes as any;
  }
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || "",
    isActive: row.is_active,
    isDefault: row.is_default,
    nodes,
    triggerKeywords: Array.isArray(row.trigger_keywords) ? row.trigger_keywords : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    facebookPageId: row.facebook_page_id || undefined,
    facebookPageName: row.facebook_page_name || undefined,
    pageAccessToken: row.page_access_token || undefined,
    isMessengerConnected: row.is_messenger_connected ?? false,
    instagramAccountId: row.instagram_account_id || undefined,
    instagramUsername: row.instagram_username || undefined,
    isInstagramConnected: row.is_instagram_connected ?? false,
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
  password?: string;
}): Promise<Client | null> {
  try {
    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (res.ok && json.success && json.client) {
      return mapClientFromRow(json.client);
    }
  } catch (err) {
    console.warn("API client creation failed, falling back to direct DB insert:", err);
  }

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
  try {
    const res = await fetch(`/api/admin/clients?clientId=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn("API delete failed, falling back:", err);
  }

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
  try {
    const cleanUserId = (userId && typeof userId === "string" && userId.trim()) ? userId.trim() : "client-1";
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .or(`user_id.eq.${cleanUserId},user_id.eq.default`)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch contacts from Supabase:", error.message || error.details || error.code || "Network error");
      return [];
    }

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(mapContactFromRow);
  } catch (err: any) {
    console.warn("fetchContacts network error:", err?.message || "Failed to reach Supabase");
    return [];
  }
}

export async function fetchMessages(userId: string = "client-1"): Promise<Record<string, Message[]>> {
  try {
    const cleanUserId = (userId && typeof userId === "string" && userId.trim()) ? userId.trim() : "client-1";
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`user_id.eq.${cleanUserId},user_id.eq.default`)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Could not fetch messages from Supabase:", error.message || error.details || error.code || "Network error");
      return {};
    }

    if (!Array.isArray(data)) {
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
  } catch (err: any) {
    console.warn("fetchMessages network error:", err?.message || "Failed to reach Supabase");
    return {};
  }
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

export async function fetchFlows(userId: string = "client-1"): Promise<BotFlow[]> {
  try {
    const { data, error } = await supabase
      .from("flows")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(mapFlowFromRow);
    }

    // Fallback: If no flows found in 'flows' table yet, check existing flow_nodes
    const legacyNodes = await fetchFlowNodes(userId);
    const fallbackNodes = legacyNodes && legacyNodes.length > 0 ? legacyNodes : initialFlowNodes;

    const defaultFlow: BotFlow = {
      id: `flow-main-${userId}`,
      userId,
      name: "Main Welcome & Onboarding Flow",
      description: "Automated greeting, interactive menu, and customer support routing",
      isActive: true,
      isDefault: true,
      nodes: fallbackNodes,
      triggerKeywords: ["hi", "hello", "start", "menu", "help"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-save the default flow into the flows table
    await saveFlow(defaultFlow, userId);
    return [defaultFlow];
  } catch (err) {
    console.error("fetchFlows exception:", err);
    return [];
  }
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
    channel: message.channel || "whatsapp",
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
    channel: contact.channel || "whatsapp",
    external_id: contact.externalId || null,
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

export async function saveFlow(flow: BotFlow, userId: string = "client-1"): Promise<boolean> {
  try {
    const flowId = flow.id || `flow-${Date.now()}`;
    const row = {
      id: flowId,
      user_id: userId,
      name: flow.name || "Untitled Flow",
      description: flow.description || "",
      is_active: flow.isActive ?? true,
      is_default: flow.isDefault ?? false,
      nodes: (flow.nodes || []) as any,
      trigger_keywords: flow.triggerKeywords || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("flows").upsert(row);
    if (error) {
      console.error("Error saving flow to Supabase:", error);
      return false;
    }

    // If this flow is default or active, also sync its nodes to flow_nodes table for backward compatibility
    if (flow.isDefault || flow.isActive) {
      await saveFlowNodes(flow.nodes || [], userId);
    }

    return true;
  } catch (err) {
    console.error("saveFlow exception:", err);
    return false;
  }
}

export async function deleteFlow(flowId: string, userId: string = "client-1"): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("flows")
      .delete()
      .eq("id", flowId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting flow:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deleteFlow exception:", err);
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
    facebook_page_id: config.facebookPageId || "",
    facebook_page_name: config.facebookPageName || "",
    page_access_token: config.pageAccessToken || "",
    is_messenger_connected: config.isMessengerConnected ?? false,
    instagram_account_id: config.instagramAccountId || "",
    instagram_username: config.instagramUsername || "",
    is_instagram_connected: config.isInstagramConnected ?? false,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error updating meta config in Supabase:", error);
    return false;
  }
  return true;
}

export function mapCatalogFromRow(row: any): BusinessCatalog {
  return {
    id: row.id,
    clientId: row.client_id || row.clientId || "client-1",
    name: row.name,
    catalogId: row.catalog_id || row.catalogId || undefined,
    description: row.description || undefined,
    items: Array.isArray(row.items) ? (row.items as unknown as CatalogItem[]) : [],
    isDefault: row.is_default ?? row.isDefault ?? false,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export const INITIAL_DEFAULT_CATALOG_ITEMS: CatalogItem[] = [];

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

    const mapped: BusinessCatalog[] = data.map(mapCatalogFromRow);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(getLocalKey(clientId), JSON.stringify(mapped));
      } catch (e) {}
    }

    return mapped;
  } catch (err) {
    console.error("fetchCatalogs error:", err);
    return getLocalCatalogs(clientId);
  }
}

export async function saveCatalog(catalog: BusinessCatalog): Promise<BusinessCatalog> {
  const resolvedClientId =
    catalog.clientId ||
    (catalog as any).client_id ||
    "client-1";

  const now = new Date().toISOString();
  const catalogToSave: BusinessCatalog = {
    ...catalog,
    clientId: resolvedClientId,
    catalogId: catalog.catalogId || (catalog as any).catalog_id || undefined,
    isDefault: catalog.isDefault ?? (catalog as any).is_default ?? false,
    updatedAt: now,
    createdAt: catalog.createdAt || (catalog as any).created_at || now,
  };

  try {
    const { error } = await supabase.from("catalogs").upsert({
      id: catalogToSave.id,
      client_id: resolvedClientId,
      name: catalogToSave.name,
      catalog_id: catalogToSave.catalogId || null,
      description: catalogToSave.description || null,
      items: (catalogToSave.items || []) as unknown as Json,
      is_default: catalogToSave.isDefault ?? false,
      created_at: catalogToSave.createdAt,
      updated_at: catalogToSave.updatedAt,
    });

    if (error) {
      console.error("Supabase saveCatalog error:", error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    // Sync to localStorage after successful DB write
    saveLocalCatalog(catalogToSave);
  } catch (err: any) {
    console.error("saveCatalog exception:", err);
    throw err;
  }

  return catalogToSave;
}

export async function deleteCatalog(catalogId: string, clientId?: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("catalogs").delete().eq("id", catalogId);
    if (error) {
      console.error("Supabase deleteCatalog error:", error.message);
      throw new Error(`Database error: ${error.message}`);
    }
    if (clientId) {
      deleteLocalCatalog(catalogId, clientId);
    }
    return true;
  } catch (err: any) {
    console.error("deleteCatalog exception:", err);
    throw err;
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

// ============================================================================
// SUPPORT TICKETS SERVICE
// ============================================================================

export function mapTicketFromRow(row: any): SupportTicket {
  return {
    id: row.id,
    clientId: row.client_id || row.clientId || "client-1",
    clientName: row.client_name || row.clientName || "Client",
    businessName: row.business_name || row.businessName || "",
    clientEmail: row.client_email || row.clientEmail || "",
    subject: row.subject || "Support Inquiry",
    category: row.category || "technical",
    priority: row.priority || "medium",
    status: row.status || "open",
    description: row.description || "",
    messages: Array.isArray(row.messages) ? (row.messages as TicketMessage[]) : [],
    assignedAdmin: row.assigned_admin || row.assignedAdmin || "Unassigned",
    resolutionNotes: row.resolution_notes || row.resolutionNotes || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
  };
}

export async function fetchTickets(clientId?: string): Promise<SupportTicket[]> {
  try {
    let query = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    if (clientId && clientId !== "all" && clientId !== "admin") {
      query = query.eq("client_id", clientId);
    }
    const { data, error } = await query;
    if (error) {
      console.warn("fetchTickets warning:", error.message);
      return [];
    }
    return (data || []).map(mapTicketFromRow);
  } catch (err) {
    console.error("fetchTickets exception:", err);
    return [];
  }
}

export async function createSupportTicket(
  ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">
): Promise<SupportTicket | null> {
  try {
    const id = `tick-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const { error } = await supabase.from("support_tickets").insert({
      id: newTicket.id,
      client_id: newTicket.clientId,
      client_name: newTicket.clientName,
      business_name: newTicket.businessName || "",
      client_email: newTicket.clientEmail,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: newTicket.status,
      description: newTicket.description,
      messages: (newTicket.messages || []) as any,
      assigned_admin: newTicket.assignedAdmin || "Unassigned",
      created_at: newTicket.createdAt,
      updated_at: newTicket.updatedAt,
    });

    if (error) {
      console.error("createSupportTicket error:", error.message);
      return null;
    }
    return newTicket;
  } catch (err) {
    console.error("createSupportTicket exception:", err);
    return null;
  }
}

export async function updateSupportTicket(
  ticketId: string,
  updates: Partial<SupportTicket>
): Promise<boolean> {
  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.status) payload.status = updates.status;
    if (updates.priority) payload.priority = updates.priority;
    if (updates.category) payload.category = updates.category;
    if (updates.assignedAdmin !== undefined) payload.assigned_admin = updates.assignedAdmin;
    if (updates.resolutionNotes !== undefined) payload.resolution_notes = updates.resolutionNotes;
    if (updates.messages) payload.messages = updates.messages;

    const { error } = await supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId);

    if (error) {
      console.error("updateSupportTicket error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("updateSupportTicket exception:", err);
    return false;
  }
}

export async function addTicketReply(
  ticketId: string,
  message: TicketMessage,
  newStatus?: TicketStatus
): Promise<boolean> {
  try {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("messages, status")
      .eq("id", ticketId)
      .single();

    if (!ticket) return false;
    const currentMessages: TicketMessage[] = Array.isArray(ticket.messages)
      ? (ticket.messages as unknown as TicketMessage[])
      : [];
    const updatedMessages = [...currentMessages, message];

    const payload: any = {
      messages: updatedMessages as any,
      updated_at: new Date().toISOString(),
    };
    if (newStatus) {
      payload.status = newStatus;
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId);

    return !error;
  } catch (err) {
    console.error("addTicketReply exception:", err);
    return false;
  }
}

// =========================================================================
// CATALOG ORDERS SERVICE (WhatsApp Commerce Orders)
// =========================================================================

export function mapOrderFromRow(row: any): CatalogOrder {
  return {
    id: row.id,
    userId: row.user_id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    catalogId: row.catalog_id || undefined,
    catalogName: row.catalog_name || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal) || 0,
    currency: row.currency || "LKR",
    customerNote: row.customer_note || undefined,
    status: row.status as CatalogOrderStatus,
    shippingAddress: row.shipping_address || undefined,
    trackingNumber: row.tracking_number || undefined,
    whatsappMessageId: row.whatsapp_message_id || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function fetchCatalogOrders(userId?: string): Promise<CatalogOrder[]> {
  try {
    let query = supabase
      .from("catalog_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId && userId !== "all") {
      query = query.or(`user_id.eq.${userId},user_id.eq.default,user_id.eq.client-1`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("fetchCatalogOrders warning:", error.message);
      return [];
    }
    return (data || []).map(mapOrderFromRow);
  } catch (err) {
    console.error("fetchCatalogOrders exception:", err);
    return [];
  }
}

export async function saveCatalogOrder(
  order: CatalogOrder,
  userId: string
): Promise<boolean> {
  try {
    const payload = {
      id: order.id,
      user_id: userId,
      contact_id: order.contactId,
      contact_name: order.contactName,
      contact_phone: order.contactPhone,
      catalog_id: order.catalogId || null,
      catalog_name: order.catalogName || null,
      items: order.items as any,
      subtotal: order.subtotal,
      currency: order.currency,
      customer_note: order.customerNote || null,
      status: order.status,
      shipping_address: order.shippingAddress || null,
      tracking_number: order.trackingNumber || null,
      whatsapp_message_id: order.whatsappMessageId || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("catalog_orders").upsert(payload, {
      onConflict: "id",
    });

    if (error) {
      console.error("saveCatalogOrder error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("saveCatalogOrder exception:", err);
    return false;
  }
}

export async function updateCatalogOrderStatus(
  orderId: string,
  status: CatalogOrderStatus,
  trackingNumber?: string,
  shippingAddress?: string
): Promise<boolean> {
  try {
    const payload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (trackingNumber !== undefined) payload.tracking_number = trackingNumber;
    if (shippingAddress !== undefined) payload.shipping_address = shippingAddress;

    const { error } = await supabase
      .from("catalog_orders")
      .update(payload)
      .eq("id", orderId);

    if (error) {
      console.error("updateCatalogOrderStatus error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("updateCatalogOrderStatus exception:", err);
    return false;
  }
}

export async function deleteCatalogOrder(
  orderId: string,
  userId?: string
): Promise<boolean> {
  try {
    let query = supabase.from("catalog_orders").delete().eq("id", orderId);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { error } = await query;

    if (error) {
      console.error("deleteCatalogOrder error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("deleteCatalogOrder exception:", err);
    return false;
  }
}

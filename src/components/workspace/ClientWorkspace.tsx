"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar, ActiveTab } from "@/components/navigation/Sidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { LiveInbox } from "@/components/inbox/LiveInbox";
import { FlowBuilder } from "@/components/flow-builder/FlowBuilder";
import { FlowListView } from "@/components/flow-builder/FlowListView";
import { WhatsAppSimulator } from "@/components/simulator/WhatsAppSimulator";
import { MetaSettings } from "@/components/settings/MetaSettings";
import { ContactsView } from "@/components/contacts/ContactsView";
import { CampaignManager } from "@/components/campaigns/CampaignManager";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { IntegrationsHub } from "@/components/integrations/IntegrationsHub";
import { SetupGuideModal } from "@/components/guide/SetupGuideModal";
import { UserSwitchModal } from "@/components/auth/UserSwitchModal";
import { CatalogManager } from "@/components/catalog/CatalogManager";
import { OrdersManager } from "@/components/catalog/OrdersManager";
import { SupportTicketsView } from "@/components/support/SupportTicketsView";
import {
  initialCatalogOrders,
  initialContacts,
  initialFlowNodes,
  initialMessages,
  initialMetaConfig,
} from "@/lib/initial-data";
import { Contact, FlowNode, Message, MetaConfig, UserWorkspace, Client, CatalogPayload, BusinessCatalog, BotFlow, CatalogOrder, CatalogOrderStatus } from "@/types/whatsapp";
import { supabase } from "@/lib/supabase/client";
import {
  fetchClients,
  createClientAccount,
  fetchContacts,
  fetchMessages,
  fetchFlowNodes,
  fetchFlows,
  saveFlow,
  deleteFlow,
  fetchMetaConfig,
  fetchCatalogs,
  saveCatalog,
  deleteCatalog,
  saveMessage,
  saveContact,
  updateContactFields,
  saveFlowNodes,
  saveMetaConfig,
  mapMessageFromRow,
  mapContactFromRow,
  mapOrderFromRow,
  fetchCatalogOrders,
  saveCatalogOrder,
  updateCatalogOrderStatus,
  deleteCatalogOrder,
} from "@/lib/supabase/service";
import {
  getStoredSession,
  clearStoredSession,
  isSuperAdmin,
  AuthUser,
} from "@/lib/auth-session";
import { Bell, ArrowRight, X } from "lucide-react";

interface ClientWorkspaceProps {
  initialClientId?: string;
  initialTab?: ActiveTab;
}

export function ClientWorkspace({
  initialClientId,
  initialTab = "inbox",
}: ClientWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameter overrides
  const clientQueryParam = searchParams.get("client");
  const tabQueryParam = (searchParams.get("tab") as ActiveTab) || initialTab;

  const [authSession, setAuthSession] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabQueryParam);
  const [currentClientId, setCurrentClientId] = useState<string>(
    clientQueryParam || initialClientId || "client-1"
  );

  // Tab switch that keeps URL in sync — preserves tab on refresh
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.replace(`/app?${params.toString()}`, { scroll: false });
  };
  const [clients, setClients] = useState<Client[]>([]);

  // Workspace data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [flows, setFlows] = useState<BotFlow[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string>("");
  const [flowNodes, setFlowNodes] = useState<FlowNode[]>(initialFlowNodes);
  const [isFlowsLoaded, setIsFlowsLoaded] = useState(false);
  const [builderSubView, setBuilderSubView] = useState<"list" | "canvas">("list");
  const [metaConfig, setMetaConfig] = useState<MetaConfig>(initialMetaConfig);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [catalogs, setCatalogs] = useState<BusinessCatalog[]>([]);
  const [orders, setOrders] = useState<CatalogOrder[]>(initialCatalogOrders);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState(false);

  // Notification for incoming handoff
  const [handoffAlert, setHandoffAlert] = useState<{
    contactName: string;
    message: string;
  } | null>(null);

  // 1. Check Auth & Session
  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setAuthSession(session);

    // If client is logged in and not admin, enforce their own clientId
    if (!isSuperAdmin(session) && session.clientId) {
      setCurrentClientId(session.clientId);
    } else if (clientQueryParam) {
      setCurrentClientId(clientQueryParam);
    }
  }, [router, clientQueryParam]);

  // 2. Load Clients (for admin switching or workspace details)
  useEffect(() => {
    async function loadClients() {
      try {
        const data = await fetchClients();
        if (Array.isArray(data) && data.length > 0) {
          setClients(data);
        }
      } catch (err) {
        console.error("Error loading clients:", err);
      }
    }
    loadClients();
  }, []);

  // 3. Load workspace data for currentClientId
  useEffect(() => {
    let isMounted = true;
    setIsFlowsLoaded(false);

    // 1. Fetch flows immediately from database
    fetchFlows(currentClientId)
      .then((fetchedFlows) => {
        if (isMounted) {
          if (Array.isArray(fetchedFlows) && fetchedFlows.length > 0) {
            setFlows(fetchedFlows);
            const initialActive = fetchedFlows.find((f) => f.isDefault) || fetchedFlows[0];
            setCurrentFlowId(initialActive.id);
            setFlowNodes(initialActive.nodes);
          }
          setIsFlowsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Error loading flows:", err);
        if (isMounted) setIsFlowsLoaded(true);
      });

    // 2. Fetch contacts
    fetchContacts(currentClientId)
      .then((fetchedContacts) => {
        if (isMounted) {
          if (Array.isArray(fetchedContacts) && fetchedContacts.length > 0) {
            setContacts(fetchedContacts);
            setSelectedContactId((prev) => {
              if (prev && fetchedContacts.some((c) => c.id === prev)) return prev;
              return fetchedContacts[0].id;
            });
          } else {
            setContacts([]);
            setSelectedContactId("");
          }
        }
      })
      .catch((err) => console.error("Error loading contacts:", err));

    // 3. Fetch messages
    fetchMessages(currentClientId)
      .then((fetchedMessages) => {
        if (isMounted) {
          if (fetchedMessages && Object.keys(fetchedMessages).length > 0) {
            setMessages(fetchedMessages);
          } else {
            setMessages({});
          }
        }
      })
      .catch((err) => console.error("Error loading messages:", err));

    // 4. Fetch meta config
    fetchMetaConfig(currentClientId)
      .then((fetchedMeta) => {
        if (isMounted && fetchedMeta) {
          setMetaConfig(fetchedMeta);
        }
      })
      .catch((err) => console.error("Error loading meta config:", err));

    // 5. Fetch catalogs & products
    fetchCatalogs(currentClientId)
      .then((fetchedCats) => {
        if (isMounted && Array.isArray(fetchedCats)) {
          setCatalogs(fetchedCats);
        }
      })
      .catch((err) => console.error("Error loading catalogs:", err));

    // 6. Fetch catalog orders
    fetchCatalogOrders(currentClientId)
      .then((fetchedOrders) => {
        if (isMounted && Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
          setOrders(fetchedOrders);
        }
      })
      .catch((err) => console.error("Error loading catalog orders:", err));

    // Supabase Realtime channel for live messages, contacts & catalog orders
    const channel = supabase
      .channel(`wppx-realtime-${currentClientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newRow = payload.new as any;
          if (!newRow || !newRow.contact_id) return;
          if (newRow.user_id && newRow.user_id !== currentClientId && newRow.user_id !== "default") return;

          const mappedMsg = mapMessageFromRow(newRow);
          setMessages((prev) => {
            const list = prev[newRow.contact_id] || [];
            if (list.some((m) => m.id === mappedMsg.id)) return prev;
            return {
              ...prev,
              [newRow.contact_id]: [...list, mappedMsg],
            };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contacts" },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.user_id && row.user_id !== currentClientId && row.user_id !== "default") return;

          if (payload.eventType === "INSERT") {
            const newContact = mapContactFromRow(payload.new as any);
            setContacts((prev) => {
              if (prev.some((c) => c.id === newContact.id)) return prev;
              return [newContact, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedContact = mapContactFromRow(payload.new as any);
            setContacts((prev) =>
              prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setContacts((prev) => prev.filter((c) => c.id !== deletedId));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "catalog_orders" },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.user_id && row.user_id !== currentClientId && row.user_id !== "default") return;

          if (payload.eventType === "INSERT") {
            const newOrder = mapOrderFromRow(payload.new as any);
            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = mapOrderFromRow(payload.new as any);
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setOrders((prev) => prev.filter((o) => o.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    // Resilient background polling every 3 seconds to guarantee instant message arrival
    const pollInterval = setInterval(() => {
      if (!isMounted) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      fetchMessages(currentClientId)
        .then((latestMsgs) => {
          if (!isMounted || !latestMsgs) return;
          setMessages((prev) => {
            let hasChanged = false;
            const updated = { ...prev };
            for (const [cid, msgList] of Object.entries(latestMsgs)) {
              const currentList = prev[cid] || [];
              if (
                currentList.length !== msgList.length ||
                (msgList.length > 0 && currentList[currentList.length - 1]?.id !== msgList[msgList.length - 1]?.id)
              ) {
                updated[cid] = msgList;
                hasChanged = true;
              }
            }
            return hasChanged ? updated : prev;
          });
        })
        .catch(() => {});

      fetchContacts(currentClientId)
        .then((latestContacts) => {
          if (!isMounted || !Array.isArray(latestContacts)) return;
          setContacts((prev) => {
            if (prev.length !== latestContacts.length) return latestContacts;
            const hasSnippetChange = latestContacts.some((lc) => {
              const match = prev.find((p) => p.id === lc.id);
              return (
                !match ||
                match.lastMessageSnippet !== lc.lastMessageSnippet ||
                match.lastMessageTime !== lc.lastMessageTime
              );
            });
            return hasSnippetChange ? latestContacts : prev;
          });
        })
        .catch(() => {});

      fetchCatalogOrders(currentClientId)
        .then((latestOrders) => {
          if (!isMounted || !Array.isArray(latestOrders)) return;
          setOrders((prev) => {
            if (prev.length !== latestOrders.length) return latestOrders;
            const hasChange = latestOrders.some((lo) => {
              const match = prev.find((p) => p.id === lo.id);
              return !match || match.status !== lo.status || match.updatedAt !== lo.updatedAt;
            });
            return hasChange ? latestOrders : prev;
          });
        })
        .catch(() => {});
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [currentClientId]);

  const activeClientObj = clients.find((c) => c.id === currentClientId) || {
    id: currentClientId,
    name: "Tharusha Damsara",
    businessName: "Apex Commerce",
    email: "tharusha@zynex.lk",
    phone: "+94 72 973 1508",
    verifyToken: metaConfig.verifyToken || "wppx_meta_webhook_secret_2026",
    status: "active" as const,
  };

  const currentWorkspaceUser: UserWorkspace = {
    id: activeClientObj.id,
    name: `${activeClientObj.name} (${activeClientObj.businessName})`,
    email: activeClientObj.email,
    role: "client",
    verifyToken: activeClientObj.verifyToken,
  };

  const allWorkspaces: UserWorkspace[] = clients.map((c) => ({
    id: c.id,
    name: `${c.name} (${c.businessName})`,
    email: c.email,
    role: "client",
    verifyToken: c.verifyToken,
  }));

  const pendingHumanCount = contacts.filter((c) => c.status === "pending_human").length;

  const handleSendMessage = async (
    contactId: string,
    text: string,
    isInternalNote = false,
    mediaUrl?: string,
    mediaType?: "image" | "audio" | "document",
    catalog?: CatalogPayload
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "agent",
      senderName: `${activeClientObj.name} (Agent)`,
      text,
      timestamp: timeStr,
      status: "delivered",
      isInternalNote,
      userId: currentClientId,
      mediaUrl,
      mediaType,
      catalog,
    };

    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

    if (!isInternalNote) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                lastMessageSnippet: catalog ? `🛍️ ${catalog.catalogName || "WhatsApp Catalog"}` : text,
                lastMessageTime: timeStr,
              }
            : c
        )
      );
    }

    await saveMessage(contactId, newMsg, currentClientId);

    // If not an internal note, dispatch outbound message directly to customer's WhatsApp
    if (!isInternalNote) {
      const targetContact = contacts.find((c) => c.id === contactId);
      if (targetContact?.phone) {
        fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumberId: metaConfig.phoneNumberId,
            accessToken: metaConfig.accessToken,
            recipientPhone: targetContact.phone,
            text,
            buttons: newMsg.buttons,
            catalog,
            mediaUrl,
            mediaType,
            contactId,
            messageId: newMsg.id,
            userId: currentClientId,
          }),
        })
          .then(async (res) => {
            const data = await res.json();
            if (!data.success && data.error) {
              console.warn("[ClientWorkspace] Outbound WhatsApp dispatch notice:", data.error);
            }
          })
          .catch((err) => {
            console.error("[ClientWorkspace] Failed to send outbound WhatsApp message:", err);
          });
      }
    }
  };

  const handleToggleBot = async (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    const newIsBotActive = !target.isBotActive;
    const newStatus = !newIsBotActive ? "active" : target.status;

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              isBotActive: newIsBotActive,
              status: newStatus,
            }
          : c
      )
    );

    await updateContactFields(
      contactId,
      {
        is_bot_active: newIsBotActive,
        status: newStatus,
      },
      currentClientId
    );
  };

  const handleAssignAgent = async (contactId: string, agentName: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, assignedAgent: agentName } : c
      )
    );

    await updateContactFields(contactId, { assigned_agent: agentName }, currentClientId);
  };

  const handleAddTag = async (contactId: string, tag: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target || target.tags.includes(tag)) return;
    const newTags = [...target.tags, tag];

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, tags: newTags } : c
      )
    );

    await updateContactFields(contactId, { tags: newTags }, currentClientId);
  };

  const handleAddNote = async (contactId: string, note: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    const newNotes = [note, ...target.notes];

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, notes: newNotes } : c
      )
    );

    await updateContactFields(contactId, { notes: newNotes }, currentClientId);
    handleSendMessage(contactId, note, true);
  };

  const handleSimulatorHandoffAlert = (customerText: string) => {
    setHandoffAlert({
      contactName: `Simulator Customer (${activeClientObj.phone || "+94 77 000 0000"})`,
      message: customerText,
    });
  };

  const handleAddContact = async (newContact: Contact) => {
    const contactWithUser: Contact = {
      ...newContact,
      userId: currentClientId,
    };

    const initMsg: Message = {
      id: `m-init-${Date.now()}`,
      sender: "bot",
      text: "👋 Contact created on platform. Inbound welcome flow ready.",
      timestamp: "Just now",
      status: "delivered",
      userId: currentClientId,
    };

    setContacts((prev) => [contactWithUser, ...prev]);
    setMessages((prev) => ({
      ...prev,
      [newContact.id]: [initMsg],
    }));
    setSelectedContactId(newContact.id);

    await saveContact(contactWithUser, currentClientId);
    await saveMessage(newContact.id, initMsg, currentClientId);
  };

  const handleSelectFlow = (flowId: string) => {
    setCurrentFlowId(flowId);
    const targetFlow = flows.find((f) => f.id === flowId);
    if (targetFlow) {
      setFlowNodes(targetFlow.nodes || []);
    }
  };

  const handleCreateFlow = async (
    name: string,
    description?: string,
    initialNodes?: FlowNode[]
  ): Promise<BotFlow | null> => {
    const newId = `flow-${Date.now()}`;
    const defaultNodes: FlowNode[] =
      initialNodes && initialNodes.length > 0
        ? initialNodes
        : [
            {
              id: `node-${Date.now()}-1`,
              type: "trigger",
              title: "1. Inbound Welcome Trigger",
              content: "Activates when user starts chat or says hello.",
              triggerKeywords: ["hi", "hello", "start", "menu"],
              position: { x: 100, y: 150 },
              nextNodeId: `node-${Date.now()}-2`,
            },
            {
              id: `node-${Date.now()}-2`,
              type: "buttons",
              title: "2. Main Menu",
              content: "👋 Ayubowan! How can we help your business today?",
              buttons: [
                { id: `btn-${Date.now()}-1`, title: "Option 1" },
                { id: `btn-${Date.now()}-2`, title: "Option 2" },
              ],
              position: { x: 480, y: 150 },
            },
          ];

    const newFlow: BotFlow = {
      id: newId,
      userId: currentClientId,
      name: name || `Flow #${flows.length + 1}`,
      description: description || "Automated WhatsApp bot flow",
      isActive: true,
      isDefault: flows.length === 0,
      nodes: defaultNodes,
      triggerKeywords: ["hi", "hello"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFlow(newFlow, currentClientId);
    setFlows((prev) => [...prev, newFlow]);
    setCurrentFlowId(newId);
    setFlowNodes(defaultNodes);
    return newFlow;
  };

  const handleDeleteFlow = async (flowId: string): Promise<boolean> => {
    if (flows.length <= 1) {
      return false;
    }
    await deleteFlow(flowId, currentClientId);
    const remaining = flows.filter((f) => f.id !== flowId);
    setFlows(remaining);
    if (currentFlowId === flowId) {
      const nextFlow = remaining[0];
      setCurrentFlowId(nextFlow.id);
      setFlowNodes(nextFlow.nodes || []);
    }
    return true;
  };

  const handleDuplicateFlow = async (flowId: string): Promise<BotFlow | null> => {
    const source = flows.find((f) => f.id === flowId);
    if (!source) return null;

    const idMap = new Map<string, string>();
    source.nodes.forEach((n) =>
      idMap.set(n.id, `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
    );

    const duplicatedNodes: FlowNode[] = source.nodes.map((n) => {
      const newId = idMap.get(n.id) || `node-${Date.now()}`;
      const newNext = n.nextNodeId ? idMap.get(n.nextNodeId) : undefined;
      const newButtons = n.buttons?.map((b) => ({
        ...b,
        id: `btn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nextNodeId: b.nextNodeId ? idMap.get(b.nextNodeId) : undefined,
      }));
      const newListItems = n.listItems?.map((li) => ({
        ...li,
        id: `li-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nextNodeId: li.nextNodeId ? idMap.get(li.nextNodeId) : undefined,
      }));

      return {
        ...n,
        id: newId,
        nextNodeId: newNext,
        buttons: newButtons,
        listItems: newListItems,
      };
    });

    const newFlow: BotFlow = {
      id: `flow-${Date.now()}`,
      userId: currentClientId,
      name: `${source.name} (Copy)`,
      description: source.description || "",
      isActive: true,
      isDefault: false,
      nodes: duplicatedNodes,
      triggerKeywords: source.triggerKeywords ? [...source.triggerKeywords] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveFlow(newFlow, currentClientId);
    setFlows((prev) => [...prev, newFlow]);
    setCurrentFlowId(newFlow.id);
    setFlowNodes(duplicatedNodes);
    return newFlow;
  };

  const handleToggleFlowActive = async (flowId: string, isActive: boolean): Promise<boolean> => {
    const target = flows.find((f) => f.id === flowId);
    if (!target) return false;

    const updatedFlow: BotFlow = {
      ...target,
      isActive,
      updatedAt: new Date().toISOString(),
    };

    await saveFlow(updatedFlow, currentClientId);
    setFlows((prev) => prev.map((f) => (f.id === flowId ? updatedFlow : f)));
    return true;
  };

  const handleUpdateFlowNodes = async (nodes: FlowNode[], newFlowName?: string): Promise<boolean> => {
    setFlowNodes(nodes);
    const activeTarget = flows.find((f) => f.id === currentFlowId) || flows[0];
    if (activeTarget) {
      const updatedFlow: BotFlow = {
        ...activeTarget,
        name: newFlowName || activeTarget.name,
        nodes,
        updatedAt: new Date().toISOString(),
      };
      setFlows((prev) => prev.map((f) => (f.id === activeTarget.id ? updatedFlow : f)));
      return await saveFlow(updatedFlow, currentClientId);
    } else {
      return await saveFlowNodes(nodes, currentClientId);
    }
  };

  const handleUpdateMetaConfig = async (config: MetaConfig) => {
    const configWithUser: MetaConfig = {
      ...config,
      userId: currentClientId,
    };
    setMetaConfig(configWithUser);
    await saveMetaConfig(configWithUser, currentClientId);
  };

  const handleSaveCatalog = async (updated: BusinessCatalog) => {
    try {
      const sanitized: BusinessCatalog = {
        ...updated,
        clientId: updated.clientId || (updated as any).client_id || currentClientId || "client-1",
        catalogId: updated.catalogId || (updated as any).catalog_id,
        isDefault: updated.isDefault ?? (updated as any).is_default ?? true,
      };
      const saved = await saveCatalog(sanitized);
      setCatalogs((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
    } catch (err: any) {
      console.error("handleSaveCatalog error:", err);
      throw err;
    }
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    try {
      await deleteCatalog(catalogId, currentClientId);
      setCatalogs((prev) => prev.filter((c) => c.id !== catalogId));
    } catch (err: any) {
      console.error("handleDeleteCatalog error:", err);
      throw err;
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: CatalogOrderStatus,
    trackingNumber?: string,
    shippingAddress?: string
  ): Promise<boolean> => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              ...(trackingNumber !== undefined ? { trackingNumber } : {}),
              ...(shippingAddress !== undefined ? { shippingAddress } : {}),
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    const success = await updateCatalogOrderStatus(orderId, status, trackingNumber, shippingAddress);
    return success;
  };

  const handleDeleteOrder = async (orderId: string): Promise<boolean> => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    const success = await deleteCatalogOrder(orderId, currentClientId);
    return success;
  };

  const handleSendOrderWhatsAppMessage = async (phone: string, text: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    const targetContact = contacts.find((c) => c.phone.replace(/[^0-9]/g, "") === clean);

    if (targetContact) {
      await handleSendMessage(targetContact.id, text);
    } else {
      const newContactId = `c-${Date.now()}`;
      const newContact: Contact = {
        id: newContactId,
        name: phone,
        phone: phone,
        status: "active",
        tags: ["WhatsApp Order"],
        lastMessageSnippet: text,
        lastMessageTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isBotActive: false,
        userId: currentClientId,
        unreadCount: 0,
        notes: [],
      };
      setContacts((prev) => [newContact, ...prev]);
      await saveContact(newContact, currentClientId);
      await handleSendMessage(newContactId, text);
    }
  };

  const handleNavigateToChat = (contactPhone: string) => {
    const clean = contactPhone.replace(/[^0-9]/g, "");
    const targetContact = contacts.find((c) => c.phone.replace(/[^0-9]/g, "") === clean);
    if (targetContact) {
      setSelectedContactId(targetContact.id);
    }
    handleTabChange("inbox");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearStoredSession();
    } catch (e) {}
    router.push("/login");
  };

  const isOwner = isSuperAdmin(authSession);

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col lg:flex-row antialiased font-secondary text-[#334155] overflow-hidden">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        viewMode="client"
        onSwitchViewMode={(mode) => {
          if (mode === "admin") {
            router.push("/admin");
          }
        }}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        pendingHumanCount={pendingHumanCount}
        pendingOrdersCount={orders.filter((o) => o.status === "pending").length}
        currentUser={currentWorkspaceUser}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenUserSwitch={() => setIsUserSwitchOpen(true)}
        onViewLanding={() => router.push("/")}
        onLogout={handleLogout}
        userEmail={authSession?.email}
        isOwnerAdmin={isOwner}
      />

      {/* Main Surface View Container */}
      <div className={`flex-1 flex flex-col min-w-0 h-[calc(100vh-57px)] lg:h-screen ${
        activeTab === "inbox" || activeTab === "orders" || activeTab === "builder" || activeTab === "simulator" || activeTab === "catalog"
          ? "overflow-hidden"
          : "overflow-y-auto no-scrollbar"
      }`}>
        {/* Human Handoff Push Alert in Client View */}
        {handoffAlert && (
          <div className="bg-[#0A504A] text-white px-6 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2 shrink-0 border-b border-[#0A504A]/30">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-[#ef4444] flex items-center justify-center font-bold">
                <Bell className="w-3.5 h-3.5 text-white" />
              </span>
              <div>
                <span className="font-bold">{handoffAlert.contactName}</span>{" "}
                <span className="opacity-75">needs human agent assistance:</span>{" "}
                <span className="font-medium italic">&quot;{handoffAlert.message}&quot;</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  handleTabChange("inbox");
                  setSelectedContactId("c-2");
                  setHandoffAlert(null);
                }}
                className="px-3 py-1 bg-white text-[#0A504A] rounded-full font-bold hover:bg-[#F7F7F2] flex items-center gap-1 cursor-pointer text-[10px]"
              >
                <span>View in Live Inbox</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setHandoffAlert(null)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Surface View */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === "dashboard" && (
            <DashboardView
              currentUser={currentWorkspaceUser}
              contacts={contacts}
              messages={messages}
              metaConfig={metaConfig}
              onNavigateTab={handleTabChange}
            />
          )}

          {activeTab === "inbox" && (
            <LiveInbox
              contacts={contacts}
              messages={messages}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
              onSendMessage={handleSendMessage}
              onToggleBot={handleToggleBot}
              onAssignAgent={handleAssignAgent}
              onAddTag={handleAddTag}
              onAddNote={handleAddNote}
              currentUser={currentWorkspaceUser}
              catalogProducts={catalogs.flatMap((c) => c.items)}
              defaultCatalogId={catalogs.find((c) => c.catalogId)?.catalogId || "2080375866175781"}
              onNavigateToOrders={() => handleTabChange("orders")}
            />
          )}

          {activeTab === "orders" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
              <OrdersManager
                orders={orders}
                contacts={contacts}
                clientId={currentClientId}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onSendWhatsAppMessage={handleSendOrderWhatsAppMessage}
                onNavigateToChat={handleNavigateToChat}
              />
            </div>
          )}

          {activeTab === "catalog" && (
            <CatalogManager
              catalogs={catalogs}
              clientId={currentClientId}
              businessName={activeClientObj.businessName || "WAPPX Commerce"}
              orders={orders}
              contacts={contacts}
              onSaveCatalog={handleSaveCatalog}
              onDeleteCatalog={handleDeleteCatalog}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onSendWhatsAppMessage={handleSendOrderWhatsAppMessage}
              onNavigateToChat={handleNavigateToChat}
              onSelectForChat={() => {
                handleTabChange("inbox");
              }}
            />
          )}

          {activeTab === "campaigns" && (
            <CampaignManager
              contacts={contacts}
              onSendMessage={handleSendMessage}
            />
          )}

          {activeTab === "templates" && (
            <TemplateManager metaConfig={metaConfig} />
          )}

          {activeTab === "integrations" && (
            <IntegrationsHub metaConfig={metaConfig} />
          )}

          {activeTab === "builder" && (
            builderSubView === "list" ? (
              <FlowListView
                flows={flows}
                currentFlowId={currentFlowId}
                onSelectFlow={handleSelectFlow}
                onOpenCanvas={(flowId) => {
                  handleSelectFlow(flowId);
                  setBuilderSubView("canvas");
                }}
                onCreateFlow={handleCreateFlow}
                onDeleteFlow={handleDeleteFlow}
                onDuplicateFlow={handleDuplicateFlow}
                onToggleFlowActive={handleToggleFlowActive}
                onOpenSimulator={() => handleTabChange("simulator")}
              />
            ) : (
              <FlowBuilder
                key={`flow-${currentFlowId || "default"}-${currentClientId}-${isFlowsLoaded}`}
                nodes={flowNodes}
                flows={flows}
                catalogs={catalogs}
                currentFlowId={currentFlowId}
                onSelectFlow={handleSelectFlow}
                onCreateFlow={handleCreateFlow}
                onDeleteFlow={handleDeleteFlow}
                onDuplicateFlow={handleDuplicateFlow}
                onToggleFlowActive={handleToggleFlowActive}
                onUpdateNodes={handleUpdateFlowNodes}
                onOpenSimulator={() => handleTabChange("simulator")}
                onBackToList={() => setBuilderSubView("list")}
              />
            )
          )}

          {activeTab === "simulator" && (
            <WhatsAppSimulator
              nodes={
                flows.filter((f) => f.isActive).length > 0
                  ? flows.filter((f) => f.isActive).flatMap((f) => f.nodes)
                  : flowNodes
              }
              onHandoffAlert={handleSimulatorHandoffAlert}
            />
          )}

          {activeTab === "contacts" && (
            <ContactsView
              contacts={contacts}
              onSelectContactForChat={(id) => {
                setSelectedContactId(id);
                handleTabChange("inbox");
              }}
              onAddContact={handleAddContact}
            />
          )}

          {activeTab === "settings" && (
            <MetaSettings
              config={metaConfig}
              clientId={currentClientId}
              onUpdateConfig={handleUpdateMetaConfig}
            />
          )}

          {activeTab === "support" && (
            <SupportTicketsView
              currentUser={currentWorkspaceUser}
              clientId={currentClientId}
            />
          )}
        </main>
      </div>

      {/* Bilingual Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        webhookUrl={metaConfig.webhookUrl}
        verifyToken={activeClientObj.verifyToken || metaConfig.verifyToken}
      />

      {/* Client Workspace Switcher Modal (Only if Admin is inspecting) */}
      {isOwner && (
        <UserSwitchModal
          isOpen={isUserSwitchOpen}
          onClose={() => setIsUserSwitchOpen(false)}
          currentUser={currentWorkspaceUser}
          allUsers={allWorkspaces}
          onSelectUser={(u) => {
            setCurrentClientId(u.id);
            router.push(`/app?client=${u.id}`);
            setIsUserSwitchOpen(false);
          }}
          onCreateUser={async ({ name, email }) => {
            const created = await createClientAccount({
              name,
              businessName: name,
              email,
            });
            if (created) {
              setClients((prev) => [created, ...prev]);
              setCurrentClientId(created.id);
              router.push(`/app?client=${created.id}`);
            }
            setIsUserSwitchOpen(false);
          }}
        />
      )}
    </div>
  );
}

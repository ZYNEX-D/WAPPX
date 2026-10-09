import { CatalogOrder, Contact, FlowNode, Message } from "@/types/whatsapp";

export interface BotProcessResult {
  replyMessage: Message;
  additionalMessages?: Message[];
  updatedContact: Contact;
  handoffTriggered: boolean;
}

export function processBotInteraction({
  incomingText,
  buttonId,
  contact,
  nodes,
  order,
}: {
  incomingText: string;
  buttonId?: string;
  contact: Contact;
  nodes: FlowNode[];
  order?: CatalogOrder;
}): BotProcessResult | null {
  const cleanText = incomingText.trim().toLowerCase();

  // If contact has bot turned off (e.g. human handoff active), bot does not auto-reply UNLESS:
  // 1. The customer sent a catalog order
  // 2. The customer clicked an interactive button
  // 3. The customer typed a bot restart keyword
  if (!contact.isBotActive && contact.status === "pending_human") {
    const isResetWord = ["hi", "hello", "start", "menu", "restart"].includes(cleanText);
    if (!order && !buttonId && !isResetWord) {
      return null;
    }
  }

  // 0. Dedicated WhatsApp Catalog Order Placed Event
  if (order) {
    // 1. First priority: Dedicated Order Trigger node (from dedicated flows like "Order Recieved")
    const explicitOrderTrigger = nodes.find(
      (n) =>
        n.type === "trigger" &&
        (n.triggerType === "order_placed" ||
          (n as any).data?.triggerType === "order_placed" ||
          n.triggerKeywords?.some((k) =>
            ["order_placed", "catalog_order"].includes(k.trim().toLowerCase())
          ))
    );

    const explicitNextId = explicitOrderTrigger?.nextNodeId || (explicitOrderTrigger as any)?.data?.nextNodeId;
    if (explicitOrderTrigger && explicitNextId) {
      const nextNode = nodes.find((n) => n.id === explicitNextId);
      if (nextNode) {
        return createReplyFromNode(nextNode, contact, order, nodes);
      }
    }

    // 2. Second priority: If the contact was in an active flow (e.g. at a catalog step), check if that node has a next step
    if (contact.currentFlowNodeId) {
      const currentNode = nodes.find((n) => n.id === contact.currentFlowNodeId);
      if (currentNode) {
        const nextFromCurrent = currentNode.nextNodeId || (currentNode as any)?.data?.nextNodeId;
        if (nextFromCurrent) {
          const nextNode = nodes.find((n) => n.id === nextFromCurrent);
          if (nextNode) {
            return createReplyFromNode(nextNode, contact, order, nodes);
          }
        }
      }
    }

    // 3. Fallback: High-converting order confirmation with interactive action buttons
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const itemsSummary = order.items
      .map((it) => `• ${it.quantity}x ${it.name} (${order.currency} ${it.unitPrice.toLocaleString()})`)
      .join("\n");
    const noteText = order.customerNote ? `\n📝 *Customer Note:* "${order.customerNote}"` : "";

    const orderAckText =
      `✅ *Order Received!*\n\n` +
      `Thank you for your order *#${order.id}*!\n\n` +
      `${itemsSummary}\n\n` +
      `💰 *Total:* *${order.currency} ${order.subtotal.toLocaleString()}*${noteText}\n\n` +
      `Our fulfillment team is reviewing your order right now. Tap below for status or live agent support:`;

    return {
      replyMessage: {
        id: `m-bot-ack-${Date.now()}`,
        sender: "bot",
        senderName: "Automated Bot",
        text: orderAckText,
        timestamp: timeStr,
        status: "delivered",
        buttons: [
          { id: "btn_order_status", title: "📦 Order Status" },
          { id: "btn_contact_agent", title: "💬 Talk to Agent" },
        ],
      },
      updatedContact: {
        ...contact,
        lastMessageSnippet: `🛍️ Order #${order.id} (${order.currency} ${order.subtotal.toLocaleString()})`,
        lastMessageTime: timeStr,
      },
      handoffTriggered: false,
    };
  }

  // 1. Check if interactive button was clicked
  if (buttonId) {
    if (buttonId === "btn_order_status") {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      return {
        replyMessage: {
          id: `m-bot-${Date.now()}`,
          sender: "bot",
          senderName: "Automated Bot",
          text: `📦 *Order Update*\n\nYour order is currently being processed by our packaging team. You will receive real-time courier tracking information as soon as it is dispatched! 🚚`,
          timestamp: timeStr,
          status: "delivered",
        },
        updatedContact: {
          ...contact,
          lastMessageSnippet: "Checked order status",
          lastMessageTime: timeStr,
        },
        handoffTriggered: false,
      };
    }

    if (buttonId === "btn_contact_agent") {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      return {
        replyMessage: {
          id: `m-bot-${Date.now()}`,
          sender: "bot",
          senderName: "Automated Bot",
          text: `💬 A customer support specialist has been notified and will assist you shortly. Please feel free to send any order questions or delivery instructions!`,
          timestamp: timeStr,
          status: "delivered",
        },
        updatedContact: {
          ...contact,
          status: "pending_human",
          isBotActive: false,
          lastMessageSnippet: "Requested agent assistance",
          lastMessageTime: timeStr,
        },
        handoffTriggered: true,
      };
    }
    // Find node that defined this button
    for (const node of nodes) {
      const matchedBtn = node.buttons?.find((b) => b.id === buttonId);
      const nextId = matchedBtn?.nextNodeId || (matchedBtn as any)?.data?.nextNodeId;
      if (matchedBtn && nextId) {
        const nextNode = nodes.find((n) => n.id === nextId);
        if (nextNode) {
          return createReplyFromNode(nextNode, contact, undefined, nodes);
        }
      }
    }
  }

  // 1b. Check direct catalog trigger or button
  if (cleanText === "catalog" || cleanText === "shop" || buttonId === "btn-catalog") {
    const catalogNode = nodes.find((n) => n.type === "catalog");
    if (catalogNode) {
      return createReplyFromNode(catalogNode, contact, undefined, nodes);
    }
  }

  // 2. Check keyword triggers across all trigger nodes (supporting multiple active flows)
  const triggerNodes = nodes.filter((n) => n.type === "trigger");
  for (const tNode of triggerNodes) {
    if (tNode.triggerKeywords && Array.isArray(tNode.triggerKeywords)) {
      const isMatched = tNode.triggerKeywords.some((kw) => {
        const trimmed = kw.trim().toLowerCase();
        return trimmed.length > 0 && (cleanText === trimmed || cleanText.includes(trimmed));
      });
      const nextId = tNode.nextNodeId || (tNode as any).data?.nextNodeId;
      if (isMatched && nextId) {
        const nextNode = nodes.find((n) => n.id === nextId);
        if (nextNode) {
          return createReplyFromNode(nextNode, contact, undefined, nodes);
        }
      }
    }
  }

  // 2b. Contextual Progression: Check if user is currently at a step in an active flow
  if (contact.currentFlowNodeId && cleanText.length > 0) {
    const currentNode = nodes.find((n) => n.id === contact.currentFlowNodeId);
    if (currentNode) {
      // Check if user's text matched any button in their current node
      if (currentNode.buttons && currentNode.buttons.length > 0) {
        const localBtn = currentNode.buttons.find(
          (b) => b.title.toLowerCase().includes(cleanText) || cleanText.includes(b.title.toLowerCase())
        );
        const nextId = localBtn?.nextNodeId || (localBtn as any)?.data?.nextNodeId;
        if (localBtn && nextId) {
          const nextNode = nodes.find((n) => n.id === nextId);
          if (nextNode) {
            return createReplyFromNode(nextNode, contact, order, nodes);
          }
        }
      }

      // If current node has a nextNodeId and expected customer reply (e.g. text question, instructions)
      const directNextId = currentNode.nextNodeId || (currentNode as any).data?.nextNodeId;
      if (directNextId) {
        const nextNode = nodes.find((n) => n.id === directNextId);
        if (nextNode) {
          return createReplyFromNode(nextNode, contact, order, nodes);
        }
      }
    }
  }

  // 3. Fallback / direct navigation matching button text across all nodes
  if (cleanText.length > 0) {
    for (const node of nodes) {
      if (node.buttons) {
        const matchedByTitle = node.buttons.find(
          (b) => b.title.toLowerCase().includes(cleanText) || cleanText.includes(b.title.toLowerCase())
        );
        const nextId = matchedByTitle?.nextNodeId || (matchedByTitle as any)?.data?.nextNodeId;
        if (matchedByTitle && nextId) {
          const nextNode = nodes.find((n) => n.id === nextId);
          if (nextNode) {
            return createReplyFromNode(nextNode, contact, undefined, nodes);
          }
        }
      }
    }
  }

  // 4. Default intelligent fallback: Return welcome menu if no rule matches
  if (cleanText.length > 0) {
    const defaultMenuNode = nodes.find((n) => n.type === "buttons");
    if (defaultMenuNode) {
      return createReplyFromNode(defaultMenuNode, contact, undefined, nodes);
    }
  }

  return null;
}

function createReplyFromNode(
  startNode: FlowNode,
  contact: Contact,
  order?: CatalogOrder,
  nodes: FlowNode[] = []
): BotProcessResult {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 1. Auto-advance through non-messaging action nodes (notify_team, delay, sub_flow)
  let node = startNode;
  let curContact = { ...contact };
  let depth = 0;
  const internalNotes: Message[] = [];

  while (depth < 6) {
    depth++;
    if (node.type === "notify_team") {
      const channel = node.notifyChannel || "WhatsApp";
      const target = node.notifyTarget || "Internal Team";
      const alertTitle = node.title || "Notification step triggered";
      const alertNote = `📢 [Team Alert via ${channel}] ${alertTitle} (${target})`;
      const existingTags = curContact.tags || [];
      const updatedTags = existingTags.includes("Team Alert") ? existingTags : [...existingTags, "Team Alert"];
      curContact = {
        ...curContact,
        notes: [alertNote, ...(curContact.notes || [])],
        assignedAgent: "Unassigned",
        status: "pending_human",
        tags: updatedTags,
      };

      internalNotes.push({
        id: `m-note-${Date.now()}-${depth}`,
        sender: "agent",
        senderName: `Team Alert (${target})`,
        text: alertNote,
        timestamp: timeStr,
        status: "delivered",
        isInternalNote: true,
      });

      const nextId = node.nextNodeId || (node as any).data?.nextNodeId;
      if (nextId) {
        const next = nodes.find((n) => n.id === nextId);
        if (next) {
          node = next;
          continue;
        }
      }
      break;
    } else if (node.type === "delay") {
      const nextId = node.nextNodeId || (node as any).data?.nextNodeId;
      if (nextId) {
        const next = nodes.find((n) => n.id === nextId);
        if (next) {
          node = next;
          continue;
        }
      }
      break;
    } else if (node.type === "sub_flow" && node.targetFlowId) {
      const subTargetNode = nodes.find(
        (n) => n.flowId === node.targetFlowId || n.id.includes(node.targetFlowId!)
      );
      if (subTargetNode) {
        node = subTargetNode;
        continue;
      }
      break;
    }
    break;
  }

  const isNotifyTeam = curContact.tags?.includes("Team Alert");
  const isHandoff = node.type === "human_handoff";
  const isEnd = node.type === "end_conversation";

  // Replace dynamic customer and order variables
  let processedText = node.content || "";
  if (node.type === "notify_team" && !processedText.trim()) {
    processedText = "📢 Your request has been forwarded to our team. An agent will connect with you shortly.";
  } else if (node.type === "human_handoff" && !processedText.trim()) {
    processedText = "👨‍💼 You are now being connected to an agent. Our team will assist you shortly!";
  } else if (!processedText.trim() && node.type !== "catalog") {
    processedText = "Thank you for reaching out! Let us know how we can assist you today.";
  }
  processedText = processedText
    .replace(/\{\{name\}\}/gi, curContact.name || "Customer")
    .replace(/\{\{phone\}\}/gi, curContact.phone || "")
    .replace(/\{\{company\}\}/gi, "WAPPX")
    .replace(/\{\{order_id\}\}/gi, order?.id || "")
    .replace(/\{\{order_total\}\}/gi, order ? `${order.currency} ${order.subtotal.toLocaleString()}` : "")
    .replace(/\{\{order_items\}\}/gi, order ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") : "")
    .replace(/\{\{order_currency\}\}/gi, order?.currency || "LKR")
    .replace(/\{\{customer_note\}\}/gi, order?.customerNote || "");

  if (node.type === "url_cta" && node.url) {
    processedText += `\n\n🔗 ${node.urlButtonText || "Visit Link"}: ${node.url}`;
  } else if (node.type === "location" && node.location) {
    processedText += `\n\n📍 ${node.location.name || "Our Location"}: ${node.location.address || "Google Maps Pin"} (https://maps.google.com/?q=${node.location.lat},${node.location.lng})`;
  }

  const replyMessage: Message = {
    id: `m-bot-${Date.now()}`,
    sender: "bot",
    senderName: "Automated Bot",
    text: processedText,
    timestamp: timeStr,
    status: "delivered",
    buttons: node.buttons?.map((b) => ({ id: b.id, title: b.title })),
    mediaUrl: node.mediaUrl,
    mediaType:
      node.type === "image"
        ? "image"
        : node.type === "audio"
        ? "audio"
        : node.type === "document"
        ? "document"
        : undefined,
    catalog:
      node.catalog ||
      (node.type === "catalog"
        ? {
            type: "catalog_message",
            catalogName: node.title || "WhatsApp Catalog",
            bodyText: node.content || "Explore our featured products and services directly within WhatsApp.",
            footerText: "Tap 'View Catalog' to open the store",
            catalogId: "meta_cat_default",
          }
        : undefined),
  };

  let additionalMessages: Message[] | undefined = internalNotes.length > 0 ? [...internalNotes] : undefined;
  let finalNodeId = node.id;

  // 2. Chained Next Step for Catalog and Media nodes (which do not have native text reply buttons)
  const nextNodeId = node.nextNodeId || (node as any).data?.nextNodeId;
  if ((node.type === "catalog" || node.type === "image" || node.type === "video" || node.type === "document") && nextNodeId) {
    const nextNode = nodes.find((n) => n.id === nextNodeId);
    if (nextNode) {
      // Build follow-up message
      let nextText = nextNode.content || "";
      nextText = nextText
        .replace(/\{\{name\}\}/gi, curContact.name || "Customer")
        .replace(/\{\{phone\}\}/gi, curContact.phone || "")
        .replace(/\{\{company\}\}/gi, "WAPPX");

      const followUpMsg: Message = {
        id: `m-bot-next-${Date.now() + 1}`,
        sender: "bot",
        senderName: "Automated Bot",
        text: nextText,
        timestamp: timeStr,
        status: "delivered",
        buttons: nextNode.buttons?.map((b) => ({ id: b.id, title: b.title })),
        catalog: nextNode.catalog,
        mediaUrl: nextNode.mediaUrl,
        mediaType:
          nextNode.type === "image"
            ? "image"
            : nextNode.type === "audio"
            ? "audio"
            : nextNode.type === "document"
            ? "document"
            : undefined,
      };

      if (additionalMessages) {
        additionalMessages.push(followUpMsg);
      } else {
        additionalMessages = [followUpMsg];
      }
      finalNodeId = nextNode.id;
    }
  }

  const updatedContact: Contact = {
    ...curContact,
    currentFlowNodeId: finalNodeId,
    lastMessageSnippet: (additionalMessages?.find((m) => !m.isInternalNote)?.text || processedText || "Interactive Flow Message").slice(0, 60),
    lastMessageTime: timeStr,
    status: isHandoff || isNotifyTeam ? "pending_human" : isEnd ? "resolved" : curContact.status,
    isBotActive: isHandoff || isEnd ? false : curContact.isBotActive,
    assignedAgent: isHandoff || isNotifyTeam ? "Unassigned" : curContact.assignedAgent,
  };

  return {
    replyMessage,
    additionalMessages,
    updatedContact,
    handoffTriggered: isHandoff || !!isNotifyTeam,
  };
}

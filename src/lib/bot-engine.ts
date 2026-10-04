import { Contact, FlowNode, Message } from "@/types/whatsapp";

export interface BotProcessResult {
  replyMessage: Message;
  updatedContact: Contact;
  handoffTriggered: boolean;
}

export function processBotInteraction({
  incomingText,
  buttonId,
  contact,
  nodes,
}: {
  incomingText: string;
  buttonId?: string;
  contact: Contact;
  nodes: FlowNode[];
}): BotProcessResult | null {
  // If contact has bot turned off (e.g. human handoff active), bot does not auto-reply
  if (!contact.isBotActive && contact.status === "pending_human") {
    return null;
  }

  const cleanText = incomingText.trim().toLowerCase();

  // 1. Check if button was clicked
  if (buttonId) {
    // Find node that defined this button
    for (const node of nodes) {
      const matchedBtn = node.buttons?.find((b) => b.id === buttonId);
      if (matchedBtn && matchedBtn.nextNodeId) {
        const nextNode = nodes.find((n) => n.id === matchedBtn.nextNodeId);
        if (nextNode) {
          return createReplyFromNode(nextNode, contact);
        }
      }
    }
  }

  // 1b. Check direct catalog trigger or button
  if (cleanText.includes("catalog") || cleanText.includes("shop") || buttonId === "btn-catalog") {
    const catalogNode = nodes.find((n) => n.type === "catalog");
    if (catalogNode) {
      return createReplyFromNode(catalogNode, contact);
    }
    // Rich default catalog response
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return {
      replyMessage: {
        id: `m-bot-${Date.now()}`,
        sender: "bot",
        senderName: "Automated Bot",
        text: "🛍️ Here is our interactive WhatsApp Product Catalog! Tap below to browse all available packages and items.",
        timestamp: timeStr,
        status: "delivered",
        catalog: {
          type: "product",
          catalogName: "WAPPX Commerce Suite",
          bodyText: "Explore our verified WhatsApp Business automation packages, CRM tools, and API solutions.",
          footerText: "Official WhatsApp Commerce Store",
          products: [
            {
              id: "prod-growth",
              title: "Growth Commerce & CRM Suite",
              price: "$79.00 USD",
              description: "5,000 chats/mo, 5 agents, Shopify sync & Flow Builder.",
              imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
              retailerId: "ZYN-WPP-GROWTH",
            },
            {
              id: "prod-starter",
              title: "WhatsApp Automation Starter",
              price: "$29.00 USD",
              description: "1,000 chats/mo, 1 agent seat, interactive menus.",
              imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
              retailerId: "ZYN-WPP-STARTER",
            },
          ],
        },
      },
      updatedContact: {
        ...contact,
        lastMessageSnippet: "🛍️ Sent Interactive WhatsApp Catalog",
        lastMessageTime: timeStr,
      },
      handoffTriggered: false,
    };
  }

  // 2. Check keyword triggers
  const triggerNode = nodes.find((n) => n.type === "trigger");
  if (triggerNode?.triggerKeywords?.some((kw) => cleanText.includes(kw.toLowerCase()))) {
    if (triggerNode.nextNodeId) {
      const firstActiveNode = nodes.find((n) => n.id === triggerNode.nextNodeId);
      if (firstActiveNode) {
        return createReplyFromNode(firstActiveNode, contact);
      }
    }
  }

  // 3. Fallback / direct navigation matching button text
  for (const node of nodes) {
    if (node.buttons) {
      const matchedByTitle = node.buttons.find(
        (b) => b.title.toLowerCase().includes(cleanText) || cleanText.includes(b.title.toLowerCase())
      );
      if (matchedByTitle && matchedByTitle.nextNodeId) {
        const nextNode = nodes.find((n) => n.id === matchedByTitle.nextNodeId);
        if (nextNode) {
          return createReplyFromNode(nextNode, contact);
        }
      }
    }
  }

  // 4. Default intelligent fallback: Return welcome menu if no rule matches
  const defaultMenuNode = nodes.find((n) => n.type === "buttons");
  if (defaultMenuNode) {
    return createReplyFromNode(defaultMenuNode, contact);
  }

  return null;
}

function createReplyFromNode(node: FlowNode, contact: Contact): BotProcessResult {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const isHandoff = node.type === "human_handoff";
  const isEnd = node.type === "end_conversation";

  // Replace dynamic customer variables
  let processedText = node.content || "";
  processedText = processedText
    .replace(/\{\{name\}\}/gi, contact.name || "Customer")
    .replace(/\{\{phone\}\}/gi, contact.phone || "")
    .replace(/\{\{company\}\}/gi, "WAPPX");

  if (node.type === "url_cta" && node.url) {
    processedText += `\n\n🔗 ${node.urlButtonText || "Visit Link"}: ${node.url}`;
  } else if (node.type === "location" && node.location) {
    processedText += `\n\n📍 ${node.location.name || "Our Location"}: ${node.location.address || "Google Maps Pin"} (https://maps.google.com/?q=${node.location.lat},${node.location.lng})`;
  } else if (node.type === "delay" && node.delayDuration) {
    processedText = `⏳ [Automated delay of ${node.delayDuration}]: ${processedText}`;
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

  const updatedContact: Contact = {
    ...contact,
    currentFlowNodeId: node.id,
    lastMessageSnippet: processedText.slice(0, 60) + (processedText.length > 60 ? "..." : ""),
    lastMessageTime: timeStr,
    status: isHandoff ? "pending_human" : isEnd ? "resolved" : contact.status,
    isBotActive: isHandoff || isEnd ? false : contact.isBotActive,
    assignedAgent: isHandoff ? "Unassigned (Needs Agent)" : contact.assignedAgent,
  };

  return {
    replyMessage,
    updatedContact,
    handoffTriggered: isHandoff,
  };
}

import { Contact, FlowNode, Message, MetaConfig } from "@/types/whatsapp";

export const initialMetaConfig: MetaConfig = {
  phoneNumberId: "108923485719321",
  wabaId: "249018249081234",
  accessToken: "EAA...",
  verifyToken: "zynex_meta_webhook_secret_2026",
  webhookUrl: "https://api.yourdomain.com/api/webhook",
  isConnected: true,
};

export const initialFlowNodes: FlowNode[] = [
  {
    id: "node-1",
    type: "trigger",
    title: "1. Inbound Welcome Trigger",
    content: "Activates when user starts a chat or says hello.",
    triggerKeywords: ["hi", "hello", "menu", "start", "help", "hey"],
    nextNodeId: "node-2",
    position: { x: 50, y: 100 },
  },
  {
    id: "node-2",
    type: "buttons",
    title: "2. Main Interactive Menu",
    content: "👋 Ayubowan! Welcome to our automated WhatsApp assistant. How can we support your business today?",
    buttons: [
      { id: "btn-pricing", title: "💼 Packages & Pricing", nextNodeId: "node-3" },
      { id: "btn-order", title: "📦 Track Order", nextNodeId: "node-4" },
      { id: "btn-agent", title: "👤 Talk to Agent", nextNodeId: "node-5" },
    ],
    position: { x: 380, y: 100 },
  },
  {
    id: "node-3",
    type: "buttons",
    title: "3. Packages & Pricing Details",
    content: "🚀 Here are our WhatsApp Automation Plans:\n\n• Starter: $29/mo (1,000 chats, 1 agent)\n• Growth: $79/mo (5,000 chats, 5 agents)\n• Scale: $199/mo (Unlimited flows & AI agent)\n\nWhich option interests you?",
    buttons: [
      { id: "btn-demo", title: "📅 Request Demo", nextNodeId: "node-6" },
      { id: "btn-back", title: "🔙 Back to Menu", nextNodeId: "node-2" },
    ],
    position: { x: 740, y: 20 },
  },
  {
    id: "node-4",
    type: "buttons",
    title: "4. Order Tracking Prompt",
    content: "🔍 Please send your Order Number (e.g. #ORD-8492) and our system will instantly look up the dispatch status for you.",
    buttons: [
      { id: "btn-back-order", title: "🔙 Back to Menu", nextNodeId: "node-2" },
    ],
    position: { x: 740, y: 240 },
  },
  {
    id: "node-5",
    type: "human_handoff",
    title: "5. Human Agent Handoff",
    content: "Connecting you with an available customer care specialist. Please hold on for a moment while our team joins this chat.",
    position: { x: 740, y: 460 },
  },
  {
    id: "node-6",
    type: "buttons",
    title: "6. Demo Confirmation",
    content: "🎉 Great! Our solution architect will call you or message back within 15 minutes to configure your customized demo.",
    buttons: [
      { id: "btn-done", title: "🔙 Back to Menu", nextNodeId: "node-2" },
    ],
    position: { x: 1100, y: 20 },
  },
];

export const initialContacts: Contact[] = [];

export const initialMessages: Record<string, Message[]> = {};

export const initialCatalogOrders = [
  {
    id: "ORD-8291",
    userId: "client-1",
    contactId: "c-1",
    contactName: "Kasun Perera",
    contactPhone: "+94771234567",
    catalogName: "Main Store Catalog",
    items: [
      {
        productId: "prod-1",
        name: "Men's Casual Cotton Shirt",
        quantity: 1,
        unitPrice: 3800,
        currency: "LKR",
      },
      {
        productId: "prod-2",
        name: "Classic Brown Leather Belt",
        quantity: 1,
        unitPrice: 2700,
        currency: "LKR",
      },
    ],
    subtotal: 6500,
    currency: "LKR",
    customerNote: "Please deliver after 4:00 PM to Colombo 04",
    status: "pending" as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "ORD-8274",
    userId: "client-1",
    contactId: "c-2",
    contactName: "Nimali Silva",
    contactPhone: "+94719876543",
    catalogName: "Main Store Catalog",
    items: [
      {
        productId: "prod-3",
        name: "Women's Summer Floral Dress",
        quantity: 1,
        unitPrice: 4800,
        currency: "LKR",
      },
    ],
    subtotal: 4800,
    currency: "LKR",
    customerNote: "Express delivery to Peradeniya Road, Kandy",
    status: "confirmed" as const,
    trackingNumber: "DOM-918231",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

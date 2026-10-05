"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FlowNode } from "@/types/whatsapp";
import {
  Sparkles,
  Copy,
  Check,
  Code2,
  AlertCircle,
  CheckCircle2,
  Zap,
  ArrowRight,
  X,
  Bot,
  Layers,
  Wand2,
  FileCode,
  Terminal,
  HelpCircle,
  ChevronRight,
  Store,
  Calendar,
  Utensils,
  Building2,
  Briefcase,
  Headphones,
  Download,
} from "lucide-react";

interface AiFlowGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFlow: (
    flowName: string,
    nodes: FlowNode[],
    mode: "replace" | "append" | "new_flow"
  ) => void;
  currentFlowCount: number;
  initialTab?: "instruction" | "import" | "export";
  currentFlowName?: string;
  currentNodes?: FlowNode[];
}

const AI_MASTER_PROMPT = `You are an expert WhatsApp Flow Architect for the WAPPX WhatsApp Business Platform.
Your job is to generate a fully functional, interactive WhatsApp bot flow in strict JSON format based on the user's business requirements.

### OUTPUT FORMAT REQUIREMENTS
1. You must respond ONLY with a valid JSON object wrapped in a \`\`\`json ... \`\`\` codeblock.
2. Do not include any conversational filler, explanations, or text outside the JSON codeblock.
3. Every node in the "nodes" array must have a unique "id" (e.g. "node-trigger", "node-menu", "node-order-track").
4. The first node must ALWAYS be of type "trigger" with appropriate "triggerKeywords".
5. Every "nextNodeId" on a node, button, or list item MUST reference an existing node "id" in the flow.

### TOP-LEVEL JSON SCHEMA
{
  "flowName": "Name of the Flow (e.g. Customer Support & Orders)",
  "description": "Short 1-sentence description of the flow",
  "triggerKeywords": ["hi", "hello", "menu", "start", "help"],
  "nodes": [ ... ]
}

### SUPPORTED NODE TYPES & SPECIFICATIONS
1. "trigger" (Flow Starter)
   - fields: id, type ("trigger"), title, content, triggerKeywords: string[], contactType ("any_contact" | "new_contact" | "existing_contact"), nextNodeId: string

2. "message" (Text Message)
   - fields: id, type ("message"), title, content (WhatsApp text message), nextNodeId: string (optional)

3. "buttons" (Interactive Quick Reply Buttons - Max 3 buttons per WhatsApp API limits)
   - fields: id, type ("buttons"), title, content (Header/body prompt message),
     buttons: [
       { "id": "btn-1", "title": "Button Title (max 20 chars)", "nextNodeId": "target-node-id" },
       { "id": "btn-2", "title": "Button Title", "nextNodeId": "target-node-id" }
     ]

4. "list" (Interactive Menu List - Up to 10 items)
   - fields: id, type ("list"), title, content (Body prompt message),
     listItems: [
       { "id": "item-1", "title": "Item Title", "description": "Optional subtitle", "nextNodeId": "target-node-id" },
       { "id": "item-2", "title": "Item Title", "description": "Optional subtitle", "nextNodeId": "target-node-id" }
     ]

5. "image" / "video" / "document" / "audio" (Media Messages)
   - fields: id, type ("image"|"video"|"document"|"audio"), title, content, mediaUrl: string, caption: string, nextNodeId: string (optional)

6. "delay" (Typing delay simulator)
   - fields: id, type ("delay"), title, delayDuration: "3 seconds" | "5 seconds" | "10 seconds", nextNodeId: string

7. "url_cta" (Call to Action Link)
   - fields: id, type ("url_cta"), title, content, url: string (e.g. "https://zynexdev.com"), urlButtonText: string, nextNodeId: string (optional)

8. "location" (Business GPS Location)
   - fields: id, type ("location"), title, content, location: { name: string, address: string, lat: number, lng: number }

9. "catalog" (WhatsApp Interactive Product Catalog / Meta Commerce Store)
   - fields:
     - id: string (e.g. "node-catalog-1")
     - type: "catalog"
     - title: string (e.g. "Official Store Catalog" or "Food & Drinks Menu")
     - content: string (Header message sent to customer on WhatsApp)
     - catalog: {
         "type": "catalog_message" | "product_list" | "product" | "pdf",
         "catalogName": string (e.g. "WAPPX Fashion Store"),
         "bodyText": string (Body text describing items or delivery terms),
         "footerText": string (Optional, e.g. "Tap to view items & checkout"),
         "products": [
           {
             "id": "prod-1",
             "name": "Product Name",
             "price": 2500,
             "currency": "LKR",
             "description": "Short item description",
             "category": "Clothing"
           }
         ]
       }
     - nextNodeId: string (optional: pathway after customer views catalog, e.g. order confirmation or back to menu)

10. "notify_team" (Internal Notification)
    - fields: id, type ("notify_team"), title, notifyChannel: "whatsapp" | "email", notifyTarget: string, nextNodeId: string (optional)

11. "human_handoff" (Agent Transfer)
    - fields: id, type ("human_handoff"), title, content (e.g. "Connecting you to an agent...")

### SPECIAL INSTRUCTIONS FOR E-COMMERCE & CATALOG FLOWS:
- When the user asks for shopping, buying, browsing collections, food menus, product prices, or store inventory:
  1. Add trigger keywords such as "shop", "catalog", "order", "price", "products", "buy" to the trigger node.
  2. In the main menu (buttons or list), create an option like "🛍️ Browse Catalog", "📦 View Products", or "🍕 View Menu".
  3. Route that button's "nextNodeId" directly to a "catalog" node.
  4. In the "catalog" node, provide engaging catalog details and list 2-4 representative sample products with realistic prices (e.g. currency: "LKR" or "USD").
  5. Follow the catalog node with options to "Order via Agent / Checkout" or "Back to Menu".

### CRITICAL RULES
- Ensure all button and list item nextNodeIds point to valid node IDs.
- Ensure terminal nodes (e.g. human_handoff or confirmation messages) loop back to the main menu with a "Back to Menu" button, or end gracefully.
- Write friendly, persuasive, and professional WhatsApp copy with clean formatting (bullet points and emojis).

Now, await the user's business description and generate the JSON flow.`;

const PROMPT_TEMPLATES = [
  {
    id: "ecommerce",
    title: "E-Commerce & Orders",
    icon: Store,
    badge: "Popular",
    description: "Product catalog browsing, order tracking lookup, refund policy, and customer care agent handoff.",
    userPrompt: "Create a complete WhatsApp automation flow for an online fashion & apparel store with an integrated WhatsApp Product Catalog. Triggers: 'shop', 'order', 'catalog', 'buy'. Main menu with buttons: 1) 🛍️ Browse Catalog, 2) 🚚 Track Order, 3) 💬 Talk to Agent. When they select 'Browse Catalog', link to a 'catalog' node with 3-4 sample products (Shirts, Dresses, Accessories) with realistic LKR prices. After the catalog, add buttons for 'Confirm Order with Agent' or 'Back to Menu'.",
  },
  {
    id: "restaurant",
    title: "Restaurant & Food Ordering",
    icon: Utensils,
    badge: "F&B",
    description: "Dine-in table booking, digital menu, take-away orders, and restaurant location pin.",
    userPrompt: "Create a WhatsApp flow for an Italian Restaurant. It needs a welcome trigger ('hi', 'menu', 'order', 'book table'). Main menu buttons: 1) View Menu & Order, 2) Book a Table, 3) Location & Hours. Table booking should ask for date and guest count. Location should return the GPS coordinates. End with customer confirmation.",
  },
  {
    id: "healthcare",
    title: "Clinic & Appointments",
    icon: Calendar,
    badge: "Medical",
    description: "Doctor consultation booking, clinic opening hours, emergency hotline, and team alert.",
    userPrompt: "Create a WhatsApp flow for a private Medical Clinic. Trigger keywords: 'appointment', 'doctor', 'clinic', 'emergency'. Main menu with buttons: 1) Book Doctor Consultation, 2) Clinic Timings & Location, 3) Emergency Services. Table consultation should list available specialties (General Physician, Dental, Cardiology). Notify the front desk team via notify_team upon booking.",
  },
  {
    id: "realestate",
    title: "Real Estate & Housing",
    icon: Building2,
    badge: "Property",
    description: "Property listings, schedule private viewing, mortgage calculator link, and agent call.",
    userPrompt: "Create a WhatsApp flow for a Luxury Real Estate Agency in Colombo. Welcome trigger for property inquiries. Menu: 1) Available Apartments, 2) Schedule Private Viewing, 3) Speak with Property Consultant. When viewing is selected, provide an appointment prompt. When consultant is selected, do a human handoff.",
  },
  {
    id: "support",
    title: "Customer Support & FAQ",
    icon: Headphones,
    badge: "Support",
    description: "24/7 automated FAQ, troubleshooting guides, escalation to human support specialist.",
    userPrompt: "Create a comprehensive 24/7 WhatsApp Customer Support flow. Triggers: 'help', 'support', 'issue', 'complaint'. Main menu: 1) Billing & Invoices, 2) Technical Troubleshooting, 3) Talk to Support Agent. Include a delay step to simulate typing, helpful troubleshooting steps, and a seamless human agent handoff.",
  },
  {
    id: "leadgen",
    title: "B2B Lead Qualification",
    icon: Briefcase,
    badge: "SaaS & B2B",
    description: "Qualify business leads, book SaaS demo, send PDF whitepaper/brochure, notify sales team.",
    userPrompt: "Create a B2B SaaS WhatsApp Flow for booking software demos. Triggers: 'demo', 'pricing', 'enterprise'. Main menu: 1) Book Live Demo, 2) View Pricing & Plans, 3) Download Brochure. When they book demo, capture lead info, notify sales team, and confirm the meeting.",
  },
];

export function AiFlowGeneratorModal({
  isOpen,
  onClose,
  onApplyFlow,
  currentFlowCount,
  initialTab,
  currentFlowName,
  currentNodes,
}: AiFlowGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<"instruction" | "import" | "export">(initialTab || "instruction");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);
  const [aiCodeInput, setAiCodeInput] = useState("");
  const [importMode, setImportMode] = useState<"replace" | "append" | "new_flow">("replace");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [includeMarkdownFences, setIncludeMarkdownFences] = useState(true);
  const [copiedExportCode, setCopiedExportCode] = useState(false);

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Formatted export code
  const formattedExportCode = useMemo(() => {
    const nodesToExport = currentNodes && currentNodes.length > 0 ? currentNodes : [];

    // Find trigger keywords from trigger node(s)
    const triggerNode = nodesToExport.find((n) => n.type === "trigger");
    const keywords = triggerNode?.triggerKeywords || ["hi", "hello", "menu"];

    // Clean nodes to conform strictly to AI format
    const cleanedNodes = nodesToExport.map((node) => {
      const obj: Record<string, any> = {
        id: node.id,
        type: node.type,
        title: node.title,
      };

      if (node.content) obj.content = node.content;
      if (node.triggerKeywords && node.triggerKeywords.length > 0) obj.triggerKeywords = node.triggerKeywords;
      if (node.contactType) obj.contactType = node.contactType;
      if (node.triggerType) obj.triggerType = node.triggerType;

      if (node.buttons && node.buttons.length > 0) {
        obj.buttons = node.buttons.map((b) => ({
          id: b.id,
          title: b.title,
          ...(b.nextNodeId ? { nextNodeId: b.nextNodeId } : {}),
        }));
      }

      if (node.listItems && node.listItems.length > 0) {
        obj.listItems = node.listItems.map((li) => ({
          id: li.id,
          title: li.title,
          ...(li.description ? { description: li.description } : {}),
          ...(li.nextNodeId ? { nextNodeId: li.nextNodeId } : {}),
        }));
      }

      if (node.mediaUrl) obj.mediaUrl = node.mediaUrl;
      if (node.caption) obj.caption = node.caption;
      if (node.delayDuration) obj.delayDuration = node.delayDuration;
      if (node.templateName) obj.templateName = node.templateName;
      if (node.url) obj.url = node.url;
      if (node.urlButtonText) obj.urlButtonText = node.urlButtonText;
      if (node.location) obj.location = node.location;
      if (node.notifyChannel) obj.notifyChannel = node.notifyChannel;
      if (node.notifyTarget) obj.notifyTarget = node.notifyTarget;
      if (node.targetFlowId) obj.targetFlowId = node.targetFlowId;
      if (node.catalog) obj.catalog = node.catalog;
      if (node.nextNodeId) obj.nextNodeId = node.nextNodeId;

      return obj;
    });

    const exportPayload = {
      flowName: currentFlowName || "WAPPX Bot Flow",
      description: "Interactive WhatsApp bot flow exported from WAPPX Flow Builder",
      triggerKeywords: keywords,
      nodes: cleanedNodes,
    };

    const rawJson = JSON.stringify(exportPayload, null, 2);
    if (includeMarkdownFences) {
      return "```json\n" + rawJson + "\n```";
    }
    return rawJson;
  }, [currentNodes, currentFlowName, includeMarkdownFences]);

  const handleCopyExportCode = async () => {
    try {
      await navigator.clipboard.writeText(formattedExportCode);
      setCopiedExportCode(true);
      setTimeout(() => setCopiedExportCode(false), 2500);
    } catch (e) {
      console.error("Failed to copy export code:", e);
    }
  };

  const handleDownloadExportJson = () => {
    const rawJson = formattedExportCode.replace(/^```json\n/, "").replace(/\n```$/, "");
    const blob = new Blob([rawJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${(currentFlowName || "flow").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePasteToImporter = () => {
    setAiCodeInput(formattedExportCode);
    setActiveTab("import");
  };

  const handleCopyPromptWithCode = async () => {
    const rawJson = formattedExportCode.replace(/^```json\n/, "").replace(/\n```$/, "");
    const fullText =
`You are an expert WhatsApp Flow Architect for WAPPX.
Here is my current WhatsApp bot flow code in JSON format:

\`\`\`json
${rawJson}
\`\`\`

### MY MODIFICATION INSTRUCTION:
[Please explain what you want to add or change in this flow, e.g. "Add a team notification step", "Add another option button", "Add a catalog showcase"]

Please respond ONLY with the updated JSON code wrapped in a \`\`\`json ... \`\`\` block according to the WAPPX Flow schema.`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedExportCode(true);
      setTimeout(() => setCopiedExportCode(false), 2500);
    } catch {}
  };

  // Copy master prompt
  const handleCopyMasterPrompt = async (customAddition?: string) => {
    let textToCopy = AI_MASTER_PROMPT;
    if (customAddition) {
      textToCopy += `\n\n### USER SPECIFIC BUSINESS REQUIREMENT:\n${customAddition}\n\nPlease generate the JSON flow now.`;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // fallback
    }
  };

  // Copy template prompt
  const handleCopyTemplatePrompt = async (template: typeof PROMPT_TEMPLATES[0]) => {
    await handleCopyMasterPrompt(template.userPrompt);
    setCopiedTemplateId(template.id);
    setTimeout(() => setCopiedTemplateId(null), 2500);
  };

  // Parse and validate pasted AI code
  const parsedAnalysis = useMemo(() => {
    if (!aiCodeInput.trim()) {
      return null;
    }

    try {
      let cleaned = aiCodeInput.trim();
      // Remove markdown code fences if present (```json ... ``` or ``` ...)
      if (cleaned.startsWith("```")) {
        const lines = cleaned.split("\n");
        // Remove first line if it starts with ```
        if (lines[0].startsWith("```")) lines.shift();
        // Remove last line if it ends with ```
        if (lines.length > 0 && lines[lines.length - 1].trim().endsWith("```")) {
          lines.pop();
        }
        cleaned = lines.join("\n").trim();
      }

      const parsed = JSON.parse(cleaned);

      let nodes: FlowNode[] = [];
      let flowName = "AI Generated Flow";
      let description = "";
      let triggerKeywords: string[] = [];

      if (Array.isArray(parsed)) {
        nodes = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.nodes)) {
          nodes = parsed.nodes;
        }
        if (typeof parsed.flowName === "string") flowName = parsed.flowName;
        if (typeof parsed.description === "string") description = parsed.description;
        if (Array.isArray(parsed.triggerKeywords)) triggerKeywords = parsed.triggerKeywords;
      }

      if (nodes.length === 0) {
        return {
          valid: false,
          error: "No nodes found in the JSON. Expected an array of nodes or an object with a 'nodes' property.",
        };
      }

      // Check node IDs and references
      const nodeIds = new Set(nodes.map((n) => n.id));
      const warnings: string[] = [];
      let triggerCount = 0;
      let buttonCount = 0;
      let listCount = 0;
      let catalogCount = 0;
      let edgeCount = 0;

      nodes.forEach((node, idx) => {
        if (!node.id) {
          node.id = `node-${Date.now()}-${idx}`;
          nodeIds.add(node.id);
        }
        if (node.type === "trigger") {
          triggerCount++;
        }
        if (node.type === "catalog") {
          catalogCount++;
        }
        if (node.type === "buttons" || (node.buttons && node.buttons.length > 0)) {
          buttonCount += node.buttons?.length || 0;
          node.buttons?.forEach((b) => {
            if (b.nextNodeId) {
              edgeCount++;
              if (!nodeIds.has(b.nextNodeId)) {
                warnings.push(`Button "${b.title}" connects to unknown node ID: "${b.nextNodeId}"`);
              }
            }
          });
        }
        if (node.type === "list" || (node.listItems && node.listItems.length > 0)) {
          listCount += node.listItems?.length || 0;
          node.listItems?.forEach((li) => {
            if (li.nextNodeId) {
              edgeCount++;
              if (!nodeIds.has(li.nextNodeId)) {
                warnings.push(`List item "${li.title}" connects to unknown node ID: "${li.nextNodeId}"`);
              }
            }
          });
        }
        if (node.nextNodeId) {
          edgeCount++;
          if (!nodeIds.has(node.nextNodeId)) {
            warnings.push(`Node "${node.title || node.id}" connects to unknown node ID: "${node.nextNodeId}"`);
          }
        }
      });

      if (triggerCount === 0) {
        warnings.unshift("Flow does not contain a 'trigger' node. The first node will be used as the entry point.");
      }

      return {
        valid: true,
        flowName,
        description,
        triggerKeywords,
        nodes,
        triggerCount,
        buttonCount,
        listCount,
        catalogCount,
        edgeCount,
        warnings,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `JSON syntax error: ${err.message || "Invalid JSON"}`,
      };
    }
  }, [aiCodeInput]);

  // Layout Engine: Positions nodes cleanly horizontally and vertically
  const layoutNodes = (rawNodes: FlowNode[]): FlowNode[] => {
    // If nodes already have distinct non-zero coordinates, preserve them
    const hasCoordinates = rawNodes.every(
      (n) => n.position && typeof n.position.x === "number" && (n.position.x !== 0 || n.position.y !== 0)
    );
    if (hasCoordinates) {
      return rawNodes;
    }

    // Build directed adjacency graph
    const childrenMap = new Map<string, string[]>();
    const parentsMap = new Map<string, string[]>();
    rawNodes.forEach((n) => {
      childrenMap.set(n.id, []);
      parentsMap.set(n.id, []);
    });

    rawNodes.forEach((n) => {
      const nextIds: string[] = [];
      if (n.nextNodeId) nextIds.push(n.nextNodeId);
      if (n.buttons) {
        n.buttons.forEach((b) => {
          if (b.nextNodeId) nextIds.push(b.nextNodeId);
        });
      }
      if (n.listItems) {
        n.listItems.forEach((li) => {
          if (li.nextNodeId) nextIds.push(li.nextNodeId);
        });
      }
      childrenMap.set(n.id, nextIds);
      nextIds.forEach((cId) => {
        const pList = parentsMap.get(cId) || [];
        pList.push(n.id);
        parentsMap.set(cId, pList);
      });
    });

    // Find root nodes (trigger or nodes with 0 parents)
    const roots = rawNodes.filter((n) => {
      const parents = parentsMap.get(n.id) || [];
      return n.type === "trigger" || parents.length === 0;
    });

    const orderedRoots = roots.length > 0 ? roots : [rawNodes[0]];
    const visited = new Set<string>();
    const nodePositions = new Map<string, { x: number; y: number }>();

    // BFS or DFS level calculation
    let currentX = 80;
    let maxOverallY = 120;

    orderedRoots.forEach((rootNode, rootIdx) => {
      if (visited.has(rootNode.id)) return;

      const queue: { id: string; level: number }[] = [{ id: rootNode.id, level: 0 }];
      visited.add(rootNode.id);

      const levelNodes = new Map<number, string[]>();

      while (queue.length > 0) {
        const item = queue.shift()!;
        const list = levelNodes.get(item.level) || [];
        list.push(item.id);
        levelNodes.set(item.level, list);

        const children = childrenMap.get(item.id) || [];
        children.forEach((cId) => {
          if (!visited.has(cId)) {
            visited.add(cId);
            queue.push({ id: cId, level: item.level + 1 });
          }
        });
      }

      // Assign coordinates per level
      const rootBaseY = rootIdx === 0 ? 120 : maxOverallY + 160;

      levelNodes.forEach((nIds, level) => {
        const levelX = currentX + level * 380;
        const totalHeight = nIds.length * 240;
        const startY = Math.max(rootBaseY, rootBaseY + (240 - totalHeight) / 2);

        nIds.forEach((nid, i) => {
          const nodeY = startY + i * 250;
          nodePositions.set(nid, { x: levelX, y: nodeY });
          if (nodeY > maxOverallY) maxOverallY = nodeY;
        });
      });
    });

    // Unvisited nodes fallback layout
    let unvisitedIndex = 0;
    rawNodes.forEach((n) => {
      if (!nodePositions.has(n.id)) {
        nodePositions.set(n.id, {
          x: 100 + (unvisitedIndex % 3) * 360,
          y: maxOverallY + 200 + Math.floor(unvisitedIndex / 3) * 260,
        });
        unvisitedIndex++;
      }
    });

    return rawNodes.map((n) => ({
      ...n,
      position: nodePositions.get(n.id) || { x: 100, y: 100 },
    }));
  };

  // Generate / Apply flow
  const handleApply = () => {
    if (!parsedAnalysis || !parsedAnalysis.valid || !parsedAnalysis.nodes) return;

    const formattedNodes = layoutNodes(parsedAnalysis.nodes);
    onApplyFlow(parsedAnalysis.flowName, formattedNodes, importMode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs font-secondary animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#0A504A] to-[#0A504A]/95 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#A2E4B8] border border-white/10 shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AI Flow Architect & Generator
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#00A86B]/40 text-[#A2E4B8] border border-[#00A86B]/60">
                  GPT-4 / Claude / Gemini
                </span>
              </div>
              <p className="text-xs text-white/70">
                Copy our system instruction to any AI agent, describe your flow, and paste the code back to generate canvas nodes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-[#F7F7F2] px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("instruction")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
              activeTab === "instruction"
                ? "bg-white text-[#0A504A] border-slate-200 shadow-xs -mb-[1px]"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <Code2 className="w-4 h-4 text-[#00A86B]" />
            <span>1. Copy AI System Instruction</span>
            <span className="w-2 h-2 rounded-full bg-[#00A86B]" />
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
              activeTab === "import"
                ? "bg-white text-[#0A504A] border-slate-200 shadow-xs -mb-[1px]"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <Wand2 className="w-4 h-4 text-[#00A86B]" />
            <span>2. Paste AI Code & Generate Flow</span>
            {parsedAnalysis?.valid && (
              <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl flex items-center gap-2 transition-all cursor-pointer border-t border-x ${
              activeTab === "export"
                ? "bg-white text-[#0A504A] border-slate-200 shadow-xs -mb-[1px]"
                : "bg-transparent text-slate-500 border-transparent hover:text-slate-800"
            }`}
          >
            <FileCode className="w-4 h-4 text-[#00A86B]" />
            <span>3. Export Flow Code (AI Format)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {currentNodes?.length || 0} steps
            </span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: AI INSTRUCTION & PROMPTS                                           */}
          {/* ========================================================================= */}
          {activeTab === "instruction" && (
            <div className="space-y-6">
              {/* Step by step guide banner */}
              <div className="p-4 rounded-xl bg-[#00A86B]/5 border border-[#00A86B]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00A86B]/15 text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    TIP
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-[#0A504A]">How this works:</p>
                    <p>
                      <strong>1.</strong> Click <strong>&quot;Copy Complete AI Prompt&quot;</strong> below. &bull;{" "}
                      <strong>2.</strong> Open <strong>ChatGPT, Claude, or Gemini</strong> and paste it. &bull;{" "}
                      <strong>3.</strong> Tell the AI what kind of bot you need. &bull;{" "}
                      <strong>4.</strong> Bring the generated JSON code to Tab 2!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyMasterPrompt()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs ${
                    copiedPrompt
                      ? "bg-[#00A86B] text-white"
                      : "bg-[#0A504A] hover:bg-[#00A86B] text-white"
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Complete AI Prompt</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ready-to-use Business Scenario Templates */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Quick Business Templates (Pre-filled AI Prompts)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Click any card to copy instant prompt
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PROMPT_TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isCopied = copiedTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => handleCopyTemplatePrompt(tmpl)}
                        className="group relative p-3.5 rounded-xl border border-slate-200 hover:border-[#00A86B] bg-white hover:bg-[#00A86B]/5 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#0A504A]/10 text-[#0A504A] group-hover:bg-[#00A86B] group-hover:text-white flex items-center justify-center transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-slate-800">
                                {tmpl.title}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-[#00A86B]/20 group-hover:text-[#0A504A]">
                              {tmpl.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {tmpl.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#00A86B]">
                          <span>{isCopied ? "Prompt Copied! ✓" : "Copy Prompt for AI"}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Master AI Prompt Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#0A504A]" />
                    <span>Raw System Prompt Specification</span>
                  </span>
                  <button
                    onClick={() => handleCopyMasterPrompt()}
                    className="text-xs font-bold text-[#00A86B] hover:text-[#0A504A] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Raw Prompt</span>
                  </button>
                </div>
                <div className="relative rounded-xl border border-slate-200 bg-slate-900 text-slate-200 p-4 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{AI_MASTER_PROMPT}</pre>
                </div>
              </div>

              {/* Bottom Call to action */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Ready with your generated JSON code?
                </span>
                <button
                  onClick={() => setActiveTab("import")}
                  className="px-4 py-2 bg-[#0A504A] hover:bg-[#00A86B] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Go to Step 2: Paste Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: IMPORT AI CODE & GENERATE FLOW                                     */}
          {/* ========================================================================= */}
          {activeTab === "import" && (
            <div className="space-y-5">
              {/* Textarea for AI response */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-[#00A86B]" />
                    <span>Paste the AI Response Code (JSON or Markdown)</span>
                  </label>
                  {aiCodeInput && (
                    <button
                      onClick={() => setAiCodeInput("")}
                      className="text-xs text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    rows={9}
                    value={aiCodeInput}
                    onChange={(e) => setAiCodeInput(e.target.value)}
                    placeholder={`Paste here the JSON code block from ChatGPT / Claude / Gemini...\n\nExample:\n{\n  "flowName": "Customer Support Flow",\n  "triggerKeywords": ["hi", "hello", "support"],\n  "nodes": [\n    {\n      "id": "node-1",\n      "type": "trigger",\n      "title": "Welcome Trigger",\n      "triggerKeywords": ["hi", "hello"],\n      "nextNodeId": "node-2"\n    },\n    ...\n  ]\n}`}
                    className="w-full rounded-xl border border-slate-200 bg-[#F7F7F2]/50 p-4 font-mono text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] outline-hidden leading-relaxed shadow-inner"
                  />
                </div>
              </div>

              {/* LIVE VALIDATION & ANALYSIS SUMMARY */}
              {parsedAnalysis && (
                <div className="space-y-3">
                  {parsedAnalysis.valid ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-[#00A86B]" />
                        <span>Valid Flow Structure Detected!</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                          Ready to Generate
                        </span>
                      </div>

                      {/* Stat chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Flow Name
                          </span>
                          <span className="text-xs font-bold text-[#0A504A] truncate block">
                            {parsedAnalysis.flowName}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Total Nodes
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            {parsedAnalysis.nodes?.length} Steps
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Interactive Items
                          </span>
                          <span className="text-xs font-bold text-emerald-700 truncate block">
                            {parsedAnalysis.buttonCount} Btns / {parsedAnalysis.listCount} Lists
                            {(parsedAnalysis.catalogCount ?? 0) > 0 ? ` / ${parsedAnalysis.catalogCount} Cat` : ""}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Connections
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            {parsedAnalysis.edgeCount} Edges
                          </span>
                        </div>
                      </div>

                      {/* Warnings if any */}
                      {parsedAnalysis.warnings && parsedAnalysis.warnings.length > 0 && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-amber-900">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Note ({parsedAnalysis.warnings.length}):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                            {parsedAnalysis.warnings.slice(0, 3).map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                            {parsedAnalysis.warnings.length > 3 && (
                              <li>...and {parsedAnalysis.warnings.length - 3} more warnings</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-800 space-y-1">
                        <p className="font-bold">Invalid Code Format</p>
                        <p className="font-mono text-[11px] text-rose-700">{parsedAnalysis.error}</p>
                        <p className="text-[11px] text-rose-600 pt-1">
                          Tip: Ensure the AI provided a valid JSON object starting with &quot;&#123;&quot; and ending with &quot;&#125;&quot;.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GENERATION TARGET OPTIONS */}
              <div className="p-4 rounded-xl bg-[#F7F7F2] border border-slate-200">
                <span className="text-xs font-bold text-[#0A504A] block mb-2">
                  Apply Action:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    onClick={() => setImportMode("replace")}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      importMode === "replace"
                        ? "bg-white border-[#00A86B] shadow-xs text-[#0A504A]"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="text-[#00A86B] focus:ring-[#00A86B]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Replace Canvas</span>
                      <span className="text-[10px] text-slate-400 block">
                        Overrides current steps
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode("append")}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      importMode === "append"
                        ? "bg-white border-[#00A86B] shadow-xs text-[#0A504A]"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "append"}
                      onChange={() => setImportMode("append")}
                      className="text-[#00A86B] focus:ring-[#00A86B]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Append to Canvas</span>
                      <span className="text-[10px] text-slate-400 block">
                        Adds alongside existing steps
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode("new_flow")}
                    className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      importMode === "new_flow"
                        ? "bg-white border-[#00A86B] shadow-xs text-[#0A504A]"
                        : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "new_flow"}
                      onChange={() => setImportMode("new_flow")}
                      className="text-[#00A86B] focus:ring-[#00A86B]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Create as New Flow</span>
                      <span className="text-[10px] text-slate-400 block">
                        Save as Flow #{currentFlowCount + 1}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EXPORT FLOW CODE (AI JSON FORMAT)                                  */}
          {/* ========================================================================= */}
          {activeTab === "export" && (
            <div className="space-y-6">
              {/* Informative Header Banner */}
              <div className="p-4 rounded-xl bg-[#00A86B]/5 border border-[#00A86B]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00A86B]/15 text-[#00A86B] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-[#0A504A]">AI-Compatible Export Format:</p>
                    <p>
                      This code is formatted in the exact JSON schema that AI models (ChatGPT, Claude, Gemini) generate and that our system imports.
                      You can copy it, download it as a <strong>.json</strong> file, or feed it into ChatGPT to modify or extend your flow.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadExportJson}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download .json</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyExportCode}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      copiedExportCode
                        ? "bg-[#00A86B] text-white"
                        : "bg-[#0A504A] hover:bg-[#00A86B] text-white"
                    }`}
                  >
                    {copiedExportCode ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Format Options & Flow Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <span className="font-semibold text-slate-900">{currentFlowName || "Current Flow"}:</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono">
                    {currentNodes?.length || 0} nodes
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                    100% AI Schema Compatible
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={includeMarkdownFences}
                      onChange={(e) => setIncludeMarkdownFences(e.target.checked)}
                      className="rounded text-[#00A86B] focus:ring-[#00A86B]"
                    />
                    <span>Wrap in ```json codeblock</span>
                  </label>

                  <button
                    type="button"
                    onClick={handlePasteToImporter}
                    className="text-[#00A86B] hover:text-[#0A504A] font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    title="Load this exported code directly into Tab 2 Importer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Paste into Importer (Tab 2)</span>
                  </button>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="relative rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden shadow-md">
                <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 font-mono text-[11px] text-slate-300">
                      {(currentFlowName || "flow").toLowerCase().replace(/[^a-z0-9_-]/g, "-")}.json
                    </span>
                  </div>

                  <button
                    onClick={handleCopyExportCode}
                    className="hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedExportCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 max-h-[360px] overflow-y-auto no-scrollbar font-mono text-[11.5px] leading-relaxed select-all">
                  <pre className="text-emerald-300 whitespace-pre font-mono">
                    {formattedExportCode}
                  </pre>
                </div>
              </div>

              {/* AI Modification Assistant Helper */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>How to use this code with AI (ChatGPT / Claude / Gemini)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPromptWithCode}
                    className="text-xs font-bold text-[#0A504A] hover:text-[#00A86B] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full AI Prompt + Code</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Want to modify or expand this flow with AI? Copy the code and ask ChatGPT:
                  <span className="block mt-1 p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700">
                    &quot;Here is my existing WhatsApp bot flow JSON. Please add a product feedback rating step with buttons after the order tracking message, then return the complete updated JSON.&quot;
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-[#F7F7F2] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeTab === "instruction" ? (
              <button
                onClick={() => setActiveTab("import")}
                className="px-4 py-2 bg-[#0A504A] hover:bg-[#00A86B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Continue to Import & Generate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : activeTab === "export" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExportJson}
                  className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Download .json</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyExportCode}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    copiedExportCode
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0A504A] hover:bg-[#00A86B] text-white"
                  }`}
                >
                  {copiedExportCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied AI Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy AI Code to Clipboard</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={!parsedAnalysis?.valid}
                className="px-5 py-2.5 bg-[#00A86B] hover:bg-[#0A504A] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate & Apply to Canvas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import { BotFlow, FlowNode } from "@/types/whatsapp";
import { AiFlowGeneratorModal } from "./AiFlowGeneratorModal";
import {
  GitFork,
  Plus,
  Search,
  Sparkles,
  Smartphone,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface FlowListViewProps {
  flows: BotFlow[];
  currentFlowId: string;
  onSelectFlow: (flowId: string) => void;
  onOpenCanvas: (flowId: string) => void;
  onCreateFlow: (
    name: string,
    description?: string,
    initialNodes?: FlowNode[]
  ) => Promise<BotFlow | null> | void;
  onDeleteFlow: (flowId: string) => Promise<boolean> | void;
  onDuplicateFlow: (flowId: string) => Promise<BotFlow | null> | void;
  onToggleFlowActive: (flowId: string, isActive: boolean) => Promise<boolean> | void;
  onOpenSimulator: () => void;
}

export function FlowListView({
  flows,
  currentFlowId,
  onSelectFlow,
  onOpenCanvas,
  onCreateFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onToggleFlowActive,
  onOpenSimulator,
}: FlowListViewProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "draft">("all");

  // Modals state (replacing window alerts/prompts/confirms)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [newFlowKeywords, setNewFlowKeywords] = useState("");
  const [newFlowStarter, setNewFlowStarter] = useState<"standard" | "blank">("standard");

  const [flowToDelete, setFlowToDelete] = useState<BotFlow | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered flows
  const filteredFlows = useMemo(() => {
    return flows.filter((f) => {
      // Tab filter
      if (filterTab === "active" && !f.isActive) return false;
      if (filterTab === "draft" && f.isActive) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchDesc = (f.description || "").toLowerCase().includes(q);
      const matchKws = (f.triggerKeywords || []).some((k) =>
        k.toLowerCase().includes(q)
      );
      return matchName || matchDesc || matchKws;
    });
  }, [flows, filterTab, searchQuery]);

  // Handle flow creation submission
  const handleConfirmCreateFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;

    const keywordsArray = newFlowKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    let initialNodes: FlowNode[] | undefined = undefined;
    if (newFlowStarter === "standard") {
      const now = Date.now();
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "trigger",
          title: "Welcome Trigger",
          content: "Activates when user starts a chat or says hello.",
          triggerKeywords: keywordsArray.length > 0 ? keywordsArray : ["hi", "hello", "menu"],
          position: { x: 100, y: 150 },
          nextNodeId: `node-${now}-2`,
        },
        {
          id: `node-${now}-2`,
          type: "buttons",
          title: "Main Options",
          content: "Welcome! How can we assist you today?",
          buttons: [
            { id: `btn-${now}-1`, title: "Inquire Services" },
            { id: `btn-${now}-2`, title: "Talk to Agent" },
          ],
          position: { x: 480, y: 150 },
        },
      ];
    } else {
      const now = Date.now();
      initialNodes = [
        {
          id: `node-${now}-1`,
          type: "trigger",
          title: "Initial Trigger",
          content: "Configure your trigger keywords to activate this pathway.",
          triggerKeywords: keywordsArray.length > 0 ? keywordsArray : ["start"],
          position: { x: 120, y: 150 },
        },
      ];
    }

    const created = await onCreateFlow(
      newFlowName.trim(),
      newFlowDescription.trim() || undefined,
      initialNodes
    );

    setIsCreateModalOpen(false);
    setNewFlowName("");
    setNewFlowDescription("");
    setNewFlowKeywords("");
    showToast(`Flow "${newFlowName.trim()}" created`);

    if (created && created.id) {
      onOpenCanvas(created.id);
    }
  };

  // Handle flow deletion confirmation
  const handleConfirmDeleteFlow = async () => {
    if (!flowToDelete) return;
    if (flows.length <= 1) {
      setFlowToDelete(null);
      return;
    }
    const name = flowToDelete.name;
    await onDeleteFlow(flowToDelete.id);
    setFlowToDelete(null);
    showToast(`Flow "${name}" deleted`);
  };

  // Handle flow duplication
  const handleDuplicate = async (f: BotFlow) => {
    await onDuplicateFlow(f.id);
    showToast(`Duplicated "${f.name}"`);
  };

  // Handle AI generated flow from modal
  const handleApplyAiFlow = async (
    aiFlowName: string,
    newNodes: FlowNode[],
    mode: "replace" | "append" | "new_flow"
  ) => {
    const created = await onCreateFlow(
      aiFlowName || `Flow #${flows.length + 1}`,
      "AI Generated Automation Flow",
      newNodes
    );
    setIsAiModalOpen(false);
    showToast(`AI Flow "${aiFlowName}" created`);
    if (created && created.id) {
      onOpenCanvas(created.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-[#FAFAF8] overflow-y-auto font-secondary">
      {/* HEADER SECTION (Minimal, Thin Typography) */}
      <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur-xs px-6 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-slate-900">
              Flows & Automations
            </h1>
            <p className="text-xs font-light text-slate-400 mt-1">
              Design and manage WhatsApp bot routing, quick replies, and keyword pathways
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Test in Simulator */}
            <button
              type="button"
              onClick={onOpenSimulator}
              className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Test Simulator</span>
            </button>

            {/* AI Flow Assistant Button */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-light text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Flow Assistant</span>
            </button>

            {/* Create Flow Button */}
            <button
              type="button"
              onClick={() => {
                setNewFlowName(`Automation Flow #${flows.length + 1}`);
                setNewFlowDescription("");
                setNewFlowKeywords("hi, hello");
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR (Minimal, no loud badge tags) */}
      <div className="max-w-6xl mx-auto w-full px-6 sm:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
          {/* Filter tabs: All, Active, Draft (minimal text with underline indicator) */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`text-xs font-light tracking-wide pb-1 transition-colors cursor-pointer border-b-2 ${
                filterTab === "all"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              All Flows ({flows.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("active")}
              className={`text-xs font-light tracking-wide pb-1 transition-colors cursor-pointer border-b-2 ${
                filterTab === "active"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Active ({flows.filter((f) => f.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("draft")}
              className={`text-xs font-light tracking-wide pb-1 transition-colors cursor-pointer border-b-2 ${
                filterTab === "draft"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Draft ({flows.filter((f) => !f.isActive).length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flows or keywords..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-light text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* FLOWS LIST TABLE / CARDS (Minimal, Thin Typography, No bulky tags) */}
        <div className="mt-5 space-y-2.5">
          {filteredFlows.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-light text-slate-700">No flows match your search</p>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  Try adjusting the filter or create a new flow to get started
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewFlowName(`Automation Flow #${flows.length + 1}`);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-normal text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Flow</span>
              </button>
            </div>
          ) : (
            filteredFlows.map((flow) => {
              const nodeCount = flow.nodes ? flow.nodes.length : 0;
              const triggerNode = flow.nodes?.find((n) => n.type === "trigger");
              const keywords =
                flow.triggerKeywords && flow.triggerKeywords.length > 0
                  ? flow.triggerKeywords
                  : triggerNode?.triggerKeywords || [];

              return (
                <div
                  key={flow.id}
                  className="group bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left info: Status dot, Flow Name, Description, Trigger keywords */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Status Dot (Minimal, no background box) */}
                    <div className="pt-1 shrink-0">
                      <span
                        className={`block w-2 h-2 rounded-full ${
                          flow.isActive ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                        title={flow.isActive ? "Active on WhatsApp" : "Draft (Disabled)"}
                      />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectFlow(flow.id);
                            onOpenCanvas(flow.id);
                          }}
                          className="text-sm font-normal text-slate-800 hover:text-emerald-700 transition-colors text-left truncate cursor-pointer"
                        >
                          {flow.name}
                        </button>

                        {/* Minimal Default text (no loud badge) */}
                        {flow.isDefault && (
                          <span className="text-[11px] font-light text-amber-600">
                            &bull; Default
                          </span>
                        )}

                        {/* Minimal Status text */}
                        <span className="text-[11px] font-light text-slate-400">
                          &bull; {flow.isActive ? "Active" : "Draft"}
                        </span>

                        {/* Step count */}
                        <span className="text-[11px] font-light text-slate-400">
                          &bull; {nodeCount} {nodeCount === 1 ? "step" : "steps"}
                        </span>
                      </div>

                      {/* Description or Subtitle */}
                      {flow.description && (
                        <p className="text-xs font-light text-slate-400 truncate max-w-xl">
                          {flow.description}
                        </p>
                      )}

                      {/* Trigger keywords: Plain minimal text (NO tags with bg and border!) */}
                      {keywords.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-light text-slate-400 pt-0.5">
                          <span>Triggers:</span>
                          <span className="text-slate-600">
                            {keywords.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right actions: Toggle Active, Edit in Canvas, Duplicate, Delete */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    {/* Minimal Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onToggleFlowActive(flow.id, !flow.isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        flow.isActive ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                      title={flow.isActive ? "Turn flow off (Draft)" : "Activate flow on WhatsApp"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out mt-0.5 ${
                          flow.isActive ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    {/* Open in Canvas Builder */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectFlow(flow.id);
                        onOpenCanvas(flow.id);
                      }}
                      className="px-3 py-1.5 text-xs font-light text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Edit Canvas</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Duplicate button */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(flow)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 flex items-center justify-center transition-colors cursor-pointer"
                      title="Duplicate flow"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button (opens professional modal) */}
                    <button
                      type="button"
                      onClick={() => setFlowToDelete(flow)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete flow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL CREATE FLOW MODAL (Zero window.prompt)                      */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-normal text-slate-900">Create New Flow</h3>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  Set up a new conversational pathway for WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateFlow} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">Flow Name</label>
                <input
                  type="text"
                  required
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  placeholder="e.g. Lead Qualification Flow"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">Description (Optional)</label>
                <input
                  type="text"
                  value={newFlowDescription}
                  onChange={(e) => setNewFlowDescription(e.target.value)}
                  placeholder="e.g. Automated answers for pricing inquiries"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">
                  Trigger Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={newFlowKeywords}
                  onChange={(e) => setNewFlowKeywords(e.target.value)}
                  placeholder="e.g. quote, price, pricing (comma separated)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors"
                />
                <span className="text-[11px] font-light text-slate-400">
                  Customer messages matching these will trigger this flow
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-normal text-slate-700">Starter Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFlowStarter("standard")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      newFlowStarter === "standard"
                        ? "border-slate-800 bg-slate-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-normal text-slate-800 block">Menu Starter</span>
                    <span className="text-[11px] font-light text-slate-400 block mt-0.5">
                      Trigger + 2 options menu
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewFlowStarter("blank")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      newFlowStarter === "blank"
                        ? "border-slate-800 bg-slate-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xs font-normal text-slate-800 block">Blank Canvas</span>
                    <span className="text-[11px] font-light text-slate-400 block mt-0.5">
                      Single trigger node
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL DELETE FLOW MODAL (Zero window.confirm)                      */}
      {/* ========================================================================= */}
      {flowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-normal text-slate-900">Delete Flow</h3>
                {flows.length <= 1 ? (
                  <p className="text-xs font-light text-slate-500 mt-1 leading-relaxed">
                    You cannot delete <strong>&quot;{flowToDelete.name}&quot;</strong> because it is the only remaining flow in your workspace. Please create another flow first.
                  </p>
                ) : (
                  <p className="text-xs font-light text-slate-500 mt-1 leading-relaxed">
                    Are you sure you want to delete <strong>&quot;{flowToDelete.name}&quot;</strong>? This action will permanently remove this flow and its steps.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlowToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {flows.length <= 1 ? "Close" : "Cancel"}
                </button>

                {flows.length > 1 && (
                  <button
                    type="button"
                    onClick={handleConfirmDeleteFlow}
                    className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    Delete Flow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI FLOW ARCHITECT MODAL */}
      <AiFlowGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyFlow={handleApplyAiFlow}
        currentFlowCount={flows.length}
      />

      {/* MINIMAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-light flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type EdgeProps,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FlowNode, FlowNodeType, BotFlow, BusinessCatalog, CatalogItem, CatalogPayload } from "@/types/whatsapp";
import { AiFlowGeneratorModal } from "./AiFlowGeneratorModal";
import {
  GitFork,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Sparkles,
  MessageCircle,
  X,
  Zap,
  Save,
  Headphones,
  Sliders,
  Smartphone,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Clock,
  Link as LinkIcon,
  MapPin,
  Bell,
  Layers,
  CheckCircle2,
  Copy,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  AlertCircle,
  Radio,
  Maximize2,
  Undo2,
  Redo2,
  Loader2,
  ShoppingBag,
  FolderPlus,
  Star,
  Wand2,
} from "lucide-react";

// =========================================================================
// CUSTOM REACT FLOW NODE DATA TYPES
// =========================================================================

export interface FlowNodeData extends Record<string, unknown> {
  title: string;
  content: string;
  type: FlowNodeType;
  triggerKeywords?: string[];
  contactType?: "any_contact" | "new_contact" | "existing_contact";
  triggerType?: "new_message" | "keyword_match" | "order_placed";
  buttons?: { id: string; title: string; nextNodeId?: string }[];
  mediaUrl?: string;
  caption?: string;
  delayDuration?: string;
  templateName?: string;
  listItems?: { id: string; title: string; description?: string }[];
  url?: string;
  urlButtonText?: string;
  location?: { lat: number; lng: number; name?: string; address?: string };
  targetFlowId?: string;
  notifyChannel?: "whatsapp" | "email";
  notifyTarget?: string;
  catalog?: CatalogPayload;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export type RfNode = Node<FlowNodeData>;

// =========================================================================
// CUSTOM REMOVABLE EDGE (Interactive Break-Link "×" Button on every edge)
// =========================================================================

function RemovableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      interactionWidth={20}
      style={{
        ...style,
        stroke: selected ? "#ef4444" : "#00A86B",
        strokeWidth: selected ? 3 : 2,
      }}
    />
  );
}

const edgeTypes = {
  removable: RemovableEdge,
  default: RemovableEdge,
};

// =========================================================================
// NODE HEADER COMPONENT (Shared across all nodes)
// =========================================================================

function NodeHeader({
  icon: Icon,
  title,
  badgeText,
  id,
  onDuplicate,
  onDelete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badgeText?: string;
  id?: string;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="bg-[#0A504A] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-white/10 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[#A2E4B8] shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-xs truncate text-white">{title}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {badgeText && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/90">
            {badgeText}
          </span>
        )}
        {onDuplicate && id && (
          <button
            type="button"
            title="Duplicate step"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(id);
            }}
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
        {onDelete && id && (
          <button
            type="button"
            title="Delete step"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="p-1 rounded-md text-red-300 hover:text-red-100 hover:bg-red-500/20 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// CUSTOM REACT FLOW NODES (Static, Non-Animated, Restful on the eyes)
// =========================================================================

// 1. Inbound Trigger Node
function TriggerNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-[#0A504A]/20"
      }`}
    >
      <NodeHeader
        icon={Zap}
        title="Inbound Trigger"
        badgeText="START"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#0A504A]">{data.title || "Customer Starts Chat"}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {data.contactType === "new_contact" ? "New Contacts" : data.contactType === "existing_contact" ? "Existing" : "Any Contact"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{data.content || "Fires automatically when a customer messages."}</p>

        {data.triggerType === "order_placed" ? (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10.5px] font-normal text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>🛍️ WhatsApp Catalog Order Event</span>
          </div>
        ) : data.triggerKeywords && data.triggerKeywords.length > 0 ? (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
            {data.triggerKeywords.map((kw: string, i: number) => (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0A504A]/10 text-[#0A504A] border border-[#0A504A]/20"
              >
                #{kw}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 2. WhatsApp Message Node
function MessageNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={MessageCircle}
        title="WhatsApp Message"
        badgeText="TEXT"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <div className="p-2.5 bg-[#efe7dd] rounded-xl text-xs text-slate-800 border border-slate-200 shadow-inner">
          <p className="leading-relaxed whitespace-pre-wrap">{data.content || "Type your message..."}</p>
          <div className="text-[9px] text-slate-400 text-right mt-1">10:42 AM • ✓✓</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 3. Interactive Buttons Node
function ButtonsNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-76 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={GitFork}
        title="Interactive Buttons"
        badgeText={`${data.buttons?.length || 0} Buttons`}
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2.5">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <p className="text-[11px] text-slate-600">{data.content}</p>

        {/* Buttons List */}
        <div className="space-y-1.5 pt-1">
          {data.buttons?.map((btn, idx) => (
            <div
              key={btn.id || idx}
              className="relative p-2 bg-[#F7F7F2] hover:bg-[#0A504A]/5 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-[#0A504A]"
            >
              <span>{btn.title}</span>
              <span className="text-[10px] font-mono text-[#00A86B]">→ Next</span>
              <Handle
                type="source"
                position={Position.Right}
                id={btn.id || `btn-${idx}`}
                className="w-3 h-3 bg-[#00A86B] border border-white -right-1.5"
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 4. Delay Node
function DelayNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-64 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-amber-500 ring-2 ring-amber-500/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={Clock}
        title="Wait / Delay"
        badgeText={data.delayDuration || "5 sec"}
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title || "Smart Pause"}</p>
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600 shrink-0" />
          <p className="text-[11px] font-semibold text-slate-800">
            Pause flow for <span className="underline decoration-slate-400">{data.delayDuration || "5 seconds"}</span>
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-slate-600 border-2 border-white" />
    </div>
  );
}

// 5. Template Message Node
function TemplateNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={CheckCircle2}
        title="Meta Template"
        badgeText="APPROVED"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-1">
            <Radio className="w-3 h-3 text-[#00A86B]" />
            <span>{data.templateName || "order_update_v2"}</span>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed">{data.content || "Pre-approved marketing / utility template"}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 6. Media Node (Image, Video, Audio, Document)
function MediaNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  const isImage = data.type === "image";
  const isVideo = data.type === "video";
  const isDoc = data.type === "document";

  const Icon = isImage ? ImageIcon : isVideo ? Video : isDoc ? FileText : Music;
  const typeLabel = isImage ? "Send Image" : isVideo ? "Send Video" : isDoc ? "Send Document" : "Send Audio";

  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={Icon}
        title={typeLabel}
        badgeText={data.type.toUpperCase()}
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
          <Icon className="w-8 h-8 text-slate-400 mb-1" />
          <p className="text-[11px] font-medium text-slate-700 truncate max-w-full">
            {data.mediaUrl ? (data.mediaUrl.split("/").pop() || "media file") : "No media URL specified"}
          </p>
          {data.caption && <p className="text-[10px] text-slate-500 mt-1 italic">&quot;{data.caption}&quot;</p>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 7. Interactive List Node
function ListNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-76 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={Layers}
        title="Interactive List Menu"
        badgeText={`${data.listItems?.length || 0} Options`}
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2.5">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <p className="text-[11px] text-slate-600">{data.content}</p>

        <div className="p-2 bg-slate-100 rounded-xl text-center text-xs font-bold text-[#0A504A] border border-slate-200">
          📋 Select from Menu
        </div>

        <div className="space-y-1.5 pt-1">
          {data.listItems?.map((item, idx) => (
            <div
              key={item.id || idx}
              className="relative p-2 bg-[#F7F7F2] hover:bg-[#0A504A]/5 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-[#0A504A]"
            >
              <div className="min-w-0 pr-4">
                <span className="block truncate">{item.title}</span>
                {item.description && (
                  <span className="text-[9px] text-slate-400 block truncate">{item.description}</span>
                )}
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={item.id || `list-${idx}`}
                className="w-3 h-3 bg-[#00A86B] border border-white -right-1.5"
              />
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 8. URL / CTA Link Node
function UrlCtaNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={LinkIcon}
        title="URL / CTA Button"
        badgeText="LINK"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <p className="text-[11px] text-slate-600">{data.content}</p>
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <ExternalLink className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
            <span className="text-xs font-bold text-[#0A504A] truncate">{data.urlButtonText || "Visit Website"}</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono truncate max-w-[100px]">{data.url || "https://..."}</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 9. Location Pin Node
function LocationNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={MapPin}
        title="Send Location Pin"
        badgeText="GPS"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
            <span className="text-xs font-bold text-slate-900">{data.location?.name || "Store Location"}</span>
          </div>
          <p className="text-[10px] text-slate-500">{data.location?.address || "Colombo, Sri Lanka"}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 10. Notify Team Node
function NotifyTeamNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-purple-500 ring-2 ring-purple-500/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={Bell}
        title="Notify Team"
        badgeText="ALERT"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Bell className="w-3.5 h-3.5 text-slate-600" />
            <span>Via {data.notifyChannel === "email" ? "Staff Email" : "WhatsApp Alert"}</span>
          </div>
          <p className="text-[10px] text-slate-600 truncate">{data.notifyTarget || "+9477... or staff@zynex.lk"}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-slate-600 border-2 border-white" />
    </div>
  );
}

// 11. Human Agent Handoff Node
function HandoffNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-amber-500 ring-2 ring-amber-500/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={Headphones}
        title="Live Agent Handoff"
        badgeText="ESCALATE"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">{data.content}</p>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-800 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span>Alerts Live Inbox with Sound & Push</span>
        </div>
      </div>
    </div>
  );
}

// 12. Sub Flow Node
function SubFlowNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-72 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={GitFork}
        title="Trigger Sub Flow"
        badgeText="NESTED"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title}</p>
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0A504A] flex items-center justify-between">
          <span>Target: {data.targetFlowId || "Lead Qualification Flow"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#00A86B]" />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// 13. End Conversation Node
function EndNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  return (
    <div
      className={`w-68 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-slate-700 ring-2 ring-slate-400" : "border-slate-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={CheckCircle2}
        title="End Conversation"
        badgeText="RESOLVED"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title || "Session Concluded"}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {data.content || "Closes customer session and sets status to Resolved."}
        </p>
      </div>
    </div>
  );
}

// 17. WhatsApp Catalog Node
function CatalogNodeComponent({ data, selected, id }: { data: FlowNodeData; selected?: boolean; id: string }) {
  const cat = data.catalog;
  const heroImage = cat?.products?.[0]?.imageUrl;
  const isStore = !cat?.type || cat?.type === "catalog_message";
  const isList = cat?.type === "product_list";

  return (
    <div
      className={`w-76 bg-white rounded-2xl border-2 shadow-md overflow-hidden ${
        selected ? "border-[#00A86B] ring-2 ring-[#00A86B]/30" : "border-slate-200"
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3.5 h-3.5 bg-[#0A504A] border-2 border-white" />
      <NodeHeader
        icon={ShoppingBag}
        title="WhatsApp Catalog"
        badgeText="IN-APP STORE"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2.5">
        {/* Catalog Header Meta info */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-800 truncate max-w-[150px]">
            {cat?.catalogName || "Business Catalog"}
          </span>
          <span className="text-[9.5px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-[#00A86B] border border-emerald-200/60">
            {isStore ? "In-App Store" : isList ? `Products (${cat?.products?.length || 0})` : "Product Card"}
          </span>
        </div>

        {/* Thumbnail Preview if available */}
        {heroImage && (
          <div className="relative h-24 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
            <img
              src={heroImage}
              alt={cat?.catalogName || "Product"}
              className="w-full h-full object-cover"
            />
            {cat?.products?.[0]?.price && (
              <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-white/95 rounded-md text-[10px] font-bold text-[#00A86B] shadow-xs">
                {cat.products[0].price}
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
          {data.content || cat?.bodyText || "Browse our official catalog directly within WhatsApp."}
        </p>

        {/* Meta Native In-App Button Preview */}
        <div className="p-2 bg-[#00A86B]/10 border border-[#00A86B]/20 rounded-xl flex items-center justify-between text-xs font-bold text-[#00A86B]">
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            {isList ? "View Products" : "View Catalog"}
          </span>
          <span className="text-[9.5px] text-[#0A504A] font-normal">WhatsApp Native</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3.5 h-3.5 bg-[#00A86B] border-2 border-white" />
    </div>
  );
}

// Node types mapping for React Flow
const nodeTypes = {
  trigger: TriggerNodeComponent,
  message: MessageNodeComponent,
  buttons: ButtonsNodeComponent,
  delay: DelayNodeComponent,
  template: TemplateNodeComponent,
  image: MediaNodeComponent,
  video: MediaNodeComponent,
  document: MediaNodeComponent,
  audio: MediaNodeComponent,
  list: ListNodeComponent,
  url_cta: UrlCtaNodeComponent,
  location: LocationNodeComponent,
  catalog: CatalogNodeComponent,
  notify_team: NotifyTeamNodeComponent,
  human_handoff: HandoffNodeComponent,
  sub_flow: SubFlowNodeComponent,
  end_conversation: EndNodeComponent,
  condition: MessageNodeComponent,
  ai_reply: MessageNodeComponent,
};

// =========================================================================
// STEP DRAWER CATALOGUE (Unified Monochrome Icons)
// =========================================================================

interface StepCatalogItem {
  type: FlowNodeType;
  title: string;
  category: "Messages & Media" | "Interactive & Branching" | "Logic & Actions" | "Team & Agents";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEP_CATALOGUE: StepCatalogItem[] = [
  // Category 1: Messages & Media
  {
    type: "message",
    title: "Text Message",
    category: "Messages & Media",
    description: "Send standard formatted WhatsApp text message with variables.",
    icon: MessageCircle,
  },
  {
    type: "image",
    title: "Send Image",
    category: "Messages & Media",
    description: "Send JPG or PNG photo, product banner, or flyer with caption.",
    icon: ImageIcon,
  },
  {
    type: "video",
    title: "Send Video",
    category: "Messages & Media",
    description: "Send MP4 product video, explainer clip, or promo teaser.",
    icon: Video,
  },
  {
    type: "document",
    title: "Send Document",
    category: "Messages & Media",
    description: "Send PDF catalogue, quotation, invoice, or brochure file.",
    icon: FileText,
  },
  {
    type: "audio",
    title: "Voice / Audio Note",
    category: "Messages & Media",
    description: "Send recorded voice note or MP3 audio greeting.",
    icon: Music,
  },
  {
    type: "template",
    title: "Meta Template",
    category: "Messages & Media",
    description: "Send Meta pre-approved 24h+ utility or marketing template.",
    icon: CheckCircle2,
  },

  // Category 2: Interactive & Branching
  {
    type: "buttons",
    title: "Interactive Buttons",
    category: "Interactive & Branching",
    description: "Quick reply buttons (up to 3) with distinct branching branches.",
    icon: GitFork,
  },
  {
    type: "list",
    title: "Interactive List Menu",
    category: "Interactive & Branching",
    description: "Sectioned list dropdown allowing user to pick from 10 items.",
    icon: Layers,
  },
  {
    type: "catalog",
    title: "WhatsApp Catalog",
    category: "Interactive & Branching",
    description: "Send native in-app Meta store catalog or product card.",
    icon: ShoppingBag,
  },
  {
    type: "url_cta",
    title: "CTA / Website Link",
    category: "Interactive & Branching",
    description: "WhatsApp message with a clickable outbound web action button.",
    icon: LinkIcon,
  },
  {
    type: "location",
    title: "Send Location Pin",
    category: "Interactive & Branching",
    description: "Send GPS map coordinates, store address, or branch pin.",
    icon: MapPin,
  },

  // Category 3: Logic & Actions
  {
    type: "delay",
    title: "Delay / Wait",
    category: "Logic & Actions",
    description: "Pause automation for seconds, minutes, or hours before replying.",
    icon: Clock,
  },
  {
    type: "sub_flow",
    title: "Trigger Sub Flow",
    category: "Logic & Actions",
    description: "Transfer contact to another flow (e.g. Sales, Feedback).",
    icon: GitFork,
  },
  {
    type: "end_conversation",
    title: "End Conversation",
    category: "Logic & Actions",
    description: "Conclude interaction and mark customer conversation resolved.",
    icon: CheckCircle2,
  },

  // Category 4: Team & Agents
  {
    type: "human_handoff",
    title: "Live Agent Handoff",
    category: "Team & Agents",
    description: "Escalate immediately to Live Inbox and alert human agents.",
    icon: Headphones,
  },
  {
    type: "notify_team",
    title: "Notify Staff / Team",
    category: "Team & Agents",
    description: "Send internal WhatsApp message or email notification to team.",
    icon: Bell,
  },
];

// =========================================================================
// FLOW NODES TO REACT FLOW CONVERTER HELPER
// =========================================================================

function convertFlowNodesToRf(flowNodesList: FlowNode[]): { nodes: RfNode[]; edges: Edge[] } {
  const nodes: RfNode[] = flowNodesList.map((fn, index) => {
    const defaultX = 150 + (index % 3) * 340;
    const defaultY = 100 + Math.floor(index / 3) * 260;

    let resolvedType = fn.type in nodeTypes ? fn.type : "message";
    if (resolvedType === "message" && fn.buttons && fn.buttons.length > 0) {
      resolvedType = "buttons";
    }

    return {
      id: fn.id,
      type: resolvedType,
      position:
        fn.position && typeof fn.position.x === "number" && typeof fn.position.y === "number"
          ? fn.position
          : { x: defaultX, y: defaultY },
      data: {
        title: fn.title,
        content: fn.content,
        type: resolvedType,
        triggerKeywords: fn.triggerKeywords,
        contactType: fn.contactType,
        triggerType: fn.triggerType,
        buttons: fn.buttons,
        mediaUrl: fn.mediaUrl,
        caption: fn.caption,
        delayDuration: fn.delayDuration,
        templateName: fn.templateName,
        listItems: fn.listItems,
        url: fn.url,
        urlButtonText: fn.urlButtonText,
        location: fn.location,
        targetFlowId: fn.targetFlowId,
        notifyChannel: fn.notifyChannel,
        notifyTarget: fn.notifyTarget,
        catalog: fn.catalog,
      },
    };
  });

  const edges: Edge[] = [];
  const validNodeIds = new Set(flowNodesList.map((n) => n.id));

  flowNodesList.forEach((fn) => {
    const isButtons = fn.type === "buttons" || (fn.buttons && fn.buttons.length > 0);
    const isList = fn.type === "list" || (fn.listItems && fn.listItems.length > 0);

    // 1. Single next node connection
    if (fn.nextNodeId && !isButtons && !isList && validNodeIds.has(fn.nextNodeId)) {
      edges.push({
        id: `edge-${fn.id}-${fn.nextNodeId}`,
        source: fn.id,
        target: fn.nextNodeId,
        type: "removable",
        animated: false,
        style: { stroke: "#00A86B", strokeWidth: 2 },
      });
    }

    // 2. Buttons branching connections
    if (isButtons && fn.buttons && Array.isArray(fn.buttons)) {
      fn.buttons.forEach((btn, bIdx) => {
        if (btn.nextNodeId && validNodeIds.has(btn.nextNodeId)) {
          const handleId = btn.id || `btn-${bIdx}`;
          edges.push({
            id: `edge-${fn.id}-${handleId}-${btn.nextNodeId}`,
            source: fn.id,
            sourceHandle: handleId,
            target: btn.nextNodeId,
            type: "removable",
            animated: false,
            style: { stroke: "#00A86B", strokeWidth: 2 },
          });
        }
      });
    }

    // 3. List item branching connections
    if (isList && fn.listItems && Array.isArray(fn.listItems)) {
      fn.listItems.forEach((li, lIdx) => {
        if (li.nextNodeId && validNodeIds.has(li.nextNodeId)) {
          const handleId = li.id || `list-${lIdx}`;
          edges.push({
            id: `edge-${fn.id}-${handleId}-${li.nextNodeId}`,
            source: fn.id,
            sourceHandle: handleId,
            target: li.nextNodeId,
            type: "removable",
            animated: false,
            style: { stroke: "#00A86B", strokeWidth: 2 },
          });
        }
      });
    }
  });

  return { nodes, edges };
}

// =========================================================================
// MAIN FLOW BUILDER COMPONENT WITH UNDO / REDO & MULTI-FLOW CAPABILITY
// =========================================================================

export interface FlowBuilderProps {
  nodes: FlowNode[];
  onUpdateNodes: (nodes: FlowNode[], flowName?: string) => Promise<boolean> | Promise<void> | void;
  onOpenSimulator: () => void;
  onBackToList?: () => void;
  flows?: BotFlow[];
  catalogs?: BusinessCatalog[];
  currentFlowId?: string;
  onSelectFlow?: (flowId: string) => void;
  onCreateFlow?: (name: string, description?: string, initialNodes?: FlowNode[]) => Promise<BotFlow | null> | void;
  onDeleteFlow?: (flowId: string) => Promise<boolean> | void;
  onDuplicateFlow?: (flowId: string) => Promise<BotFlow | null> | void;
  onToggleFlowActive?: (flowId: string, isActive: boolean) => Promise<boolean> | void;
}

export function FlowBuilder(props: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}

function FlowBuilderInner({
  nodes: initialFlowNodes,
  onUpdateNodes,
  onOpenSimulator,
  onBackToList,
  flows,
  catalogs = [],
  currentFlowId,
  onSelectFlow,
  onCreateFlow,
  onDeleteFlow,
  onDuplicateFlow,
  onToggleFlowActive,
}: FlowBuilderProps) {
  const { fitView } = useReactFlow();

  const currentFlow = flows?.find((f) => f.id === currentFlowId) || flows?.[0];

  // Topbar Flow Name & Unsaved state
  const [flowName, setFlowName] = useState(
    currentFlow?.name || "Main Inbound & Customer Support Flow"
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Multi-flow Dropdown & AI Modal states
  const [isFlowDropdownOpen, setIsFlowDropdownOpen] = useState(false);
  const [flowSearchQuery, setFlowSearchQuery] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Professional Modals (Zero window.alert/prompt/confirm)
  const [flowToDelete, setFlowToDelete] = useState<BotFlow | null>(null);
  const [isCreateFlowModalOpen, setIsCreateFlowModalOpen] = useState(false);
  const [newFlowNameInput, setNewFlowNameInput] = useState("");
  const [flowSwitchPendingId, setFlowSwitchPendingId] = useState<string | null>(null);

  // Sync flowName when currentFlow changes
  useEffect(() => {
    if (currentFlow) {
      setFlowName(currentFlow.name);
    }
  }, [currentFlow?.id, currentFlow?.name]);

  // Drawer / Add Step state
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [searchStepQuery, setSearchStepQuery] = useState("");

  // Inspector Drawer State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Context Menu State (Right-click on node, edge, or pane)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
  } | null>(null);

  // Close context menu & flow dropdown on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      setContextMenu(null);
      const target = e.target as HTMLElement;
      if (!target.closest("#flow-selector-container")) {
        setIsFlowDropdownOpen(false);
      }
    };
    window.addEventListener("click", handleDocumentClick);
    return () => window.removeEventListener("click", handleDocumentClick);
  }, []);

  // Inspector edit form fields
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const [editTriggerType, setEditTriggerType] = useState<"new_message" | "keyword_match" | "order_placed">("new_message");
  const [editContactType, setEditContactType] = useState<"any_contact" | "new_contact" | "existing_contact">("any_contact");
  const [editButtons, setEditButtons] = useState<{ id: string; title: string; nextNodeId?: string }[]>([]);
  const [editListItems, setEditListItems] = useState<{ id: string; title: string; description?: string }[]>([]);
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editDelayDuration, setEditDelayDuration] = useState("5 seconds");
  const [editTemplateName, setEditTemplateName] = useState("order_update_v2");
  const [editUrl, setEditUrl] = useState("");
  const [editUrlButtonText, setEditUrlButtonText] = useState("");
  const [editLocName, setEditLocName] = useState("");
  const [editLocAddress, setEditLocAddress] = useState("");
  const [editLocLat, setEditLocLat] = useState(6.9271);
  const [editLocLng, setEditLocLng] = useState(79.8612);
  const [editNotifyChannel, setEditNotifyChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [editNotifyTarget, setEditNotifyTarget] = useState("");
  const [editTargetFlowId, setEditTargetFlowId] = useState("");

  // Catalog Step Inspector Fields
  const [editCatalogId, setEditCatalogId] = useState("");
  const [editCatalogName, setEditCatalogName] = useState("");
  const [editCatalogType, setEditCatalogType] = useState<"catalog_message" | "product_list" | "product">("catalog_message");
  const [editThumbnailProductId, setEditThumbnailProductId] = useState("");
  const [editCatalogFooter, setEditCatalogFooter] = useState("Tap 'View Catalog' to open store");
  const [editSelectedProducts, setEditSelectedProducts] = useState<CatalogItem[]>([]);

  // Deep snapshot helper for robust Undo / Redo without mutating references
  const cloneFlowSnapshot = useCallback((nodes: RfNode[], edges: Edge[]) => {
    return {
      nodes: nodes.map((n) => ({
        ...n,
        position: { ...n.position },
        data: {
          ...n.data,
          buttons: n.data.buttons ? JSON.parse(JSON.stringify(n.data.buttons)) : undefined,
          listItems: n.data.listItems ? JSON.parse(JSON.stringify(n.data.listItems)) : undefined,
          triggerKeywords: n.data.triggerKeywords ? [...n.data.triggerKeywords] : undefined,
          location: n.data.location ? { ...n.data.location } : undefined,
          onDuplicate: undefined,
          onDelete: undefined,
        },
      })),
      edges: edges.map((e) => ({
        ...e,
        style: e.style ? { ...e.style } : undefined,
      })),
    };
  }, []);

  // Convert initial FlowNode[] to React Flow format
  const { nodes: initialReactFlowNodes, edges: initialReactFlowEdges } = useMemo(() => {
    return convertFlowNodesToRf(initialFlowNodes);
  }, [initialFlowNodes]);

  // Main React Flow canvas state
  const [rfNodes, setRfNodes] = useState<RfNode[]>(initialReactFlowNodes);
  const [rfEdges, setRfEdges] = useState<Edge[]>(initialReactFlowEdges);

  // Synchronous references to eliminate stale closures
  const rfNodesRef = useRef<RfNode[]>(initialReactFlowNodes);
  const rfEdgesRef = useRef<Edge[]>(initialReactFlowEdges);

  useEffect(() => {
    rfNodesRef.current = rfNodes;
  }, [rfNodes]);

  useEffect(() => {
    rfEdgesRef.current = rfEdges;
  }, [rfEdges]);

  // =========================================================================
  // IMMUTABLE UNDO / REDO HISTORY STACK
  // =========================================================================
  const historyRef = useRef<{ nodes: RfNode[]; edges: Edge[] }[]>([]);
  const historyPointerRef = useRef<number>(-1);
  const isUndoRedoActionRef = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Push new state snapshot onto history stack
  const pushHistorySnapshot = useCallback(
    (nodes: RfNode[], edges: Edge[]) => {
      if (isUndoRedoActionRef.current) {
        isUndoRedoActionRef.current = false;
        return;
      }
      const snapshot = cloneFlowSnapshot(nodes, edges);
      const curPointer = historyPointerRef.current;
      const nextHistory = historyRef.current.slice(0, curPointer + 1);
      if (nextHistory.length >= 50) {
        nextHistory.shift();
      }
      nextHistory.push(snapshot);
      historyRef.current = nextHistory;
      const newPointer = nextHistory.length - 1;
      historyPointerRef.current = newPointer;

      setCanUndo(newPointer > 0);
      setCanRedo(false);
    },
    [cloneFlowSnapshot]
  );

  // Duplicate node handler
  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;

      const sourceNode = currentNodes.find((n) => n.id === nodeId);
      if (!sourceNode) return;

      const newId = `node-${Date.now()}`;
      const duplicatedNode: RfNode = {
        ...sourceNode,
        id: newId,
        position: {
          x: sourceNode.position.x + 40,
          y: sourceNode.position.y + 40,
        },
        data: {
          ...sourceNode.data,
          title: `${sourceNode.data.title} (Copy)`,
          buttons: sourceNode.data.buttons
            ? sourceNode.data.buttons.map((b, idx) => ({
                id: `btn-${Date.now()}-${idx}`,
                title: b.title,
              }))
            : undefined,
          listItems: sourceNode.data.listItems
            ? sourceNode.data.listItems.map((li, idx) => ({
                id: `li-${Date.now()}-${idx}`,
                title: li.title,
                description: li.description,
              }))
            : undefined,
        },
      };

      const nextNodes = [...currentNodes, duplicatedNode];
      setRfNodes(nextNodes);
      rfNodesRef.current = nextNodes;

      pushHistorySnapshot(nextNodes, currentEdges);
      setContextMenu(null);
      setHasUnsavedChanges(true);
    },
    [pushHistorySnapshot]
  );

  // Delete node handler
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;

      const remainingNodes = currentNodes.filter((n) => n.id !== nodeId);
      const remainingEdges = currentEdges.filter((e) => e.source !== nodeId && e.target !== nodeId);

      setRfNodes(remainingNodes);
      setRfEdges(remainingEdges);
      rfNodesRef.current = remainingNodes;
      rfEdgesRef.current = remainingEdges;

      pushHistorySnapshot(remainingNodes, remainingEdges);
      setSelectedNodeId((current) => (current === nodeId ? null : current));
      setContextMenu(null);
      setHasUnsavedChanges(true);
    },
    [pushHistorySnapshot]
  );

  // Delete edge / Break connection link handler
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;

      const remainingEdges = currentEdges.filter((e) => e.id !== edgeId);

      setRfEdges(remainingEdges);
      rfEdgesRef.current = remainingEdges;

      pushHistorySnapshot(currentNodes, remainingEdges);
      setContextMenu(null);
      setHasUnsavedChanges(true);
    },
    [pushHistorySnapshot]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyPointerRef.current <= 0) return;
    const targetIndex = historyPointerRef.current - 1;
    const targetSnapshot = historyRef.current[targetIndex];
    if (!targetSnapshot) return;

    isUndoRedoActionRef.current = true;
    historyPointerRef.current = targetIndex;

    const restoredNodes: RfNode[] = targetSnapshot.nodes.map((n) => ({
      ...n,
      position: { ...n.position },
      data: {
        ...n.data,
        onDuplicate: handleDuplicateNode,
        onDelete: handleDeleteNode,
      },
    }));
    const restoredEdges: Edge[] = targetSnapshot.edges.map((e) => ({ ...e }));

    rfNodesRef.current = restoredNodes;
    rfEdgesRef.current = restoredEdges;
    setRfNodes(restoredNodes);
    setRfEdges(restoredEdges);

    setCanUndo(targetIndex > 0);
    setCanRedo(targetIndex < historyRef.current.length - 1);
    setHasUnsavedChanges(true);
  }, [handleDuplicateNode, handleDeleteNode]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyPointerRef.current >= historyRef.current.length - 1) return;
    const targetIndex = historyPointerRef.current + 1;
    const targetSnapshot = historyRef.current[targetIndex];
    if (!targetSnapshot) return;

    isUndoRedoActionRef.current = true;
    historyPointerRef.current = targetIndex;

    const restoredNodes: RfNode[] = targetSnapshot.nodes.map((n) => ({
      ...n,
      position: { ...n.position },
      data: {
        ...n.data,
        onDuplicate: handleDuplicateNode,
        onDelete: handleDeleteNode,
      },
    }));
    const restoredEdges: Edge[] = targetSnapshot.edges.map((e) => ({ ...e }));

    rfNodesRef.current = restoredNodes;
    rfEdgesRef.current = restoredEdges;
    setRfNodes(restoredNodes);
    setRfEdges(restoredEdges);

    setCanUndo(targetIndex > 0);
    setCanRedo(targetIndex < historyRef.current.length - 1);
    setHasUnsavedChanges(true);
  }, [handleDuplicateNode, handleDeleteNode]);

  // Ref to track last saved fingerprint and avoid overwriting canvas when parent re-renders after save
  const lastSavedFingerprintRef = useRef<string>("");

  // Sync server nodes if initial data changes and user has not made edits
  useEffect(() => {
    const incomingFingerprint = JSON.stringify(
      initialFlowNodes.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        position: n.position,
        buttons: n.buttons,
        listItems: n.listItems,
        nextNodeId: n.nextNodeId,
      }))
    );

    // If this matches the state we just saved or loaded, do NOT overwrite active canvas state!
    if (incomingFingerprint === lastSavedFingerprintRef.current) {
      return;
    }

    // Only sync if user hasn't made active edits on canvas
    if (!hasUnsavedChanges && initialReactFlowNodes.length > 0) {
      lastSavedFingerprintRef.current = incomingFingerprint;
      setRfNodes(initialReactFlowNodes);
      setRfEdges(initialReactFlowEdges);
      rfNodesRef.current = initialReactFlowNodes;
      rfEdgesRef.current = initialReactFlowEdges;
      historyRef.current = [cloneFlowSnapshot(initialReactFlowNodes, initialReactFlowEdges)];
      historyPointerRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [initialFlowNodes, initialReactFlowNodes, initialReactFlowEdges, hasUnsavedChanges, cloneFlowSnapshot]);

  // Ensure duplicate and delete callbacks are always attached to rfNodes
  useEffect(() => {
    setRfNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onDuplicate: handleDuplicateNode,
          onDelete: handleDeleteNode,
        },
      }))
    );
  }, [handleDuplicateNode, handleDeleteNode]);

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Open inspector for a given node
  const handleOpenInspectorForNode = useCallback((node: RfNode) => {
    setSelectedNodeId(node.id);
    setEditTitle(node.data.title || "");
    setEditContent(node.data.content || "");
    setEditKeywords(node.data.triggerKeywords ? node.data.triggerKeywords.join(", ") : "");
    setEditTriggerType(node.data.triggerType || "new_message");
    setEditContactType(node.data.contactType || "any_contact");
    setEditButtons(node.data.buttons ? JSON.parse(JSON.stringify(node.data.buttons)) : []);
    setEditListItems(node.data.listItems ? JSON.parse(JSON.stringify(node.data.listItems)) : []);
    setEditMediaUrl(node.data.mediaUrl || "");
    setEditCaption(node.data.caption || "");
    setEditDelayDuration(node.data.delayDuration || "5 seconds");
    setEditTemplateName(node.data.templateName || "order_update_v2");
    setEditUrl(node.data.url || "");
    setEditUrlButtonText(node.data.urlButtonText || "Visit Website");
    setEditLocName(node.data.location?.name || "Colombo Flagship Store");
    setEditLocAddress(node.data.location?.address || "Galle Road, Colombo 03");
    setEditLocLat(node.data.location?.lat || 6.9271);
    setEditLocLng(node.data.location?.lng || 79.8612);
    setEditNotifyChannel(node.data.notifyChannel || "whatsapp");
    setEditNotifyTarget(node.data.notifyTarget || "+94770000000");
    setEditTargetFlowId(node.data.targetFlowId || "Lead Qualification Flow");

    // Populate Catalog fields
    const cat = node.data.catalog as CatalogPayload | undefined;
    const defaultCat = (catalogs && catalogs.length > 0)
      ? (catalogs.find((c) => c.catalogId === cat?.catalogId) || catalogs[0])
      : undefined;
    const initialCatId = cat?.catalogId || defaultCat?.catalogId || defaultCat?.id || "2080375866175781";
    const initialCatName = cat?.catalogName || defaultCat?.name || "Official WhatsApp Store";
    const initialType = (cat?.type === "product" || cat?.type === "product_list") ? cat.type : "catalog_message";
    const initialThumbnail = cat?.thumbnailProductId || defaultCat?.items?.[0]?.retailerId || defaultCat?.items?.[0]?.id || "";
    const initialFooter = cat?.footerText || "Tap 'View Catalog' to open store";
    const initialProducts = cat?.products && cat.products.length > 0 ? cat.products : (defaultCat?.items || []);

    setEditCatalogId(initialCatId);
    setEditCatalogName(initialCatName);
    setEditCatalogType(initialType);
    setEditThumbnailProductId(initialThumbnail);
    setEditCatalogFooter(initialFooter);
    setEditSelectedProducts(initialProducts);
  }, [catalogs]);

  // Node click handler -> opens inspector
  const onNodeClick = (_: React.MouseEvent, node: RfNode) => {
    handleOpenInspectorForNode(node);
  };

  // Right click handler on Node
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  // Right click handler on Edge -> quick break link
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      edgeId: edge.id,
    });
  }, []);

  // Right click handler on empty canvas Pane
  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: (event as MouseEvent).clientX,
      y: (event as MouseEvent).clientY,
    });
  }, []);

  // Node change handler with edge cleanup on removal and history tracking
  const onNodesChange = useCallback(
    (changes: NodeChange<RfNode>[]) => {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;

      const hasRemoval = changes.some((ch) => ch.type === "remove");
      if (hasRemoval) {
        const removedIds = new Set(
          changes.filter((ch) => ch.type === "remove").map((ch) => (ch as any).id)
        );
        const nextNodes = applyNodeChanges(changes, currentNodes);
        const nextEdges = currentEdges.filter((e) => !removedIds.has(e.source) && !removedIds.has(e.target));

        setRfNodes(nextNodes);
        setRfEdges(nextEdges);
        rfNodesRef.current = nextNodes;
        rfEdgesRef.current = nextEdges;

        pushHistorySnapshot(nextNodes, nextEdges);
        setSelectedNodeId((cur) => (cur && removedIds.has(cur) ? null : cur));
      } else {
        const nextNodes = applyNodeChanges(changes, currentNodes);
        setRfNodes(nextNodes);
        rfNodesRef.current = nextNodes;
      }
      setHasUnsavedChanges(true);
    },
    [pushHistorySnapshot]
  );

  // Edge change handler (supports keyboard Backspace / Delete on edges)
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;

      const nextEdges = applyEdgeChanges(changes, currentEdges);
      setRfEdges(nextEdges);
      rfEdgesRef.current = nextEdges;

      const hasRemoval = changes.some((c) => c.type === "remove");
      if (hasRemoval) {
        pushHistorySnapshot(currentNodes, nextEdges);
      }
      setHasUnsavedChanges(true);
    },
    [pushHistorySnapshot]
  );

  // New connection handler
  const onConnect = useCallback(
    (params: Connection) => {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;

      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.sourceHandle || "def"}-${params.target}`,
        type: "removable",
        animated: false,
        style: { stroke: "#00A86B", strokeWidth: 2 },
      };
      const nextEdges = addEdge(newEdge, currentEdges);

      setRfEdges(nextEdges);
      rfEdgesRef.current = nextEdges;

      pushHistorySnapshot(currentNodes, nextEdges);
      setHasUnsavedChanges(true);
    },
    [pushHistorySnapshot]
  );

  // Node drag stop -> records snapshot for Undo/Redo
  const onNodeDragStop = useCallback(() => {
    pushHistorySnapshot(rfNodesRef.current, rfEdgesRef.current);
  }, [pushHistorySnapshot]);

  // Sync React Flow state back to FlowNode[] and save
  const handleSaveAllNodes = async () => {
    setIsSaving(true);

    // 1. Auto-commit pending inspector drawer changes if a node is currently selected
    let currentNodes = rfNodesRef.current;
    if (selectedNodeId) {
      const keywordsArray = editKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      currentNodes = currentNodes.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              title: editTitle,
              content: editContent,
              triggerKeywords: keywordsArray.length > 0 ? keywordsArray : undefined,
              contactType: editContactType,
              buttons: editButtons.length > 0 ? editButtons : undefined,
              listItems: editListItems.length > 0 ? editListItems : undefined,
              mediaUrl: editMediaUrl || undefined,
              caption: editCaption || undefined,
              delayDuration: editDelayDuration || undefined,
              templateName: editTemplateName || undefined,
              url: editUrl || undefined,
              urlButtonText: editUrlButtonText || undefined,
              location:
                node.type === "location"
                  ? {
                      name: editLocName,
                      address: editLocAddress,
                      lat: Number(editLocLat),
                      lng: Number(editLocLng),
                    }
                  : undefined,
              notifyChannel: editNotifyChannel,
              notifyTarget: editNotifyTarget || undefined,
              targetFlowId: editTargetFlowId || undefined,
              catalog:
                node.type === "catalog"
                  ? {
                      type: editCatalogType,
                      catalogId: editCatalogId,
                      catalogName: editCatalogName,
                      thumbnailProductId: editThumbnailProductId || undefined,
                      bodyText: editContent,
                      footerText: editCatalogFooter || undefined,
                      products: editSelectedProducts,
                    }
                  : (node.data.catalog as CatalogPayload | undefined),
            },
          };
        }
        return node;
      });

      setRfNodes(currentNodes);
      rfNodesRef.current = currentNodes;
    }

    const currentEdges = rfEdgesRef.current;

    const updatedFlowNodes: FlowNode[] = currentNodes.map((node) => {
      const matchingEdge = currentEdges.find((e) => e.source === node.id && !e.sourceHandle);

      const nodeButtons = node.data.buttons
        ? node.data.buttons.map((btn, idx) => {
            const btnEdge = currentEdges.find(
              (e) => e.source === node.id && e.sourceHandle === (btn.id || `btn-${idx}`)
            );
            return {
              ...btn,
              nextNodeId: btnEdge ? btnEdge.target : undefined,
            };
          })
        : undefined;

      const nodeListItems = node.data.listItems
        ? node.data.listItems.map((li, idx) => {
            const liEdge = currentEdges.find(
              (e) => e.source === node.id && e.sourceHandle === (li.id || `list-${idx}`)
            );
            return {
              ...li,
              nextNodeId: liEdge ? liEdge.target : undefined,
            };
          })
        : undefined;

      return {
        id: node.id,
        type: (node.type || "message") as FlowNodeType,
        title: String(node.data.title || "Custom Node"),
        content: String(node.data.content || ""),
        triggerKeywords: node.data.triggerKeywords || undefined,
        contactType: node.data.contactType,
        triggerType: node.data.triggerType,
        buttons: nodeButtons,
        listItems: nodeListItems,
        mediaUrl: node.data.mediaUrl,
        caption: node.data.caption,
        delayDuration: node.data.delayDuration,
        templateName: node.data.templateName,
        url: node.data.url,
        urlButtonText: node.data.urlButtonText,
        location: node.data.location,
        targetFlowId: node.data.targetFlowId,
        notifyChannel: node.data.notifyChannel,
        notifyTarget: node.data.notifyTarget,
        catalog: node.data.catalog as CatalogPayload | undefined,
        nextNodeId: matchingEdge ? matchingEdge.target : undefined,
        position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      };
    });

    // Fingerprint this saved state to prevent circular overwrite
    lastSavedFingerprintRef.current = JSON.stringify(
      updatedFlowNodes.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        position: n.position,
        buttons: n.buttons,
        listItems: n.listItems,
        nextNodeId: n.nextNodeId,
      }))
    );

    try {
      await onUpdateNodes(updatedFlowNodes);
      setHasUnsavedChanges(false);
      setSaveToast(true);
      setContextMenu(null);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err) {
      console.error("Error saving flow nodes:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply edits from Inspector Form
  const handleSaveInspector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId) return;

    const currentNodes = rfNodesRef.current;
    const currentEdges = rfEdgesRef.current;

    const keywordsArray = editKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const nextNodes = currentNodes.map((node) => {
      if (node.id === selectedNodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            title: editTitle,
            content: editContent,
            triggerKeywords: keywordsArray.length > 0 ? keywordsArray : undefined,
            triggerType: editTriggerType,
            contactType: editContactType,
            buttons: editButtons.length > 0 ? editButtons : undefined,
            listItems: editListItems.length > 0 ? editListItems : undefined,
            mediaUrl: editMediaUrl || undefined,
            caption: editCaption || undefined,
            delayDuration: editDelayDuration || undefined,
            templateName: editTemplateName || undefined,
            url: editUrl || undefined,
            urlButtonText: editUrlButtonText || undefined,
            location:
              node.type === "location"
                ? {
                    name: editLocName,
                    address: editLocAddress,
                    lat: Number(editLocLat),
                    lng: Number(editLocLng),
                  }
                : undefined,
            notifyChannel: editNotifyChannel,
            notifyTarget: editNotifyTarget || undefined,
            targetFlowId: editTargetFlowId || undefined,
            catalog:
              node.type === "catalog"
                ? {
                    type: editCatalogType,
                    catalogId: editCatalogId,
                    catalogName: editCatalogName,
                    thumbnailProductId: editThumbnailProductId || undefined,
                    bodyText: editContent,
                    footerText: editCatalogFooter || undefined,
                    products: editSelectedProducts,
                  }
                : (node.data.catalog as CatalogPayload | undefined),
          },
        };
      }
      return node;
    });

    setRfNodes(nextNodes);
    rfNodesRef.current = nextNodes;

    pushHistorySnapshot(nextNodes, currentEdges);
    setHasUnsavedChanges(true);
    setSelectedNodeId(null);
  };

  // Add a new node to canvas from Catalogue
  const handleAddNodeFromCatalogue = (step: StepCatalogItem) => {
    const currentNodes = rfNodesRef.current;
    const currentEdges = rfEdgesRef.current;

    const newId = `node-${Date.now()}`;
    const x = 320 + Math.random() * 80;
    const y = 160 + Math.random() * 80;

    let defaultContent = "Hello! We are here to assist you with your inquiry.";
    let defaultButtons = undefined;
    let defaultListItems = undefined;
    let defaultKeywords = undefined;
    let defaultMediaUrl = undefined;
    let defaultUrl = undefined;
    let defaultUrlButtonText = undefined;
    let defaultLocation = undefined;

    let defaultCatalog: CatalogPayload | undefined = undefined;

    if (step.type === "buttons") {
      defaultContent = "Please choose an option to continue:";
      defaultButtons = [
        { id: `btn-${Date.now()}-1`, title: "Option 1" },
        { id: `btn-${Date.now()}-2`, title: "Option 2" },
      ];
    } else if (step.type === "list") {
      defaultContent = "Explore our catalogue:";
      defaultListItems = [
        { id: `li-${Date.now()}-1`, title: "Services", description: "Learn about what we do" },
        { id: `li-${Date.now()}-2`, title: "Pricing", description: "View monthly plans" },
      ];
    } else if (step.type === "url_cta") {
      defaultContent = "Click the button below to visit our official portal:";
      defaultUrl = "https://wappx.zynexdev.com";
      defaultUrlButtonText = "Open Website";
    } else if (step.type === "location") {
      defaultLocation = {
        name: "WAPPX Headquarters",
        address: "Colombo, Sri Lanka",
        lat: 6.9271,
        lng: 79.8612,
      };
    } else if (["image", "video", "document", "audio"].includes(step.type)) {
      defaultMediaUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800";
    } else if (step.type === "catalog") {
      defaultContent = "Browse our official product catalog and packages directly on WhatsApp:";
      const firstCat = catalogs && catalogs.length > 0 ? catalogs[0] : undefined;
      defaultCatalog = {
        type: "catalog_message",
        catalogId: firstCat?.catalogId || firstCat?.id || "2080375866175781",
        catalogName: firstCat?.name || "Official Business Catalog",
        thumbnailProductId: firstCat?.items?.[0]?.retailerId || firstCat?.items?.[0]?.id || "",
        bodyText: defaultContent,
        footerText: "Tap 'View Catalog' to open store",
        products: firstCat?.items || [],
      };
    } else if (step.type === "trigger") {
      defaultKeywords = ["hi", "hello", "start"];
    }

    const newNode: RfNode = {
      id: newId,
      type: step.type in nodeTypes ? step.type : "message",
      position: { x, y },
      data: {
        title: step.title,
        content: defaultContent,
        type: step.type,
        buttons: defaultButtons,
        listItems: defaultListItems,
        triggerKeywords: defaultKeywords,
        mediaUrl: defaultMediaUrl,
        url: defaultUrl,
        urlButtonText: defaultUrlButtonText,
        location: defaultLocation,
        catalog: defaultCatalog,
        delayDuration: step.type === "delay" ? "5 seconds" : undefined,
        templateName: step.type === "template" ? "order_update_v2" : undefined,
        notifyChannel: "whatsapp",
        notifyTarget: "+94770000000",
        onDuplicate: handleDuplicateNode,
        onDelete: handleDeleteNode,
      },
    };

    const nextNodes = [...currentNodes, newNode];
    setRfNodes(nextNodes);
    rfNodesRef.current = nextNodes;

    pushHistorySnapshot(nextNodes, currentEdges);
    setHasUnsavedChanges(true);
    setIsAddStepOpen(false);

    // Open inspector for immediately customizing
    handleOpenInspectorForNode(newNode);
  };

  const selectedNode = rfNodes.find((n) => n.id === selectedNodeId);
  const contextNode = contextMenu?.nodeId
    ? rfNodes.find((n) => n.id === contextMenu.nodeId)
    : null;
  const contextEdge = contextMenu?.edgeId
    ? rfEdges.find((e) => e.id === contextMenu.edgeId)
    : null;

  // Filter catalogue by search
  const filteredCatalogue = useMemo(() => {
    if (!searchStepQuery.trim()) return STEP_CATALOGUE;
    const q = searchStepQuery.toLowerCase();
    return STEP_CATALOGUE.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchStepQuery]);

  // Group filtered catalogue by category
  const categories: ("Messages & Media" | "Interactive & Branching" | "Logic & Actions" | "Team & Agents")[] = [
    "Messages & Media",
    "Interactive & Branching",
    "Logic & Actions",
    "Team & Agents",
  ];

  // Handle applying AI generated flow
  const handleApplyAiFlow = async (
    aiFlowName: string,
    newNodes: FlowNode[],
    mode: "replace" | "append" | "new_flow"
  ) => {
    if (mode === "new_flow") {
      if (onCreateFlow) {
        await onCreateFlow(
          aiFlowName || `Flow #${(flows?.length || 0) + 1}`,
          "AI Generated Automation Flow",
          newNodes
        );
        return;
      }
    }

    if (mode === "replace") {
      const { nodes: convertedNodes, edges: convertedEdges } = convertFlowNodesToRf(newNodes);
      setRfNodes(convertedNodes);
      setRfEdges(convertedEdges);
      rfNodesRef.current = convertedNodes;
      rfEdgesRef.current = convertedEdges;
      if (aiFlowName) setFlowName(aiFlowName);
      pushHistorySnapshot(convertedNodes, convertedEdges);
      setHasUnsavedChanges(true);
      setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 150);
    } else if (mode === "append") {
      const currentNodes = rfNodesRef.current;
      const currentEdges = rfEdgesRef.current;
      const maxX = currentNodes.reduce((max, n) => Math.max(max, n.position.x), 0);
      const shiftedNodes = newNodes.map((n) => ({
        ...n,
        id: `ai-${Date.now().toString(36)}-${n.id}`,
        position: { x: n.position.x + maxX + 400, y: n.position.y },
        nextNodeId: n.nextNodeId ? `ai-${Date.now().toString(36)}-${n.nextNodeId}` : undefined,
        buttons: n.buttons?.map((b) => ({
          ...b,
          id: `btn-ai-${Date.now().toString(36)}-${b.id}`,
          nextNodeId: b.nextNodeId ? `ai-${Date.now().toString(36)}-${b.nextNodeId}` : undefined,
        })),
        listItems: n.listItems?.map((li) => ({
          ...li,
          id: `li-ai-${Date.now().toString(36)}-${li.id}`,
          nextNodeId: li.nextNodeId ? `ai-${Date.now().toString(36)}-${li.nextNodeId}` : undefined,
        })),
      }));
      const { nodes: convertedNodes, edges: convertedEdges } = convertFlowNodesToRf(shiftedNodes);
      const combinedNodes = [...currentNodes, ...convertedNodes];
      const combinedEdges = [...currentEdges, ...convertedEdges];
      setRfNodes(combinedNodes);
      setRfEdges(combinedEdges);
      rfNodesRef.current = combinedNodes;
      rfEdgesRef.current = combinedEdges;
      pushHistorySnapshot(combinedNodes, combinedEdges);
      setHasUnsavedChanges(true);
      setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 150);
    }
  };

  // Filtered flows for the dropdown
  const filteredFlows = useMemo(() => {
    if (!flows) return [];
    if (!flowSearchQuery.trim()) return flows;
    return flows.filter((f) =>
      f.name.toLowerCase().includes(flowSearchQuery.toLowerCase())
    );
  }, [flows, flowSearchQuery]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-[#F7F7F2] overflow-hidden relative font-secondary">
      {/* ========================================================================= */}
      {/* TOP CANVAS TOOLBAR WITH MULTI-FLOW SELECTOR & AI FLOW ASSISTANT            */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-slate-200/70 px-5 py-3 flex flex-wrap items-center justify-between gap-4 z-20 shadow-2xs font-secondary">
        {/* Left: Back button to Flows list & Flow Selector */}
        <div className="flex items-center gap-3 relative" id="flow-selector-container">
          {/* Back to Flow List button */}
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-light text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors cursor-pointer mr-1"
              title="Back to Flows List"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flows</span>
            </button>
          )}

          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <GitFork className="w-4 h-4" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              {/* Flow Selector Dropdown Trigger */}
              {flows && flows.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFlowDropdownOpen(!isFlowDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-normal text-xs cursor-pointer transition-all"
                    title="Switch or manage bot flows"
                  >
                    <span className="truncate max-w-[180px] sm:max-w-[240px]">
                      {currentFlow?.name || flowName}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFlowDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Multi-Flow Popover Menu */}
                  {isFlowDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 pb-2 border-b border-slate-100">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={flowSearchQuery}
                            onChange={(e) => setFlowSearchQuery(e.target.value)}
                            placeholder="Search flows..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-light outline-hidden focus:border-slate-400"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 px-1.5">
                        <div className="px-2 py-1 text-[10px] font-light uppercase tracking-wider text-slate-400">
                          Your Flows ({flows.length})
                        </div>
                        {filteredFlows.map((f) => {
                          const isSelected = f.id === currentFlow?.id;
                          return (
                            <div
                              key={f.id}
                              className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-slate-100 text-slate-900 font-normal"
                                  : "text-slate-600 hover:bg-slate-50 font-light"
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setIsFlowDropdownOpen(false);
                                  return;
                                }
                                if (hasUnsavedChanges) {
                                  setFlowSwitchPendingId(f.id);
                                  setIsFlowDropdownOpen(false);
                                  return;
                                }
                                setIsFlowDropdownOpen(false);
                                onSelectFlow?.(f.id);
                              }}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    f.isActive ? "bg-emerald-500" : "bg-slate-300"
                                  }`}
                                />
                                <span className="truncate">{f.name}</span>
                                {f.isDefault && (
                                  <span className="text-[11px] font-light text-amber-600">
                                    &bull; Default
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[10px] text-slate-400 font-light">
                                  {f.nodes ? f.nodes.length : 0} steps
                                </span>

                                {/* Quick duplicate */}
                                {onDuplicateFlow && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDuplicateFlow(f.id);
                                    }}
                                    className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white cursor-pointer"
                                    title="Duplicate Flow"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Delete flow (opens custom professional modal) */}
                                {onDeleteFlow && flows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsFlowDropdownOpen(false);
                                      setFlowToDelete(f);
                                    }}
                                    className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                                    title="Delete Flow"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* New Flow Action Button (opens custom professional modal) */}
                      {onCreateFlow && (
                        <div className="pt-2 px-2 border-t border-slate-100 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsFlowDropdownOpen(false);
                              setNewFlowNameInput(`Automation Flow #${flows.length + 1}`);
                              setIsCreateFlowModalOpen(true);
                            }}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-normal rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New Flow</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={flowName}
                  onChange={(e) => {
                    setFlowName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="text-sm font-normal text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white focus:border-slate-300 px-1.5 py-0.5 rounded-lg border border-transparent outline-hidden max-w-xs md:max-w-md font-light"
                />
              )}

              {/* Status Indicator (Minimal, no background border tag) */}
              <span className="text-xs font-light text-slate-500 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    currentFlow?.isActive ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <span>{currentFlow?.isActive ? "Active" : "Draft"}</span>
              </span>

              {/* Step count (Minimal, no background border tag) */}
              <span className="text-xs font-light text-slate-400">
                &bull; {rfNodes.length} steps
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 font-light">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasUnsavedChanges ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[11px] text-slate-400 font-light">
                {flows ? `${flows.length} flows configured` : `${rfNodes.length} steps`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Undo/Redo, AI Flow Assistant, Add Step, Test, Save */}
        <div className="flex items-center gap-2">
          {/* Active / Draft Minimal Toggle Switch */}
          {currentFlow && onToggleFlowActive && (
            <div className="flex items-center gap-2 pr-1 border-r border-slate-200">
              <button
                type="button"
                onClick={() => onToggleFlowActive(currentFlow.id, !currentFlow.isActive)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  currentFlow.isActive ? "bg-emerald-600" : "bg-slate-200"
                }`}
                title={
                  currentFlow.isActive
                    ? "Active on WhatsApp (click to deactivate)"
                    : "Draft (click to activate on WhatsApp)"
                }
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out mt-0.5 ${
                    currentFlow.isActive ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-xs font-light text-slate-600 hidden sm:inline">
                {currentFlow.isActive ? "Active" : "Draft"}
              </span>
            </div>
          )}

          {/* UNDO & REDO BUTTONS */}
          <div className="flex items-center bg-[#F7F7F2] p-1 rounded-xl border border-slate-200 gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`px-2 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                canUndo
                  ? "text-[#0A504A] hover:bg-white hover:shadow-xs cursor-pointer"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`px-2 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all ${
                canRedo
                  ? "text-[#0A504A] hover:bg-white hover:shadow-xs cursor-pointer"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          </div>

          {/* AI FLOW ARCHITECT BUTTON */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0A504A] via-[#00A86B] to-[#0A504A] hover:brightness-110 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-emerald-400/30 group"
            title="Open AI Flow Architect (Copy instruction prompts & generate flows from code)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#A2E4B8] group-hover:rotate-12 transition-transform" />
            <span className="tracking-wide">AI Flow Assistant</span>
          </button>

          {/* Add a Step Drawer Toggle */}
          <button
            onClick={() => setIsAddStepOpen(!isAddStepOpen)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer ${
              isAddStepOpen
                ? "bg-[#0A504A] text-white"
                : "bg-white text-[#0A504A] border border-[#0A504A]/20 hover:bg-[#F7F7F2]"
            }`}
          >
            <Plus className="w-4 h-4 text-[#00A86B]" />
            <span>Add a Step</span>
          </button>

          {/* Test Simulator */}
          <button
            onClick={onOpenSimulator}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-[#0A504A] border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#00A86B]" />
            <span className="hidden sm:inline">Test Simulator</span>
          </button>

          {/* Save Flow Button */}
          <button
            type="button"
            onClick={handleSaveAllNodes}
            disabled={isSaving}
            className="px-4 py-2 bg-[#00A86B] hover:bg-[#0A504A] disabled:opacity-75 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : saveToast ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Database!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Flow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CANVAS & OVERLAYS CONTAINER                                               */}
      {/* ========================================================================= */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          deleteKeyCode={["Backspace", "Delete"]}
        >
          {/* Subtle dots background */}
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#cbd5e1" />

          {/* Canvas Controls */}
          <Controls
            position="bottom-left"
            className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
          />

          {/* MiniMap */}
          <MiniMap
            position="bottom-right"
            className="hidden sm:block rounded-xl border border-slate-200 shadow-lg overflow-hidden bg-white/90"
            nodeColor={(n) => {
              if (n.type === "trigger") return "#0A504A";
              if (n.type === "buttons") return "#00A86B";
              if (n.type === "human_handoff") return "#f59e0b";
              if (n.type === "url_cta") return "#3b82f6";
              if (n.type === "location") return "#f43f5e";
              return "#A2E4B8";
            }}
          />
        </ReactFlow>

        {/* ========================================================================= */}
        {/* RIGHT CLICK CONTEXT MENU                                                  */}
        {/* ========================================================================= */}
        {contextMenu && (
          <div
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 w-52 select-none"
          >
            {contextNode ? (
              // 1. Context Menu on a Node
              <div>
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0A504A] truncate max-w-[120px]">
                    {contextNode.data.title || "Step"}
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    {contextNode.type}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenInspectorForNode(contextNode);
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-[#F7F7F2] hover:text-[#00A86B] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#00A86B]" />
                    <span>Edit Properties</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateNode(contextNode.id)}
                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-[#F7F7F2] hover:text-[#00A86B] flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Duplicate Step</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => handleDeleteNode(contextNode.id)}
                    className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Delete Step</span>
                  </button>
                </div>
              </div>
            ) : contextEdge ? (
              // 2. Context Menu on a Connection Link / Edge
              <div>
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-[#0A504A]">Connection Link</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    EDGE
                  </span>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleDeleteEdge(contextEdge.id)}
                    className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors font-semibold"
                  >
                    <X className="w-3.5 h-3.5 text-red-500" />
                    <span>Break / Disconnect Link</span>
                  </button>
                </div>
              </div>
            ) : (
              // 3. Context Menu on Canvas Pane
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddStepOpen(true);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-[#F7F7F2] hover:text-[#00A86B] flex items-center gap-2 cursor-pointer transition-colors font-medium"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>Add a Step</span>
                </button>
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={() => {
                    handleUndo();
                    setContextMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                    canUndo
                      ? "text-slate-700 hover:bg-[#F7F7F2] hover:text-[#00A86B] cursor-pointer"
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo (Ctrl+Z)</span>
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={() => {
                    handleRedo();
                    setContextMenu(null);
                  }}
                  className={`w-full px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                    canRedo
                      ? "text-slate-700 hover:bg-[#F7F7F2] hover:text-[#00A86B] cursor-pointer"
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Redo (Ctrl+Y)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fitView({ duration: 400 });
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-[#F7F7F2] hover:text-[#00A86B] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Fit to Screen</span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={handleSaveAllNodes}
                  className="w-full px-3 py-1.5 text-xs text-[#0A504A] hover:bg-[#F7F7F2] flex items-center gap-2 cursor-pointer transition-colors font-semibold"
                >
                  <Save className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>Save Flow</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* "ADD A STEP" DRAWER (UNIFIED BRAND-COORDINATED ICONS)                       */}
        {/* ========================================================================= */}
        {isAddStepOpen && (
          <div className="absolute top-4 left-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col z-30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A504A]">Add a Step</h3>
                  <p className="text-[10px] text-slate-400">Choose from 15 automation node types</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStepOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative my-3">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search steps..."
                value={searchStepQuery}
                onChange={(e) => setSearchStepQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
              />
            </div>

            {/* Catalog list grouped by category — UNIFIED SLEEK MONOCHROME ICONS */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
              {categories.map((cat) => {
                const itemsInCat = filteredCatalogue.filter((item) => item.category === cat);
                if (itemsInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      {cat}
                    </span>
                    <div className="space-y-1">
                      {itemsInCat.map((step) => {
                        const ItemIcon = step.icon;
                        return (
                          <button
                            key={step.type}
                            type="button"
                            onClick={() => handleAddNodeFromCatalogue(step)}
                            className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-[#00A86B]/40 hover:bg-[#F7F7F2] flex items-start gap-3 group cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#0A504A]/5 group-hover:bg-[#00A86B]/15 border border-[#0A504A]/10 flex items-center justify-center text-[#0A504A] group-hover:text-[#00A86B] shrink-0 mt-0.5 transition-colors">
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-xs text-[#0A504A] group-hover:text-[#00A86B] transition-colors block">
                                {step.title}
                              </span>
                              <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                                {step.description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00A86B] shrink-0 mt-2 transition-colors" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* NODE INSPECTOR DRAWER (When a node is clicked)                             */}
        {/* ========================================================================= */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bottom-4 w-92 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col justify-between z-30 overflow-y-auto no-scrollbar">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#0A504A]">Step Properties</h3>
                    <p className="text-[10px] font-mono text-slate-400 capitalize">
                      {selectedNode.type?.replace("_", " ")} Node
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveInspector} className="space-y-4 mt-4">
                {/* Node Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Step Label / Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setEditTitle(newTitle);
                      setHasUnsavedChanges(true);
                      setRfNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, title: newTitle } }
                            : n
                        )
                      );
                      rfNodesRef.current = rfNodesRef.current.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, title: newTitle } }
                          : n
                      );
                    }}
                    className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium"
                  />
                </div>

                {/* Inbound Trigger Specifics */}
                {selectedNode.type === "trigger" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Trigger Event</label>
                      <select
                        value={editTriggerType}
                        onChange={(e) => {
                          const val = e.target.value as "new_message" | "keyword_match" | "order_placed";
                          setEditTriggerType(val);
                          setHasUnsavedChanges(true);
                          setRfNodes((nds) =>
                            nds.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, triggerType: val } }
                                : n
                            )
                          );
                          rfNodesRef.current = rfNodesRef.current.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, triggerType: val } }
                              : n
                          );
                        }}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium cursor-pointer"
                      >
                        <option value="new_message">Incoming WhatsApp Message (Default)</option>
                        <option value="keyword_match">Keyword Match (e.g. hi, info, quote)</option>
                        <option value="order_placed">🛍️ WhatsApp Catalog Order Placed</option>
                      </select>
                    </div>

                    {editTriggerType === "order_placed" && (
                      <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 space-y-1.5">
                        <div className="font-semibold flex items-center gap-1.5 text-amber-950">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          <span>WhatsApp In-App Order Event</span>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-amber-800 font-light">
                          Triggers automatically whenever a customer submits an order via your WhatsApp Catalog. Connect subsequent nodes to send payment bank details, delivery notes, or request agent confirmation.
                        </p>
                        <div className="text-[10px] font-mono text-amber-700 bg-amber-100/60 p-1.5 rounded-lg border border-amber-200/60">
                          Variables: &#123;&#123;order_id&#125;&#125; &#123;&#123;order_total&#125;&#125; &#123;&#123;order_items&#125;&#125; &#123;&#123;name&#125;&#125;
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Contact Filter</label>
                      <select
                        value={editContactType}
                        onChange={(e) => setEditContactType(e.target.value as "any_contact" | "new_contact" | "existing_contact")}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium cursor-pointer"
                      >
                        <option value="any_contact">Any Contact (Default)</option>
                        <option value="new_contact">New Contacts Only (First time)</option>
                        <option value="existing_contact">Existing Contacts Only</option>
                      </select>
                    </div>

                    {editTriggerType !== "order_placed" && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">
                          Trigger Keywords (Comma separated)
                        </label>
                        <input
                          type="text"
                          value={editKeywords}
                          onChange={(e) => setEditKeywords(e.target.value)}
                          placeholder="help, hi, hello, order, quote"
                          className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                        />
                        <p className="text-[10px] text-slate-400">Leave blank to trigger on ANY incoming message.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Message Content (For standard message, buttons, list, cta, and handoff) */}
                {["message", "buttons", "list", "url_cta", "human_handoff", "end_conversation"].includes(
                  selectedNode.type || ""
                ) && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-[11px] font-bold text-slate-600">Message Body</label>
                      {/* Customer Variable Chips */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const next = editContent + " {{name}}";
                            setEditContent(next);
                            setHasUnsavedChanges(true);
                            setRfNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, content: next } }
                                  : n
                              )
                            );
                            rfNodesRef.current = rfNodesRef.current.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, content: next } }
                                : n
                            );
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 hover:bg-[#0A504A]/10 text-[#0A504A] rounded border border-slate-200 cursor-pointer"
                        >
                          +&#123;&#123;name&#125;&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = editContent + " {{order_id}}";
                            setEditContent(next);
                            setHasUnsavedChanges(true);
                            setRfNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, content: next } }
                                  : n
                              )
                            );
                            rfNodesRef.current = rfNodesRef.current.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, content: next } }
                                : n
                            );
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 cursor-pointer"
                        >
                          +&#123;&#123;order_id&#125;&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = editContent + " {{order_total}}";
                            setEditContent(next);
                            setHasUnsavedChanges(true);
                            setRfNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, content: next } }
                                  : n
                              )
                            );
                            rfNodesRef.current = rfNodesRef.current.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, content: next } }
                                : n
                            );
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 cursor-pointer"
                        >
                          +&#123;&#123;order_total&#125;&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = editContent + " {{phone}}";
                            setEditContent(next);
                            setHasUnsavedChanges(true);
                            setRfNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, content: next } }
                                  : n
                              )
                            );
                            rfNodesRef.current = rfNodesRef.current.map((n) =>
                              n.id === selectedNode.id
                                ? { ...n, data: { ...n.data, content: next } }
                                : n
                            );
                          }}
                          className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 hover:bg-[#0A504A]/10 text-[#0A504A] rounded border border-slate-200 cursor-pointer"
                        >
                          +&#123;&#123;phone&#125;&#125;
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={editContent}
                      onChange={(e) => {
                        const newContent = e.target.value;
                        setEditContent(newContent);
                        setHasUnsavedChanges(true);
                        setRfNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, content: newContent } }
                              : n
                          )
                        );
                        rfNodesRef.current = rfNodesRef.current.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, content: newContent } }
                            : n
                        );
                      }}
                      className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden leading-relaxed"
                    />
                  </div>
                )}

                {/* WHATSAPP IN-APP BUSINESS CATALOG INSPECTOR */}
                {selectedNode.type === "catalog" && (
                  <div className="space-y-4">
                    {/* Header Banner */}
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A504A]">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#00A86B]" />
                        <span>WhatsApp In-App Commerce Catalog</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-light">
                        Sends a native Meta Commerce interactive catalog message. Customers tap <strong className="font-semibold text-slate-800">&quot;View catalog&quot;</strong> to browse your business catalog natively inside WhatsApp, add items to cart, and place orders directly.
                      </p>
                    </div>

                    {/* Catalog Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Select Business Catalog</label>
                      {catalogs && catalogs.length > 0 ? (
                        <select
                          value={editCatalogId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditCatalogId(val);
                            const matched = catalogs.find((c) => (c.catalogId || c.id) === val);
                            if (matched) {
                              setEditCatalogName(matched.name);
                              setEditSelectedProducts(matched.items || []);
                              if (matched.items?.[0]) {
                                setEditThumbnailProductId(matched.items[0].retailerId || matched.items[0].id);
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium cursor-pointer"
                        >
                          {catalogs.map((cat) => (
                            <option key={cat.id} value={cat.catalogId || cat.id}>
                              {cat.name} ({cat.items?.length || 0} products) {cat.catalogId ? `• ID: ${cat.catalogId}` : ""}
                            </option>
                          ))}
                          <option value="custom">-- Custom Meta Catalog ID --</option>
                        </select>
                      ) : (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800">
                          <p className="font-semibold">No catalogs found in workspace</p>
                          <p className="text-[11px] font-light mt-0.5">Enter your Meta Catalog ID manually below or create a catalog in the Catalog tab.</p>
                        </div>
                      )}

                      {/* Manual / Custom Catalog ID if selected */}
                      {(editCatalogId === "custom" || !catalogs || catalogs.length === 0) && (
                        <div className="pt-1.5 space-y-1.5">
                          <input
                            type="text"
                            placeholder="Enter Meta Catalog ID (e.g. 2080375866175781)"
                            value={editCatalogId === "custom" ? "" : editCatalogId}
                            onChange={(e) => setEditCatalogId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                          />
                          <input
                            type="text"
                            placeholder="Catalog Display Name"
                            value={editCatalogName}
                            onChange={(e) => setEditCatalogName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                          />
                        </div>
                      )}
                    </div>

                    {/* Delivery Format */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">Catalog Delivery Format</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setEditCatalogType("catalog_message")}
                          className={`py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer ${
                            editCatalogType === "catalog_message"
                              ? "bg-white text-[#0A504A] shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 font-normal"
                          }`}
                        >
                          In-App Store
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCatalogType("product_list")}
                          className={`py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer ${
                            editCatalogType === "product_list"
                              ? "bg-white text-[#0A504A] shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 font-normal"
                          }`}
                        >
                          Product List
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCatalogType("product")}
                          className={`py-1.5 px-2 rounded-lg text-[11px] transition-all cursor-pointer ${
                            editCatalogType === "product"
                              ? "bg-white text-[#0A504A] shadow-xs font-bold"
                              : "text-slate-600 hover:text-slate-900 font-normal"
                          }`}
                        >
                          Single Item
                        </button>
                      </div>
                      <p className="text-[10.5px] text-slate-500 font-light">
                        {editCatalogType === "catalog_message"
                          ? "Displays native 'View catalog' button opening the full in-app store with cart & checkout."
                          : editCatalogType === "product_list"
                          ? "Displays an interactive section list of selected products with prices."
                          : "Displays a single featured product card with image and price."}
                      </p>
                    </div>

                    {/* Featured Thumbnail Product SKU (For catalog_message) */}
                    {editCatalogType === "catalog_message" && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Featured Card Thumbnail (SKU)</label>
                        {editSelectedProducts && editSelectedProducts.length > 0 ? (
                          <select
                            value={editThumbnailProductId}
                            onChange={(e) => setEditThumbnailProductId(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden cursor-pointer"
                          >
                            <option value="">-- First product in catalog (Default) --</option>
                            {editSelectedProducts.map((p) => (
                              <option key={p.id} value={p.retailerId || p.id}>
                                {p.title} ({p.price || "LKR"}) {p.retailerId ? `[SKU: ${p.retailerId}]` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Product Retailer ID / SKU (e.g. PROD-001)"
                            value={editThumbnailProductId}
                            onChange={(e) => setEditThumbnailProductId(e.target.value)}
                            className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                          />
                        )}
                        <p className="text-[10px] text-slate-400 font-light">
                          Meta uses this item image as the thumbnail header on the WhatsApp catalog card.
                        </p>
                      </div>
                    )}

                    {/* Product Selection Checklist (For product_list or product) */}
                    {(editCatalogType === "product_list" || editCatalogType === "product") && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                          <span>
                            {editCatalogType === "product" ? "Select Featured Product" : "Products in this Catalog"}
                          </span>
                          <span className="text-[10px] font-normal text-slate-400">
                            {editSelectedProducts.length} items
                          </span>
                        </label>
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-[#F7F7F2]/50 p-1">
                          {editSelectedProducts.map((prod) => {
                            const isSelected = editCatalogType === "product"
                              ? editThumbnailProductId === (prod.retailerId || prod.id)
                              : true;

                            return (
                              <div
                                key={prod.id}
                                onClick={() => {
                                  if (editCatalogType === "product") {
                                    setEditThumbnailProductId(prod.retailerId || prod.id);
                                  }
                                }}
                                className="p-2 flex items-center gap-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                              >
                                {prod.imageUrl ? (
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.title}
                                    className="w-8 h-8 rounded-md object-cover bg-slate-100 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-slate-200 flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-slate-800 truncate">{prod.title}</p>
                                  <p className="text-[10px] text-slate-500 font-mono truncate">{prod.price || "LKR"}</p>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Message Caption (Body Text) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600">Message Caption (Body)</label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = editContent + " {{name}}";
                              setEditContent(next);
                            }}
                            className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 hover:bg-[#0A504A]/10 text-[#0A504A] rounded border border-slate-200 cursor-pointer"
                          >
                            +&#123;&#123;name&#125;&#125;
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Browse our official product catalog directly within WhatsApp:"
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden leading-relaxed"
                      />
                    </div>

                    {/* Footer Text */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Card Footer</label>
                      <input
                        type="text"
                        value={editCatalogFooter}
                        onChange={(e) => setEditCatalogFooter(e.target.value)}
                        placeholder="Tap 'View Catalog' to open store"
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>

                    {/* WhatsApp In-App Live Mobile Preview */}
                    <div className="pt-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                        WhatsApp Live In-App Preview
                      </label>
                      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#0A504A]">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="w-3 h-3 text-[#00A86B]" />
                            <span className="truncate max-w-[150px]">{editCatalogName || "Business Catalog"}</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase font-bold text-[#00A86B] bg-emerald-50 px-1.5 py-0.5 rounded">
                            {editCatalogType === "catalog_message" ? "In-App Store" : editCatalogType === "product_list" ? "Items" : "Product"}
                          </span>
                        </div>

                        {/* Thumbnail image */}
                        {editSelectedProducts?.[0]?.imageUrl && (
                          <div className="h-28 w-full bg-slate-100 overflow-hidden relative">
                            <img
                              src={editSelectedProducts[0].imageUrl}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            {editSelectedProducts[0].price && (
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-white/95 rounded-md text-[11px] font-bold text-[#00A86B] shadow-xs">
                                {editSelectedProducts[0].price}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-3 space-y-1">
                          <p className="text-xs text-slate-800 leading-relaxed font-light">
                            {editContent || "Browse our official product catalog and packages directly on WhatsApp:"}
                          </p>
                          {editCatalogFooter && (
                            <p className="text-[10px] text-slate-400 font-light">
                              {editCatalogFooter}
                            </p>
                          )}
                        </div>

                        <div className="p-2 bg-slate-50 border-t border-slate-100">
                          <div className="w-full py-2 bg-[#00A86B] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>
                              {editCatalogType === "product_list" ? "View Products" : editCatalogType === "product" ? "View Product" : "View Catalog"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delay Duration */}
                {selectedNode.type === "delay" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Wait Duration</label>
                    <input
                      type="text"
                      value={editDelayDuration}
                      onChange={(e) => setEditDelayDuration(e.target.value)}
                      placeholder="e.g. 5 seconds, 1 minute, 2 hours"
                      className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium"
                    />
                  </div>
                )}

                {/* Template Message Selector */}
                {selectedNode.type === "template" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Meta Approved Template</label>
                      <select
                        value={editTemplateName}
                        onChange={(e) => setEditTemplateName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium cursor-pointer"
                      >
                        <option value="order_update_v2">order_update_v2 (Utility)</option>
                        <option value="welcome_offer_30">welcome_offer_30 (Marketing)</option>
                        <option value="appointment_reminder">appointment_reminder (Utility)</option>
                        <option value="payment_receipt">payment_receipt (Utility)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Template Fallback / Preview Text</label>
                      <textarea
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Media URL & Caption (Image, Video, Document, Audio) */}
                {["image", "video", "document", "audio"].includes(selectedNode.type || "") && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Media Public URL</label>
                      <input
                        type="url"
                        value={editMediaUrl}
                        onChange={(e) => setEditMediaUrl(e.target.value)}
                        placeholder="https://example.com/asset.jpg"
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>
                    {selectedNode.type !== "audio" && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Media Caption</label>
                        <input
                          type="text"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder="Optional caption text..."
                          className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Buttons (up to 3) */}
                {selectedNode.type === "buttons" && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>Quick Reply Buttons (Max 3)</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editButtons.length < 3) {
                            setEditButtons([
                              ...editButtons,
                              { id: `btn-${Date.now()}`, title: `Choice ${editButtons.length + 1}` },
                            ]);
                          }
                        }}
                        className="text-[10px] font-bold text-[#00A86B] hover:underline cursor-pointer"
                      >
                        + Add Button
                      </button>
                    </label>

                    {editButtons.map((btn, idx) => (
                      <div key={btn.id || idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={btn.title}
                          onChange={(e) => {
                            const updated = [...editButtons];
                            updated[idx].title = e.target.value;
                            setEditButtons(updated);
                          }}
                          className="flex-1 px-3 py-1.5 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditButtons(editButtons.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive List Items */}
                {selectedNode.type === "list" && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>List Options (Max 10)</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (editListItems.length < 10) {
                            setEditListItems([
                              ...editListItems,
                              {
                                id: `li-${Date.now()}`,
                                title: `Option ${editListItems.length + 1}`,
                                description: "Description",
                              },
                            ]);
                          }
                        }}
                        className="text-[10px] font-bold text-[#00A86B] hover:underline cursor-pointer"
                      >
                        + Add List Item
                      </button>
                    </label>

                    {editListItems.map((li, idx) => (
                      <div key={li.id || idx} className="p-2 bg-[#F7F7F2] border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Item Title"
                            value={li.title}
                            onChange={(e) => {
                              const updated = [...editListItems];
                              updated[idx].title = e.target.value;
                              setEditListItems(updated);
                            }}
                            className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0A504A]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditListItems(editListItems.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Optional Description"
                          value={li.description || ""}
                          onChange={(e) => {
                            const updated = [...editListItems];
                            updated[idx].description = e.target.value;
                            setEditListItems(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* URL / CTA Button */}
                {selectedNode.type === "url_cta" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Button Display Text</label>
                      <input
                        type="text"
                        value={editUrlButtonText}
                        onChange={(e) => setEditUrlButtonText(e.target.value)}
                        placeholder="e.g. View Website"
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Destination URL</label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Location Pin */}
                {selectedNode.type === "location" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Location / Branch Name</label>
                      <input
                        type="text"
                        value={editLocName}
                        onChange={(e) => setEditLocName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Street Address</label>
                      <input
                        type="text"
                        value={editLocAddress}
                        onChange={(e) => setEditLocAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editLocLat}
                          onChange={(e) => setEditLocLat(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editLocLng}
                          onChange={(e) => setEditLocLng(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notify Team */}
                {selectedNode.type === "notify_team" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Notification Channel</label>
                      <select
                        value={editNotifyChannel}
                        onChange={(e) => setEditNotifyChannel(e.target.value as "whatsapp" | "email")}
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium cursor-pointer"
                      >
                        <option value="whatsapp">Internal WhatsApp Alert</option>
                        <option value="email">Staff Email Notification</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Target Phone or Email</label>
                      <input
                        type="text"
                        value={editNotifyTarget}
                        onChange={(e) => setEditNotifyTarget(e.target.value)}
                        placeholder="+9477... or alerts@zynex.lk"
                        className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Sub Flow Selection */}
                {selectedNode.type === "sub_flow" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Target Automation Flow</label>
                    <select
                      value={editTargetFlowId}
                      onChange={(e) => setEditTargetFlowId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium cursor-pointer"
                    >
                      <option value="">Select a target flow...</option>
                      {flows && flows.length > 0 ? (
                        flows
                          .filter((f) => f.id !== currentFlow?.id)
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} {f.isActive ? "✓ (Active)" : "(Draft)"}
                            </option>
                          ))
                      ) : (
                        <>
                          <option value="Lead Qualification Flow">Lead Qualification Flow</option>
                          <option value="Order Status Inquiry Flow">Order Status Inquiry Flow</option>
                          <option value="After-Hours Auto-Responder">After-Hours Auto-Responder</option>
                          <option value="Customer Feedback Collection">Customer Feedback Collection</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0A504A] hover:bg-[#00A86B] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer mt-2"
                >
                  Apply Changes
                </button>
              </form>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleDuplicateNode(selectedNode.id)}
                  className="text-xs text-slate-600 hover:text-[#00A86B] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400">ID: {selectedNode.id}</span>
            </div>
          </div>
        )}
      </div>

      {/* AI FLOW ARCHITECT MODAL (System Prompt & Flow Generator) */}
      <AiFlowGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyFlow={handleApplyAiFlow}
        currentFlowCount={flows ? flows.length : 1}
      />

      {/* ========================================================================= */}
      {/* PROFESSIONAL CREATE FLOW MODAL (Zero window.prompt)                      */}
      {/* ========================================================================= */}
      {isCreateFlowModalOpen && (
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
                onClick={() => setIsCreateFlowModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newFlowNameInput.trim()) return;
                onCreateFlow?.(newFlowNameInput.trim());
                setIsCreateFlowModalOpen(false);
                setNewFlowNameInput("");
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">Flow Name</label>
                <input
                  type="text"
                  required
                  value={newFlowNameInput}
                  onChange={(e) => setNewFlowNameInput(e.target.value)}
                  placeholder="e.g. Lead Qualification Flow"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateFlowModalOpen(false)}
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
                {flows && flows.length <= 1 ? (
                  <p className="text-xs font-light text-slate-500 mt-1 leading-relaxed">
                    You cannot delete <strong>&quot;{flowToDelete.name}&quot;</strong> because it is the only remaining flow in your workspace.
                  </p>
                ) : (
                  <p className="text-xs font-light text-slate-500 mt-1 leading-relaxed">
                    Are you sure you want to delete <strong>&quot;{flowToDelete.name}&quot;</strong>? This action will permanently remove this flow.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlowToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {flows && flows.length <= 1 ? "Close" : "Cancel"}
                </button>

                {flows && flows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteFlow?.(flowToDelete.id);
                      setFlowToDelete(null);
                    }}
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

      {/* ========================================================================= */}
      {/* PROFESSIONAL UNSAVED CHANGES MODAL (Zero window.confirm)                  */}
      {/* ========================================================================= */}
      {flowSwitchPendingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-normal text-slate-900">Unsaved Changes</h3>
                <p className="text-xs font-light text-slate-500 mt-1 leading-relaxed">
                  You have unsaved changes in this flow. Switching to another flow will discard them. Would you like to continue?
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFlowSwitchPendingId(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetId = flowSwitchPendingId;
                    setFlowSwitchPendingId(null);
                    setHasUnsavedChanges(false);
                    onSelectFlow?.(targetId);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Discard & Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
import { FlowNode, FlowNodeType } from "@/types/whatsapp";
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
  Radio,
  Maximize2,
  Undo2,
  Redo2,
  Loader2,
  ShoppingBag,
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
  triggerType?: "new_message" | "keyword_match";
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

        {data.triggerKeywords && data.triggerKeywords.length > 0 && (
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
        )}
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
        badgeText="COMMERCE"
        id={id}
        onDuplicate={data.onDuplicate}
        onDelete={data.onDelete}
      />
      <div className="p-3.5 space-y-2">
        <p className="text-xs font-bold text-[#0A504A]">{data.title || "WhatsApp Catalog"}</p>
        <p className="text-[11px] text-slate-600 line-clamp-2">
          {data.content || "Explore our official product catalog and packages directly on WhatsApp."}
        </p>
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-[#00A86B]">
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> View Catalog
          </span>
          <span className="text-[10px] text-slate-400 font-mono">In-App Store</span>
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
// MAIN FLOW BUILDER COMPONENT WITH UNDO / REDO & BREAK-LINK CAPABILITY
// =========================================================================

interface FlowBuilderProps {
  nodes: FlowNode[];
  onUpdateNodes: (nodes: FlowNode[]) => Promise<boolean> | Promise<void> | void;
  onOpenSimulator: () => void;
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
}: FlowBuilderProps) {
  const { fitView } = useReactFlow();

  // Topbar Flow Name & Unsaved state
  const [flowName, setFlowName] = useState("Main Inbound & Customer Support Flow");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

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

  // Close context menu on any outside click
  useEffect(() => {
    const handleDocumentClick = () => setContextMenu(null);
    window.addEventListener("click", handleDocumentClick);
    return () => window.removeEventListener("click", handleDocumentClick);
  }, []);

  // Inspector edit form fields
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
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
  const initialReactFlowNodes: RfNode[] = useMemo(() => {
    return initialFlowNodes.map((fn, index) => {
      const defaultX = 150 + (index % 3) * 320;
      const defaultY = 100 + Math.floor(index / 3) * 260;

      let resolvedType = fn.type in nodeTypes ? fn.type : "message";
      // Auto-resolve to buttons if node contains buttons data
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
        },
      };
    });
  }, [initialFlowNodes]);

  // Generate initial React Flow edges with custom removable edge type
  const initialReactFlowEdges: Edge[] = useMemo(() => {
    const edgesList: Edge[] = [];
    const validNodeIds = new Set(initialFlowNodes.map((n) => n.id));

    initialFlowNodes.forEach((fn) => {
      const isButtons = fn.type === "buttons" || (fn.buttons && fn.buttons.length > 0);
      const isList = fn.type === "list" || (fn.listItems && fn.listItems.length > 0);

      // 1. Single next node connection (for non-branching nodes)
      if (fn.nextNodeId && !isButtons && !isList && validNodeIds.has(fn.nextNodeId)) {
        edgesList.push({
          id: `edge-${fn.id}-${fn.nextNodeId}`,
          source: fn.id,
          target: fn.nextNodeId,
          type: "removable",
          animated: false,
          style: { stroke: "#00A86B", strokeWidth: 2 },
        });
      }

      // 2. Buttons branching connections: ONLY when node type is buttons
      if (isButtons && fn.buttons && Array.isArray(fn.buttons)) {
        fn.buttons.forEach((btn, bIdx) => {
          if (btn.nextNodeId && validNodeIds.has(btn.nextNodeId)) {
            const handleId = btn.id || `btn-${bIdx}`;
            edgesList.push({
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

      // 3. List item branching connections: ONLY when node type is list
      if (isList && fn.listItems && Array.isArray(fn.listItems)) {
        fn.listItems.forEach((li, lIdx) => {
          if (li.nextNodeId && validNodeIds.has(li.nextNodeId)) {
            const handleId = li.id || `list-${lIdx}`;
            edgesList.push({
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

    return edgesList;
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
  }, []);

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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] lg:h-screen bg-[#F7F7F2] overflow-hidden relative font-secondary">
      {/* ========================================================================= */}
      {/* TOP CANVAS TOOLBAR                                                        */}
      {/* ========================================================================= */}
      <div className="bg-white border-b border-[#0A504A]/10 px-5 py-3 flex flex-wrap items-center justify-between gap-4 z-20 shadow-xs">
        {/* Flow Name & State */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00A86B]/10 flex items-center justify-center text-[#00A86B] shrink-0">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={flowName}
                onChange={(e) => {
                  setFlowName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="text-sm font-bold text-[#0A504A] bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-1 focus:ring-[#00A86B] px-1.5 py-0.5 rounded-lg border border-transparent hover:border-slate-200 outline-hidden max-w-xs md:max-w-md"
              />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A2E4B8]/30 text-[#0A504A] border border-[#A2E4B8]/50">
                15+ Steps Active
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasUnsavedChanges ? "bg-amber-500" : "bg-[#00A86B]"
                  }`}
                />
                {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400">{rfNodes.length} steps in flow</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Undo/Redo, Add Step, Test, Save */}
        <div className="flex items-center gap-2">
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
                  </div>
                )}

                {/* Text Message Content (For standard message, buttons, list, cta, and catalog) */}
                {["message", "buttons", "list", "url_cta", "catalog", "human_handoff", "end_conversation"].includes(
                  selectedNode.type || ""
                ) && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-600">Message Body</label>
                      {/* Customer Variable Chips */}
                      <div className="flex items-center gap-1">
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
                      <option value="Lead Qualification Flow">Lead Qualification Flow</option>
                      <option value="Order Status Inquiry Flow">Order Status Inquiry Flow</option>
                      <option value="After-Hours Auto-Responder">After-Hours Auto-Responder</option>
                      <option value="Customer Feedback Collection">Customer Feedback Collection</option>
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
    </div>
  );
}

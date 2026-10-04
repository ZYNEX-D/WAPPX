"use client";

import React, { useState } from "react";
import { UserWorkspace } from "@/types/whatsapp";
import {
  X,
  Users,
  Plus,
  Check,
  Building2,
  Key,
  Shield,
  ExternalLink,
  Copy,
} from "lucide-react";

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserWorkspace;
  allUsers: UserWorkspace[];
  onSelectUser: (user: UserWorkspace) => void;
  onCreateUser: (newUser: { name: string; email: string }) => void;
}

export function UserSwitchModal({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
  onCreateUser,
}: UserSwitchModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) return;

    onCreateUser({
      name: newClientName.trim(),
      email: newClientEmail.trim(),
    });

    setNewClientName("");
    setNewClientEmail("");
    setIsCreating(false);
  };

  const copyVerifyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A504A]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in font-secondary">
      <div className="bg-white rounded-3xl shadow-2xl border border-[#dee3e9] w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#dee3e9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0A504A] flex items-center justify-center text-white font-bold text-xs">
              <Users className="w-4 h-4 text-[#A2E4B8]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0A504A]">
                Client Workspaces
              </h3>
              <p className="text-[11px] text-[#5d6c7b]">
                Switch between dedicated tenant WhatsApp accounts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#5d6c7b] hover:text-[#0A504A] hover:bg-[#F7F7F2] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!isCreating ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0A504A]">
                  Available Workspaces ({allUsers.length})
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-3.5 py-1.5 bg-[#00A86B] text-white rounded-full text-xs font-bold hover:bg-[#0A504A] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Client</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <div
                      key={u.id}
                      onClick={() => onSelectUser(u)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "border-[#00A86B] bg-[#A2E4B8]/15 ring-1 ring-[#00A86B]/30"
                          : "border-[#dee3e9] hover:border-[#00A86B] bg-[#F7F7F2]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCurrent
                              ? "bg-[#00A86B] text-white"
                              : "bg-[#0A504A] text-white"
                          }`}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0A504A] flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.role === "admin" && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#0A504A] text-white">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#5d6c7b]">
                            {u.email}
                          </div>
                          <div className="text-[10px] font-mono text-[#00A86B]">
                            Verify Token: {u.verifyToken}
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="w-6 h-6 rounded-full bg-[#00A86B] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-[#F7F7F2] rounded-xl text-[11px] text-[#5d6c7b] space-y-1 border border-[#dee3e9]">
                <span className="font-bold text-[#0A504A]">Multi-Tenant Architecture:</span>
                <p>
                  Each client has their own dedicated WhatsApp connection, unique Meta Verify Token, Live Inbox, Contacts CRM, and Bot Flows.
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="pb-2 border-b border-[#dee3e9] flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#0A504A]">
                  Create New Client Account
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#5d6c7b] hover:text-[#0A504A]"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  Client Business / Store Name
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Apex Global Tech"
                  className="meta-input w-full"
                />
              </div>

              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="e.g. contact@apex.com"
                  className="meta-input w-full"
                />
              </div>

              <div className="p-3 bg-[#A2E4B8]/20 border border-[#00A86B]/30 rounded-xl text-[11px] text-[#0A504A]">
                A unique, secure <strong>Meta Verify Token</strong> will be generated automatically for this client.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00A86B] text-white rounded-full font-bold hover:bg-[#0A504A] transition-colors cursor-pointer"
                >
                  Create &amp; Switch Workspace
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 border border-[#dee3e9] text-[#444950] rounded-full font-bold hover:bg-[#F7F7F2] cursor-pointer"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

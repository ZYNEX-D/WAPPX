"use client";

import React, { useState } from "react";
import { Client } from "@/types/whatsapp";
import {
  Users,
  Smartphone,
  MessageSquare,
  ShieldCheck,
  Plus,
  Copy,
  Check,
  Trash2,
  Zap,
  ArrowRight,
  RefreshCw,
  Search,
  Building,
  Radio,
} from "lucide-react";

interface AdminDashboardProps {
  clients: Client[];
  totalMessagesCount: number;
  onSelectClientWorkspace: (clientId: string) => void;
  onCreateClient: (data: { name: string; businessName: string; email: string; phone?: string; password?: string }) => Promise<void>;
  onDeleteClient: (clientId: string) => Promise<void>;
  onRefresh: () => void;
}

export function AdminDashboard({
  clients,
  totalMessagesCount,
  onSelectClientWorkspace,
  onCreateClient,
  onDeleteClient,
  onRefresh,
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formBusiness, setFormBusiness] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("+94 ");
  const [formPassword, setFormPassword] = useState("ZynexClient2026!");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const connectedNumbersCount = clients.filter(
    (c) => c.metaConfig?.phoneNumberId && c.metaConfig?.isConnected
  ).length;

  const handleCopy = (token: string, clientId: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(clientId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBusiness.trim() || !formEmail.trim()) return;

    setIsSubmitting(true);
    await onCreateClient({
      name: formName.trim(),
      businessName: formBusiness.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      password: formPassword.trim() || "ZynexClient2026!",
    });
    setIsSubmitting(false);

    setFormName("");
    setFormBusiness("");
    setFormEmail("");
    setFormPhone("+94 ");
    setFormPassword("ZynexClient2026!");
    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F7F2] p-6 space-y-6 font-secondary">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Admin Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#0A504A]">
                Platform Control Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0A504A] text-white">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage client accounts, monitor connected WhatsApp business numbers, and view message throughput.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:text-[#0A504A] bg-white border border-slate-200 hover:bg-[#F7F7F2] rounded-full transition-all cursor-pointer shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#00A86B] text-white rounded-full text-xs font-bold hover:bg-[#0A504A] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Client</span>
            </button>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-[#0A504A]/10 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Clients
              </div>
              <div className="text-2xl font-black text-[#0A504A]">{clients.length}</div>

            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[#0A504A]/10 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#A2E4B8]/40 text-[#0A504A] flex items-center justify-center font-bold">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Connected WhatsApp
              </div>
              <div className="text-2xl font-black text-[#0A504A]">{connectedNumbersCount}</div>

            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#0A504A]/10 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0A504A]/10 text-[#0A504A] flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6 text-[#00A86B]" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Messages
              </div>
              <div className="text-2xl font-black text-[#0A504A]">{totalMessagesCount}</div>

            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-[#0A504A]/10 rounded-2xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00A86B]/15 text-[#00A86B] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Dynamic Webhook
              </div>
              <div className="text-sm font-bold text-[#00A86B] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse" />
                Active & Healthy
              </div>
              <div className="text-[10px] text-slate-500">Multi-Tenant Routing</div>
            </div>
          </div>
        </div>

        {/* Clients Directory Table Card */}
        <div className="bg-white border border-[#0A504A]/10 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#00A86B]" />
              <h2 className="font-bold text-sm text-[#0A504A]">Client Accounts Directory</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#F7F7F2] text-[#0A504A]">
                {clients.length}
              </span>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client, business, or phone..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F2] border border-slate-200 rounded-xl focus:border-[#00A86B] outline-hidden"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7F2] text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Client & Business</th>
                  <th className="py-3 px-4">WhatsApp Number</th>
                  <th className="py-3 px-4">Meta WABA / Phone ID</th>
                  <th className="py-3 px-4">Verify Token</th>
                  <th className="py-3 px-4">API Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClients.map((client) => {
                  const isConnected = !!(
                    client.metaConfig?.phoneNumberId && client.metaConfig?.isConnected
                  );

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#F7F7F2]/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0A504A]">{client.businessName}</div>
                        <div className="text-[11px] text-slate-500">
                          {client.name} • {client.email}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {client.phone || client.metaConfig?.phoneNumberId ? (
                          <span className="font-semibold text-[#0A504A]">
                            {client.phone || "Active"}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not registered</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        <div>ID: {client.metaConfig?.phoneNumberId || "—"}</div>
                        <div>WABA: {client.metaConfig?.wabaId || "—"}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="bg-[#F7F7F2] px-2 py-0.5 rounded font-mono text-[10px] text-[#00A86B] max-w-[120px] truncate block border border-slate-200">
                            {client.verifyToken}
                          </code>
                          <button
                            onClick={() => handleCopy(client.verifyToken, client.id)}
                            className="p-1 text-slate-400 hover:text-[#0A504A] rounded hover:bg-slate-100"
                            title="Copy Verify Token"
                          >
                            {copiedTokenId === client.id ? (
                              <Check className="w-3 h-3 text-[#00A86B]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#A2E4B8]/30 text-[#0A504A] border border-[#A2E4B8]/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse" />
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Awaiting Setup
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectClientWorkspace(client.id)}
                            className="px-3 py-1.5 bg-[#0A504A] hover:bg-[#00A86B] text-white rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Open this client's Live Inbox, Flow Builder & Settings"
                          >
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete client "${client.businessName}"? This action cannot be undone.`)) {
                                onDeleteClient(client.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No client accounts found matching "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Onboard New Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in fade-in space-y-4 font-secondary">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-[#00A86B]" />
                <h3 className="font-bold text-base text-[#0A504A]">
                  Onboard New Client Workspace
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Creates an isolated tenant with a dedicated verify token for official WhatsApp Cloud API integration.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={formBusiness}
                  onChange={(e) => setFormBusiness(e.target.value)}
                  placeholder="e.g. Apex Global Tech"
                  className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Michael Perera"
                  className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Client Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="michael@company.com"
                  className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  WhatsApp Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+94 72 973 1508"
                  className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Workspace Password
                  </label>
                  <span className="text-[10px] text-slate-400">Client will use this to sign in</span>
                </div>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="e.g. ZynexClient2026!"
                  className="w-full px-3 py-2 bg-[#F7F7F2] border border-slate-200 rounded-xl text-xs text-[#0A504A] focus:border-[#00A86B] outline-hidden font-mono font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Pre-filled with default: <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">ZynexClient2026!</code>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

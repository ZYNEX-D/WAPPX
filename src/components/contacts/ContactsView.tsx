"use client";

import React, { useState } from "react";
import { Contact } from "@/types/whatsapp";
import {
  Users,
  Search,
  Plus,
  MessageSquare,
  Tag,
  Phone,
  Bot,
  UserCheck,
  X,
  ArrowRight,
} from "lucide-react";

interface ContactsViewProps {
  contacts: Contact[];
  onSelectContactForChat: (contactId: string) => void;
  onAddContact: (contact: Contact) => void;
}

export function ContactsView({
  contacts,
  onSelectContactForChat,
  onAddContact,
}: ContactsViewProps) {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+94");
  const [tag, setTag] = useState("Lead");

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmitNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newContact: Contact = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      status: "active",
      assignedAgent: "Unassigned",
      tags: [tag],
      unreadCount: 0,
      lastMessageSnippet: "Contact manually added",
      lastMessageTime: "Just now",
      isBotActive: true,
      notes: [],
    };

    onAddContact(newContact);
    setShowAddModal(false);
    setName("");
    setPhone("+94");
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F7F2] p-4 sm:p-6 font-secondary">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A504A]">
                Customer Contacts &amp; CRM
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A2E4B8]/30 text-[#0A504A] border border-[#00A86B]/30">
                {contacts.length} Customers
              </span>
            </div>
            <p className="text-xs text-[#5d6c7b] mt-1">
              Manage WhatsApp customer profiles, segmentation tags, and assigned team members.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-buy-cta text-xs px-4 py-2.5 flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8595a4] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-pill w-full pl-10 text-xs bg-white"
            />
          </div>
        </div>

        {/* Mobile View: Cards Grid (< md) */}
        <div className="block md:hidden space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-[#dee3e9] text-center text-[#8595a4] text-xs">
              No contacts matching search query.
            </div>
          ) : (
            filtered.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-2xl border border-[#dee3e9] p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0A504A] text-white flex items-center justify-center font-bold text-xs">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0A504A]">{contact.name}</h3>
                      <p className="text-xs font-mono text-[#5d6c7b]">{contact.phone}</p>
                    </div>
                  </div>

                  {contact.status === "pending_human" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e41e3f] text-white animate-pulse">
                      Needs Human
                    </span>
                  ) : contact.isBotActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#A2E4B8]/30 text-[#0A504A] border border-[#00A86B]/30">
                      Bot Handled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F7F7F2] text-[#0A504A] border border-gray-200">
                      Active Chat
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-[#F7F7F2] rounded-full text-[10px] font-medium text-[#0A504A] border border-[#dee3e9]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onSelectContactForChat(contact.id)}
                    className="flex items-center gap-1 text-xs font-bold text-[#00A86B] hover:text-[#0A504A] transition-colors py-1 px-2 rounded-lg bg-[#A2E4B8]/20"
                  >
                    <span>Open Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table (>= md) */}
        <div className="hidden md:block bg-white border border-[#dee3e9] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F2] border-b border-[#dee3e9] text-[#0A504A] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Tags</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dee3e9]/60">
                {filtered.map((contact) => (
                  <tr key={contact.id} className="hover:bg-[#F7F7F2]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0A504A]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0A504A] text-white flex items-center justify-center font-bold text-xs">
                          {contact.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{contact.name}</span>
                          <span className="block text-[11px] font-normal text-[#8595a4]">
                            Last active: {contact.lastMessageTime}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[#5d6c7b]">
                      {contact.phone}
                    </td>

                    <td className="py-3.5 px-4">
                      {contact.status === "pending_human" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e41e3f] text-white">
                          Needs Human
                        </span>
                      ) : contact.isBotActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#A2E4B8]/30 text-[#0A504A] border border-[#00A86B]/30">
                          Bot Handled
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#00A86B]/15 text-[#00A86B] border border-[#00A86B]/30">
                          Active Chat
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#444950]">
                      {contact.assignedAgent || "Unassigned"}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-[#F7F7F2] rounded-full text-[10px] font-medium text-[#0A504A] border border-[#dee3e9]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectContactForChat(contact.id)}
                        className="btn-ghost text-xs px-3 py-1.5 border border-gray-200 hover:border-[#00A86B] text-[#0A504A]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#00A86B]" />
                        <span>Open Chat</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#dee3e9] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#dee3e9]">
              <h2 className="font-bold text-base text-[#0A504A]">
                Add New WhatsApp Contact
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5d6c7b] hover:bg-[#F7F7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewContact} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  Customer Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ruwan Jayasuriya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="meta-input w-full"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  WhatsApp Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  placeholder="+94771234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="meta-input w-full font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#0A504A] block mb-1">
                  Segmentation Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lead, Inquirer, VIP"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="meta-input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#dee3e9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-buy-cta">
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

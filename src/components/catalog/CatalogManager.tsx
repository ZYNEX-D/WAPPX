"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Package,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  CheckCircle2,
  Sparkles,
  Download,
  Upload,
  Layers,
  Store,
  Eye,
  X,
  AlertCircle,
  Tag,
  DollarSign,
  Image as ImageIcon,
  Save,
  Globe,
  Share2,
} from "lucide-react";
import { BusinessCatalog, CatalogItem } from "@/types/whatsapp";

interface CatalogManagerProps {
  catalogs: BusinessCatalog[];
  clientId: string;
  businessName?: string;
  onSaveCatalog: (catalog: BusinessCatalog) => Promise<void>;
  onDeleteCatalog?: (catalogId: string) => Promise<void>;
  onSelectForChat?: (item: CatalogItem) => void;
}

const SAMPLE_IMAGE_PRESETS = [
  {
    name: "SaaS / Software",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Modern Tech",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Team & Support",
    url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Analytics & Growth",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Ecommerce Box",
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
  },
];

const CURRENCIES = ["USD", "LKR", "EUR", "GBP", "INR", "AED", "AUD", "SGD"];

export function CatalogManager({
  catalogs,
  clientId,
  businessName = "WAPPX Commerce",
  onSaveCatalog,
  onDeleteCatalog,
  onSelectForChat,
}: CatalogManagerProps) {
  // Active catalog selection
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(
    catalogs[0]?.id || `cat-${clientId}-default`
  );

  const activeCatalog =
    catalogs.find((c) => c.id === selectedCatalogId) ||
    catalogs[0] || {
      id: `cat-${clientId}-default`,
      clientId,
      name: "Main Product Catalog",
      catalogId: `meta_${clientId.replace(/[^a-zA-Z0-9]/g, "")}_cat`,
      description: "Official WhatsApp Commerce products.",
      items: [],
      isDefault: true,
    };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Product Modal (Create / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [productForm, setProductForm] = useState<Partial<CatalogItem>>({
    title: "",
    retailerId: "",
    price: "",
    currency: "USD",
    category: "General",
    status: "active",
    description: "",
    imageUrl: "",
    url: "",
  });

  // Catalog Modal (Create / Edit Catalog)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogNameInput, setCatalogNameInput] = useState("");
  const [catalogIdInput, setCatalogIdInput] = useState("");
  const [catalogDescInput, setCatalogDescInput] = useState("");

  // Toast / notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Categories list derived from current items
  const allCategories = Array.from(
    new Set(activeCatalog.items.map((i) => i.category || "General"))
  );

  // Filtered items
  const filteredItems = activeCatalog.items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.retailerId && item.retailerId.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategory === "all" ||
      (item.category || "General") === selectedCategory;

    const matchesStatus =
      selectedStatus === "all" ||
      (item.status || "active") === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const totalProducts = activeCatalog.items.length;
  const activeProducts = activeCatalog.items.filter(
    (i) => (i.status || "active") === "active"
  ).length;

  // Open Create Product
  const handleOpenCreateProduct = () => {
    const nextSku = `SKU-${Date.now().toString().slice(-6)}`;
    setEditingItem(null);
    setProductForm({
      title: "",
      retailerId: nextSku,
      price: "$29.00",
      currency: "USD",
      category: "Software Plans",
      status: "active",
      description: "",
      imageUrl: SAMPLE_IMAGE_PRESETS[0].url,
      url: "",
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Product
  const handleOpenEditProduct = (item: CatalogItem) => {
    setEditingItem(item);
    setProductForm({
      title: item.title,
      retailerId: item.retailerId || "",
      price: item.price || "",
      currency: item.currency || "USD",
      category: item.category || "General",
      status: item.status || "active",
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      url: item.url || "",
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Create / Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title?.trim()) {
      alert("Product title is required");
      return;
    }

    const priceFormatted = productForm.price?.trim().startsWith("$")
      ? productForm.price.trim()
      : productForm.price?.trim()
      ? `${productForm.currency === "USD" ? "$" : productForm.currency + " "}${productForm.price.trim()}`
      : "$0.00";

    const newItem: CatalogItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      title: productForm.title.trim(),
      retailerId:
        productForm.retailerId?.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      price: priceFormatted,
      currency: productForm.currency || "USD",
      category: productForm.category?.trim() || "General",
      status: productForm.status || "active",
      description: productForm.description?.trim() || "",
      imageUrl:
        productForm.imageUrl?.trim() ||
        SAMPLE_IMAGE_PRESETS[0].url,
      url: productForm.url?.trim() || "",
    };

    let updatedItems: CatalogItem[];
    if (editingItem) {
      updatedItems = activeCatalog.items.map((it) =>
        it.id === editingItem.id ? newItem : it
      );
    } else {
      updatedItems = [newItem, ...activeCatalog.items];
    }

    const updatedCatalog: BusinessCatalog = {
      ...activeCatalog,
      items: updatedItems,
    };

    await onSaveCatalog(updatedCatalog);
    setIsProductModalOpen(false);
    showToast(
      editingItem
        ? `Updated product "${newItem.title}"`
        : `Added new product "${newItem.title}" to catalog`
    );
  };

  // Delete Product
  const handleDeleteProduct = async (itemId: string, title: string) => {
    if (!confirm(`Delete product "${title}" from this catalog?`)) return;

    const updatedCatalog: BusinessCatalog = {
      ...activeCatalog,
      items: activeCatalog.items.filter((it) => it.id !== itemId),
    };

    await onSaveCatalog(updatedCatalog);
    showToast(`Removed "${title}"`);
  };

  // Duplicate Product
  const handleDuplicateProduct = async (item: CatalogItem) => {
    const duplicated: CatalogItem = {
      ...item,
      id: `item-${Date.now()}`,
      title: `${item.title} (Copy)`,
      retailerId: `${item.retailerId || "SKU"}-COPY`,
    };

    const updatedCatalog: BusinessCatalog = {
      ...activeCatalog,
      items: [duplicated, ...activeCatalog.items],
    };

    await onSaveCatalog(updatedCatalog);
    showToast(`Duplicated "${item.title}"`);
  };

  // Create Catalog
  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogNameInput.trim()) return;

    const newCat: BusinessCatalog = {
      id: `cat-${clientId}-${Date.now()}`,
      clientId,
      name: catalogNameInput.trim(),
      catalogId:
        catalogIdInput.trim() ||
        `meta_${catalogNameInput.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      description: catalogDescInput.trim() || undefined,
      items: [],
      isDefault: catalogs.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveCatalog(newCat);
    setSelectedCatalogId(newCat.id);
    setIsCatalogModalOpen(false);
    setCatalogNameInput("");
    setCatalogIdInput("");
    setCatalogDescInput("");
    showToast(`Created new catalog "${newCat.name}"`);
  };

  // Export Meta Commerce Manager CSV
  const handleExportMetaCSV = () => {
    const headers = [
      "id",
      "title",
      "description",
      "availability",
      "condition",
      "price",
      "link",
      "image_link",
      "brand",
    ];

    const rows = activeCatalog.items.map((item) => [
      `"${item.retailerId || item.id}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${(item.description || "").replace(/"/g, '""')}"`,
      item.status === "out_of_stock" ? '"out of stock"' : '"in stock"',
      '"new"',
      `"${(item.price || "0").replace(/[^0-9.]/g, "")} ${item.currency || "USD"}"`,
      `"${item.url || "https://wappx.zynex.lk"}"`,
      `"${item.imageUrl || ""}"`,
      `"${businessName.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `meta_catalog_${activeCatalog.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Meta Commerce Manager CSV!");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-secondary">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00A86B] flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                WhatsApp Catalog Manager
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 text-[11px] font-bold">
                Meta Commerce v22.0
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create, organize, and manage your products to send directly inside WhatsApp chats and automated flows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMetaCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Download CSV formatted for Meta Commerce Manager"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export Meta CSV
            </button>

            <button
              onClick={() => setIsCatalogModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              New Catalog
            </button>

            <button
              onClick={handleOpenCreateProduct}
              className="px-4 py-2 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Catalog Tabs & Meta Commerce ID Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {catalogs.map((cat) => {
              const isActive = cat.id === selectedCatalogId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatalogId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {cat.name}
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {cat.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meta Catalog ID:
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700">
                {activeCatalog.catalogId || "meta_cat_default"}
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              WhatsApp Synced
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TOOLBAR: Search & Filters
      ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-3 bg-white border-b border-slate-200/70 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title, SKU, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded-xl outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs outline-none cursor-pointer focus:border-emerald-500"
          >
            <option value="all">All Categories ({activeCatalog.items.length})</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs outline-none cursor-pointer focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="active">In Stock / Active</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="draft">Draft</option>
          </select>

          <div className="text-slate-400 text-xs pl-2 border-l border-slate-200">
            Showing <strong className="text-slate-700">{filteredItems.length}</strong> of {totalProducts} items
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT: Product Grid + Live WhatsApp Mobile Preview
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#00A86B] flex items-center justify-center mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No products found in this catalog
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
              {searchQuery
                ? "No products matched your search. Try clearing your filters."
                : "Add your business items, software subscriptions, or physical products to start sending them in WhatsApp."}
            </p>
            <button
              onClick={handleOpenCreateProduct}
              className="px-4 py-2.5 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isOutOfStock = item.status === "out_of_stock";
              const isDraft = item.status === "draft";

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden group"
                >
                  {/* Product Hero Image */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-[10px]">No image provided</span>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs ${
                          isOutOfStock
                            ? "bg-red-500/90 text-white"
                            : isDraft
                            ? "bg-amber-500/90 text-white"
                            : "bg-emerald-600/90 text-white"
                        }`}
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : isDraft
                          ? "Draft"
                          : "In Stock"}
                      </span>
                    </div>

                    {/* Price Pill */}
                    <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-xs text-white text-xs font-bold shadow-sm">
                      {item.price || "$0.00"}
                    </div>

                    {/* SKU badge */}
                    {item.retailerId && (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-700 font-mono text-[9.5px] font-bold shadow-xs">
                        {item.retailerId}
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00A86B] mb-1">
                        <Tag className="w-2.5 h-2.5" />
                        {item.category || "General"}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || "No description provided."}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProduct(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateProduct(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Duplicate product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(item.id, item.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {onSelectForChat && (
                        <button
                          onClick={() => onSelectForChat(item)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#00A86B] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          Send to Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CREATE / EDIT PRODUCT MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#00A86B] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? "Edit Product" : "Add New WhatsApp Product"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Target Catalog: <strong>{activeCatalog.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Product Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp Automation Starter Plan"
                  value={productForm.title || ""}
                  onChange={(e) =>
                    setProductForm({ ...productForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                />
              </div>

              {/* SKU & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      SKU / Retailer ID (Meta ID) *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          retailerId: `SKU-${Date.now().toString().slice(-6)}`,
                        })
                      }
                      className="text-[10px] text-[#00A86B] font-semibold hover:underline"
                    >
                      Generate SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WPP-STARTER-01"
                    value={productForm.retailerId || ""}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        retailerId: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Price & Currency *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={productForm.currency || "USD"}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          currency: e.target.value,
                        })
                      }
                      className="w-24 px-2 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none cursor-pointer"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="e.g. $49.00 or 49.00"
                      value={productForm.price || ""}
                      onChange={(e) =>
                        setProductForm({ ...productForm, price: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Software, Services, Food, Retail"
                    value={productForm.category || ""}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={productForm.status || "active"}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none cursor-pointer"
                  >
                    <option value="active">In Stock (Active)</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="draft">Draft (Hidden from WhatsApp)</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={productForm.imageUrl || ""}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      imageUrl: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                />

                {/* Preset quick picks */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold mr-1">
                    Sample Presets:
                  </span>
                  {SAMPLE_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          imageUrl: preset.url,
                        })
                      }
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium cursor-pointer transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Image preview */}
                {productForm.imageUrl && (
                  <div className="mt-2.5 relative h-28 w-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productForm.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description / Features
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what is included, specifications, delivery details..."
                  value={productForm.description || ""}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none resize-none"
                />
              </div>

              {/* Website URL (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://yoursite.com/products/starter"
                  value={productForm.url || ""}
                  onChange={(e) =>
                    setProductForm({ ...productForm, url: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingItem ? "Save Changes" : "Add to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CREATE CATALOG MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#00A86B] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Create New Catalog
                </h3>
              </div>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCatalog} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catalog Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seasonal Collection or VIP Services"
                  value={catalogNameInput}
                  onChange={(e) => setCatalogNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meta Catalog ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 19283746501928"
                  value={catalogIdInput}
                  onChange={(e) => setCatalogIdInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Found in Meta Commerce Manager Settings &gt; Catalog.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What products or services belong in this catalog..."
                  value={catalogDescInput}
                  onChange={(e) => setCatalogDescInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

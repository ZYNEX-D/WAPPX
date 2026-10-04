"use client";

import React, { useState, useEffect } from "react";
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
  Zap,
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

  // Sync selected catalog when catalogs change
  useEffect(() => {
    if (catalogs.length > 0 && !catalogs.some((c) => c.id === selectedCatalogId)) {
      setSelectedCatalogId(catalogs[0].id);
    }
  }, [catalogs, selectedCatalogId]);

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
  const [catalogModalMode, setCatalogModalMode] = useState<"auto" | "manual">("manual");
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [autoCreateError, setAutoCreateError] = useState<{
    message: string;
    isPermissionError: boolean;
  } | null>(null);
  const [catalogNameInput, setCatalogNameInput] = useState("");
  const [catalogIdInput, setCatalogIdInput] = useState("");
  const [catalogDescInput, setCatalogDescInput] = useState("");

  // Loading & Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Toast / notification
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
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
      showToast("Product title is required", "error");
      return;
    }

    try {
      setIsSaving(true);
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
          : `Added new product "${newItem.title}" to catalog`,
        "success"
      );
    } catch (err: any) {
      console.error("handleSaveProduct error:", err);
      showToast(err?.message || "Failed to save product", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (itemId: string, title: string) => {
    if (!confirm(`Delete product "${title}" from this catalog?`)) return;

    try {
      setIsSaving(true);
      const updatedCatalog: BusinessCatalog = {
        ...activeCatalog,
        items: activeCatalog.items.filter((it) => it.id !== itemId),
      };

      await onSaveCatalog(updatedCatalog);
      showToast(`Removed "${title}"`, "success");
    } catch (err: any) {
      console.error("handleDeleteProduct error:", err);
      showToast(err?.message || "Failed to delete product", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate Product
  const handleDuplicateProduct = async (item: CatalogItem) => {
    try {
      setIsSaving(true);
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
      showToast(`Duplicated "${item.title}"`, "success");
    } catch (err: any) {
      console.error("handleDuplicateProduct error:", err);
      showToast(err?.message || "Failed to duplicate product", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-Create Catalog via Meta Cloud API (Method 2)
  const handleAutoCreateMetaCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogNameInput.trim()) {
      showToast("Catalog name is required", "error");
      return;
    }

    try {
      setIsAutoCreating(true);
      setAutoCreateError(null);

      const res = await fetch("/api/whatsapp/catalog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          catalogName: catalogNameInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setAutoCreateError({
          message: data.detail || data.error || "Failed to auto-create Meta Catalog",
          isPermissionError: data.isPermissionError ?? false,
        });
        showToast(
          data.isPermissionError
            ? "Permission missing. Please configure manually using your Catalog ID."
            : data.error || "Failed to auto-create Meta Catalog",
          "error"
        );
        return;
      }

      if (data.catalog) {
        const catObj: BusinessCatalog = {
          id: data.catalog.id,
          clientId: data.catalog.clientId || data.catalog.client_id || clientId || "client-1",
          name: data.catalog.name,
          catalogId: data.catalog.catalogId || data.catalog.catalog_id,
          description: data.catalog.description,
          items: data.catalog.items || [],
          isDefault: data.catalog.isDefault ?? data.catalog.is_default ?? true,
          createdAt: data.catalog.createdAt || data.catalog.created_at || new Date().toISOString(),
          updatedAt: data.catalog.updatedAt || data.catalog.updated_at || new Date().toISOString(),
        };
        await onSaveCatalog(catObj);
        setSelectedCatalogId(catObj.id);
      }
      setIsCatalogModalOpen(false);
      setCatalogNameInput("");
      setCatalogIdInput("");
      setCatalogDescInput("");
      setAutoCreateError(null);
      showToast(`Created & Linked Meta Catalog "${catalogNameInput.trim()}"!`, "success");
    } catch (err: any) {
      setAutoCreateError({
        message: err?.message || "Network exception",
        isPermissionError: false,
      });
      showToast(err?.message || "Failed to auto-create Meta Catalog", "error");
    } finally {
      setIsAutoCreating(false);
    }
  };

  // Manual Link / Save Meta Catalog (Method 1)
  const handleManualLinkMetaCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogNameInput.trim()) {
      showToast("Catalog name is required", "error");
      return;
    }

    try {
      setIsSaving(true);
      const cleanCatId = catalogIdInput.trim();

      // If user provided a numeric Meta Catalog ID, link it through API
      if (cleanCatId && /^\d+$/.test(cleanCatId)) {
        const res = await fetch("/api/whatsapp/catalog/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            catalogId: cleanCatId,
            catalogName: catalogNameInput.trim(),
          }),
        });
        const linkData = await res.json();
        if (linkData.success && linkData.catalog) {
          const catObj: BusinessCatalog = {
            id: linkData.catalog.id,
            clientId: linkData.catalog.clientId || linkData.catalog.client_id || clientId || "client-1",
            name: linkData.catalog.name,
            catalogId: linkData.catalog.catalogId || linkData.catalog.catalog_id || cleanCatId,
            description: linkData.catalog.description,
            items: linkData.catalog.items || [],
            isDefault: linkData.catalog.isDefault ?? linkData.catalog.is_default ?? true,
            createdAt: linkData.catalog.createdAt || linkData.catalog.created_at || new Date().toISOString(),
            updatedAt: linkData.catalog.updatedAt || linkData.catalog.updated_at || new Date().toISOString(),
          };
          await onSaveCatalog(catObj);
          setSelectedCatalogId(catObj.id);
          setIsCatalogModalOpen(false);
          setCatalogNameInput("");
          setCatalogIdInput("");
          setCatalogDescInput("");
          showToast(`Official Meta Catalog ID ${cleanCatId} successfully linked to WhatsApp!`, "success");
          return;
        }
      }

      // Default or local update
      const newCat: BusinessCatalog = {
        id: activeCatalog.id || `cat-${clientId}-${Date.now()}`,
        clientId,
        name: catalogNameInput.trim(),
        catalogId: cleanCatId || `meta_${catalogNameInput.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        description: catalogDescInput.trim() || undefined,
        items: activeCatalog.items || [],
        isDefault: true,
        createdAt: activeCatalog.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveCatalog(newCat);
      setSelectedCatalogId(newCat.id);
      setIsCatalogModalOpen(false);
      setCatalogNameInput("");
      setCatalogIdInput("");
      setCatalogDescInput("");
      showToast(`Catalog "${newCat.name}" saved!`, "success");
    } catch (err: any) {
      console.error("handleManualLinkMetaCatalog error:", err);
      showToast(err?.message || "Failed to save catalog", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Catalog Action
  const handleDeleteCatalogAction = async (catToDelete: BusinessCatalog, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (catalogs.length <= 1) {
      showToast("Cannot delete the only remaining catalog", "error");
      return;
    }
    if (!confirm(`Are you sure you want to delete catalog "${catToDelete.name}" and all its products?`)) return;

    try {
      setIsSaving(true);
      if (onDeleteCatalog) {
        await onDeleteCatalog(catToDelete.id);
      }
      const remaining = catalogs.filter((c) => c.id !== catToDelete.id);
      if (remaining.length > 0) {
        setSelectedCatalogId(remaining[0].id);
      }
      showToast(`Deleted catalog "${catToDelete.name}"`, "success");
    } catch (err: any) {
      console.error("handleDeleteCatalogAction error:", err);
      showToast(err?.message || "Failed to delete catalog", "error");
    } finally {
      setIsSaving(false);
    }
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
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === "error"
              ? "bg-rose-950 text-rose-100 border border-rose-800"
              : toast.type === "info"
              ? "bg-slate-900 text-slate-100 border border-slate-700"
              : "bg-slate-900 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
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
                <div key={cat.id} className="flex items-center">
                  <button
                    onClick={() => setSelectedCatalogId(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cat.items.length}
                    </span>
                    {catalogs.length > 1 && (
                      <span
                        onClick={(e) => handleDeleteCatalogAction(cat, e)}
                        className={`ml-1 p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ${
                          isActive ? "text-slate-400 hover:text-rose-300" : ""
                        }`}
                        title={`Delete catalog "${cat.name}"`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <button
              onClick={() => {
                setCatalogNameInput(activeCatalog.name);
                setCatalogIdInput(activeCatalog.catalogId?.startsWith("meta_") ? "" : activeCatalog.catalogId || "");
                setCatalogDescInput(activeCatalog.description || "");
                setCatalogModalMode("manual");
                setAutoCreateError(null);
                setIsCatalogModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/90 px-3 py-1.5 rounded-xl transition-all cursor-pointer group shadow-2xs"
              title="Configure official Meta Commerce Catalog ID"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Meta Catalog ID:
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-700">
                {activeCatalog.catalogId || "Not set"}
              </span>
              <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-[#00A86B] ml-1 transition-colors" />
            </button>

            {activeCatalog.catalogId && /^\d+$/.test(activeCatalog.catalogId) ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Meta Commerce Linked</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCatalogNameInput(activeCatalog.name);
                  setCatalogIdInput("");
                  setCatalogModalMode("manual");
                  setAutoCreateError(null);
                  setIsCatalogModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/90 text-amber-700 border border-amber-200/80 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                title="Click to link official Meta Commerce Catalog"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Link Meta ID</span>
              </button>
            )}
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
          CREATE / LINK META CATALOG MODAL (DUAL MODE)
      ═══════════════════════════════════════════════════════════════ */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-[#00A86B] flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Configure WhatsApp Catalog
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Connect or create official Meta Catalog for native WhatsApp in-chat shopping.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCatalogModalOpen(false);
                  setAutoCreateError(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex gap-2 bg-slate-50/30">
              <button
                type="button"
                onClick={() => {
                  setCatalogModalMode("manual");
                  setAutoCreateError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  catalogModalMode === "manual"
                    ? "bg-[#0A504A] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Option 1: Link Numeric ID (Manual)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCatalogModalMode("auto");
                  setAutoCreateError(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  catalogModalMode === "auto"
                    ? "bg-[#0A504A] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#A2E4B8]" />
                <span>Option 2: Auto-Create via API</span>
              </button>
            </div>

            {/* Mode 1: Manual Link */}
            {catalogModalMode === "manual" && (
              <form onSubmit={handleManualLinkMetaCatalog} className="p-6 space-y-4 text-xs">
                {/* Step-by-Step Guidance Banner */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00A86B]" />
                      Fast 1-Minute Meta Setup
                    </span>
                    <a
                      href="https://business.facebook.com/latest/whatsapp_manager/catalog?business_id=523464470848127"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#00A86B] font-bold hover:underline flex items-center gap-1"
                    >
                      Open WhatsApp Manager <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <ol className="text-[11px] text-emerald-900 list-decimal list-inside space-y-1">
                    <li>In WhatsApp Manager &gt; Catalogue, turn <b>ON</b> both toggles (&ldquo;Show catalogue icon&rdquo; &amp; &ldquo;Add to basket&rdquo;).</li>
                    <li>Click <b>[Manage]</b> (or open Commerce Manager) to view your numeric <b>Catalogue ID</b>.</li>
                    <li>Paste the 15-16 digit Meta Catalog ID below and click Verify &amp; Link.</li>
                  </ol>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catalog Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WAPPX or Catalogue_Products_WAPPX"
                    value={catalogNameInput}
                    onChange={(e) => setCatalogNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      Official Meta Catalog ID *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">15-16 digit numeric ID</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9914123625266497"
                    value={catalogIdInput}
                    onChange={(e) => setCatalogIdInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Found in Meta Commerce Manager URL or Settings &gt; Catalogue Info.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Products and packages in this collection..."
                    value={catalogDescInput}
                    onChange={(e) => setCatalogDescInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCatalogModalOpen(false);
                      setAutoCreateError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-[#00A86B] hover:bg-[#008f5b] text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isSaving ? "Linking to Meta..." : "Verify & Link Catalog"}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Auto-Create via Meta Cloud API */}
            {catalogModalMode === "auto" && (
              <form onSubmit={handleAutoCreateMetaCatalog} className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Zap className="w-4 h-4 text-[#00A86B]" />
                    Automatic Meta Provisioning
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Our backend will call Meta Graph API (<code>POST /{`{business_id}`}/owned_product_catalogs</code>) to provision a new catalog on Facebook and link it directly to your WhatsApp Business Account.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    * Requires <code>catalog_management</code> and <code>business_management</code> permissions on your System User Token.
                  </p>
                </div>

                {/* If Auto-Create failed with missing permission, show graceful fallback prompt */}
                {autoCreateError && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          {autoCreateError.isPermissionError ? "Meta Permission Missing (#100)" : "Meta API Notice"}
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          {autoCreateError.message}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-amber-800 font-medium">Use manual configuration instead?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogModalMode("manual");
                          setAutoCreateError(null);
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Switch to Manual Mode ➔
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catalog Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WAPPX Official Products"
                    value={catalogNameInput}
                    onChange={(e) => setCatalogNameInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:border-[#00A86B] outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCatalogModalOpen(false);
                      setAutoCreateError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAutoCreating}
                    className="px-5 py-2 rounded-xl bg-[#0A504A] hover:bg-[#00A86B] text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#A2E4B8]" />
                    {isAutoCreating ? "Provisioning on Meta..." : "⚡ Auto-Create via Meta API"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

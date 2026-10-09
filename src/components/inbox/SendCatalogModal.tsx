"use client";

import React, { useState } from "react";
import {
  X,
  ShoppingBag,
  Package,
  Layers,
  FileText,
  Check,
  Send,
  ExternalLink,
  Sparkles,
  Info,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { CatalogPayload, CatalogItem } from "@/types/whatsapp";

export const isItemApproved = (item?: CatalogItem) => {
  if (!item) return false;
  return item.reviewStatus === "APPROVED" || item.reviewStatus === "OUTDATED";
};

interface SendCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendCatalog: (catalog: CatalogPayload, customText?: string) => void;
  contactName: string;
  defaultCatalogId?: string;
  businessName?: string;
  customProducts?: CatalogItem[];
}

const DEFAULT_PRODUCTS: CatalogItem[] = [];

export function SendCatalogModal({
  isOpen,
  onClose,
  onSendCatalog,
  contactName,
  defaultCatalogId = "2080375866175781",
  businessName = "ZYNEX Developments",
  customProducts,
}: SendCatalogModalProps) {
  const initialList =
    customProducts && customProducts.length > 0
      ? customProducts
      : DEFAULT_PRODUCTS;

  type Mode = "catalog_message" | "product" | "product_list" | "pdf_catalog";
  const [activeMode, setActiveMode] = useState<Mode>("catalog_message");

  // Mode 1: Full Catalog Message
  const [catalogId, setCatalogId] = useState(defaultCatalogId);
  const [catalogTitle, setCatalogTitle] = useState(`${businessName} Official Catalog`);
  const [catalogBody, setCatalogBody] = useState(
    "Explore our complete collection of digital automation solutions, packages, and services directly inside WhatsApp."
  );
  const [thumbnailSku, setThumbnailSku] = useState(initialList[0]?.retailerId || "WPP-STARTER");

  // Mode 2: Single Product
  const [selectedProductId, setSelectedProductId] = useState<string>(initialList[0]?.id || "prod-1");
  const [productsList, setProductsList] = useState<CatalogItem[]>(initialList);
  const [productCustomNote, setProductCustomNote] = useState(
    "Here is the product details you requested! You can review the features and add to cart directly:"
  );

  // Sync customProducts & defaultCatalogId if updated
  React.useEffect(() => {
    if (defaultCatalogId) {
      setCatalogId(defaultCatalogId);
    }
  }, [defaultCatalogId]);

  React.useEffect(() => {
    if (customProducts && customProducts.length > 0) {
      setProductsList(customProducts);
      if (!customProducts.some((p) => p.id === selectedProductId)) {
        setSelectedProductId(customProducts[0].id);
      }
    }
  }, [customProducts, selectedProductId]);

  // Mode 3: Multi-product selection
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>(
    initialList.slice(0, 3).map((p) => p.id)
  );
  const [multiListHeader, setMultiListHeader] = useState("Recommended Packages For You");

  // Mode 4: PDF Catalog
  const [pdfTitle, setPdfTitle] = useState(`${businessName} Product & Solutions Lookbook 2026`);
  const [pdfUrl, setPdfUrl] = useState("https://zynexdev.lk/catalog-2026.pdf");

  // Meta review status sync
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshMetaStatus = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/whatsapp/catalog/sync?clientId=client-1", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setProductsList(data.items);
      }
    } catch (e) {
      console.warn("Failed to auto-refresh catalog statuses:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      refreshMetaStatus();
    }
  }, [isOpen]);

  const currentSelectedProduct =
    productsList.find((p) => p.id === selectedProductId) || productsList[0];

  // Approval validation: Cannot send until approved!
  const isProductModeApproved = isItemApproved(currentSelectedProduct);
  const hasApprovedCatalogItems = productsList.some(isItemApproved);
  const isMultiApproved =
    selectedMultiIds.length > 0 &&
    selectedMultiIds.every((id) =>
      isItemApproved(productsList.find((p) => p.id === id))
    );

  const canSend =
    activeMode === "pdf_catalog"
      ? true
      : activeMode === "product"
      ? isProductModeApproved
      : activeMode === "catalog_message"
      ? hasApprovedCatalogItems
      : isMultiApproved;

  const handleToggleMultiProduct = (id: string) => {
    if (selectedMultiIds.includes(id)) {
      if (selectedMultiIds.length > 1) {
        setSelectedMultiIds(selectedMultiIds.filter((item) => item !== id));
      }
    } else {
      setSelectedMultiIds([...selectedMultiIds, id]);
    }
  };

  const handleSend = () => {
    if (!canSend) {
      alert("This item cannot be sent because it has not been approved by Meta yet.");
      return;
    }
    if (activeMode === "catalog_message") {
      const payload: CatalogPayload = {
        type: "catalog_message",
        catalogId: catalogId.trim() || defaultCatalogId,
        catalogName: catalogTitle,
        thumbnailProductId: thumbnailSku.trim() || undefined,
        bodyText: catalogBody,
        footerText: "Tap 'View Catalog' to browse in WhatsApp",
        products: productsList,
      };
      onSendCatalog(payload, catalogBody);
    } else if (activeMode === "product") {
      const payload: CatalogPayload = {
        type: "product",
        catalogId: catalogId.trim() || defaultCatalogId,
        catalogName: catalogTitle,
        thumbnailProductId: currentSelectedProduct.retailerId,
        bodyText: productCustomNote,
        footerText: "Official WhatsApp Commerce Card",
        products: [currentSelectedProduct],
      };
      onSendCatalog(payload, `${productCustomNote} \n\n${currentSelectedProduct.title} (${currentSelectedProduct.price})`);
    } else if (activeMode === "product_list") {
      const chosen = productsList.filter((p) => selectedMultiIds.includes(p.id));
      const payload: CatalogPayload = {
        type: "product_list",
        catalogId: catalogId.trim() || defaultCatalogId,
        catalogName: multiListHeader,
        bodyText: `Explore ${chosen.length} selected packages from our catalog:`,
        footerText: "Select an item to view details",
        products: chosen,
      };
      onSendCatalog(payload, `${multiListHeader}\nExplore our products below.`);
    } else if (activeMode === "pdf_catalog") {
      const payload: CatalogPayload = {
        type: "pdf",
        catalogName: pdfTitle,
        bodyText: `📄 Download our digital catalog: ${pdfTitle}`,
        footerText: "PDF Document Catalog",
        thumbnailProductId: pdfUrl,
      };
      onSendCatalog(payload, `📄 ${pdfTitle}\nDownload Link: ${pdfUrl}`);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00A86B] text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800">Send WhatsApp Catalog or Products</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Meta Commerce API
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sending to <span className="font-semibold text-slate-700">{contactName}</span> directly in chat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshMetaStatus}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Refresh product approval status directly from Meta Graph API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#00A86B]" : "text-slate-500"}`} />
              <span>{isSyncing ? "Checking..." : "Verify Meta Status"}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveMode("catalog_message")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeMode === "catalog_message"
                ? "bg-white text-[#00A86B] border-[#00A86B] shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Full Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("product")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeMode === "product"
                ? "bg-white text-[#00A86B] border-[#00A86B] shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Single Product Card</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("product_list")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeMode === "product_list"
                ? "bg-white text-[#00A86B] border-[#00A86B] shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multi-Product List</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("pdf_catalog")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
              activeMode === "pdf_catalog"
                ? "bg-white text-[#00A86B] border-[#00A86B] shadow-xs"
                : "text-slate-500 hover:text-slate-800 border-transparent"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PDF Brochure</span>
          </button>
        </div>

        {/* Modal Body: Left form, Right WhatsApp Live Bubble Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* Form Settings (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-5 border-r border-slate-100">
            {/* Mode 1: Full Catalog Form */}
            {activeMode === "catalog_message" && (
              <div className="space-y-4">
                <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-emerald-900 leading-relaxed">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Meta In-App Catalog Message:</span> This sends an interactive WhatsApp
                    card with an in-chat <span className="font-semibold text-emerald-700">"View Catalog"</span> button.
                    Customers can browse all your products, check prices, and send order inquiries without leaving WhatsApp.
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Catalog Header / Store Name</label>
                  <input
                    type="text"
                    value={catalogTitle}
                    onChange={(e) => setCatalogTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden font-medium transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Body Description</label>
                  <textarea
                    rows={3}
                    value={catalogBody}
                    onChange={(e) => setCatalogBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden font-medium transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Meta Catalog ID</label>
                    <input
                      type="text"
                      value={catalogId}
                      onChange={(e) => setCatalogId(e.target.value)}
                      placeholder="e.g. 1757228632208483"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Thumbnail Featured SKU</label>
                    <input
                      type="text"
                      value={thumbnailSku}
                      onChange={(e) => setThumbnailSku(e.target.value)}
                      placeholder="e.g. ZYN-WPP-GROWTH"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Single Product Form */}
            {activeMode === "product" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Select Product to Showcase</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
                    {productsList.length === 0 ? (
                      <div className="col-span-full py-8 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No products in catalog yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Go to the &quot;Catalog &amp; Products&quot; tab to add your first product!</p>
                      </div>
                    ) : (
                      productsList.map((prod) => {
                        const approved = isItemApproved(prod);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => setSelectedProductId(prod.id)}
                            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                              selectedProductId === prod.id
                                ? "border-[#00A86B] bg-emerald-50/50 ring-2 ring-[#00A86B]/20"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{prod.title}</p>
                                {approved ? (
                                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/90 border border-emerald-300/70 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Approved
                                  </span>
                                ) : prod.reviewStatus === "REJECTED" ? (
                                  <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100/90 border border-rose-300/70 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Rejected
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/90 border border-amber-300/70 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-amber-600" /> In Review
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-extrabold text-[#00A86B] mt-0.5">{prod.price}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">{prod.retailerId}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Message Note</label>
                  <textarea
                    rows={2}
                    value={productCustomNote}
                    onChange={(e) => setProductCustomNote(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Mode 3: Multi-Product List Form */}
            {activeMode === "product_list" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Collection Title / Section Header</label>
                  <input
                    type="text"
                    value={multiListHeader}
                    onChange={(e) => setMultiListHeader(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Select Products to Include</label>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {selectedMultiIds.length} Selected
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                    {productsList.length === 0 ? (
                      <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">No products in catalog yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Go to the &quot;Catalog &amp; Products&quot; tab to add your first product!</p>
                      </div>
                    ) : (
                      productsList.map((prod) => {
                        const isChecked = selectedMultiIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleToggleMultiProduct(prod.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? "border-[#00A86B] bg-emerald-50/40"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={prod.imageUrl}
                                alt={prod.title}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate">{prod.title}</p>
                                <p className="text-[11px] text-slate-500 truncate">{prod.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-bold text-[#00A86B]">{prod.price}</span>
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                                  isChecked
                                    ? "bg-[#00A86B] border-[#00A86B] text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 4: PDF Brochure Form */}
            {activeMode === "pdf_catalog" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Brochure Document Title</label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Public Document Link / URL</label>
                  <input
                    type="url"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-[#00A86B] outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Preview Bubble (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-[#EFEAE2] flex flex-col items-center justify-center border-t lg:border-t-0 border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 block">
              WhatsApp Live Bubble Preview
            </span>

            {/* Simulated WhatsApp Message Bubble */}
            <div className="w-full max-w-sm bg-white rounded-2xl rounded-tr-xs shadow-md border border-slate-200/80 overflow-hidden text-slate-800 transition-all">
              {/* Header Badge */}
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#0A504A]">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#00A86B]" />
                  <span>{businessName}</span>
                </div>
                <span className="text-[9px] font-mono text-slate-400">WhatsApp Catalog</span>
              </div>

              {/* Mode-specific content */}
              {activeMode === "catalog_message" && (
                <div>
                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
                    alt="Catalog Banner"
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-3.5 space-y-1.5">
                    <p className="text-xs font-bold text-[#0A504A]">{catalogTitle}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{catalogBody}</p>
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50">
                    <button
                      type="button"
                      className="w-full py-2 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>View Catalog</span>
                    </button>
                  </div>
                </div>
              )}

              {activeMode === "product" && (
                <div>
                  <img
                    src={currentSelectedProduct.imageUrl}
                    alt={currentSelectedProduct.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">{currentSelectedProduct.title}</p>
                      <span className="text-xs font-extrabold text-[#00A86B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {currentSelectedProduct.price}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{currentSelectedProduct.description}</p>
                  </div>
                  <div className="p-2 border-t border-slate-100 bg-slate-50 flex gap-1.5">
                    <button
                      type="button"
                      className="flex-1 py-2 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>View Item</span>
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      Message
                    </button>
                  </div>
                </div>
              )}

              {activeMode === "product_list" && (
                <div className="p-3.5 space-y-2">
                  <p className="text-xs font-bold text-[#0A504A]">{multiListHeader}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Browse our curated packages below directly in WhatsApp:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {productsList
                      .filter((p) => selectedMultiIds.includes(p.id))
                      .map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                          <span className="font-bold text-[#00A86B] shrink-0 ml-2">{p.price}</span>
                        </div>
                      ))}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      className="w-full py-2 bg-[#00A86B] hover:bg-[#0A504A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View Items ({selectedMultiIds.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {activeMode === "pdf_catalog" && (
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{pdfTitle}</p>
                      <p className="text-[10px] text-slate-500 font-mono">PDF • 3.4 MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 bg-[#0A504A] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <span>Download Brochure</span>
                  </button>
                </div>
              )}

              {/* Timestamp & Ticks */}
              <div className="px-3.5 pb-2 text-right">
                <span className="text-[10px] text-slate-400">12:30 PM • ✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
          {!canSend ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300/80 px-3.5 py-2 rounded-xl w-full sm:w-auto">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {activeMode === "product"
                  ? `Cannot send: This product is not approved by Meta yet (${currentSelectedProduct?.reviewStatus || "Under Review"}).`
                  : activeMode === "catalog_message"
                  ? "Cannot send: No approved products in your catalog yet. Awaiting Meta review."
                  : "Cannot send: Some selected items are not approved by Meta yet."}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Powered by <span className="font-bold text-[#00A86B]">WhatsApp Commerce Engine</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={handleSend}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                canSend
                  ? "bg-[#00A86B] hover:bg-[#0A504A] text-white shadow-sm cursor-pointer"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to Customer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

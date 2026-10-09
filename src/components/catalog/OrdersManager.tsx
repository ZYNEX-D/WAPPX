"use client";

import React, { useState, useMemo } from "react";
import {
  CatalogOrder,
  CatalogOrderStatus,
  Contact,
} from "@/types/whatsapp";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Phone,
  FileText,
  Send,
  Eye,
  Trash2,
  ArrowUpRight,
  Package,
} from "lucide-react";

interface OrdersManagerProps {
  orders: CatalogOrder[];
  contacts?: Contact[];
  clientId: string;
  onUpdateOrderStatus: (
    orderId: string,
    status: CatalogOrderStatus,
    trackingNumber?: string,
    shippingAddress?: string
  ) => Promise<boolean> | void;
  onDeleteOrder?: (orderId: string) => Promise<boolean> | void;
  onSendWhatsAppMessage?: (phone: string, text: string) => Promise<void> | void;
  onNavigateToChat?: (contactPhone: string) => void;
}

export function OrdersManager({
  orders,
  contacts = [],
  clientId,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSendWhatsAppMessage,
  onNavigateToChat,
}: OrdersManagerProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled"
  >("all");

  // Modals state (Zero window alerts/prompts)
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] =
    useState<CatalogOrder | null>(null);
  const [orderToShip, setOrderToShip] = useState<CatalogOrder | null>(null);
  const [courierName, setCourierName] = useState("Prompt Xpress");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");

  const [orderToConfirm, setOrderToConfirm] = useState<CatalogOrder | null>(null);
  const [confirmationNote, setConfirmationNote] = useState("");

  const [orderToDelete, setOrderToDelete] = useState<CatalogOrder | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Tab filter
      if (selectedFilter === "pending" && ord.status !== "pending") return false;
      if (selectedFilter === "confirmed" && ord.status !== "confirmed") return false;
      if (
        selectedFilter === "in_transit" &&
        ord.status !== "processing" &&
        ord.status !== "shipped"
      )
        return false;
      if (selectedFilter === "delivered" && ord.status !== "delivered") return false;
      if (selectedFilter === "cancelled" && ord.status !== "cancelled") return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchId = ord.id.toLowerCase().includes(q);
      const matchName = ord.contactName.toLowerCase().includes(q);
      const matchPhone = ord.contactPhone.toLowerCase().includes(q);
      const matchItem = ord.items.some((i) =>
        i.name.toLowerCase().includes(q)
      );
      const matchTracking = (ord.trackingNumber || "").toLowerCase().includes(q);
      return matchId || matchName || matchPhone || matchItem || matchTracking;
    });
  }, [orders, selectedFilter, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const inTransit = orders.filter(
      (o) => o.status === "processing" || o.status === "shipped"
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const currency = orders[0]?.currency || "LKR";

    return { total, pending, inTransit, delivered, totalRevenue, currency };
  }, [orders]);

  // Handle Confirm Order submission
  const handleConfirmOrder = async () => {
    if (!orderToConfirm) return;
    const ord = orderToConfirm;
    await onUpdateOrderStatus(ord.id, "confirmed");

    if (onSendWhatsAppMessage) {
      const msg =
        `✅ *Order Confirmed!*\n\n` +
        `Hello ${ord.contactName}, your order *#${ord.id}* has been confirmed!\n\n` +
        `📦 *Items:* ${ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}\n` +
        `💰 *Amount:* ${ord.currency} ${ord.subtotal.toLocaleString()}\n` +
        (confirmationNote ? `\nNote: ${confirmationNote}\n` : "") +
        `\nWe are now packing your items. Thank you for shopping with us!`;

      await onSendWhatsAppMessage(ord.contactPhone, msg);
    }

    setOrderToConfirm(null);
    setConfirmationNote("");
    showToast(`Order #${ord.id} confirmed & WhatsApp message sent`);
  };

  // Handle Dispatch / Ship Order submission
  const handleShipOrder = async () => {
    if (!orderToShip) return;
    const ord = orderToShip;
    const tracking = trackingNumberInput.trim() || undefined;
    await onUpdateOrderStatus(ord.id, "shipped", tracking);

    if (onSendWhatsAppMessage) {
      const msg =
        `🚚 *Order Dispatched!*\n\n` +
        `Hello ${ord.contactName}, your order *#${ord.id}* is on its way!\n\n` +
        (tracking ? `📦 Courier: ${courierName}\n🔖 Tracking #: *${tracking}*\n\n` : "") +
        `Please ensure someone is available at your delivery location to receive the package. Thank you!`;

      await onSendWhatsAppMessage(ord.contactPhone, msg);
    }

    setOrderToShip(null);
    setTrackingNumberInput("");
    showToast(`Order #${ord.id} marked as Shipped & tracking sent`);
  };

  // Status badge helper (Minimal dot + thin text)
  const renderStatusIndicator = (status: CatalogOrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>New Order</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Confirmed</span>
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-purple-700">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Processing</span>
          </span>
        );
      case "shipped":
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Shipped</span>
          </span>
        );
      case "delivered":
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-slate-600">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Delivered</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-rose-600">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-light text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFAF8] overflow-y-auto font-secondary">
      {/* METRICS ROW (Minimal, Thin Typography) */}
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-1 shadow-2xs">
            <span className="text-xs font-light text-slate-400 block">Total Orders</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-slate-900 tracking-tight">
                {metrics.total}
              </span>
              <span className="text-xs font-light text-slate-400">placed</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-1 shadow-2xs">
            <span className="text-xs font-light text-amber-600 block">Pending Confirmation</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-slate-900 tracking-tight">
                {metrics.pending}
              </span>
              <span className="text-xs font-light text-slate-400">new orders</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-1 shadow-2xs">
            <span className="text-xs font-light text-emerald-600 block">In Transit / Shipped</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-slate-900 tracking-tight">
                {metrics.inTransit}
              </span>
              <span className="text-xs font-light text-slate-400">on the way</span>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/70 space-y-1 shadow-2xs">
            <span className="text-xs font-light text-slate-400 block">Total Catalog Revenue</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-light text-slate-400">{metrics.currency}</span>
              <span className="text-2xl font-light text-slate-900 tracking-tight truncate">
                {metrics.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER TABS (Minimal styling, thin font) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          {/* Status Tabs */}
          <div className="flex items-center gap-5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={`text-xs tracking-wide pb-1 transition-colors cursor-pointer border-b-2 shrink-0 ${
                selectedFilter === "all"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600 font-light"
              }`}
            >
              All ({orders.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("pending")}
              className={`text-xs tracking-wide pb-1 transition-colors cursor-pointer border-b-2 shrink-0 ${
                selectedFilter === "pending"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600 font-light"
              }`}
            >
              New / Pending ({orders.filter((o) => o.status === "pending").length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("confirmed")}
              className={`text-xs tracking-wide pb-1 transition-colors cursor-pointer border-b-2 shrink-0 ${
                selectedFilter === "confirmed"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600 font-light"
              }`}
            >
              Confirmed ({orders.filter((o) => o.status === "confirmed").length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("in_transit")}
              className={`text-xs tracking-wide pb-1 transition-colors cursor-pointer border-b-2 shrink-0 ${
                selectedFilter === "in_transit"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600 font-light"
              }`}
            >
              In Transit (
              {
                orders.filter(
                  (o) => o.status === "processing" || o.status === "shipped"
                ).length
              }
              )
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("delivered")}
              className={`text-xs tracking-wide pb-1 transition-colors cursor-pointer border-b-2 shrink-0 ${
                selectedFilter === "delivered"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600 font-light"
              }`}
            >
              Delivered ({orders.filter((o) => o.status === "delivered").length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter("cancelled")}
              className={`text-xs tracking-wide pb-1 transition-colors cursor-pointer border-b-2 shrink-0 ${
                selectedFilter === "cancelled"
                  ? "border-slate-900 text-slate-900 font-normal"
                  : "border-transparent text-slate-400 hover:text-slate-600 font-light"
              }`}
            >
              Cancelled ({orders.filter((o) => o.status === "cancelled").length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, customer, item..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs font-light text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* ORDERS LIST CARDS (Minimal, No loud tag badges) */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-sm font-light text-slate-700">No orders found</p>
              <p className="text-xs font-light text-slate-400">
                When customers place orders from your WhatsApp catalog, they will appear here in real-time.
              </p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const formattedDate = new Date(ord.createdAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Order ID, Customer info, Date, Status */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-normal text-slate-900">
                        {ord.id}
                      </span>
                      <span className="text-xs font-light text-slate-400">
                        &bull; {formattedDate}
                      </span>
                      <span className="text-xs font-light text-slate-400">
                        &bull; {renderStatusIndicator(ord.status)}
                      </span>
                    </div>

                    {/* Customer info */}
                    <div className="flex items-center gap-3 text-xs font-light text-slate-500">
                      <span className="text-slate-800 font-normal">
                        {ord.contactName}
                      </span>
                      <span>({ord.contactPhone})</span>
                      {ord.trackingNumber && (
                        <span className="text-emerald-700 font-mono text-[11px]">
                          &bull; Tracking: {ord.trackingNumber}
                        </span>
                      )}
                    </div>

                    {/* Items List (Minimal plain text, no bulky tags) */}
                    <div className="text-xs font-light text-slate-600 space-y-0.5 pt-1">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-slate-400">{item.quantity}x</span>
                          <span className="truncate max-w-md">{item.name}</span>
                          <span className="text-slate-400">
                            ({item.currency} {item.unitPrice.toLocaleString()})
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Customer Note if present */}
                    {ord.customerNote && (
                      <p className="text-[11px] font-light text-slate-400 italic pt-1 max-w-xl truncate">
                        &quot;{ord.customerNote}&quot;
                      </p>
                    )}
                  </div>

                  {/* Right: Subtotal & Action buttons */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 lg:border-l lg:border-slate-100 lg:pl-6">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-light text-slate-400 block">
                        Subtotal ({ord.items.length} {ord.items.length === 1 ? "item" : "items"})
                      </span>
                      <span className="text-base font-normal text-slate-900">
                        {ord.currency} {ord.subtotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Quick Confirm button if pending */}
                      {ord.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToConfirm(ord);
                            setConfirmationNote("We have received your order and are packing it now.");
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-normal text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Confirm order & notify customer on WhatsApp"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm Order</span>
                        </button>
                      )}

                      {/* Quick Ship button if confirmed */}
                      {ord.status === "confirmed" && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToShip(ord);
                            setTrackingNumberInput(`TRK-${Date.now().toString().slice(-6)}`);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-normal text-white bg-emerald-700 hover:bg-emerald-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Mark as shipped & send tracking details"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Ship Order</span>
                        </button>
                      )}

                      {/* Mark Delivered if shipped */}
                      {ord.status === "shipped" && (
                        <button
                          type="button"
                          onClick={async () => {
                            await onUpdateOrderStatus(ord.id, "delivered");
                            showToast(`Order #${ord.id} marked as Delivered`);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-light text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {/* View Receipt / Invoice */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForReceipt(ord)}
                        className="px-3 py-1.5 rounded-xl text-xs font-light text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                        title="View order receipt"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Receipt</span>
                      </button>

                      {/* Open Chat in Live Inbox */}
                      {onNavigateToChat && (
                        <button
                          type="button"
                          onClick={() => onNavigateToChat(ord.contactPhone)}
                          className="w-8 h-8 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                          title="Open chat in Live Inbox"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete / Cancel order */}
                      {onDeleteOrder && (
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(ord)}
                          className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete or cancel order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROFESSIONAL CONFIRM ORDER MODAL                                          */}
      {/* ========================================================================= */}
      {orderToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-normal text-slate-900">Confirm Order</h3>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  Confirm #{orderToConfirm.id} and notify {orderToConfirm.contactName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderToConfirm(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs font-light space-y-1">
                <span className="text-slate-400 block">Items in order:</span>
                {orderToConfirm.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{i.quantity}x {i.name}</span>
                    <span>{i.currency} {(i.quantity * i.unitPrice).toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-normal text-slate-900">
                  <span>Total:</span>
                  <span>{orderToConfirm.currency} {orderToConfirm.subtotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">
                  WhatsApp Message Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={confirmationNote}
                  onChange={(e) => setConfirmationNote(e.target.value)}
                  placeholder="e.g. Expected delivery is tomorrow between 2-5 PM."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderToConfirm(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL SHIP ORDER MODAL                                             */}
      {/* ========================================================================= */}
      {orderToShip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-normal text-slate-900">Ship Order</h3>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  Dispatch #{orderToShip.id} and send tracking to customer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOrderToShip(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">Courier Partner</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Prompt Xpress, DHL, Domex"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-normal text-slate-700">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. PX-82736192"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-light text-slate-800 focus:bg-white focus:border-slate-400 outline-hidden transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderToShip(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShipOrder}
                  className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch & Notify</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL ORDER RECEIPT MODAL                                          */}
      {/* ========================================================================= */}
      {selectedOrderForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-normal text-slate-900">Order Receipt</h3>
                <p className="text-xs font-light text-slate-400 mt-0.5">
                  Order #{selectedOrderForReceipt.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForReceipt(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs font-light">
                <div>
                  <span className="text-slate-400 block">Customer</span>
                  <span className="text-slate-800 font-normal">
                    {selectedOrderForReceipt.contactName}
                  </span>
                  <span className="text-slate-500 block">
                    {selectedOrderForReceipt.contactPhone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status</span>
                  {renderStatusIndicator(selectedOrderForReceipt.status)}
                  <span className="text-slate-400 block text-[11px] mt-1">
                    {new Date(selectedOrderForReceipt.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedOrderForReceipt.customerNote && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-light">
                  <span className="text-slate-400 block text-[11px]">Customer Note / Delivery Address:</span>
                  <p className="text-slate-700 mt-0.5">{selectedOrderForReceipt.customerNote}</p>
                </div>
              )}

              {/* Items Table */}
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-400 font-light border-b border-slate-200/80">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-light text-slate-700">
                    {selectedOrderForReceipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-normal text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">
                          {item.currency} {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-normal">
                          {item.currency} {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/70 border-t border-slate-200/80 font-normal text-slate-900">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-right">
                        Subtotal:
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {selectedOrderForReceipt.currency}{" "}
                        {selectedOrderForReceipt.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Quick Status Changer in Receipt */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-light text-slate-400">Change Status:</span>
                  <select
                    value={selectedOrderForReceipt.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value as CatalogOrderStatus;
                      await onUpdateOrderStatus(selectedOrderForReceipt.id, newStatus);
                      setSelectedOrderForReceipt({
                        ...selectedOrderForReceipt,
                        status: newStatus,
                      });
                      showToast(`Status updated to ${newStatus}`);
                    }}
                    className="text-xs font-light text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-hidden"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderForReceipt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFESSIONAL DELETE / CANCEL ORDER MODAL                                  */}
      {/* ========================================================================= */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-secondary animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-base font-normal text-slate-900">Delete Order</h3>
                <p className="text-xs font-light text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to remove order <strong>#{orderToDelete.id}</strong> for {orderToDelete.contactName}? This record will be permanently deleted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-light text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (onDeleteOrder) {
                      await onDeleteOrder(orderToDelete.id);
                    }
                    setOrderToDelete(null);
                    showToast(`Order #${orderToDelete.id} deleted`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-normal text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-2xs"
                >
                  Delete Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-light flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

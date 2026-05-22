/**
 * OrdersSection.tsx
 * Drop this in: @modules/account/components/OrdersSection.tsx
 *
 * Shows the customer's orders as expandable cards.
 * Each card shows: order #, date, status, total.
 * Clicking expands a detailed breakdown of all line items.
 */

import { useState } from "react";
import type { MedusaOrder } from "@lib/data/medusa";
import type { HttpTypes } from "@medusajs/types";

function adaptOrder(order: HttpTypes.StoreOrder): MedusaOrder {
  return {
    id: order.id,
    display_id: order.display_id ?? parseInt(order.id.slice(-8), 16),
    status: order.status,
    payment_status: order.payment_status ?? "not_paid",
    fulfillment_status: order.fulfillment_status ?? "not_fulfilled",
    total: order.total,
    subtotal: order.subtotal ?? 0,
    shipping_total: order.shipping_total ?? 0,
    tax_total: order.tax_total ?? 0,
    currency_code: order.currency_code,
    created_at: order.created_at instanceof Date ? order.created_at.toISOString() : order.created_at,
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      title: item.product?.title ?? item.title ?? "Unknown",
      quantity: item.quantity,
      unit_price: item.unit_price,
      thumbnail: item.product?.thumbnail ?? item.thumbnail ?? undefined,
      variant: item.variant
        ? {
            title: item.variant.title ?? "",
            sku: item.variant.sku ?? undefined,
          }
        : undefined,
      product: item.product
        ? {
            title: item.product.title ?? "",
            thumbnail: item.product.thumbnail ?? undefined,
          }
        : undefined,
    })),
    shipping_address: order.shipping_address
        ? {
            first_name: order.shipping_address.first_name,
            last_name: order.shipping_address.last_name,
            address_1: order.shipping_address.address_1,
            city: order.shipping_address.city,
            country_code: order.shipping_address.country_code,
          }
        : undefined,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Format a price in millimes (or cents) to a readable string.
 * Medusa stores all prices in the smallest unit (e.g. 1000 = 10.000 TND).
 * For TND: 1 dinar = 1000 millimes → divide by 1000.
 * For EUR/USD: 1 unit = 100 cents → divide by 100.
 */
function formatPrice(amount: number, currencyCode: string): string {
  const isTND = currencyCode.toLowerCase() === "tnd";
  const divisor = isTND ? 1000 : 100;
  const value = amount / divisor;
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: isTND ? 3 : 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  completed: "Complétée",
  canceled: "Annulée",
  archived: "Archivée",
  requires_action: "Action requise",
  // payment statuses
  awaiting: "Paiement en attente",
  captured: "Payée",
  refunded: "Remboursée",
  partially_refunded: "Partiellement remboursée",
  not_paid: "Non payée",
  // fulfillment
  not_fulfilled: "Non expédiée",
  fulfilled: "Expédiée",
  partially_fulfilled: "Partiellement expédiée",
  shipped: "Livrée",
  delivered: "Livrée",
  returned: "Retournée",
};

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  captured: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  fulfilled: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  awaiting: "bg-amber-50 text-amber-700 border-amber-200",
  not_paid: "bg-amber-50 text-amber-700 border-amber-200",
  canceled: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-red-50 text-red-700 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  );
}

// ─── Single Order Card ────────────────────────────────────────────────────────

function OrderCard({ order }: { order: MedusaOrder }) {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <div className="border border-[#E8E6E1] rounded-xl overflow-hidden transition-shadow hover:shadow-md">
      {/* ── Card Header (always visible, clickable) ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 bg-white hover:bg-[#FAFAF9] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Order icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#F9F8F7] border border-[#E8E6E1] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#717182]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#1a1a2e] text-sm">
                Commande #{order.display_id}
              </span>
              <StatusBadge status={order.payment_status || order.status} />
            </div>
            <p className="text-xs text-[#717182] mt-0.5">
              {formatDate(order.created_at)} · {itemCount} article{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="font-bold text-[#1a1a2e] text-sm">
            {formatPrice(order.total, order.currency_code)}
          </span>
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-[#717182] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ── Expandable Detail Panel ── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-[#E8E6E1] bg-[#FAFAF9] px-6 py-5 space-y-5">

          {/* Line items */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#717182] uppercase tracking-wider">
              Articles commandés
            </h4>
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#E8E6E1]">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#F0EEEB]">
                  {item.thumbnail || item.product?.thumbnail ? (
                    <img
                      src={item.thumbnail || item.product?.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#C4C3D0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">
                    {item.product?.title || item.title}
                  </p>
                  {item.variant?.title && item.variant.title !== "Default Title" && (
                    <p className="text-xs text-[#717182]">{item.variant.title}</p>
                  )}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-[#1a1a2e]">
                    {formatPrice(item.unit_price * item.quantity, order.currency_code)}
                  </p>
                  <p className="text-xs text-[#717182]">
                    {item.quantity} × {formatPrice(item.unit_price, order.currency_code)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order totals */}
          <div className="bg-white rounded-lg border border-[#E8E6E1] p-4 space-y-2">
            <div className="flex justify-between text-sm text-[#717182]">
              <span>Sous-total</span>
              <span>{formatPrice(order.subtotal, order.currency_code)}</span>
            </div>
            {order.shipping_total > 0 && (
              <div className="flex justify-between text-sm text-[#717182]">
                <span>Livraison</span>
                <span>{formatPrice(order.shipping_total, order.currency_code)}</span>
              </div>
            )}
            {order.tax_total > 0 && (
              <div className="flex justify-between text-sm text-[#717182]">
                <span>Taxes</span>
                <span>{formatPrice(order.tax_total, order.currency_code)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#1a1a2e] pt-2 border-t border-[#E8E6E1]">
              <span>Total</span>
              <span>{formatPrice(order.total, order.currency_code)}</span>
            </div>
          </div>

          {/* Shipping address (if available) */}
          {order.shipping_address?.address_1 && (
            <div className="text-xs text-[#717182] space-y-0.5">
              <p className="font-semibold text-[#1a1a2e] uppercase tracking-wide text-[11px]">
                Adresse de livraison
              </p>
              <p>
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </p>
              <p>{order.shipping_address.address_1}</p>
              <p>
                {order.shipping_address.city}
                {order.shipping_address.country_code
                  ? `, ${order.shipping_address.country_code.toUpperCase()}`
                  : ""}
              </p>
            </div>
          )}

          {/* Statuses row */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[#717182]">
              <span>Paiement :</span>
              <StatusBadge status={order.payment_status} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#717182]">
              <span>Expédition :</span>
              <StatusBadge status={order.fulfillment_status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

interface OrdersSectionProps {
  orders: MedusaOrder[] | HttpTypes.StoreOrder[] | null;
  isLoading?: boolean;
}

export default function OrdersSection({ orders, isLoading }: OrdersSectionProps) {
  const adaptedOrders: MedusaOrder[] = (orders ?? []).map((order) => {
    // Check if it's an HttpTypes.StoreOrder (has item.unit_price directly)
    if ("items" in order && order.items && "unit_price" in (order.items?.[0] || {})) {
      return adaptOrder(order as HttpTypes.StoreOrder);
    }
    return order as MedusaOrder;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-[#E8E6E1] rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#E8E6E1] rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#E8E6E1] rounded w-40" />
                <div className="h-3 bg-[#E8E6E1] rounded w-28" />
              </div>
              <div className="h-4 bg-[#E8E6E1] rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!adaptedOrders || adaptedOrders.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-[#E8E6E1] rounded-xl">
        <div className="w-14 h-14 rounded-full bg-[#F9F8F7] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#C4C3D0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-[#1a1a2e] font-medium">Aucune commande pour l'instant</p>
        <p className="text-sm text-[#717182] mt-1">
          Vos commandes apparaîtront ici une fois passées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {adaptedOrders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
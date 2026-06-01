import { useState } from "react"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Package, ShoppingBag } from "lucide-react"

export interface OrderItem {
  id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  product_image?: string
}

export interface BackendOrder {
  id: string
  order_number: string
  status: "pending" | "processing" | "paid" | "shipped" | "delivered" | "cancelled"
  total_amount: number
  subtotal?: number
  shipping_amount?: number
  promo_code?: string
  discount_amount?: number
  created_at: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  shipping_address?: {
    fullName: string
    address: string
    city: string
    postalCode: string
    countryCode: string
    phone?: string
  }
  items?: OrderItem[]
}

function formatPrice(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return ""
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 3,
  }).format(num)
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd MMMM yyyy 'à' HH:mm")
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En traitement",
  paid: "Payée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status
  const color = STATUS_COLORS[status] ?? "bg-gray-50 text-gray-600 border-gray-200"
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {label}
    </span>
  )
}

interface OrderCardProps {
  order: BackendOrder
}

export function OrderCard({ order }: OrderCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <div className="border border-[#E8E6E1] rounded-xl overflow-hidden transition-all hover:shadow-md">
      {/* Card Header - Clickable */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 bg-white hover:bg-[#FAFAF9] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#F9F8F7] border border-[#E8E6E1] flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-[#717182]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-[#1a1a2e] text-sm">
                Commande #{order.order_number}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-[#717182] mt-0.5">
              {formatDate(order.created_at)} · {itemCount} article{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="font-bold text-[#1a1a2e] text-sm">
            {formatPrice(order.total_amount)}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#717182]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#717182]" />
          )}
        </div>
      </button>

      {/* Expandable Detail Panel */}
      {isOpen && (
        <div className="border-t border-[#E8E6E1] bg-[#FAFAF9] px-6 py-5 space-y-5">
          {/* Line Items */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#717182] uppercase tracking-wider">
                Articles commandés
              </h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#E8E6E1]"
                  >
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-[#F0EEEB]">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-[#C4C3D0]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a2e] truncate">
                        {item.product_name}
                      </p>
                      {item.product_sku && (
                        <p className="text-xs text-[#717182]">SKU: {item.product_sku}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-[#1a1a2e]">
                        {formatPrice(item.total_price)}
                      </p>
                      <p className="text-xs text-[#717182]">
                        {item.quantity} × {formatPrice(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping & Total */}
          <div className="bg-white rounded-lg border border-[#E8E6E1] p-4 space-y-2">
            {order.discount_amount && order.discount_amount > 0 && order.subtotal && (
              <div className="flex justify-between text-sm text-[#717182]">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
            )}
            {order.discount_amount && order.discount_amount > 0 && order.promo_code && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Remise ({order.promo_code})</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            {order.shipping_amount !== undefined && order.shipping_amount > 0 && (
              <div className="flex justify-between text-sm text-[#717182]">
                <span>Livraison</span>
                <span>{formatPrice(order.shipping_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[#1a1a2e] pt-2 border-t border-[#E8E6E1]">
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="text-xs text-[#717182] space-y-0.5">
              <p className="font-semibold text-[#1a1a2e] uppercase tracking-wide text-[11px]">
                Adresse de livraison
              </p>
              <p>
                {order.shipping_address.fullName}
              </p>
              <p>{order.shipping_address.address}</p>
              <p>
                {order.shipping_address.city} {order.shipping_address.postalCode}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface OrdersListProps {
  orders: BackendOrder[]
  isLoading?: boolean
}

export default function OrdersList({ orders, isLoading }: OrdersListProps) {
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
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-[#E8E6E1] rounded-xl">
        <div className="w-14 h-14 rounded-full bg-[#F9F8F7] flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-[#C4C3D0]" />
        </div>
        <p className="text-[#1a1a2e] font-medium">Aucune commande pour l'instant</p>
        <p className="text-sm text-[#717182] mt-1">
          Vos commandes apparaîtront ici une fois passées.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
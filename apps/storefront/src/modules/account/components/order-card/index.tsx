"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { Button } from "@modules/common/components/ui"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import OrderDetails from "@modules/order/components/order-details"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const [expanded, setExpanded] = useState(false)
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [maxHeight, setMaxHeight] = useState<string>("0px")

  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + (item.quantity ?? 0)
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  const toggle = () => setExpanded((v) => !v)

  useEffect(() => {
    const el = detailsRef.current
    if (!el) return
    if (expanded) {
      // measure and expand
      const h = el.scrollHeight
      setMaxHeight(h + "px")
    } else {
      setMaxHeight("0px")
    }
  }, [expanded])

  const formatStatus = (s?: string) => {
    if (!s) return "Unknown"
    const formatted = s.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="bg-white flex flex-col shadow-sm rounded-lg overflow-hidden" data-testid="order-card">
      <button
        onClick={toggle}
        className="w-full text-left p-4 flex items-center justify-between gap-4"
        aria-expanded={expanded}
      >
        <div>
          <div className="uppercase text-sm font-semibold mb-1">#<span data-testid="order-display-id">{order.display_id}</span></div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span data-testid="order-created-at">{new Date(order.created_at).toDateString()}</span>
            <span data-testid="order-amount">{convertToLocale({ amount: order.total, currency_code: order.currency_code })}</span>
            <span>{`${numberOfLines} ${numberOfLines > 1 ? "items" : "item"}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">{formatStatus(order.payment_status)}</div>
          <div className="text-xs text-gray-500">{order.items?.length ?? 0} products</div>
          <div className="text-sm text-ui-fg-interactive">{expanded ? "Hide" : "Details"}</div>
        </div>
      </button>

      <div
        ref={detailsRef}
        style={{ maxHeight, transition: "max-height 300ms ease" }}
        className="overflow-hidden px-4"
      >
        <div className="py-4 border-t">
          <OrderDetails order={order} showStatus />

          <div className="mt-4 grid grid-cols-1 gap-3">
            {(order.items || []).map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                  <Thumbnail thumbnail={it.thumbnail} images={[]} size="full" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{it.title}</div>
                  <div className="text-xs text-gray-600">{it.description || ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{convertToLocale({ amount: it.unit_price ?? it.unit_price_incl_tax ?? 0, currency_code: order.currency_code })}</div>
                  <div className="text-xs text-gray-600">Qty: {it.quantity}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
              <Button variant="secondary">Open order</Button>
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderCard

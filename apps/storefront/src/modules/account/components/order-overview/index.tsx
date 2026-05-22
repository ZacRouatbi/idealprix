"use client"

import { Button } from "@modules/common/components/ui"

import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-gray-200 pb-6 last:pb-0 last:border-none"
          >
            <div className="bg-white flex flex-col shadow-sm rounded-lg overflow-hidden" data-testid="order-card">
              <div className="w-full text-left p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="uppercase text-sm font-semibold mb-1">#<span data-testid="order-display-id">{o.display_id}</span></div>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span data-testid="order-created-at">{new Date(o.created_at).toDateString()}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-700">{o.payment_status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">Nothing to see here</h2>
      <p className="text-base-regular">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <div className="mt-4">
        <a href="/">
          <Button data-testid="continue-shopping-button">
            Continue shopping
          </Button>
        </a>
      </div>
    </div>
  )
}

export default OrderOverview

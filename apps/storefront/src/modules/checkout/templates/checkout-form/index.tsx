"use client"

import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { useEffect, useState } from "react"

export default function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  const [shippingMethods, setShippingMethods] = useState<HttpTypes.StoreCartShippingOption[] | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<{ id: string }[] | null>(null)

  useEffect(() => {
    if (cart) {
      listCartShippingMethods(cart.id).then(setShippingMethods)
      listCartPaymentMethods(cart.region?.id ?? "").then(setPaymentMethods)
    }
  }, [cart])

  if (!cart) {
    return null
  }

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      <Review cart={cart} />
    </div>
  )
}

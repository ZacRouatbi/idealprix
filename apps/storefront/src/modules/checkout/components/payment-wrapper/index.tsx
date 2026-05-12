"use client"

import { loadStripe } from "@stripe/stripe-js"
import React, { useEffect, useState } from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripeLike } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey =
  process.env.NEXT_PUBLIC_STRIPE_KEY ||
  process.env.VITE_STRIPE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY ||
  process.env.VITE_MEDUSA_PAYMENTS_PUBLISHABLE_KEY

const medusaAccountId = process.env.NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID || process.env.VITE_MEDUSA_PAYMENTS_ACCOUNT_ID
const stripePromise = stripeKey
  ? loadStripe(
      stripeKey,
      medusaAccountId ? { stripeAccount: medusaAccountId } : undefined
    )
  : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const [paymentSession, setPaymentSession] = useState(
    cart.payment_collection?.payment_sessions?.find((s) => s.status === "pending")
  )

  useEffect(() => {
    const session = cart.payment_collection?.payment_sessions?.find(
      (s) => s.status === "pending"
    )
    setPaymentSession(session)
  }, [cart])

  if (
    isStripeLike(paymentSession?.provider_id) &&
    paymentSession &&
    stripePromise
  ) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <div>{children}</div>
}

export default PaymentWrapper

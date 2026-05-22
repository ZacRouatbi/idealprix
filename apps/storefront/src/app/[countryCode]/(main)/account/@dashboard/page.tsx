import { Metadata } from "next"

import AccountTemplate from "@modules/account/templates"
import { notFound } from "next/navigation"
import { verifyAuth } from "@lib/data/backend-api"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  const cookieStore = await cookies()
  const token = cookieStore.get("storefront_auth_token")?.value

  if (!token) {
    notFound()
  }

  const { user } = await verifyAuth(token).catch(() => ({ user: null }))

  if (!user) {
    notFound()
  }

  const customer = {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: "",
  }

  const ordersResponse = await fetch(
    `${process.env.VITE_BACKEND_API_URL || "http://localhost:3000/api"}/orders/customer?limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).catch(() => null)

  const orders = ordersResponse ? await ordersResponse.json().catch(() => null) : null

  return <AccountTemplate customer={customer} orders={orders?.data || []} />
}

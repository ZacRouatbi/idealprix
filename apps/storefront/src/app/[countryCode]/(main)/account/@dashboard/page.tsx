import { Metadata } from "next"

import AccountTemplate from "@modules/account/templates"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "Account",
  description: "Overview of your account activity.",
}

export default async function OverviewTemplate() {
  const customer = await retrieveCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null

  if (!customer) {
    notFound()
  }

  return <AccountTemplate customer={customer} orders={orders} />
}

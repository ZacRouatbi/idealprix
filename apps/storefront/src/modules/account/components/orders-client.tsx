"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { useAuth } from "@lib/context/AuthContext"

export default function OrdersClient({ initialOrders }: { initialOrders?: HttpTypes.StoreOrder[] | null }) {
  const [orders, setOrders] = useState<HttpTypes.StoreOrder[] | null>(initialOrders ?? null)
  const [loading, setLoading] = useState<boolean>(!initialOrders)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const PUBLISHABLE_KEY = (import.meta as any).env?.VITE_MEDUSA_PUBLISHABLE_KEY || ""

  useEffect(() => {
    if (orders !== null) return
    let mounted = true
    async function fetchOrders() {
      setLoading(true)
      try {
        const headers: Record<string, string> = { "x-publishable-api-key": PUBLISHABLE_KEY }
        if (token) headers["Authorization"] = `Bearer ${token}`
        const res = await fetch(`/store/orders?limit=50`, { headers })
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          // Medusa returns { orders: [...] } or array depending on proxy; try both
          const list = data.orders ?? data
          setOrders(list)
        } else {
          const txt = await res.text()
          setError(txt || "Failed to fetch orders")
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch orders")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchOrders()
    return () => { mounted = false }
  }, [orders, token])

  if (loading) return <div className="p-6">Loading orders...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!orders || orders.length === 0)
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Vous n'avez pas encore passé de commande.</p>
        <a href="/products" className="text-red-600 font-medium hover:underline mt-2 inline-block">Découvrir nos produits</a>
      </div>
    )

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  const formatCurrency = (amount: number, currency: string) => new Intl.NumberFormat("fr-TN", { style: "currency", currency: currency?.toUpperCase() || "TND" }).format(amount / 100)
  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-800"
    if (status === "pending") return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-6 py-3 text-left font-medium">Commande</th>
            <th className="px-6 py-3 text-left font-medium">Date</th>
            <th className="px-6 py-3 text-left font-medium">Articles</th>
            <th className="px-6 py-3 text-left font-medium">Total</th>
            <th className="px-6 py-3 text-left font-medium">Statut</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order: any) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">#{order.display_id}</td>
              <td className="px-6 py-4 text-gray-600">{formatDate(order.created_at as string)}</td>
              <td className="px-6 py-4 text-gray-600">{order.items?.length || 0}</td>
              <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(order.total, order.currency_code)}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <a href={`/account/orders/details/${order.id}`} className="text-red-600 hover:underline text-sm font-medium">Détails</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { NextRequest, NextResponse } from "next/server"
import { orderService } from "@/services/order-service"
import { verifyTokenFromRequest } from "@/lib/auth-middleware"
import { sendOrderConfirmationEmail } from "@/emails/email-service"

async function checkAuth(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["admin", "manager", "staff"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const { id } = await params
  try {
    const order = await orderService.getOrder(id)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const items = order.items?.map((item: any) => ({
      name: item.product_name,
      quantity: item.quantity,
      price: `${Number(item.unit_price).toLocaleString("fr-TN")} TND`,
    })) || []

    const deliveryMethod = order.shipping_provider?.service_type === 'pickup' ? 'pickup' : 'shipping'
    const billingAddress = order.billing_address 
      ? `${order.billing_address.city}, Tunisie` 
      : undefined

    const success = await sendOrderConfirmationEmail({
      to: order.customer_email,
      customerName: order.customer_name || "",
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString("fr-TN"),
      total: `${Number(order.total_amount).toLocaleString("fr-TN")} TND`,
      shippingCost: order.shipping_amount > 0 
        ? `${Number(order.shipping_amount).toLocaleString("fr-TN")} TND` 
        : undefined,
      deliveryAddress: order.shipping_address 
        ? `${order.shipping_address.city}, Tunisie` 
        : "",
      deliveryMethod,
      billingAddress,
      trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/orders/${order.id}`,
      items,
    })

    return NextResponse.json({ 
      success, 
      message: success ? "Email sent successfully" : "Email not sent (SMTP not configured)",
      to: order.customer_email 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
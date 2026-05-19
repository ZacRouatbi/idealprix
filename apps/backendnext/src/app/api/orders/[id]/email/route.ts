import { NextRequest, NextResponse } from "next/server"
import { orderService } from "@/services/order-service"
import { verifyTokenFromRequest } from "@/lib/auth-middleware"

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

    const emailHtml = generateOrderEmail(order)

    return NextResponse.json({ 
      success: true, 
      message: "Email template generated", 
      emailHtml,
      to: order.customer_email 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateOrderEmail(order: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Update - IdealPrix</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%);
      margin: 0;
      padding: 20px;
      color: #1a1a1a;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      color: #3b82f6;
    }
    .content {
      padding: 32px 24px;
    }
    .order-info {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .order-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #64748b;
      font-weight: 500;
    }
    .value {
      color: #0f172a;
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    .status-processing { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-shipped { background: #ede9fe; color: #5b21b4; }
    .status-delivered { background: #dcfce7; color: #166534; }
    .footer {
      background: #f1f5f9;
      padding: 24px;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IP</div>
      <h1 style="margin: 0; font-size: 28px;">IdealPrix</h1>
      <p style="margin: 8px 0 0; opacity: 0.9;">Your order has been updated</p>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Hello ${order.customer_name || "there"}!</h2>
      <p>We wanted to let you know that your order <strong>#${order.order_number}</strong> status has been updated.</p>
      
      <div class="order-info">
        <div class="order-row">
          <span class="label">Order Number</span>
          <span class="value">#${order.order_number}</span>
        </div>
        <div class="order-row">
          <span class="label">Current Status</span>
          <span>
            <span class="status-badge status-${order.status}">${order.status}</span>
          </span>
        </div>
        <div class="order-row">
          <span class="label">Total Amount</span>
          <span class="value">${Number(order.total_amount).toLocaleString("fr-TN")} TND</span>
        </div>
        <div class="order-row">
          <span class="label">Order Date</span>
          <span class="value">${new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <a href="https://idealprix.com/orders/${order.id}" class="button">View Order Details</a>
      
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Thank you for choosing IdealPrix!</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 IdealPrix. All rights reserved.</p>
      <p>contact@idealprix.com | +216 XX XXX XXX</p>
    </div>
  </div>
</body>
</html>
  `
}
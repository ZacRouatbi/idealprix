import { NextRequest, NextResponse } from "next/server"
import { orderService } from "@/services/order-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const [orderStats, orders] = await Promise.all([
      orderService.getOrderStats(),
      orderService.listOrders({ limit: 100 }),
    ])

    const dailySales: Record<string, { revenue: number; orders: number }> = {}
    orders.data.forEach(order => {
      const date = new Date(order.created_at).toISOString().split("T")[0]
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, orders: 0 }
      }
      dailySales[date].revenue += parseFloat(order.total_amount as any) || 0
      dailySales[date].orders += 1
    })

    const chartData = Object.entries(dailySales)
      .map(([date, stats]) => `${date}: ${stats.orders} orders, ${stats.revenue.toLocaleString()} TND`)

    const pdfBuffer = generatePDFReport({
      title: "Sales Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Orders", value: orderStats.total },
        { label: "Total Revenue", value: `${orderStats.total_amount.toLocaleString()} TND` },
      ],
      tables: [
        {
          title: "Recent Orders",
          headers: ["Order", "Customer", "Amount", "Status", "Date"],
          data: orders.data.slice(0, 30).map(o => [
            o.order_number,
            o.customer_name || o.customer_email,
            `${parseFloat(o.total_amount as any).toLocaleString()} TND`,
            o.status,
            new Date(o.created_at).toLocaleDateString(),
          ]) as (string | number)[][],
        },
      ],
      chartText: chartData.slice(0, 20),
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Sales_Report.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
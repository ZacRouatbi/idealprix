import { NextRequest, NextResponse } from "next/server"
import { orderService } from "@/services/order-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const [orderStats, ordersByStatus] = await Promise.all([
      orderService.getOrderStats(),
      orderService.getOrdersByStatus(),
    ])

    const pdfBuffer = generatePDFReport({
      title: "Financial Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Revenue", value: `${orderStats.total_amount.toLocaleString()} TND` },
        { label: "Total Orders", value: orderStats.total },
      ],
      chartText: Object.entries(ordersByStatus).map(([status, count]) => `${status}: ${count} orders`),
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Financial_Report.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
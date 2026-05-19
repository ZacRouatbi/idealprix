import { NextRequest, NextResponse } from "next/server"
import { inventoryService } from "@/services/inventory-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const [inventory, lowStock] = await Promise.all([
      inventoryService.listInventory({ limit: 100 }),
      inventoryService.getLowStockItems(),
    ])

    const pdfBuffer = generatePDFReport({
      title: "Inventory Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Items", value: inventory.count },
        { label: "Low Stock Items", value: lowStock.length },
      ],
      tables: [
        {
          title: "Inventory",
          headers: ["Product", "Quantity", "Location"],
          data: inventory.data.map(i => [
            "-",
            String(i.quantity),
            i.location || "-",
          ]),
        },
        {
          title: "Low Stock Alert",
          headers: ["Product", "Quantity"],
          data: lowStock.map(i => [
            "-",
            String(i.quantity),
          ]),
        },
      ],
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Inventory_Report.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import { orderService } from "@/services/order-service"
import { productService } from "@/services/product-service"
import { inventoryService } from "@/services/inventory-service"
import { clientService } from "@/services/client-service"
import { categoryService } from "@/services/category-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const [orderStats, orders, products, inventory, clients, categories, lowStock] = await Promise.all([
      orderService.getOrderStats(),
      orderService.listOrders({ limit: 100 }),
      productService.listProducts({ limit: 100 }),
      inventoryService.listInventory({ limit: 100 }),
      clientService.listClients({ limit: 100 }),
      categoryService.listCategories({ limit: 100 }),
      inventoryService.getLowStockItems(),
    ])

    const pdfBuffer = generatePDFReport({
      title: "IdealPrix Business Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Revenue", value: `${orderStats.total_amount.toLocaleString()} TND` },
        { label: "Total Orders", value: orderStats.total },
        { label: "Total Products", value: products.count },
        { label: "Total Customers", value: clients.count },
        { label: "Total Categories", value: categories.count },
        { label: "Low Stock Items", value: lowStock.length },
      ],
      tables: [
        {
          title: "Orders",
          headers: ["Order Number", "Customer", "Amount", "Status", "Date"],
          data: orders.data.slice(0, 30).map(o => [
            o.order_number,
            o.customer_name || o.customer_email,
            `${parseFloat(o.total_amount as any).toLocaleString()} TND`,
            o.status,
            new Date(o.created_at).toLocaleDateString(),
          ]) as (string | number)[][],
        },
        {
          title: "Products",
          headers: ["Name", "SKU", "Price", "Stock"],
          data: products.data.slice(0, 30).map(p => [
            p.name,
            p.sku,
            `${parseFloat(String(p.price)).toLocaleString()} TND`,
            String(p.stock_quantity || 0),
          ]) as (string | number)[][],
        },
      ],
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="IdealPrix_Report_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
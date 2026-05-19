import { NextRequest, NextResponse } from "next/server"
import { productService } from "@/services/product-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const products = await productService.listProducts({ limit: 100 })

    const pdfBuffer = generatePDFReport({
      title: "Product Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Products", value: products.count },
      ],
      tables: [
        {
          title: "Products",
          headers: ["Name", "SKU", "Price", "Stock"],
          data: products.data.map(p => [
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
        "Content-Disposition": `attachment; filename="Product_Report.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
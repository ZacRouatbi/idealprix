import { NextRequest, NextResponse } from "next/server"
import { categoryService } from "@/services/category-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const categories = await categoryService.listCategories({ limit: 100 })

    const pdfBuffer = generatePDFReport({
      title: "Category Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Categories", value: categories.count },
      ],
      tables: [
        {
          title: "Categories",
          headers: ["Name", "Slug"],
          data: categories.data.map(c => [
            c.name,
            c.slug || "-",
          ]),
        },
      ],
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Category_Report.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
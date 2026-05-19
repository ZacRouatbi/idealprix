import { NextRequest, NextResponse } from "next/server"
import { clientService } from "@/services/client-service"
import { generatePDFReport } from "@/lib/pdf-utils"

export async function GET(request: NextRequest) {
  try {
    const clients = await clientService.listClients({ limit: 100 })

    const pdfBuffer = generatePDFReport({
      title: "Customer Report",
      subtitle: `Generated: ${new Date().toLocaleDateString()}`,
      stats: [
        { label: "Total Customers", value: clients.count },
      ],
      tables: [
        {
          title: "Customer List",
          headers: ["Name", "Email", "Created"],
          data: clients.data.map(c => [
            `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
            c.email,
            new Date(c.created_at).toLocaleDateString(),
          ]),
        },
      ],
    })

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Customer_Report.pdf"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
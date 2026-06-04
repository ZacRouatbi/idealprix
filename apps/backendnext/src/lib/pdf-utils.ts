import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import fs from "fs"
import path from "path"

export function generatePDFReport(options: {
  title: string
  subtitle?: string
  stats?: Array<{ label: string; value: string | number }>
  tables?: Array<{ title: string; headers: string[]; data: (string | number)[][] }>
  chartText?: string[]
}): Uint8Array {
  const doc = new jsPDF()
  let _initialY: number | undefined
  try {
    const logoPath = path.join(process.cwd(), "public", "idealprixlogo.png")
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath).toString("base64")
      // center and enlarge logo
      const pageWidth = (doc as any).internal.pageSize.getWidth
        ? (doc as any).internal.pageSize.getWidth()
        : (doc as any).internal.pageSize.width
      const logoWidth = 60
      const logoHeight = 30
      const xPos = (pageWidth - logoWidth) / 2
      const yPosLogo = 10
      doc.addImage("data:image/png;base64," + logoData, "PNG", xPos, yPosLogo, logoWidth, logoHeight)
      // push content below logo
      _initialY = yPosLogo + logoHeight + 10
    }
  } catch (e) {
    // ignore if reading logo fails
  }
  let yPos = typeof _initialY === "number" ? _initialY : 20

  doc.setFontSize(20)
  doc.text(options.title, 14, yPos)
  yPos += 10

  if (options.subtitle) {
    doc.setFontSize(12)
    doc.text(options.subtitle, 14, yPos)
    yPos += 15
  }

  if (options.stats && options.stats.length > 0) {
    doc.setFontSize(14)
    doc.text("Summary", 14, yPos)
    yPos += 10

    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: options.stats.map(s => [s.label, String(s.value)]),
      startY: yPos,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [212, 48, 42] },
    })
    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  if (options.tables) {
    options.tables.forEach(table => {
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.text(table.title, 14, yPos)
      yPos += 10

      autoTable(doc, {
        head: [table.headers],
        body: table.data,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [212, 48, 42] },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    })
  }

  if (options.chartText) {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.text("Data Overview", 14, yPos)
    yPos += 10

    options.chartText.forEach(line => {
      doc.setFontSize(9)
      doc.text(line, 20, yPos)
      yPos += 6
    })
  }

  return new Uint8Array(doc.output("arraybuffer"))
}
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function generatePDFReport(options: {
  title: string
  subtitle?: string
  stats?: Array<{ label: string; value: string | number }>
  tables?: Array<{ title: string; headers: string[]; data: (string | number)[][] }>
  chartText?: string[]
}): Uint8Array {
  const doc = new jsPDF()
  let yPos = 20

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
      headStyles: { fillColor: [59, 130, 246] },
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
        headStyles: { fillColor: [59, 130, 246] },
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
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export")
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ""
        if (typeof value === "object") return JSON.stringify(value)
        return String(value).includes(",") ? `"${String(value).replace(/"/g, '""')}"` : String(value)
      }).join(",")
    )
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportJSON<T>(data: T, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToPDF<T extends Record<string, any>>(
  data: T[], 
  filename: string, 
  title?: string
) {
  const doc = new jsPDF()
  
  if (title) {
    doc.setFontSize(16)
    doc.text(title, 14, 15)
  }
  
  if (data.length > 0) {
    const headers = Object.keys(data[0])
    
    autoTable(doc, {
      head: [headers],
      body: data.map(row => headers.map(h => formatValue(row[h]))),
      startY: title ? 25 : 14,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    })
  }
  
  doc.save(`${filename}.pdf`)
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "object") return JSON.stringify(value)
  if (typeof value === "number") return value.toLocaleString()
  return String(value)
}
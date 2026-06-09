"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { toast } from "sonner"

export default function RelatoriosPage() {
  async function gerarPDF() {
    try {
      const { default: jsPDF } = await import("jspdf")
      await import("jspdf-autotable")

      const doc = new jsPDF("portrait")
      const margin = 15
      let y = margin

      doc.setFontSize(16).setFont("helvetica", "bold")
      doc.text("Relatório de Monitoramento", margin, y)
      y += 10

      ;(doc as any).autoTable({
        head: [["Edificação", "Monitor", "Status", "Última Leitura"]],
        body: [["Nenhum dado disponível", "-", "-", "-"]],
        startY: y,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      })

      doc.save("relatorio-monitoramento.pdf")
      toast.success("Relatório gerado com sucesso")
    } catch {
      toast.error("Erro ao gerar relatório")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gere relatórios em PDF com os dados de monitoramento
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={gerarPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Gerar Relatório PDF
        </Button>
      </div>
    </div>
  )
}

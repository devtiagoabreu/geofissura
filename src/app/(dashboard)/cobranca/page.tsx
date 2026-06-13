"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Loader2, DollarSign, FileText, ChevronRight } from "lucide-react"

interface ClienteResumo {
  id: number
  nome: string
  slug: string
  totalSensores: number
  sensoresAtivos: number
  totalMensal: string
}

export default function CobrancaPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/cobranca")
      .then((r) => { if (r.status === 401) throw new Error(); return r.json() })
      .then(setClientes)
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  const totalGeral = clientes.reduce((acc, c) => acc + (parseFloat(c.totalMensal) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cobrança</h1>
          <p className="text-sm text-[var(--text-secondary)]">Precificação mensal por sensor</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Total mensal geral</p>
          <p className="text-2xl font-bold text-[var(--brand)]">
            {totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
      ) : clientes.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center text-sm text-[var(--text-secondary)]">
          Nenhum cliente cadastrado
        </div>
      ) : (
        <div className="grid gap-4">
          {clientes.map((c) => (
            <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-[var(--brand)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {c.sensoresAtivos} sensores ativos de {c.totalSensores} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-[var(--text-secondary)]">Mensal</p>
                    <p className="text-lg font-bold text-[var(--brand)]">
                      {(parseFloat(c.totalMensal) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                  <Link href={`/cobranca/${c.id}`}>
                    <Button size="sm" variant="outline">
                      Precificar <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/cobranca/${c.id}/relatorio`}>
                    <Button size="sm" variant="outline">
                      <FileText className="mr-1 h-4 w-4" /> Relatório
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

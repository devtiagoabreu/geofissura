"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Loader2, Save, FileText, DollarSign, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"

interface SensorPreco {
  id: number
  nome: string
  tipoSensor: string
  ativo: string
  precoId: number | null
  valorMensal: string | null
}

interface EdificacaoComSensores {
  id: number
  nome: string
  endereco: string | null
  sensores: SensorPreco[]
}

interface ClienteData {
  id: number
  nome: string
  slug: string
}

export default function CobrancaClientePage() {
  const params = useParams()
  const router = useRouter()
  const clienteId = params.clienteId as string

  const [cliente, setCliente] = useState<ClienteData | null>(null)
  const [edificacoes, setEdificacoes] = useState<EdificacaoComSensores[]>([])
  const [totalMensal, setTotalMensal] = useState("0")
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch(`/api/cobranca/${clienteId}`)
      .then((r) => { if (r.status === 401) throw new Error(); return r.json() })
      .then((data) => {
        setCliente(data.cliente)
        setEdificacoes(data.edificacoes)
        setTotalMensal(data.totalMensal)
        const values: Record<number, string> = {}
        for (const ed of data.edificacoes) {
          for (const s of ed.sensores) {
            values[s.id] = s.valorMensal ?? ""
          }
        }
        setEditValues(values)
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [clienteId, router])

  async function handleSave(sensorId: number) {
    setSavingId(sensorId)
    try {
      const res = await fetch("/api/cobranca/precos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId, valorMensal: editValues[sensorId] || "0" }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Valor salvo")
      const totalRes = await fetch(`/api/cobranca/${clienteId}`).then(r => r.json())
      setTotalMensal(totalRes.totalMensal)
    } catch { toast.error("Erro ao salvar") }
    finally { setSavingId(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
  }

  if (!cliente) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">Cliente não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cobranca">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{cliente.nome}</h1>
          <p className="text-sm text-[var(--text-secondary)]">Defina o valor mensal por sensor</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Total mensal</p>
          <p className="text-xl font-bold text-[var(--brand)]">
            {(parseFloat(totalMensal) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <Link href={`/cobranca/${clienteId}/relatorio`}>
          <Button variant="outline"><FileText className="mr-1 h-4 w-4" /> Relatório</Button>
        </Link>
      </div>

      {edificacoes.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 text-center text-sm text-[var(--text-secondary)]">
          Nenhuma edificação cadastrada para este cliente
        </div>
      ) : (
        edificacoes.map((ed) => (
          <div key={ed.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
              <Building2 className="h-5 w-5 text-[var(--brand)]" />
              <div>
                <p className="font-semibold">{ed.nome}</p>
                {ed.endereco && <p className="text-xs text-[var(--text-secondary)]">{ed.endereco}</p>}
              </div>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {ed.sensores.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-secondary)] text-center">Nenhum sensor</div>
              ) : (
                ed.sensores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {s.ativo === "S" ? (
                        <Wifi className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.nome}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{s.tipoSensor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editValues[s.id] ?? ""}
                          onChange={(e) => setEditValues((v) => ({ ...v, [s.id]: e.target.value }))}
                          className="w-28 pl-7 text-sm"
                          placeholder="0,00"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSave(s.id)}
                        disabled={savingId === s.id}
                      >
                        {savingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

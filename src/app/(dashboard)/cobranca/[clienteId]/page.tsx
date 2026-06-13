"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Building2, Loader2, Save, FileText, Wifi, WifiOff, Signal, HardDrive } from "lucide-react"
import { toast } from "sonner"

interface SensorPreco {
  id: number
  nome: string
  tipoSensor: string
  ativo: string
  precoId: number | null
  valorMensal: string | null
}

interface PlanoDadosItem {
  id: number
  operadora: string
  descricao: string | null
  valorMensal: string
  ativo: string
}

interface EquipamentoItem {
  id: number
  tipo: string
  descricao: string | null
  quantidade: number
  valorUnitario: string
  ativo: string
}

interface EdificacaoComItems {
  id: number
  nome: string
  endereco: string | null
  sensores: SensorPreco[]
  planosDados: PlanoDadosItem[]
  equipamentos: EquipamentoItem[]
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
  const [edificacoes, setEdificacoes] = useState<EdificacaoComItems[]>([])
  const [totalSensores, setTotalSensores] = useState("0")
  const [totalPlanos, setTotalPlanos] = useState("0")
  const [totalEquipamentos, setTotalEquipamentos] = useState("0")
  const [totalMensal, setTotalMensal] = useState("0")
  const [loading, setLoading] = useState(true)
  const [savingSensor, setSavingSensor] = useState<number | null>(null)
  const [savingPlano, setSavingPlano] = useState<number | null>(null)
  const [savingEquip, setSavingEquip] = useState<number | null>(null)
  const [sensorValues, setSensorValues] = useState<Record<number, string>>({})
  const [planoValues, setPlanoValues] = useState<Record<number, string>>({})
  const [equipValues, setEquipValues] = useState<Record<number, string>>({})

  useEffect(() => {
    fetch(`/api/cobranca/${clienteId}`)
      .then((r) => { if (r.status === 401) throw new Error(); return r.json() })
      .then((data) => {
        setCliente(data.cliente)
        setEdificacoes(data.edificacoes)
        setTotalSensores(data.totalSensores)
        setTotalPlanos(data.totalPlanos)
        setTotalEquipamentos(data.totalEquipamentos)
        setTotalMensal(data.totalMensal)
        const svals: Record<number, string> = {}
        const pvals: Record<number, string> = {}
        const evals: Record<number, string> = {}
        for (const ed of data.edificacoes) {
          for (const s of ed.sensores) svals[s.id] = s.valorMensal ?? ""
          for (const p of ed.planosDados) pvals[p.id] = p.valorMensal
          for (const e of ed.equipamentos) evals[e.id] = e.valorUnitario
        }
        setSensorValues(svals)
        setPlanoValues(pvals)
        setEquipValues(evals)
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }, [clienteId, router])

  async function reloadTotals() {
    const res = await fetch(`/api/cobranca/${clienteId}`).then(r => r.json())
    setTotalSensores(res.totalSensores)
    setTotalPlanos(res.totalPlanos)
    setTotalEquipamentos(res.totalEquipamentos)
    setTotalMensal(res.totalMensal)
  }

  async function handleSaveSensor(sensorId: number) {
    setSavingSensor(sensorId)
    try {
      const res = await fetch("/api/cobranca/precos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId, valorMensal: sensorValues[sensorId] || "0" }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Valor do sensor salvo")
      await reloadTotals()
    } catch { toast.error("Erro ao salvar") }
    finally { setSavingSensor(null) }
  }

  async function handleSavePlano(planoId: number) {
    setSavingPlano(planoId)
    try {
      const res = await fetch("/api/cobranca/planos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: planoId, valorMensal: planoValues[planoId] || "0" }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Valor do plano salvo")
      await reloadTotals()
    } catch { toast.error("Erro ao salvar") }
    finally { setSavingPlano(null) }
  }

  async function handleSaveEquip(equipId: number) {
    setSavingEquip(equipId)
    try {
      const res = await fetch("/api/cobranca/equipamentos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: equipId, valorUnitario: equipValues[equipId] || "0" }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Valor do equipamento salvo")
      await reloadTotals()
    } catch { toast.error("Erro ao salvar") }
    finally { setSavingEquip(null) }
  }

  function fmt(v: string | number) {
    return (typeof v === "string" ? parseFloat(v) : v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
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
          <p className="text-sm text-[var(--text-secondary)]">Precificação mensal</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Sensores</p>
          <p className="text-md font-semibold">{fmt(totalSensores)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Planos</p>
          <p className="text-md font-semibold">{fmt(totalPlanos)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Equip.</p>
          <p className="text-md font-semibold">{fmt(totalEquipamentos)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--text-secondary)]">Total</p>
          <p className="text-xl font-bold text-[var(--brand)]">{fmt(totalMensal)}</p>
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
        edificacoes.map((ed) => {
          return (
            <div key={ed.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                <Building2 className="h-5 w-5 text-[var(--brand)]" />
                <div className="flex-1">
                  <p className="font-semibold">{ed.nome}</p>
                  {ed.endereco && <p className="text-xs text-[var(--text-secondary)]">{ed.endereco}</p>}
                </div>
              </div>

              {/* Sensores */}
              <div className="divide-y divide-[var(--border)]">
                <div className="px-5 py-2 bg-[var(--bg-secondary)]/10">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Sensores</p>
                </div>
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
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sensorValues[s.id] ?? ""}
                          onChange={(e) => setSensorValues((v) => ({ ...v, [s.id]: e.target.value }))}
                          className="w-24 pl-2 text-sm"
                          placeholder="0,00"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveSensor(s.id)}
                          disabled={savingSensor === s.id}
                        >
                          {savingSensor === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Planos de Dados */}
              {ed.planosDados.length > 0 && (
                <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                  <div className="px-5 py-2 bg-[var(--bg-secondary)]/10">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                      <Signal className="h-3 w-3" /> Planos de Dados
                    </p>
                  </div>
                  {ed.planosDados.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Signal className={`h-4 w-4 shrink-0 ${p.ativo === "S" ? "text-green-500" : "text-red-400"}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.operadora}</p>
                          {p.descricao && <p className="text-xs text-[var(--text-secondary)]">{p.descricao}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={planoValues[p.id] ?? ""}
                          onChange={(e) => setPlanoValues((v) => ({ ...v, [p.id]: e.target.value }))}
                          className="w-24 pl-2 text-sm"
                          placeholder="0,00"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSavePlano(p.id)}
                          disabled={savingPlano === p.id}
                        >
                          {savingPlano === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Equipamentos */}
              {ed.equipamentos.length > 0 && (
                <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                  <div className="px-5 py-2 bg-[var(--bg-secondary)]/10">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                      <HardDrive className="h-3 w-3" /> Equipamentos
                    </p>
                  </div>
                  {ed.equipamentos.map((eq) => (
                    <div key={eq.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <HardDrive className={`h-4 w-4 shrink-0 ${eq.ativo === "S" ? "text-green-500" : "text-red-400"}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{eq.tipo}</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {eq.descricao ? `${eq.descricao} — ` : ""}{eq.quantidade}x
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-[var(--text-secondary)]">Valor unit.</p>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={equipValues[eq.id] ?? ""}
                            onChange={(ev) => setEquipValues((v) => ({ ...v, [eq.id]: ev.target.value }))}
                            className="w-24 pl-2 text-sm"
                            placeholder="0,00"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEquip(eq.id)}
                          disabled={savingEquip === eq.id}
                          className="mt-4"
                        >
                          {savingEquip === eq.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

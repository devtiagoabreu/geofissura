"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Pencil, X, Cpu, WifiOff, Save, DollarSign } from "lucide-react"
import { toast } from "sonner"

interface SensorItem {
  id: number
  edificacaoId: number
  tipoSensor: string
  nome: string
  descricao: string | null
  ativo: string
  dados: Record<string, unknown>
}

interface PrecoSensor {
  id: number
  sensorId: number
  valorMensal: string
}

const tiposSensor = [
  "inclinometro",
  "fissurometro",
  "termometro",
  "piezometro",
  "extensometro",
]

export function SensoresSection({ edificacaoId, isSuper }: { edificacaoId: number; isSuper: boolean }) {
  const [sensores, setSensores] = useState<SensorItem[]>([])
  const [precos, setPrecos] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPreco, setSavingPreco] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetch("/api/sensores")
      .then(r => r.json())
      .then((lista: SensorItem[]) => {
        const filtrados = Array.isArray(lista) ? lista.filter(s => s.edificacaoId === edificacaoId) : []
        setSensores(filtrados)
        if (filtrados.length > 0) {
          return fetch(`/api/cobranca/precos?sensorIds=${filtrados.map(s => s.id).join(",")}`).then(r => r.json())
        }
        return []
      })
      .then((prices: PrecoSensor[]) => {
        const map: Record<number, string> = {}
        if (Array.isArray(prices)) {
          for (const p of prices) map[p.sensorId] = p.valorMensal
        }
        setPrecos(map)
      })
      .catch(() => toast.error("Erro ao carregar sensores"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/sensores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edificacaoId,
          tipoSensor: form.get("tipoSensor"),
          nome: form.get("nome"),
          descricao: form.get("descricao") || null,
          dados: {},
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Sensor adicionado")
      setShowForm(false)
      load()
    } catch { toast.error("Erro ao adicionar sensor") }
    finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/sensores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoSensor: form.get("tipoSensor"),
          nome: form.get("nome"),
          descricao: form.get("descricao") || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Sensor atualizado")
      setEditingId(null)
      load()
    } catch { toast.error("Erro ao atualizar sensor") }
    finally { setSaving(false) }
  }

  async function handleSavePreco(sensorId: number) {
    setSavingPreco(sensorId)
    try {
      const res = await fetch("/api/cobranca/precos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId, valorMensal: precos[sensorId] || "0" }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Valor salvo")
    } catch { toast.error("Erro ao salvar valor") }
    finally { setSavingPreco(null) }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este sensor?")) return
    try {
      const res = await fetch(`/api/sensores/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Sensor excluído")
      load()
    } catch { toast.error("Erro ao excluir") }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sensores Instalados</h2>
        {isSuper && (
          <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null) }}>
            <Plus className="mr-1 h-3 w-3" /> Adicionar Sensor
          </Button>
        )}
      </div>

      {isSuper && showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tipoSensor">Tipo de Sensor</Label>
            <select id="tipoSensor" name="tipoSensor" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
              <option value="">Selecione...</option>
              {tiposSensor.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" placeholder="Inclinômetro Digital" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Sensor de inclinação bi-axial" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Salvar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" /></div>
        ) : sensores.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum sensor instalado nesta edificação</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {sensores.map((sensor) => (
              editingId === sensor.id ? (
                <form key={sensor.id} onSubmit={(e) => handleUpdate(e, sensor.id)} className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <select name="tipoSensor" defaultValue={sensor.tipoSensor} required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors">
                      {tiposSensor.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Nome</Label>
                    <Input name="nome" defaultValue={sensor.nome} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Descrição</Label>
                    <Input name="descricao" defaultValue={sensor.descricao ?? ""} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />} Salvar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="mr-1 h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div key={sensor.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {sensor.ativo === "S" ? (
                      <Cpu className="h-8 w-8 shrink-0 text-[var(--brand)]" />
                    ) : (
                      <WifiOff className="h-8 w-8 shrink-0 text-red-400" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                          {sensor.tipoSensor}
                        </span>
                      </div>
                      <p className="font-medium">{sensor.nome}</p>
                      {sensor.descricao && (
                        <p className="text-xs text-[var(--text-secondary)]">{sensor.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isSuper && (
                      <>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-secondary)]" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={precos[sensor.id] ?? ""}
                            onChange={(e) => setPrecos((v) => ({ ...v, [sensor.id]: e.target.value }))}
                            className="w-20 pl-6 text-xs"
                            placeholder="0,00"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSavePreco(sensor.id)}
                          disabled={savingPreco === sensor.id}
                        >
                          {savingPreco === sensor.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(sensor.id); setShowForm(false) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sensor.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Pencil, ExternalLink, FileText, X } from "lucide-react"
import { toast } from "sonner"

interface Documento {
  id: number
  url: string
  descricao: string
  usuarioNome: string | null
  createdAt: string | null
}

export function DocumentosSection({ edificacaoId }: { edificacaoId: number }) {
  const [docs, setDocs] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  function load() {
    setLoading(true)
    fetch(`/api/documentos?edificacaoId=${edificacaoId}`)
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => toast.error("Erro ao carregar documentos"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edificacaoId,
          url: form.get("url"),
          descricao: form.get("descricao"),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Documento adicionado")
      setShowForm(false)
      load()
    } catch {
      toast.error("Erro ao adicionar documento")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)

    try {
      const res = await fetch(`/api/documentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.get("url"),
          descricao: form.get("descricao"),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Documento atualizado")
      setEditingId(null)
      load()
    } catch {
      toast.error("Erro ao atualizar documento")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este documento?")) return
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Documento excluído")
      load()
    } catch {
      toast.error("Erro ao excluir")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditingId(null) }}>
          <Plus className="mr-1 h-3 w-3" />
          Adicionar Link
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm space-y-3">
          <div className="space-y-1">
            <Label htmlFor="url">Link (Google Drive, Dropbox, etc)</Label>
            <Input id="url" name="url" type="url" placeholder="https://drive.google.com/..." required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" placeholder="Laudo estrutural - março 2026" required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Salvar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhum documento vinculado
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {docs.map((doc) => (
              editingId === doc.id ? (
                <form key={doc.id} onSubmit={(e) => handleUpdate(e, doc.id)} className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`url-${doc.id}`}>Link</Label>
                    <Input id={`url-${doc.id}`} name="url" type="url" defaultValue={doc.url} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`desc-${doc.id}`}>Descrição</Label>
                    <Input id={`desc-${doc.id}`} name="descricao" defaultValue={doc.descricao} required />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Salvar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="mr-1 h-3 w-3" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div key={doc.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 shrink-0 text-[var(--brand)]" />
                    <div className="min-w-0">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 font-medium text-[var(--brand)] hover:underline"
                      >
                        {doc.descricao}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Adicionado por {doc.usuarioNome ?? "—"} {doc.createdAt ? new Date(doc.createdAt).toLocaleString("pt-BR") : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingId(doc.id); setShowForm(false) }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

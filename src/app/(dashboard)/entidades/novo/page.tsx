"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function NovaEntidadePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = {
      edificacaoId: Number(form.get("edificacaoId")),
      tipoEntidade: form.get("tipoEntidade") as string,
      nome: form.get("nome") as string,
      descricao: form.get("descricao") as string,
    }

    try {
      const res = await fetch("/api/entidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Entidade cadastrada com sucesso")
      router.push("/entidades")
    } catch {
      toast.error("Erro ao cadastrar entidade")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Nova Entidade</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Cadastre engenheiros, equipamentos, monitores, sensores, laudos...
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edificacaoId">ID da Edificação</Label>
          <Input id="edificacaoId" name="edificacaoId" type="number" placeholder="1" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoEntidade">Tipo</Label>
          <Input
            id="tipoEntidade"
            name="tipoEntidade"
            placeholder="engenheiro, equipamento, monitor, laudo, sensor..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" placeholder="Nome da entidade" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" name="descricao" placeholder="Descrição opcional" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

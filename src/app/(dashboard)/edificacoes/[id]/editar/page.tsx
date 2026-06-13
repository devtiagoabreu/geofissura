"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EditarEdificacaoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [nome, setNome] = useState("")
  const [endereco, setEndereco] = useState("")

  useEffect(() => {
    fetch(`/api/edificacoes/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setNome(data.nome)
        setEndereco(data.endereco ?? "")
        setLoadingData(false)
      })
      .catch(() => {
        toast.error("Erro ao carregar dados")
        router.push("/edificacoes")
      })
  }, [params.id, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/edificacoes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, endereco }),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success("Edificação atualizada com sucesso")
      router.push(`/edificacoes/${params.id}`)
    } catch {
      toast.error("Erro ao atualizar edificação")
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Editar Edificação</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
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

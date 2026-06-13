"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Loader2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export default function ConfiguracoesPage() {
  const { data: session } = useSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Senhas não conferem")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Nova senha deve ter no mínimo 6 caracteres")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/usuarios/${session?.user?.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao alterar senha")
        return
      }
      toast.success("Senha alterada com sucesso!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast.error("Erro ao alterar senha")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-[var(--text-secondary)]">Altere sua senha de acesso</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <div className="h-10 w-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-[var(--brand)]" />
          </div>
          <div>
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-xs text-[var(--text-secondary)]">{session?.user?.email}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Senha Atual</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="newPassword">Nova Senha</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Salvando..." : "Alterar Senha"}
        </Button>
      </form>
    </div>
  )
}

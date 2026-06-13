"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Shield, ShieldCheck, Building2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Usuario {
  id: number
  nome: string
  email: string
  role: string
  tenantId: number
  tenantNome?: string
  createdAt: string | null
}

interface Tenant {
  id: number
  nome: string
  slug: string
  ativo: string
  createdAt: string | null
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-[var(--brand)] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
      }`}
    >
      {children}
    </button>
  )
}

function UsuariosTab() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const { data: session } = useSession()
  const isSuper = session?.user?.role === "SUPER"

  function loadUsuarios() {
    setLoading(true)
    fetch("/api/usuarios")
      .then((r) => {
        if (r.status === 401) throw new Error("Unauthorized")
        return r.json()
      })
      .then((data) => setUsuarios(data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsuarios() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.get("nome"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Usuário cadastrado com sucesso")
      setShowForm(false)
      loadUsuarios()
    } catch { toast.error("Erro ao cadastrar usuário") }
    finally { setSaving(false) }
  }

  async function handleRoleChange(id: number, role: string) {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error()
      toast.success("Papel atualizado")
      loadUsuarios()
    } catch { toast.error("Erro ao atualizar papel") }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir usuário "${nome}"?`)) return
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Usuário excluído")
      loadUsuarios()
    } catch { toast.error("Erro ao excluir usuário") }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Gerencie usuários do sistema</p>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Cadastrar Usuário</h2>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <select
              id="role" name="role"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
              defaultValue="USER"
            >
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
              <option value="VIEWER">Visualizador</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum usuário cadastrado</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-xs font-bold text-[var(--brand)] shrink-0">
                    {u.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{u.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
                    {isSuper && u.tenantNome && (
                      <p className="text-xs text-[var(--brand)] truncate">{u.tenantNome}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-xs"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    u.role === "ADMIN" || u.role === "SUPER"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role === "ADMIN" || u.role === "SUPER"
                      ? <ShieldCheck className="h-3 w-3" />
                      : <Shield className="h-3 w-3" />
                    }
                    {u.role}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id, u.nome)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TenantsTab() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function loadTenants() {
    setLoading(true)
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data) => setTenants(data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTenants() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.get("nome"),
          slug: form.get("slug"),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Tenant cadastrado com sucesso!")
      setShowForm(false)
      loadTenants()
    } catch { toast.error("Erro ao cadastrar tenant") }
    finally { setSaving(false) }
  }

  async function handleToggleAtivo(id: number, ativo: string) {
    try {
      await fetch(`/api/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: ativo === "S" ? "N" : "S" }),
      })
      loadTenants()
    } catch { toast.error("Erro ao atualizar") }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir tenant "${nome}"? Todas as edificações, sensores e usuários serão removidos.`)) return
    try {
      await fetch(`/api/tenants/${id}`, { method: "DELETE" })
      toast.success("Tenant excluído")
      loadTenants()
    } catch { toast.error("Erro ao excluir tenant") }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Gerencie os tenants (clientes) do sistema</p>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Novo Tenant
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Cadastrar Tenant</h2>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Tenant</Label>
            <Input id="nome" name="nome" required placeholder="Ex: Construtora XYZ" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (identificador único)</Label>
            <Input id="slug" name="slug" required placeholder="Ex: construtora-xyz" />
            <p className="text-xs text-[var(--text-secondary)]">Usado em URLs e identificação do MQTT. Apenas letras minúsculas, números e hífens.</p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum tenant cadastrado</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {tenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-xs font-bold text-[var(--brand)] shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{t.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleAtivo(t.id, t.ativo)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      t.ativo === "S"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {t.ativo === "S" ? "Ativo" : "Inativo"}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id, t.nome)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState<"usuarios" | "tenants">("usuarios")
  const { data: session } = useSession()
  const isSuper = session?.user?.role === "SUPER"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administração</h1>
        <p className="text-sm text-[var(--text-secondary)]">Configurações do sistema</p>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <TabButton active={tab === "usuarios"} onClick={() => setTab("usuarios")}>
          Usuários
        </TabButton>
        {isSuper && (
          <TabButton active={tab === "tenants"} onClick={() => setTab("tenants")}>
            Tenants
          </TabButton>
        )}
      </div>

      {tab === "usuarios" && <UsuariosTab />}
      {tab === "tenants" && <TenantsTab />}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Shield, ShieldCheck, Building2, Pencil, Check, ArrowLeft, Users, KeyRound } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

interface Usuario {
  id: number
  nome: string
  email: string
  role: string
  clienteId: number
  createdAt: string | null
}

interface Cliente {
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
        active ? "bg-[var(--brand)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
      }`}
    >
      {children}
    </button>
  )
}

interface UserListProps {
  clienteId: number
  back: () => void
  clienteNome: string
}

function UserList({ clienteId, back, clienteNome }: UserListProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Usuario>>({})
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)

  function load() {
    setLoading(true)
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((data) => setUsuarios(data.filter((u: Usuario) => u.clienteId === clienteId)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [clienteId])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.get("nome"), email: form.get("email"), password: form.get("password"), role: form.get("role"), clienteId }),
      })
      if (!res.ok) throw new Error()
      toast.success("Usuário criado"); setShowForm(false); load()
    } catch { toast.error("Erro ao criar") }
    finally { setSaving(false) }
  }

  async function handleEditSave(id: number) {
    try {
      const body: Record<string, unknown> = {}
      if (editForm.nome) body.nome = editForm.nome
      if (editForm.email) body.email = editForm.email
      if (editForm.role) body.role = editForm.role
      const res = await fetch(`/api/usuarios/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      toast.success("Atualizado"); setEditingId(null); load()
    } catch { toast.error("Erro ao atualizar") }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir "${nome}"?`)) return
    try { await fetch(`/api/usuarios/${id}`, { method: "DELETE" }); toast.success("Excluído"); load() }
    catch { toast.error("Erro ao excluir") }
  }

  async function handleResetPassword(id: number) {
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres")
      return
    }
    setResettingPassword(true)
    try {
      const res = await fetch(`/api/usuarios/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Senha redefinida")
      setResetPasswordId(null)
      setResetPasswordValue("")
    } catch { toast.error("Erro ao redefinir senha") }
    finally { setResettingPassword(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={back}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{clienteNome}</h2>
          <p className="text-sm text-[var(--text-secondary)]">Usuários do cliente</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="mr-1 h-4 w-4" />Novo Usuário</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm space-y-4">
          <h3 className="font-semibold">Cadastrar Usuário</h3>
          <div className="space-y-2"><Label>Nome</Label><Input name="nome" required /></div>
          <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required /></div>
          <div className="space-y-2"><Label>Senha</Label><Input name="password" type="password" required /></div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <select name="role" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm" defaultValue="USER">
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
              <option value="VIEWER">Visualizador</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
        ) : usuarios.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum usuário neste cliente</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {usuarios.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                {editingId === u.id ? (
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <input defaultValue={u.nome} onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <input defaultValue={u.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Papel</Label>
                      <select defaultValue={u.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm">
                        <option value="VIEWER">Viewer</option>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                    <div className="col-span-3 flex gap-1 justify-end">
                      <Button size="sm" onClick={() => handleEditSave(u.id)}><Check className="h-3 w-3 mr-1" />Salvar</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-xs font-bold text-[var(--brand)] shrink-0">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.nome}</p>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {resetPasswordId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="password"
                            placeholder="Nova senha"
                            value={resetPasswordValue}
                            onChange={(e) => setResetPasswordValue(e.target.value)}
                            className="w-32 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleResetPassword(u.id)} disabled={resettingPassword}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setResetPasswordId(null); setResetPasswordValue("") }}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setResetPasswordId(u.id); setResetPasswordValue("") }} title="Redefinir senha">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingId(u.id); setEditForm({ nome: u.nome, email: u.email, role: u.role }) }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        u.role === "ADMIN" || u.role === "SUPER" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {u.role === "ADMIN" || u.role === "SUPER" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                        {u.role}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id, u.nome)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientesTab() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [allUsers, setAllUsers] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Cliente>>({})
  const [selectedCliente, setSelectedCliente] = useState<{ id: number; nome: string } | null>(null)

  function load() {
    setLoading(true)
    Promise.all([
      fetch("/api/clientes").then((r) => r.json()),
      fetch("/api/usuarios").then((r) => r.json()),
    ]).then(([t, u]) => {
      setClientes(t)
      setAllUsers(u)
    }).catch(() => router.push("/dashboard"))
    .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: form.get("nome"), slug: form.get("slug") }) })
      if (!res.ok) throw new Error(); toast.success("Cliente criado!"); setShowForm(false); load()
    } catch { toast.error("Erro ao criar") }
    finally { setSaving(false) }
  }

  async function handleEditSave(id: number) {
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) })
      if (!res.ok) throw new Error(); toast.success("Cliente atualizado"); setEditingId(null); load()
    } catch { toast.error("Erro ao atualizar") }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir "${nome}"? Todas as edificações, sensores e usuários serão removidos.`)) return
    try { await fetch(`/api/clientes/${id}`, { method: "DELETE" }); toast.success("Excluído"); load() }
    catch { toast.error("Erro ao excluir") }
  }

  if (selectedCliente) {
    return <UserList clienteId={selectedCliente.id} clienteNome={selectedCliente.nome} back={() => setSelectedCliente(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Clientes cadastrados no sistema</p>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="mr-1 h-4 w-4" />Novo Cliente</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Cadastrar Cliente</h2>
          <div className="space-y-2"><Label>Nome</Label><Input name="nome" required placeholder="Ex: Construtora XYZ" /></div>
          <div className="space-y-2"><Label>Slug</Label><Input name="slug" required placeholder="Ex: construtora-xyz" /></div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
        ) : clientes.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum cliente</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {clientes.map((t) => {
              const userCount = allUsers.filter((u) => u.clienteId === t.id).length
              return (
                <div key={t.id} className="flex items-center justify-between p-4">
                  {editingId === t.id ? (
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <input defaultValue={t.nome} onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                          className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Slug</Label>
                        <input defaultValue={t.slug} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                          className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm" />
                      </div>
                      <div className="col-span-2 flex gap-1 justify-end">
                        <Button size="sm" onClick={() => handleEditSave(t.id)}><Check className="h-3 w-3 mr-1" />Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setSelectedCliente({ id: t.id, nome: t.nome })} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                        <div className="h-9 w-9 rounded-full bg-[var(--brand)]/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-[var(--brand)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{t.nome}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{t.slug}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <Users className="h-3 w-3" />
                          {userCount}
                        </span>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingId(t.id); setEditForm({ nome: t.nome, slug: t.slug }) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.nome) }} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState<"usuarios" | "clientes">("clientes")
  const { data: session } = useSession()
  const isSuper = session?.user?.role === "SUPER"

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Administração</h1><p className="text-sm text-[var(--text-secondary)]">Configurações do sistema</p></div>
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <TabButton active={tab === "clientes"} onClick={() => setTab("clientes")}>Clientes</TabButton>
        {isSuper && <TabButton active={tab === "usuarios"} onClick={() => setTab("usuarios")}>Todos Usuários</TabButton>}
      </div>
      {tab === "clientes" && <ClientesTab />}
      {tab === "usuarios" && <UsuariosGlobalTab />}
    </div>
  )
}

function UsuariosGlobalTab() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null)
  const [resetPasswordValue, setResetPasswordValue] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)
  const { data: session } = useSession()
  const isSuper = session?.user?.role === "SUPER"

  function load() {
    setLoading(true)
    fetch("/api/usuarios")
      .then((r) => { if (r.status === 401) throw new Error(); return r.json() })
      .then((data) => setUsuarios(data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleResetPassword(id: number) {
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres")
      return
    }
    setResettingPassword(true)
    try {
      const res = await fetch(`/api/usuarios/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPasswordValue }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || "Erro"); return }
      toast.success("Senha redefinida")
      setResetPasswordId(null)
      setResetPasswordValue("")
    } catch { toast.error("Erro ao redefinir senha") }
    finally { setResettingPassword(false) }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[var(--brand)]" /></div>
      ) : usuarios.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhum usuário</div>
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
                  {isSuper && (u as any).clienteNome && <p className="text-xs text-[var(--brand)] truncate">{(u as any).clienteNome}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {resetPasswordId === u.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="password"
                      placeholder="Nova senha"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-32 rounded border border-[var(--border)] bg-[var(--bg-primary)] px-2 py-1 text-sm"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleResetPassword(u.id)} disabled={resettingPassword}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setResetPasswordId(null); setResetPasswordValue("") }}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => { setResetPasswordId(u.id); setResetPasswordValue("") }} title="Redefinir senha">
                    <KeyRound className="h-4 w-4" />
                  </Button>
                )}
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  u.role === "ADMIN" || u.role === "SUPER" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {u.role === "ADMIN" || u.role === "SUPER" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { clientes } from "@/lib/db/schema/clientes"
import { eq, and } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function EdificacoesPage() {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions = []
  if (!isSuper) conditions.push(eq(edificacoes.clienteId, clienteId!))
  const lista = await db.select({
    id: edificacoes.id,
    nome: edificacoes.nome,
    endereco: edificacoes.endereco,
    ativo: edificacoes.ativo,
    clienteId: edificacoes.clienteId,
    clienteNome: clientes.nome,
  })
    .from(edificacoes)
    .where(and(...conditions))
    .leftJoin(clientes, eq(edificacoes.clienteId, clientes.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edificações</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Gerencie as edificações da sua construtora
          </p>
        </div>
        <Link href="/edificacoes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Edificação
          </Button>
        </Link>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {lista.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma edificação cadastrada
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {lista.map((ed) => (
              <Link
                key={ed.id}
                href={`/edificacoes/${ed.id}`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div>
                  <p className="font-medium">{ed.nome}</p>
                  {ed.endereco && (
                    <p className="text-sm text-[var(--text-secondary)]">{ed.endereco}</p>
                  )}
                  {isSuper && ed.clienteNome && (
                    <p className="text-xs text-[var(--brand)] mt-0.5">{ed.clienteNome}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${ed.ativo === "S" ? "text-green-600" : "text-red-600"}`}
                >
                  {ed.ativo === "S" ? "Ativo" : "Inativo"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

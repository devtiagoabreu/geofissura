import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { notificacoesRegras } from "@/lib/db/schema/notificacoes-regras"
import { eq, and, desc } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function NotificacoesRegrasPage() {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions = isSuper ? [] : [eq(notificacoesRegras.clienteId, clienteId!)]
  const lista = await db
    .select()
    .from(notificacoesRegras)
    .where(and(...conditions))
    .orderBy(desc(notificacoesRegras.createdAt))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Regras de Notificação</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Defina quando e como as notificações serão disparadas
          </p>
        </div>
        <Link href="/notificacoes/regras/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {lista.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma regra cadastrada
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {lista.map((regra) => (
              <Link
                key={regra.id}
                href={`/notificacoes/regras/${regra.id}`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{regra.nome}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        regra.ativo
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {regra.ativo ? "Ativo" : "Inativo"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {regra.prioridade}
                    </span>
                  </div>
                  {regra.descricao && (
                    <p className="text-sm text-[var(--text-secondary)] truncate mt-1">
                      {regra.descricao}
                    </p>
                  )}
                </div>
                <div className="text-sm text-[var(--text-secondary)] ml-4">
                  {regra.sensorTipo ?? "Todos os sensores"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { notificacoesRegras } from "@/lib/db/schema/notificacoes-regras"
import { eq, and, desc } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, Settings, Plus, RefreshCw, Mail } from "lucide-react"
import { NotificacaoList } from "./_components/list"

export default async function NotificacoesPage() {
  const { session, clienteId } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const lista = await db
    .select()
    .from(notificacoes)
    .where(and(eq(notificacoes.clienteId, clienteId!)))
    .orderBy(desc(notificacoes.createdAt))
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Histórico de alertas e notificações
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/notificacoes/config">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Configurar Email
            </Button>
          </Link>
          <Link href="/notificacoes/regras">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Regras
            </Button>
          </Link>
        </div>
      </div>
      <NotificacaoList data={lista} />
    </div>
  )
}

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { leituras } from "@/lib/db/schema/leituras"
import { eq } from "drizzle-orm"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return <p>Não autorizado</p>
  }

  const totalEdificacoes = await db.select({ count: edificacoes.id })
    .from(edificacoes)
    .where(eq(edificacoes.tenantId, session.user.tenantId))

  const ultimasLeituras = await db.select()
    .from(leituras)
    .where(eq(leituras.tenantId, session.user.tenantId))
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Bem-vindo ao GeoFissuras
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
          <p className="text-sm text-[var(--text-secondary)]">Edificações</p>
          <p className="text-3xl font-bold">{totalEdificacoes[0]?.count ?? 0}</p>
        </div>
      </div>
    </div>
  )
}

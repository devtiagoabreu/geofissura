import { getSession } from "@/lib/tenant"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { leituras } from "@/lib/db/schema/leituras"
import { eq, and, inArray, sql } from "drizzle-orm"
import { Building2, Users, Activity, AlertTriangle } from "lucide-react"
import { ReadingsChart } from "./chart"

export default async function DashboardPage() {
  const { session, tenantId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const buildConds = () => {
    const c: any[] = []
    if (!isSuper) c.push(eq(edificacoes.tenantId, tenantId!))
    return c
  }
  const entConds = () => {
    const c: any[] = []
    if (!isSuper) c.push(eq(entidadesDaEdificacao.tenantId, tenantId!))
    return c
  }
  const leitConds = () => {
    const c: any[] = []
    if (!isSuper) c.push(eq(leituras.tenantId, tenantId!))
    return c
  }

  const [totalEdificacoes] = await db.select({ count: sql<number>`count(*)` })
    .from(edificacoes)
    .where(and(...buildConds()))

  const [totalEntidades] = await db.select({ count: sql<number>`count(*)` })
    .from(entidadesDaEdificacao)
    .where(and(...entConds()))

  const [totalLeituras] = await db.select({ count: sql<number>`count(*)` })
    .from(leituras)
    .where(and(...leitConds()))

  const ultimasLeituras = await db.select()
    .from(leituras)
    .where(and(...leitConds()))
    .orderBy(sql`lida_em DESC`)
    .limit(50)

  const entidadeIds = Array.from(new Set(ultimasLeituras.map((l) => l.entidadeId)))
  const entidades = entidadeIds.length > 0
    ? await db.select({ id: entidadesDaEdificacao.id, nome: entidadesDaEdificacao.nome })
        .from(entidadesDaEdificacao)
        .where(and(inArray(entidadesDaEdificacao.id, entidadeIds), ...entConds()))
    : []
  const entidadeNomes: Record<number, string> = {}
  for (const e of entidades) entidadeNomes[e.id] = e.nome

  const cards = [
    { label: "Edificações", value: Number(totalEdificacoes.count), icon: Building2, color: "text-emerald-500" },
    { label: "Entidades", value: Number(totalEntidades.count), icon: Users, color: "text-blue-500" },
    { label: "Leituras", value: Number(totalLeituras.count), icon: Activity, color: "text-violet-500" },
    { label: "Alertas", value: 0, icon: AlertTriangle, color: "text-amber-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Bem-vindo ao GeoFissura
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`${card.color}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ReadingsChart data={ultimasLeituras} entidadeNomes={entidadeNomes} />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Últimas Leituras</h2>
        </div>
        {ultimasLeituras.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma leitura registrada
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {ultimasLeituras.slice(0, 10).map((leitura) => (
              <div key={leitura.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {entidadeNomes[leitura.entidadeId] ?? `Entidade #${leitura.entidadeId}`}
                  </span>
                  <p className="text-lg font-bold">
                    {String(leitura.valor)} {leitura.unidade}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {leitura.lidaEm?.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { leituras } from "@/lib/db/schema/leituras"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { eq, and, inArray, sql } from "drizzle-orm"
import { DashboardCards } from "@/components/dashboard-cards"
import { ReadingsChart } from "./chart"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { edificacao_id?: string }
}) {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  let edificacaoId: number | null = null
  if (searchParams?.edificacao_id) {
    const parsed = Number(searchParams.edificacao_id)
    if (!isNaN(parsed) && parsed > 0) edificacaoId = parsed
  }
  // SUPER padrao: iniciar no primeiro edificio de exemplo
  if (!searchParams?.edificacao_id && isSuper && !edificacaoId) {
    edificacaoId = 1
  }

  function clienteFilter(table: any) {
    const c: any[] = [eq(table.ativo, "S")]
    if (!isSuper) c.push(eq(table.clienteId, clienteId!))
    return c
  }
  function onlyCliente(table: any) {
    const c: any[] = []
    if (!isSuper) c.push(eq(table.clienteId, clienteId!))
    return c
  }

  const [[totalEdificacoes], [totalSensores], [totalLeituras], [totalAlertas]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(edificacoes).where(and(...clienteFilter(edificacoes))),
    db.select({ count: sql<number>`count(*)` }).from(sensores).where(and(...clienteFilter(sensores))),
    db.select({ count: sql<number>`count(*)` }).from(leituras).where(and(...onlyCliente(leituras))),
    db.select({ count: sql<number>`count(*)` }).from(notificacoes).where(and(...onlyCliente(notificacoes))),
  ])

  const [ultimasLeiturasRaw, listaEdificacoes, listaSensores] = await Promise.all([
    db.select().from(leituras).where(and(...onlyCliente(leituras))).orderBy(sql`lida_em DESC`).limit(50),
    db.select({ id: edificacoes.id, nome: edificacoes.nome }).from(edificacoes).where(and(...clienteFilter(edificacoes))),
    db.select({ id: sensores.id, nome: sensores.nome, edificacaoId: sensores.edificacaoId }).from(sensores).where(and(...clienteFilter(sensores))),
  ])

  let ultimasLeituras = ultimasLeiturasRaw
  if (edificacaoId) {
    const sensorIdsDoPredio = listaSensores
      .filter((s) => s.edificacaoId === edificacaoId)
      .map((s) => s.id)
    if (sensorIdsDoPredio.length > 0) {
      ultimasLeituras = await db
        .select()
        .from(leituras)
        .where(and(...onlyCliente(leituras), inArray(leituras.sensorId, sensorIdsDoPredio)))
        .orderBy(sql`lida_em DESC`)
        .limit(50)
    } else {
      ultimasLeituras = []
    }
  }

  const sensorNomes: Record<number, string> = {}
  for (const s of listaSensores) sensorNomes[s.id] = s.nome

  const counts = {
    Edificações: Number(totalEdificacoes.count),
    Sensores: Number(totalSensores.count),
    Leituras: Number(totalLeituras.count),
    Alertas: Number(totalAlertas.count),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Bem-vindo ao GeoFissura
        </p>
      </div>

      <DashboardCards counts={counts} />

      <ReadingsChart
        data={ultimasLeituras}
        sensorNomes={sensorNomes}
        sensores={listaSensores}
        edificacoes={listaEdificacoes}
        edificacaoId={edificacaoId}
      />

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
                    {sensorNomes[leitura.sensorId] ?? `Sensor #${leitura.sensorId}`}
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

import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { leituras } from "@/lib/db/schema/leituras"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { eq, and, inArray, sql } from "drizzle-orm"
import { DashboardCards } from "@/components/dashboard-cards"
import { ReadingsChart } from "./chart"

export default async function DashboardPage() {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
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

  const [ultimasLeituras, listaEdificacoes, listaSensores] = await Promise.all([
    db.select().from(leituras).where(and(...onlyCliente(leituras))).orderBy(sql`lida_em DESC`).limit(500),
    db.select({ id: edificacoes.id, nome: edificacoes.nome }).from(edificacoes).where(and(...clienteFilter(edificacoes))),
    db.select({ id: sensores.id, nome: sensores.nome, edificacaoId: sensores.edificacaoId }).from(sensores).where(and(...clienteFilter(sensores))),
  ])

  const sensorIds = Array.from(new Set(ultimasLeituras.map((l) => l.sensorId)))
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

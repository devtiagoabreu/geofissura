import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { clientes } from "@/lib/db/schema/clientes"
import { leituras } from "@/lib/db/schema/leituras"
import { eq, and, desc, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil, Cpu, Building2, User, Calendar, Ruler, Hash } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { SensorReadingsChart } from "./sensor-chart"

interface Props {
  params: { id: string }
}

export default async function SensorDetalhePage({ params }: Props) {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) notFound()

  const conditions1 = [eq(sensores.id, Number(params.id))]
  if (!isSuper) conditions1.push(eq(sensores.clienteId, clienteId!))
  const sensor = await db.query.sensores.findFirst({
    where: and(...conditions1),
  })
  if (!sensor) notFound()

  const [edificacao] = await db.select({ nome: edificacoes.nome }).from(edificacoes).where(eq(edificacoes.id, sensor.edificacaoId))
  const [cliente] = await db.select({ nome: clientes.nome }).from(clientes).where(eq(clientes.id, sensor.clienteId))

  const conditions2 = [eq(leituras.sensorId, sensor.id)]
  if (!isSuper) conditions2.push(eq(leituras.clienteId, clienteId!))
  const ultimasLeituras = await db.select()
    .from(leituras)
    .where(and(...conditions2))
    .orderBy(desc(leituras.lidaEm))
    .limit(50)

  const dadosArray = toArray(sensor.dados)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--brand)]/10 p-2">
            <Cpu className="h-6 w-6 text-[var(--brand)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                {sensor.tipoSensor}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {sensor.ativo === "S" ? "Ativo" : "Inativo"}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{sensor.nome}</h1>
            {sensor.descricao && (
              <p className="text-sm text-[var(--text-secondary)]">{sensor.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/sensores/${params.id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-3 w-3" />
              Editar
            </Button>
          </Link>
          <DeleteButton apiPath={`/api/sensores/${params.id}`} redirectTo="/sensores" />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Hash} label="ID" value={`#${sensor.id}`} />
        <InfoCard icon={Building2} label="Edificação" value={edificacao?.nome ?? "-"} />
        <InfoCard icon={User} label="Cliente" value={cliente?.nome ?? "-"} />
        <InfoCard icon={Calendar} label="Instalação" value={sensor.createdAt?.toLocaleDateString("pt-BR") ?? "-"} />
      </div>

      {dadosArray.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
          <div className="p-4 border-b border-[var(--border)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">Dados do Sensor</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {dadosArray.map(([chave, valor]) => (
              <div key={chave} className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{chave}</span>
                <span className="text-sm text-[var(--text-secondary)]">{String(valor)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SensorReadingsChart data={ultimasLeituras} />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Últimas Leituras</h2>
        </div>
        {ultimasLeituras.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Nenhuma leitura registrada</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {ultimasLeituras.map((leitura) => (
              <div key={leitura.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-lg font-bold">
                    {String(leitura.valor)} {leitura.unidade}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {leitura.lidaEm?.toLocaleString("pt-BR")}
                  </p>
                  {leitura.topicoMqtt && (
                    <p className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">
                      {leitura.topicoMqtt}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm">
      <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
        <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
      </div>
      <div>
        <p className="text-xs text-[var(--text-secondary)]">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  )
}

function toArray(dados: unknown): [string, unknown][] {
  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) return []
  return Object.entries(dados)
}

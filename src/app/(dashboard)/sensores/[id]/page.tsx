import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { leituras } from "@/lib/db/schema/leituras"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"

interface Props {
  params: { id: string }
}

export default async function SensorDetalhePage({ params }: Props) {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions1 = [eq(sensores.id, Number(params.id))]
  if (!isSuper) conditions1.push(eq(sensores.clienteId, clienteId!))
  const sensor = await db.query.sensores.findFirst({
    where: and(...conditions1),
  })

  if (!sensor) notFound()

  const conditions2 = [eq(leituras.sensorId, sensor.id)]
  if (!isSuper) conditions2.push(eq(leituras.clienteId, clienteId!))
  const ultimasLeituras = await db.select()
    .from(leituras)
    .where(and(...conditions2))
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
            {sensor.tipoSensor}
          </span>
          <div>
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

      {hasDados(sensor.dados) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Dados Adicionais</h2>
          <pre className="text-sm">{JSON.stringify(sensor.dados, null, 2)}</pre>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Leituras</h2>
        {ultimasLeituras.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma leitura registrada</p>
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
            <div className="divide-y divide-[var(--border)]">
              {ultimasLeituras.map((leitura) => (
                <div key={leitura.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-lg font-bold">
                      {String(leitura.valor)} {leitura.unidade}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {leitura.lidaEm?.toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {leitura.topicoMqtt && (
                    <span className="text-xs text-[var(--text-secondary)] truncate max-w-[200px]">
                      {leitura.topicoMqtt}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function hasDados(dados: unknown): dados is Record<string, unknown> {
  return typeof dados === "object" && !Array.isArray(dados) && dados !== null && Object.keys(dados).length > 0
}

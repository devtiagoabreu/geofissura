import { getSession } from "@/lib/tenant"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { tenants } from "@/lib/db/schema/tenants"
import { eq, and } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function SensoresPage() {
  const { session, tenantId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions = []
  if (!isSuper) conditions.push(eq(sensores.tenantId, tenantId!))
  const lista = await db.select({
    id: sensores.id,
    nome: sensores.nome,
    tipoSensor: sensores.tipoSensor,
    descricao: sensores.descricao,
    ativo: sensores.ativo,
    edificacaoId: sensores.edificacaoId,
    tenantId: sensores.tenantId,
    tenantNome: tenants.nome,
    edificacaoNome: edificacoes.nome,
  })
    .from(sensores)
    .where(and(...conditions))
    .leftJoin(edificacoes, eq(sensores.edificacaoId, edificacoes.id))
    .leftJoin(tenants, eq(sensores.tenantId, tenants.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sensores</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Fissurômetros, inclinômetros, sensores de temperatura, umidade e mais
          </p>
        </div>
        <Link href="/sensores/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Sensor
          </Button>
        </Link>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {lista.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhum sensor cadastrado
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {lista.map((sensor) => (
              <Link
                key={sensor.id}
                href={`/sensores/${sensor.id}`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {sensor.tipoSensor}
                  </span>
                  <div>
                    <p className="font-medium">{sensor.nome}</p>
                    {sensor.descricao && (
                      <p className="text-sm text-[var(--text-secondary)]">{sensor.descricao}</p>
                    )}
                    <div className="flex gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                      {sensor.edificacaoNome && <span>{sensor.edificacaoNome}</span>}
                      {isSuper && sensor.tenantNome && (
                        <span className="text-[var(--brand)]">{sensor.tenantNome}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

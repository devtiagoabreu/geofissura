import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"
import { eq, and } from "drizzle-orm"

export default async function LeiturasPage() {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions = []
  if (!isSuper) conditions.push(eq(leituras.clienteId, clienteId!))
  const lista = await db.select()
    .from(leituras)
    .where(and(...conditions))
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leituras</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Últimas leituras dos sensores
        </p>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {lista.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma leitura registrada
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {lista.map((leitura) => (
              <div key={leitura.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold">
                    {String(leitura.valor)} {leitura.unidade}
                  </p>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {leitura.lidaEm?.toLocaleString("pt-BR")}
                  </span>
                </div>
                {leitura.topicoMqtt && (
                  <span className="text-xs text-[var(--text-secondary)] truncate max-w-[300px]">
                    {leitura.topicoMqtt}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

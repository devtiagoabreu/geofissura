import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { leituras } from "@/lib/db/schema/leituras"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"

interface Props {
  params: { id: string }
}

export default async function EntidadeDetalhePage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return <p>Não autorizado</p>
  }

  const entidade = await db.query.entidadesDaEdificacao.findFirst({
    where: and(
      eq(entidadesDaEdificacao.id, Number(params.id)),
      eq(entidadesDaEdificacao.tenantId, session.user.tenantId),
    ),
  })

  if (!entidade) notFound()

  const ultimasLeituras = await db.select()
    .from(leituras)
    .where(
      and(
        eq(leituras.entidadeId, entidade.id),
        eq(leituras.tenantId, session.user.tenantId),
      ),
    )
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
          {entidade.tipoEntidade}
        </span>
        <div>
          <h1 className="text-2xl font-bold">{entidade.nome}</h1>
          {entidade.descricao && (
            <p className="text-sm text-[var(--text-secondary)]">{entidade.descricao}</p>
          )}
        </div>
      </div>

      {hasDados(entidade.dados) && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Dados Adicionais</h2>
          <pre className="text-sm">{JSON.stringify(entidade.dados, null, 2)}</pre>
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

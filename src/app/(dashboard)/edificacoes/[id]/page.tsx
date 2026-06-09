import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"

interface Props {
  params: { id: string }
}

export default async function EdificacaoDetalhePage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return <p>Não autorizado</p>
  }

  const edificacao = await db.query.edificacoes.findFirst({
    where: and(
      eq(edificacoes.id, Number(params.id)),
      eq(edificacoes.tenantId, session.user.tenantId),
    ),
  })

  if (!edificacao) notFound()

  const entidades = await db.select()
    .from(entidadesDaEdificacao)
    .where(
      and(
        eq(entidadesDaEdificacao.edificacaoId, edificacao.id),
        eq(entidadesDaEdificacao.tenantId, session.user.tenantId),
      ),
    )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{edificacao.nome}</h1>
        {edificacao.endereco && (
          <p className="text-sm text-[var(--text-secondary)]">{edificacao.endereco}</p>
        )}
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Entidades Vinculadas</h2>
        {entidades.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhuma entidade vinculada a esta edificação
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {entidades.map((ent) => (
              <div
                key={ent.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {ent.tipoEntidade}
                  </span>
                </div>
                <p className="font-medium">{ent.nome}</p>
                {ent.descricao && (
                  <p className="text-sm text-[var(--text-secondary)]">{ent.descricao}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

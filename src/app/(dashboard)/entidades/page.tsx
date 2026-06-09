import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function EntidadesPage() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return <p>Não autorizado</p>
  }

  const lista = await db.select()
    .from(entidadesDaEdificacao)
    .where(eq(entidadesDaEdificacao.tenantId, session.user.tenantId))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entidades</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Engenheiros, equipamentos, monitores, laudos e mais
          </p>
        </div>
        <Link href="/entidades/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entidade
          </Button>
        </Link>
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
        {lista.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
            Nenhuma entidade cadastrada
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {lista.map((ent) => (
              <Link
                key={ent.id}
                href={`/entidades/${ent.id}`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {ent.tipoEntidade}
                  </span>
                  <div>
                    <p className="font-medium">{ent.nome}</p>
                    {ent.descricao && (
                      <p className="text-sm text-[var(--text-secondary)]">{ent.descricao}</p>
                    )}
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

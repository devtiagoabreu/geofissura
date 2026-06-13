import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { DocumentosSection } from "@/components/documentos-section"

interface Props {
  params: { id: string }
}

export default async function EdificacaoDetalhePage({ params }: Props) {
  const { session, clienteId, isSuper } = await getSession()
  if (!session) {
    return <p>Não autorizado</p>
  }

  const conditions1 = [eq(edificacoes.id, Number(params.id))]
  if (!isSuper) conditions1.push(eq(edificacoes.clienteId, clienteId!))
  const edificacao = await db.query.edificacoes.findFirst({
    where: and(...conditions1),
  })

  if (!edificacao) notFound()

  const conditions2 = [eq(sensores.edificacaoId, edificacao.id)]
  if (!isSuper) conditions2.push(eq(sensores.clienteId, clienteId!))
  const listaSensores = await db.select()
    .from(sensores)
    .where(and(...conditions2))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{edificacao.nome}</h1>
          {edificacao.endereco && (
            <p className="text-sm text-[var(--text-secondary)]">{edificacao.endereco}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/edificacoes/${params.id}/editar`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-3 w-3" />
              Editar
            </Button>
          </Link>
          <DeleteButton apiPath={`/api/edificacoes/${params.id}`} redirectTo="/edificacoes" />
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sensores Instalados</h2>
        {listaSensores.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhum sensor instalado nesta edificação
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {listaSensores.map((sensor) => (
              <div
                key={sensor.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">
                    {sensor.tipoSensor}
                  </span>
                </div>
                <p className="font-medium">{sensor.nome}</p>
                {sensor.descricao && (
                  <p className="text-sm text-[var(--text-secondary)]">{sensor.descricao}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentosSection edificacaoId={edificacao.id} />
    </div>
  )
}

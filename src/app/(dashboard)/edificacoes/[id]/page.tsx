import { getSession } from "@/lib/cliente"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { DeleteButton } from "@/components/ui/delete-button"
import { DocumentosSection } from "@/components/documentos-section"
import { PlanosDadosSection } from "@/components/planos-dados-section"
import { EquipamentosSection } from "@/components/equipamentos-section"
import { SensoresSection } from "@/components/sensores-section"

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
      <SensoresSection edificacaoId={edificacao.id} isSuper={isSuper} />

      <PlanosDadosSection edificacaoId={edificacao.id} isSuper={isSuper} />

      <EquipamentosSection edificacaoId={edificacao.id} isSuper={isSuper} />

      <DocumentosSection edificacaoId={edificacao.id} />
    </div>
  )
}

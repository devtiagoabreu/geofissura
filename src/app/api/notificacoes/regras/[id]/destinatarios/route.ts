import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoesRegraDestinatarios } from "@/lib/db/schema/notificacoes-regra-destinatarios"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const regraId = parseInt(params.id)
    const dados = await db
      .select()
      .from(notificacoesRegraDestinatarios)
      .where(eq(notificacoesRegraDestinatarios.regraId, regraId))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const regraId = parseInt(params.id)
    const body = await req.json()
    const { tipo, usuarioId, email, emailAtivo, pushAtivo } = body

    const [novo] = await db
      .insert(notificacoesRegraDestinatarios)
      .values({ regraId, tipo, usuarioId, email, emailAtivo, pushAtivo })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}

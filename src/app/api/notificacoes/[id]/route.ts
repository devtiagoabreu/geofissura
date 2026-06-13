import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await req.json()

    if (body.lida) {
      await db
        .update(notificacoes)
        .set({ lida: true, lidaEm: new Date() })
        .where(eq(notificacoes.id, id))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}

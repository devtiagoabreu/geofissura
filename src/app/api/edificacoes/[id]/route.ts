import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { auth } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dado = await db.query.edificacoes.findFirst({
      where: and(
        eq(edificacoes.id, Number(params.id)),
        eq(edificacoes.tenantId, session.user.tenantId),
      ),
    })

    if (!dado) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    }

    return NextResponse.json(dado)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const [atualizado] = await db.update(edificacoes)
      .set(body)
      .where(
        and(
          eq(edificacoes.id, Number(params.id)),
          eq(edificacoes.tenantId, session.user.tenantId),
        ),
      )
      .returning()

    return NextResponse.json(atualizado)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    await db.delete(edificacoes)
      .where(
        and(
          eq(edificacoes.id, Number(params.id)),
          eq(edificacoes.tenantId, session.user.tenantId),
        ),
      )

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}

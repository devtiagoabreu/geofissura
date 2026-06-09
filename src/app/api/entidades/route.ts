import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { entidadesDaEdificacao } from "@/lib/db/schema/entidades-da-edificacao"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db.select().from(entidadesDaEdificacao)
      .where(eq(entidadesDaEdificacao.tenantId, session.user.tenantId))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const [novo] = await db.insert(entidadesDaEdificacao)
      .values({ ...body, tenantId: session.user.tenantId })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}

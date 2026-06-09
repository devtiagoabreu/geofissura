import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"
import { auth } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db.select()
      .from(leituras)
      .where(eq(leituras.tenantId, session.user.tenantId))
      .limit(50)

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

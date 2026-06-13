import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { precosSensor } from "@/lib/db/schema/precos-sensor"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function PUT(req: NextRequest) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { sensorId, valorMensal } = body

    if (!sensorId || valorMensal === undefined) {
      return NextResponse.json({ error: "sensorId e valorMensal são obrigatórios" }, { status: 400 })
    }

    const existente = await db
      .select()
      .from(precosSensor)
      .where(eq(precosSensor.sensorId, Number(sensorId)))
      .then(r => r[0] ?? null)

    let preco
    if (existente) {
      [preco] = await db
        .update(precosSensor)
        .set({ valorMensal: String(valorMensal), updatedAt: new Date() })
        .where(eq(precosSensor.sensorId, Number(sensorId)))
        .returning()
    } else {
      [preco] = await db
        .insert(precosSensor)
        .values({ sensorId: Number(sensorId), valorMensal: String(valorMensal) })
        .returning()
    }

    return NextResponse.json(preco)
  } catch (err) {
    return apiError(err)
  }
}

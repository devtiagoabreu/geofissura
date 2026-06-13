import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { precosSensor } from "@/lib/db/schema/precos-sensor"
import { getSession } from "@/lib/cliente"
import { eq, and, sql } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db.select({
      id: clientes.id,
      nome: clientes.nome,
      slug: clientes.slug,
      totalSensores: sql<number>`count(distinct ${sensores.id})`,
      sensoresAtivos: sql<number>`count(distinct case when ${sensores.ativo} = 'S' then ${sensores.id} end)`,
      totalMensal: sql<string>`coalesce(sum(${precosSensor.valorMensal}), 0)`,
    })
      .from(clientes)
      .leftJoin(edificacoes, eq(edificacoes.clienteId, clientes.id))
      .leftJoin(sensores, eq(sensores.edificacaoId, edificacoes.id))
      .leftJoin(precosSensor, eq(precosSensor.sensorId, sensores.id))
      .groupBy(clientes.id)
      .orderBy(clientes.nome)

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

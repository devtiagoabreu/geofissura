import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { precosSensor } from "@/lib/db/schema/precos-sensor"
import { getSession } from "@/lib/cliente"
import { eq, sql } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(_req: Request, { params }: { params: { clienteId: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const clienteId = Number(params.clienteId)

    const cliente = await db.select().from(clientes).where(eq(clientes.id, clienteId)).then(r => r[0] ?? null)
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const edificios = await db.select().from(edificacoes).where(eq(edificacoes.clienteId, clienteId)).orderBy(edificacoes.nome)

    const result = await Promise.all(edificios.map(async (ed) => {
      const sensoresList = await db.select({
        id: sensores.id,
        nome: sensores.nome,
        tipoSensor: sensores.tipoSensor,
        ativo: sensores.ativo,
        createdAt: sensores.createdAt,
        valorMensal: precosSensor.valorMensal,
      })
        .from(sensores)
        .leftJoin(precosSensor, eq(precosSensor.sensorId, sensores.id))
        .where(eq(sensores.edificacaoId, ed.id))
        .orderBy(sensores.nome)

      const totalEdificacao = sensoresList.reduce((acc, s) => acc + (parseFloat(s.valorMensal as string) || 0), 0)

      return { ...ed, sensores: sensoresList, totalEdificacao }
    }))

    const totalGeral = result.reduce((acc, ed) => acc + ed.totalEdificacao, 0)

    const totalSensoresAtivos = await db
      .select({ count: sql<number>`count(*)` })
      .from(sensores)
      .innerJoin(edificacoes, eq(edificacoes.id, sensores.edificacaoId))
      .where(sql`${edificacoes.clienteId} = ${clienteId} and ${sensores.ativo} = 'S'`)
      .then(r => r[0]?.count ?? 0)

    return NextResponse.json({
      cliente,
      emitidoEm: new Date().toISOString(),
      edificacoes: result,
      totalGeral,
      totalSensoresAtivos,
    })
  } catch (err) {
    return apiError(err)
  }
}

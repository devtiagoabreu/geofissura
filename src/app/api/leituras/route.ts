import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"
import { sensores } from "@/lib/db/schema/sensores"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { clientes } from "@/lib/db/schema/clientes"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = []
    if (!isSuper) conditions.push(eq(leituras.clienteId, clienteId!))
    const dados = await db.select({
      id: leituras.id,
      sensorId: leituras.sensorId,
      clienteId: leituras.clienteId,
      topicoMqtt: leituras.topicoMqtt,
      valor: leituras.valor,
      unidade: leituras.unidade,
      metadata: leituras.metadata,
      lidaEm: leituras.lidaEm,
      sensorNome: sensores.nome,
      edificacaoNome: edificacoes.nome,
      clienteNome: clientes.nome,
    })
      .from(leituras)
      .leftJoin(sensores, eq(leituras.sensorId, sensores.id))
      .leftJoin(edificacoes, eq(sensores.edificacaoId, edificacoes.id))
      .leftJoin(clientes, eq(leituras.clienteId, clientes.id))
      .where(and(...conditions))
      .limit(50)

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

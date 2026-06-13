import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const topicParts = body.topic.split("/")
  const [, clienteSlug, edificacaoId, sensorId] = topicParts

  const cliente = await db.query.clientes.findFirst({
    where: (t, { eq }) => eq(t.slug, clienteSlug),
  })

  if (!cliente) {
    return NextResponse.json({ error: "cliente not found" }, { status: 404 })
  }

  const dados = JSON.parse(body.payload)
  await db.insert(leituras).values({
    clienteId: cliente.id,
    sensorId: Number(sensorId),
    topicoMqtt: body.topic,
    valor: dados.valor,
    unidade: dados.unidade,
    metadata: dados,
  })

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const topicParts = body.topic.split("/")
  const [, tenantSlug, edificacaoId, entidadeId] = topicParts

  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, tenantSlug),
  })

  if (!tenant) {
    return NextResponse.json({ error: "tenant not found" }, { status: 404 })
  }

  const dados = JSON.parse(body.payload)
  await db.insert(leituras).values({
    tenantId: tenant.id,
    entidadeId: Number(entidadeId),
    topicoMqtt: body.topic,
    valor: dados.valor,
    unidade: dados.unidade,
    metadata: dados,
  })

  return NextResponse.json({ ok: true })
}

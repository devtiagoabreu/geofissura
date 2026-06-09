import { NextResponse } from "next/server"

export function apiError(err: unknown) {
  console.error("[API]", err)
  const message = err instanceof Error ? err.message : "Erro interno do servidor"
  return NextResponse.json({ error: message }, { status: 500 })
}

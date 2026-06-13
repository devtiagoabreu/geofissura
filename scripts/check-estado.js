const { readFileSync, existsSync } = require("fs")
const { resolve } = require("path")
const postgres = require("postgres")
const bcrypt = require("bcryptjs")

const envPath = resolve(__dirname, "..", ".env")
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n")
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i === -1) continue
    const k = t.slice(0, i)
    let v = t.slice(i + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  console.log("=== ESTADO ATUAL ===\n")

  const tenants = await sql`SELECT * FROM tenants`
  console.log("TENANTS:")
  for (const t of tenants) {
    console.log(`  [${t.id}] ${t.nome} (${t.slug})`)
  }

  const usuarios = await sql`SELECT id, tenant_id, nome, email, role FROM usuarios`
  console.log("\nUSUÁRIOS:")
  for (const u of usuarios) {
    console.log(`  [${u.id}] tenant=${u.tenant_id}  ${u.email}  role=${u.role}  nome=${u.nome}`)
  }

  const edf = await sql`SELECT id, tenant_id, nome FROM edificacoes`
  console.log("\nEDIFICAÇÕES:")
  for (const e of edf) {
    console.log(`  [${e.id}] tenant=${e.tenant_id}  ${e.nome}`)
  }

  const sens = await sql`SELECT id, tenant_id, edificacao_id, tipo_sensor, nome FROM sensores`
  console.log("\nSENSORES:")
  for (const s of sens) {
    console.log(`  [${s.id}] tenant=${s.tenant_id}  edf=${s.edificacao_id}  ${s.tipo_sensor}  ${s.nome}`)
  }

  await sql.end()
}

main().catch((err) => {
  console.error("Erro:", err)
  process.exit(1)
})

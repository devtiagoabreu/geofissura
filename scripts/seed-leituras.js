const { readFileSync, existsSync } = require("fs")
const { resolve } = require("path")
const postgres = require("postgres")

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

function rand(min, max, dec = 4) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec))
}

const gerarLeitura = (tipo) => {
  switch (tipo) {
    case "inclinometro":
      return { valor: rand(-5, 5), unidade: "graus" }
    case "fissurometro":
      return { valor: rand(0, 15), unidade: "mm" }
    case "termometro":
      return { valor: rand(18, 42), unidade: "°C" }
    case "piezometro":
      return { valor: rand(1, 25), unidade: "mca" }
    case "extensometro":
      return { valor: rand(-200, 800), unidade: "με" }
    default:
      return { valor: rand(0, 100), unidade: "un" }
  }
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  const sensores = await sql`SELECT id, cliente_id, tipo_sensor, nome FROM sensores ORDER BY id`
  console.log(`Encontrados ${sensores.length} sensores\n`)

  let total = 0

  await sql`DELETE FROM leituras`
  console.log(" Leituras anteriores removidas\n")

  for (const sensor of sensores) {
    const leituras = []
    const now = Date.now()
    // Cada sensor comeca em horario diferente (90 min * id)
    // e gera 10 leituras a cada 4h → cobre ~36h por sensor
    const baseOffset = (sensor.id - 1) * 90 * 60 * 1000
    for (let i = 9; i >= 0; i--) {
      const ts = new Date(now - baseOffset - i * 4 * 60 * 60 * 1000)
      const leitura = gerarLeitura(sensor.tipo_sensor)
      leituras.push({
        cliente_id: sensor.cliente_id,
        sensor_id: sensor.id,
        valor: leitura.valor,
        unidade: leitura.unidade,
        lida_em: ts,
      })
    }

    for (const l of leituras) {
      await sql`
        INSERT INTO leituras (cliente_id, sensor_id, valor, unidade, lida_em)
        VALUES (${l.cliente_id}, ${l.sensor_id}, ${l.valor}, ${l.unidade}, ${l.lida_em})
      `
      total++
    }

    const tipo = sensor.tipo_sensor.padEnd(14)
    const nome = sensor.nome.padEnd(30)
    console.log(`  ${tipo}  ${nome}  → 10 leituras`)
  }

  await sql.end()

  console.log(`\n✅ ${total} leituras inseridas para ${sensores.length} sensores`)
}

main().catch((err) => {
  console.error("Erro:", err)
  process.exit(1)
})

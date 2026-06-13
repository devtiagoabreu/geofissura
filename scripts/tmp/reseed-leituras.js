const postgres = require("postgres")
const sql = postgres(process.env.DATABASE_URL, { prepare: false })

function rand(min, max, dec = 4) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec))
}

function gerar(tipo) {
  switch (tipo) {
    case "inclinometro": return { valor: rand(-5, 5), unidade: "graus" }
    case "fissurometro": return { valor: rand(0, 15), unidade: "mm" }
    case "termometro":   return { valor: rand(18, 42), unidade: "°C" }
    case "piezometro":   return { valor: rand(1, 25), unidade: "mca" }
    case "extensometro": return { valor: rand(-200, 800), unidade: "με" }
    default:             return { valor: rand(0, 100), unidade: "un" }
  }
}

async function main() {
  await sql`DELETE FROM leituras`
  const sensores = await sql`SELECT id, cliente_id, tipo_sensor, nome FROM sensores ORDER BY id`
  let total = 0
  const now = Date.now()

  for (const sensor of sensores) {
    // Cada sensor comeca em um deslocamento diferente (90 min * id)
    // e tem 10 leituras espacadas a cada 4 horas
    const baseOffset = (sensor.id - 1) * 90 * 60 * 1000
    for (let i = 9; i >= 0; i--) {
      const ts = new Date(now - baseOffset - i * 4 * 60 * 60 * 1000)
      const leitura = gerar(sensor.tipo_sensor)
      await sql`
        INSERT INTO leituras (cliente_id, sensor_id, valor, unidade, lida_em)
        VALUES (${sensor.cliente_id}, ${sensor.id}, ${leitura.valor}, ${leitura.unidade}, ${ts})
      `
      total++
    }
  }

  console.log(`${total} leituras inseridas para ${sensores.length} sensores`)
  await sql.end()
}

main().catch((err) => { console.error(err); process.exit(1) })

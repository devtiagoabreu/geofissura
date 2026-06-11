const postgres = require("postgres")

async function seedEntidades() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })
  try {
    const [tenant] = await sql`SELECT id FROM tenants LIMIT 1`
    const [ed] = await sql`SELECT id FROM edificacoes LIMIT 1`

    // Create sensor entities
    const sensores = [
      { tipo: "Fissura", nome: "Fissura #01" },
      { tipo: "Fissura", nome: "Fissura #02" },
      { tipo: "Inclinacao", nome: "Inclinômetro #01" },
      { tipo: "Temperatura", nome: "Termômetro #01" },
      { tipo: "Umidade", nome: "Higrômetro #01" },
      { tipo: "Pressao", nome: "Barômetro #01" },
      { tipo: "Sismo", nome: "Sismógrafo #01" },
    ]

    const entidades = []
    for (const s of sensores) {
      const [ent] = await sql`
        INSERT INTO entidades_da_edificacao (tenant_id, edificacao_id, tipo_entidade, nome, dados)
        VALUES (${tenant.id}, ${ed.id}, ${s.tipo}, ${s.nome}, '{}')
        RETURNING id, tipo_entidade
      `
      if (ent) entidades.push(ent)
    }
    console.log(`Criadas ${entidades.length} entidades`)

    // Generate sample readings for each entity
    const unidades = {
      Fissura: "mm", Inclinacao: "graus", Temperatura: "C",
      Umidade: "%", Pressao: "bar", Sismo: "mm/s",
    }
    const valoresBase = {
      Fissura: 2.0, Inclinacao: 0.3, Temperatura: 25,
      Umidade: 60, Pressao: 1.0, Sismo: 0.05,
    }
    const variacao = {
      Fissura: 1.0, Inclinacao: 0.2, Temperatura: 5,
      Umidade: 15, Pressao: 0.05, Sismo: 0.1,
    }

    let totalLeituras = 0
    for (const ent of entidades) {
      const unidade = unidades[ent.tipo] ?? ""
      const base = valoresBase[ent.tipo] ?? 0
      const varianca = variacao[ent.tipo] ?? 0.5
      const numLeituras = 20 + Math.floor(Math.random() * 30)

      for (let i = 0; i < numLeituras; i++) {
        const timestamp = new Date(Date.now() - (numLeituras - i) * 3600000)
        const valor = (base + (Math.random() - 0.5) * varianca * 2).toFixed(2)
        await sql`
          INSERT INTO leituras (tenant_id, entidade_id, valor, unidade, lida_em)
          VALUES (${tenant.id}, ${ent.id}, ${valor}, ${unidade}, ${timestamp.toISOString()})
        `
        totalLeituras++
      }
    }
    console.log(`Inseridas ${totalLeituras} leituras de exemplo`)
    console.log("\nDashboard populado com dados de exemplo!")
  } catch (e) { console.error(e.message) }
  finally { await sql.end() }
}

seedEntidades()

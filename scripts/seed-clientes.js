const { readFileSync, existsSync, writeFileSync } = require("fs")
const { resolve } = require("path")
const postgres = require("postgres")
const bcrypt = require("bcryptjs")

// Carrega .env
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

  // ── Tenant 1: Vertical GeoLab ──
  const [t1] = await sql`
    INSERT INTO tenants (nome, slug, ativo)
    VALUES ('Vertical GeoLab', 'verticalgeolab', 'S')
    RETURNING id
  `

  // ── Tenant 2: Geométrica Construtora ──
  const [t2] = await sql`
    INSERT INTO tenants (nome, slug, ativo)
    VALUES ('Geométrica Construtora', 'geometricaconstrutora', 'S')
    RETURNING id
  `

  // ── Usuários ──
  const pass1 = "Vg@2026!"
  const pass2 = "Geo@2026!"
  const hash1 = bcrypt.hashSync(pass1, 10)
  const hash2 = bcrypt.hashSync(pass2, 10)

  // Vertical GeoLab users
  await sql`
    INSERT INTO usuarios (tenant_id, nome, email, password, role) VALUES
    (${t1.id}, 'Carlos Mendes', 'admin@verticalgeolab.com', ${hash1}, 'ADMIN'),
    (${t1.id}, 'Ana Oliveira', 'ana@verticalgeolab.com', ${hash1}, 'USER'),
    (${t1.id}, 'Rafael Costa', 'rafael@verticalgeolab.com', ${hash1}, 'USER')
  `

  // Geométrica Construtora users
  await sql`
    INSERT INTO usuarios (tenant_id, nome, email, password, role) VALUES
    (${t2.id}, 'Juliana Torres', 'admin@geometricaconstrutora.com', ${hash2}, 'ADMIN'),
    (${t2.id}, 'Lucas Santos', 'lucas@geometricaconstrutora.com', ${hash2}, 'USER'),
    (${t2.id}, 'Fernanda Lima', 'fernanda@geometricaconstrutora.com', ${hash2}, 'USER')
  `

  // ── Edificações + Sensores ──
  const edificacoesT1 = [
    { nome: "Torre Corporate Empire State", endereco: "Av. Paulista, 1500, São Paulo - SP" },
    { nome: "Residencial Vista do Parque", endereco: "Rua das Flores, 420, São Paulo - SP" },
    { nome: "Galpão Industrial LogTech", endereco: "Rodovia Anhanguera, km 45, Cajamar - SP" },
  ]

  const edificacoesT2 = [
    { nome: "Edifício Comercial Nova Aurora", endereco: "Rua XV de Novembro, 800, Curitiba - PR" },
    { nome: "Condomínio Residencial Verde Vale", endereco: "Av. das Nações, 1230, São José dos Pinhais - PR" },
    { nome: "Centro Logístico Sul Brasil", endereco: "BR-277, km 12, Araucária - PR" },
  ]

  const tiposSensor = [
    { tipo: "inclinometro", nome: "Inclinômetro Digital", unidade: "graus" },
    { tipo: "fissurometro", nome: "Fissurômetro", unidade: "mm" },
    { tipo: "termometro", nome: "Termômetro", unidade: "°C" },
    { tipo: "piezometro", nome: "Piezômetro", unidade: "mca" },
    { tipo: "extensometro", nome: "Extensômetro", unidade: "με" },
  ]

  for (const ed of edificacoesT1) {
    const [e] = await sql`
      INSERT INTO edificacoes (tenant_id, nome, endereco, ativo)
      VALUES (${t1.id}, ${ed.nome}, ${ed.endereco}, 'S')
      RETURNING id
    `
    for (const s of tiposSensor) {
      await sql`
        INSERT INTO sensores (tenant_id, edificacao_id, tipo_sensor, nome, dados)
        VALUES (${t1.id}, ${e.id}, ${s.tipo}, ${s.nome} || ' #' || ${e.id}, ${sql.json({ unidade: s.unidade, fabricante: "GeoSense", modelo: "GS-" + s.tipo.substring(0, 4).toUpperCase(), instalacao: new Date().toISOString().split("T")[0] })})
      `
    }
  }

  for (const ed of edificacoesT2) {
    const [e] = await sql`
      INSERT INTO edificacoes (tenant_id, nome, endereco, ativo)
      VALUES (${t2.id}, ${ed.nome}, ${ed.endereco}, 'S')
      RETURNING id
    `
    for (const s of tiposSensor) {
      await sql`
        INSERT INTO sensores (tenant_id, edificacao_id, tipo_sensor, nome, dados)
        VALUES (${t2.id}, ${e.id}, ${s.tipo}, ${s.nome} || ' #' || ${e.id}, ${sql.json({ unidade: s.unidade, fabricante: "GeoSense", modelo: "GS-" + s.tipo.substring(0, 4).toUpperCase(), instalacao: new Date().toISOString().split("T")[0] })})
      `
    }
  }

  await sql.end()

  // ── Resumo ──
  const Resumo = [
    "",
    "══════════════════════════════════════════════════",
    "  SEED CONCLUÍDO COM SUCESSO!",
    "══════════════════════════════════════════════════",
    "",
    "┌─ Tenant 1 ──────────────────────────────────┐",
    `│ Nome:      Vertical GeoLab                   │`,
    `│ Email:     verticalgeolab@gmail.com           │`,
    `│ Usuários:                                     │`,
    `│   admin@verticalgeolab.com                    │`,
    `│   ana@verticalgeolab.com                      │`,
    `│   rafael@verticalgeolab.com                   │`,
    `│ SENHA:     ${pass1.padEnd(51)}│`,
    "├──────────────────────────────────────────────┤",
    `│ Edificações:                                  │`,
    `│   1. Torre Corporate Empire State             │`,
    `│   2. Residencial Vista do Parque              │`,
    `│   3. Galpão Industrial LogTech                │`,
    `│ Cada uma com 5 sensores                       │`,
    "└──────────────────────────────────────────────┘",
    "",
    "┌─ Tenant 2 ──────────────────────────────────┐",
    `│ Nome:      Geométrica Construtora             │`,
    `│ Email:     geometricaconstrutora@gmail.com    │`,
    `│ Usuários:                                     │`,
    `│   admin@geometricaconstrutora.com             │`,
    `│   lucas@geometricaconstrutora.com             │`,
    `│   fernanda@geometricaconstrutora.com          │`,
    `│ SENHA:     ${pass2.padEnd(51)}│`,
    "├──────────────────────────────────────────────┤",
    `│ Edificações:                                  │`,
    `│   1. Edifício Comercial Nova Aurora           │`,
    `│   2. Condomínio Residencial Verde Vale        │`,
    `│   3. Centro Logístico Sul Brasil              │`,
    `│ Cada uma com 5 sensores                       │`,
    "└──────────────────────────────────────────────┘",
    "",
    "Total: 2 tenants, 6 edificações, 30 sensores, 6 usuários",
    "",
  ].join("\n")

  console.log(Resumo)

  // Salva resumo em arquivo
  const outPath = resolve(__dirname, "..", "seed-resumo.txt")
  writeFileSync(outPath, Resumo, "utf-8")
  console.log(`Resumo salvo em ${outPath}`)
}

main().catch((err) => {
  console.error("Erro:", err)
  process.exit(1)
})

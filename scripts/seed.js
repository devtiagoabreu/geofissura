const postgres = require("postgres")
const bcrypt = require("bcryptjs")

async function seed() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  try {
    const [tenant] = await sql`
      INSERT INTO clientes (nome, slug)
      VALUES ('Construtora ABC', 'construtora-abc')
      ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
      RETURNING id, nome
    `
    console.log(`Tenant: ${tenant.nome} (id: ${tenant.id})`)

    const password = bcrypt.hashSync("admin123", 10)
    const [user] = await sql`
      INSERT INTO usuarios (cliente_id, nome, email, password, role)
      VALUES (${tenant.id}, 'Admin', 'admin@geofissuras.com', ${password}, 'ADMIN')
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id, nome, email, role
    `
    console.log(`Usuário: ${user.nome} (${user.email}) — role: ${user.role}`)

    const [edificacao] = await sql`
      INSERT INTO edificacoes (cliente_id, nome, endereco)
      VALUES (${tenant.id}, 'Edifício Comercial ABC', 'Rua Exemplo, 123 - Centro')
      RETURNING id, nome
    `
    console.log(`Edificação: ${edificacao.nome} (id: ${edificacao.id})`)

    console.log("\nSeed concluído! Credenciais de login:")
    console.log("  Email: admin@geofissuras.com")
    console.log("  Senha: admin123")
  } catch (err) {
    console.error("Erro no seed:", err.message)
  } finally {
    await sql.end()
  }
}

seed()

const postgres = require("postgres")
const bcrypt = require("bcryptjs")

async function addUser() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  try {
    const [tenant] = await sql`SELECT id FROM tenants LIMIT 1`
    if (!tenant) {
      console.error("Nenhum tenant encontrado. Execute o seed primeiro.")
      return
    }

    const password = bcrypt.hashSync("Estoicismo&70x7", 10)
    const [user] = await sql`
      INSERT INTO usuarios (tenant_id, nome, email, password, role)
      VALUES (${tenant.id}, 'Tiago Abreu', 'devtiagoabreu@gmail.com', ${password}, 'SUPER')
      ON CONFLICT (email) DO UPDATE SET password = ${password}, role = 'SUPER'
      RETURNING id, nome, email, role
    `
    console.log(`Usuário: ${user.nome} (${user.email}) — role: ${user.role}`)
  } catch (err) {
    console.error("Erro:", err.message)
  } finally {
    await sql.end()
  }
}

addUser()

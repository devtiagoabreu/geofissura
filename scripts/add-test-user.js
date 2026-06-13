const postgres = require("postgres")
const bcrypt = require("bcryptjs")

async function addUser() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })
  try {
    const [tenant] = await sql`SELECT id FROM clientes LIMIT 1`
    const pw = bcrypt.hashSync("123456", 10)
    const [user] = await sql`
      INSERT INTO usuarios (cliente_id, nome, email, password, role)
      VALUES (${tenant.id}, 'Usuário Teste', 'user@geofissura.com.br', ${pw}, 'USER')
      ON CONFLICT (email) DO UPDATE SET password = ${pw}, role = 'USER'
      RETURNING id, nome, email, role
    `
    console.log("Criado:", user.email, "- role:", user.role)
  } catch(e) { console.error(e.message) }
  finally { await sql.end() }
}
addUser()

const { readdirSync, readFileSync } = require("fs")
const { join } = require("path")
const postgres = require("postgres")

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false })

  const migrationsDir = join(__dirname, "..", "src", "lib", "db", "migrations")
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  for (const file of files) {
    console.log(`Executando ${file}...`)
    const sqlContent = readFileSync(join(migrationsDir, file), "utf-8")
    await sql.unsafe(sqlContent)
    console.log(`  ✔ ${file} executado com sucesso`)
  }

  await sql.end()
  console.log("Migrações concluídas!")
}

migrate().catch((err) => {
  console.error("Erro na migração:", err)
  process.exit(1)
})

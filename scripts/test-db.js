const postgres = require("postgres")

async function test() {
  const url = "postgresql://neondb_owner:npg_kORLr1fGXM5h@ep-billowing-mouse-acy8437y.sa-east-1.aws.neon.tech/neondb?sslmode=require"
  console.log("Connecting with:", url.replace(/:[^:@]+@/, ":****@"))
  const sql = postgres(url, { prepare: false })
  const r = await sql.unsafe("SELECT current_user")
  console.log(r)
  await sql.end()
}

test().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})

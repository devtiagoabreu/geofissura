const fs = require("fs")
const path = require("path")

const nextDir = path.join(__dirname, "..", "node_modules", "next")
const nextPkg = path.join(nextDir, "package.json")

console.log("next dir exists:", fs.existsSync(nextDir))
console.log("next package.json exists:", fs.existsSync(nextPkg))

if (fs.existsSync(nextDir)) {
  console.log("next dir contents:", fs.readdirSync(nextDir).slice(0, 10))
}

// Check for the next binary
const nextBin = path.join(nextDir, "dist", "bin", "next")
console.log("next bin exists:", fs.existsSync(nextBin))

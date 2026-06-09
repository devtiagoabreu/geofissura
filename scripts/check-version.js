const p = require("../node_modules/next/package.json")
console.log("version:", p.version)
console.log("bin:", JSON.stringify(p.bin))

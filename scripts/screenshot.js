const { chromium } = require("playwright")

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto("https://geofissura.vercel.app", { waitUntil: "networkidle" })
  await page.waitForTimeout(2000)
  await page.screenshot({ path: "public/landing-screenshot.png", fullPage: true })
  await browser.close()
  console.log("Screenshot saved to public/landing-screenshot.png")
})()

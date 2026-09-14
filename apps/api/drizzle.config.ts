import { existsSync } from "node:fs"
import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

for (const file of [".env", "../../.env", ".env.local", "../../.env.local"]) {
  if (existsSync(file)) {
    config({ path: file, override: true })
  }
}

if (!process.env.DATABASE_URL && process.env.POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_URL
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
})

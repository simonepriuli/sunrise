import { existsSync } from "node:fs"
import { config } from "dotenv"

for (const file of [".env", "../../.env", ".env.local", "../../.env.local"]) {
  if (existsSync(file)) {
    config({ path: file, override: true })
  }
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ""
}

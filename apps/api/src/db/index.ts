import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { getDatabaseUrl } from "../env.js"
import * as schema from "./schema.js"

type Sql = ReturnType<typeof neon>
type Database = ReturnType<typeof createDb>

function createDb() {
  const url = getDatabaseUrl()
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }

  const sql = neon(url)
  return drizzle(sql, { schema })
}

let db: Database | null = null
let sql: Sql | null = null
let schemaReady: Promise<void> | null = null

export function getSql() {
  if (!sql) {
    const url = getDatabaseUrl()
    if (!url) {
      throw new Error("DATABASE_URL is not set")
    }
    sql = neon(url)
  }

  return sql
}

export function getDb() {
  if (!db) {
    db = createDb()
  }

  return db
}

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getSql()`
      CREATE TABLE IF NOT EXISTS trainings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        date date NOT NULL,
        title text NOT NULL,
        type text NOT NULL,
        status text NOT NULL DEFAULT 'planned',
        duration_minutes integer,
        distance_km real,
        elevation_m integer,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `
      .then(
        () =>
          getSql()`CREATE INDEX IF NOT EXISTS trainings_date_idx ON trainings (date)`
      )
      .then(() => undefined)
  }

  await schemaReady
}

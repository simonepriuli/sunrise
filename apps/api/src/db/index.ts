import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { DEFAULT_TRAINING_TYPES } from "../training.js"
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
    schemaReady = migrateSchema()
  }

  await schemaReady
}

async function migrateSchema() {
  const sql = getSql()

  await sql`
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
  await sql`CREATE INDEX IF NOT EXISTS trainings_date_idx ON trainings (date)`
  await sql`
    CREATE TABLE IF NOT EXISTS training_types (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      category text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS training_types_name_category_idx
    ON training_types (lower(name), category)
  `

  for (const type of DEFAULT_TRAINING_TYPES) {
    await sql`
      INSERT INTO training_types (id, name, category)
      VALUES (${type.id}, ${type.name}, ${type.category})
      ON CONFLICT (id) DO NOTHING
    `
  }

  await sql`
    UPDATE trainings SET type = CASE type
      WHEN 'hike' THEN ${DEFAULT_TRAINING_TYPES[0].id}
      WHEN 'ski' THEN ${DEFAULT_TRAINING_TYPES[1].id}
      WHEN 'strength' THEN ${DEFAULT_TRAINING_TYPES[2].id}
      WHEN 'cardio' THEN ${DEFAULT_TRAINING_TYPES[3].id}
      WHEN 'mobility' THEN ${DEFAULT_TRAINING_TYPES[4].id}
      WHEN 'rest' THEN ${DEFAULT_TRAINING_TYPES[5].id}
      ELSE type
    END
    WHERE type IN ('hike', 'ski', 'strength', 'cardio', 'mobility', 'rest')
  `
}

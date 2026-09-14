import cors from "cors"
import express from "express"
import { desc } from "drizzle-orm"
import { z } from "zod"
import { ensureSchema, getDb, getSql } from "./db/index.js"
import { notes } from "./db/schema.js"
import { getDatabaseUrl } from "./env.js"

const app = express()
const noteSchema = z.object({
  body: z.string().trim().min(1).max(280),
})

app.use(cors())
app.use(express.json())

app.get("/api/health", async (_req, res) => {
  if (!getDatabaseUrl()) {
    res.status(503).json({
      ok: false,
      service: "sunrise-api",
      database: "unconfigured",
    })
    return
  }

  try {
    await ensureSchema()
    await getSql()`SELECT 1`
    res.json({
      ok: true,
      service: "sunrise-api",
      database: "connected",
    })
  } catch (error) {
    console.error("health check failed", error)
    res.status(503).json({
      ok: false,
      service: "sunrise-api",
      database: "disconnected",
    })
  }
})

app.get("/api/notes", async (_req, res) => {
  try {
    await ensureSchema()
    const rows = await getDb()
      .select()
      .from(notes)
      .orderBy(desc(notes.createdAt))
      .limit(50)

    res.json({ notes: rows })
  } catch (error) {
    console.error("failed to list notes", error)
    res.status(500).json({ error: "Failed to load notes" })
  }
})

app.post("/api/notes", async (req, res) => {
  const parsed = noteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Note must be 1 to 280 characters" })
    return
  }

  try {
    await ensureSchema()
    const [note] = await getDb()
      .insert(notes)
      .values({ body: parsed.data.body })
      .returning()

    res.status(201).json({ note })
  } catch (error) {
    console.error("failed to create note", error)
    res.status(500).json({ error: "Failed to save note" })
  }
})

const isVercel = Boolean(process.env.VERCEL)
if (!isVercel) {
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`sunrise api listening on http://localhost:${port}`)
  })
}

export default app

import cors from "cors"
import express from "express"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"
import { ensureSchema, getDb, getSql } from "./db/index.js"
import { trainings } from "./db/schema.js"
import { getDatabaseUrl } from "./env.js"

const app = express()

const trainingTypeSchema = z.enum([
  "hike",
  "ski",
  "strength",
  "cardio",
  "mobility",
  "rest",
])
const trainingStatusSchema = z.enum(["planned", "completed", "skipped"])
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")

const trainingWriteSchema = z.object({
  date: isoDateSchema,
  title: z.string().trim().min(1).max(120),
  type: trainingTypeSchema,
  status: trainingStatusSchema.default("planned"),
  durationMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
  distanceKm: z.number().min(0).max(500).nullable().optional(),
  elevationM: z.number().int().min(0).max(20_000).nullable().optional(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
})

const trainingPatchSchema = trainingWriteSchema.partial()
const idSchema = z.uuid()

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

app.get("/api/trainings", async (req, res) => {
  const from = isoDateSchema.optional().safeParse(req.query.from)
  const to = isoDateSchema.optional().safeParse(req.query.to)

  if (!from.success || !to.success) {
    res.status(400).json({ error: "from and to must be YYYY-MM-DD dates" })
    return
  }

  try {
    await ensureSchema()
    const filters = []
    if (from.data) {
      filters.push(gte(trainings.date, from.data))
    }
    if (to.data) {
      filters.push(lte(trainings.date, to.data))
    }

    const rows = await getDb()
      .select()
      .from(trainings)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(trainings.date), desc(trainings.createdAt))

    res.json({ trainings: rows })
  } catch (error) {
    console.error("failed to list trainings", error)
    res.status(500).json({ error: "Failed to load trainings" })
  }
})

app.post("/api/trainings", async (req, res) => {
  const parsed = trainingWriteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Training is missing required fields" })
    return
  }

  try {
    await ensureSchema()
    const [training] = await getDb()
      .insert(trainings)
      .values({
        date: parsed.data.date,
        title: parsed.data.title,
        type: parsed.data.type,
        status: parsed.data.status,
        durationMinutes: parsed.data.durationMinutes ?? null,
        distanceKm: parsed.data.distanceKm ?? null,
        elevationM: parsed.data.elevationM ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning()

    res.status(201).json({ training })
  } catch (error) {
    console.error("failed to create training", error)
    res.status(500).json({ error: "Failed to save training" })
  }
})

app.patch("/api/trainings/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  const parsed = trainingPatchSchema.safeParse(req.body)

  if (!id.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Invalid training update" })
    return
  }

  try {
    await ensureSchema()
    const [training] = await getDb()
      .update(trainings)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, id.data))
      .returning()

    if (!training) {
      res.status(404).json({ error: "Training not found" })
      return
    }

    res.json({ training })
  } catch (error) {
    console.error("failed to update training", error)
    res.status(500).json({ error: "Failed to update training" })
  }
})

app.delete("/api/trainings/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  if (!id.success) {
    res.status(400).json({ error: "Invalid training id" })
    return
  }

  try {
    await ensureSchema()
    const [training] = await getDb()
      .delete(trainings)
      .where(eq(trainings.id, id.data))
      .returning({ id: trainings.id })

    if (!training) {
      res.status(404).json({ error: "Training not found" })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error("failed to delete training", error)
    res.status(500).json({ error: "Failed to delete training" })
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

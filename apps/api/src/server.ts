import cors from "cors"
import express from "express"
import { and, desc, eq, gte, lte } from "drizzle-orm"
import { z } from "zod"
import { ensureSchema, getDb, getSql } from "./db/index.js"
import { trainingTypes, trainings } from "./db/schema.js"
import { getDatabaseUrl } from "./env.js"
import {
  TRAINING_CATEGORIES,
  isTrainingCategory,
  type TrainingCategory,
} from "./training.js"

const app = express()

const trainingCategorySchema = z.enum(TRAINING_CATEGORIES)
const trainingStatusSchema = z.enum(["planned", "completed", "skipped"])
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
const idSchema = z.uuid()
const trainingTypeNameSchema = z.string().trim().min(1).max(40)

const trainingWriteSchema = z.object({
  date: isoDateSchema,
  title: z.string().trim().min(1).max(120),
  typeId: idSchema,
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
const trainingTypeWriteSchema = z.object({
  name: trainingTypeNameSchema,
  category: trainingCategorySchema,
})
const trainingTypePatchSchema = trainingTypeWriteSchema.partial()

type TrainingRow = typeof trainings.$inferSelect
type TrainingTypeRow = typeof trainingTypes.$inferSelect

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

function presentTraining(
  row: TrainingRow,
  type: TrainingTypeRow | undefined
) {
  const category: TrainingCategory =
    type && isTrainingCategory(type.category) ? type.category : "rest"

  return {
    id: row.id,
    date: row.date,
    title: row.title,
    typeId: row.type,
    typeName: type?.name ?? "Unknown",
    category,
    status: row.status,
    durationMinutes: row.durationMinutes,
    distanceKm: row.distanceKm,
    elevationM: row.elevationM,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function presentTrainingType(row: TrainingTypeRow, usageCount: number) {
  return {
    id: row.id,
    name: row.name,
    category: isTrainingCategory(row.category) ? row.category : "rest",
    usageCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function sortTrainingTypes<T extends { name: string; category: string }>(
  types: T[]
) {
  const categoryOrder = new Map(
    TRAINING_CATEGORIES.map((category, index) => [category, index])
  )

  return types.slice().sort((left, right) => {
    const categoryDelta =
      (categoryOrder.get(left.category as TrainingCategory) ?? 99) -
      (categoryOrder.get(right.category as TrainingCategory) ?? 99)
    if (categoryDelta !== 0) {
      return categoryDelta
    }
    return left.name.localeCompare(right.name)
  })
}

async function loadTypeMap() {
  const rows = await getDb().select().from(trainingTypes)
  return new Map(rows.map((type) => [type.id, type]))
}

async function loadTrainingType(id: string) {
  const [type] = await getDb()
    .select()
    .from(trainingTypes)
    .where(eq(trainingTypes.id, id))
    .limit(1)
  return type
}

async function usageByTypeId() {
  const rows = await getDb()
    .select({ typeId: trainings.type })
    .from(trainings)
  const counts = new Map<string, number>()
  for (const row of rows) {
    counts.set(row.typeId, (counts.get(row.typeId) ?? 0) + 1)
  }
  return counts
}

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

app.get("/api/training-types", async (_req, res) => {
  try {
    await ensureSchema()
    const [rows, usage] = await Promise.all([
      getDb().select().from(trainingTypes),
      usageByTypeId(),
    ])
    res.json({
      types: sortTrainingTypes(
        rows.map((row) => presentTrainingType(row, usage.get(row.id) ?? 0))
      ),
    })
  } catch (error) {
    console.error("failed to list training types", error)
    res.status(500).json({ error: "Failed to load training types" })
  }
})

app.post("/api/training-types", async (req, res) => {
  const parsed = trainingTypeWriteSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: "Type needs a name and category" })
    return
  }

  try {
    await ensureSchema()
    const [type] = await getDb()
      .insert(trainingTypes)
      .values({
        name: parsed.data.name,
        category: parsed.data.category,
      })
      .returning()

    res.status(201).json({ type: presentTrainingType(type, 0) })
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({
        error: "That name already exists in this category",
      })
      return
    }
    console.error("failed to create training type", error)
    res.status(500).json({ error: "Failed to save training type" })
  }
})

app.patch("/api/training-types/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  const parsed = trainingTypePatchSchema.safeParse(req.body)

  if (!id.success || !parsed.success || Object.keys(parsed.data).length === 0) {
    res.status(400).json({ error: "Invalid training type update" })
    return
  }

  try {
    await ensureSchema()
    const [type] = await getDb()
      .update(trainingTypes)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(trainingTypes.id, id.data))
      .returning()

    if (!type) {
      res.status(404).json({ error: "Training type not found" })
      return
    }

    const usage = await usageByTypeId()
    res.json({
      type: presentTrainingType(type, usage.get(type.id) ?? 0),
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({
        error: "That name already exists in this category",
      })
      return
    }
    console.error("failed to update training type", error)
    res.status(500).json({ error: "Failed to update training type" })
  }
})

app.delete("/api/training-types/:id", async (req, res) => {
  const id = idSchema.safeParse(req.params.id)
  if (!id.success) {
    res.status(400).json({ error: "Invalid training type id" })
    return
  }

  try {
    await ensureSchema()
    const [used] = await getDb()
      .select({ id: trainings.id })
      .from(trainings)
      .where(eq(trainings.type, id.data))
      .limit(1)

    if (used) {
      res.status(409).json({
        error: "This type is used by existing sessions",
      })
      return
    }

    const [type] = await getDb()
      .delete(trainingTypes)
      .where(eq(trainingTypes.id, id.data))
      .returning({ id: trainingTypes.id })

    if (!type) {
      res.status(404).json({ error: "Training type not found" })
      return
    }

    res.status(204).send()
  } catch (error) {
    console.error("failed to delete training type", error)
    res.status(500).json({ error: "Failed to delete training type" })
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

    const [rows, typeById] = await Promise.all([
      getDb()
        .select()
        .from(trainings)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(desc(trainings.date), desc(trainings.createdAt)),
      loadTypeMap(),
    ])

    res.json({
      trainings: rows.map((row) =>
        presentTraining(row, typeById.get(row.type))
      ),
    })
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
    const trainingType = await loadTrainingType(parsed.data.typeId)
    if (!trainingType) {
      res.status(400).json({ error: "Unknown training type" })
      return
    }

    const [training] = await getDb()
      .insert(trainings)
      .values({
        date: parsed.data.date,
        title: parsed.data.title,
        type: parsed.data.typeId,
        status: parsed.data.status,
        durationMinutes: parsed.data.durationMinutes ?? null,
        distanceKm: parsed.data.distanceKm ?? null,
        elevationM: parsed.data.elevationM ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning()

    res.status(201).json({ training: presentTraining(training, trainingType) })
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
    let trainingType: TrainingTypeRow | undefined
    if (parsed.data.typeId) {
      trainingType = await loadTrainingType(parsed.data.typeId)
      if (!trainingType) {
        res.status(400).json({ error: "Unknown training type" })
        return
      }
    }

    const { typeId, ...rest } = parsed.data
    const [training] = await getDb()
      .update(trainings)
      .set({
        ...rest,
        ...(typeId ? { type: typeId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, id.data))
      .returning()

    if (!training) {
      res.status(404).json({ error: "Training not found" })
      return
    }

    if (!trainingType) {
      trainingType = await loadTrainingType(training.type)
    }

    res.json({ training: presentTraining(training, trainingType) })
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

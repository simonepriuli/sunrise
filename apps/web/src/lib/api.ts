export type HealthResponse = {
  ok: boolean
  service: string
  database: "connected" | "disconnected" | "unconfigured"
}

export const TRAINING_CATEGORIES = [
  "hike",
  "ski",
  "strength",
  "cardio",
  "mobility",
  "rest",
] as const

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number]

export type TrainingStatus = "planned" | "completed" | "skipped"

export type TrainingType = {
  id: string
  name: string
  category: TrainingCategory
  usageCount: number
  createdAt: string
  updatedAt: string
}

export type TrainingTypeInput = {
  name: string
  category: TrainingCategory
}

export type Training = {
  id: string
  date: string
  title: string
  typeId: string
  typeName: string
  category: TrainingCategory
  status: TrainingStatus
  durationMinutes: number | null
  distanceKm: number | null
  elevationM: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type TrainingInput = {
  date: string
  title: string
  typeId: string
  status: TrainingStatus
  durationMinutes?: number | null
  distanceKm?: number | null
  elevationM?: number | null
  notes?: string | null
}

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null
  return data?.error ?? fallback
}

export async function getHealth() {
  const response = await fetch("/api/health")
  return (await response.json()) as HealthResponse
}

export async function listTrainingTypes() {
  const response = await fetch("/api/training-types")
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to load training types"))
  }

  const data = (await response.json()) as { types: TrainingType[] }
  return data.types
}

export async function createTrainingType(input: TrainingTypeInput) {
  const response = await fetch("/api/training-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to save training type"))
  }

  const data = (await response.json()) as { type: TrainingType }
  return data.type
}

export async function updateTrainingType(
  id: string,
  input: Partial<TrainingTypeInput>
) {
  const response = await fetch(`/api/training-types/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to update training type"))
  }

  const data = (await response.json()) as { type: TrainingType }
  return data.type
}

export async function deleteTrainingType(id: string) {
  const response = await fetch(`/api/training-types/${id}`, { method: "DELETE" })
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to delete training type"))
  }
}

export async function listTrainings(range?: { from?: string; to?: string }) {
  const params = new URLSearchParams()
  params.set("from", range?.from ?? "2026-01-01")
  params.set("to", range?.to ?? "2027-12-31")

  const response = await fetch(`/api/trainings?${params.toString()}`)
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to load trainings"))
  }

  const data = (await response.json()) as { trainings: Training[] }
  return data.trainings
}

export async function createTraining(input: TrainingInput) {
  const response = await fetch("/api/trainings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to save training"))
  }

  const data = (await response.json()) as { training: Training }
  return data.training
}

export async function updateTraining(
  id: string,
  input: Partial<TrainingInput>
) {
  const response = await fetch(`/api/trainings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to update training"))
  }

  const data = (await response.json()) as { training: Training }
  return data.training
}

export async function deleteTraining(id: string) {
  const response = await fetch(`/api/trainings/${id}`, { method: "DELETE" })
  if (!response.ok) {
    throw new Error(await readError(response, "Failed to delete training"))
  }
}

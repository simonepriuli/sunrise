export type HealthResponse = {
  ok: boolean
  service: string
  database: "connected" | "disconnected" | "unconfigured"
}

export type TrainingType =
  | "hike"
  | "ski"
  | "strength"
  | "cardio"
  | "mobility"
  | "rest"

export type TrainingStatus = "planned" | "completed" | "skipped"

export type Training = {
  id: string
  date: string
  title: string
  type: TrainingType
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
  type: TrainingType
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

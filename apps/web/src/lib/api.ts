export type HealthResponse = {
  ok: boolean
  service: string
  database: "connected" | "disconnected" | "unconfigured"
}

export type Note = {
  id: string
  body: string
  createdAt: string
}

export async function getHealth() {
  const response = await fetch("/api/health")
  return (await response.json()) as HealthResponse
}

export async function listNotes() {
  const response = await fetch("/api/notes")
  if (!response.ok) {
    throw new Error("Failed to load notes")
  }

  const data = (await response.json()) as { notes: Note[] }
  return data.notes
}

export async function createNote(body: string) {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null
    throw new Error(data?.error ?? "Failed to save note")
  }

  const data = (await response.json()) as { note: Note }
  return data.note
}

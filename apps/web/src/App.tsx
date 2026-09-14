import { useEffect, useState, type FormEvent } from "react"
import { Sun, LoaderCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  createNote,
  getHealth,
  listNotes,
  type HealthResponse,
  type Note,
} from "@/lib/api"

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    const [nextHealth, nextNotes] = await Promise.all([
      getHealth(),
      listNotes(),
    ])
    setHealth(nextHealth)
    setNotes(nextNotes)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [nextHealth, nextNotes] = await Promise.all([
          getHealth(),
          listNotes(),
        ])
        if (cancelled) {
          return
        }
        setHealth(nextHealth)
        setNotes(nextNotes)
        setError(null)
      } catch {
        if (!cancelled) {
          setError("The API is not reachable yet.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextBody = body.trim()
    if (!nextBody) {
      return
    }

    setSaving(true)
    try {
      await createNote(nextBody)
      setBody("")
      await refresh()
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save note")
    } finally {
      setSaving(false)
    }
  }

  const databaseLabel =
    health?.database === "connected"
      ? "Postgres connected"
      : health?.database === "unconfigured"
        ? "Database not configured"
        : "API offline"

  return (
    <div className="relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,oklch(0.78_0.16_70/0.28),transparent_62%)]" />
      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sun className="size-5" />
              </span>
              <div>
                <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
                  Sunrise
                </p>
                <h1 className="font-heading text-2xl font-medium">
                  A quiet place to begin
                </h1>
              </div>
            </div>
            <Badge variant={health?.ok ? "default" : "outline"}>
              {loading ? "Checking" : databaseLabel}
            </Badge>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Vite, React, Tailwind, and shadcn on the front. Express, Drizzle,
            and Neon Postgres on the back. Deployed together on Vercel.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Leave a note</CardTitle>
            <CardDescription>
              Saved to Postgres through the Express API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="note">Morning thought</Label>
                <Textarea
                  id="note"
                  value={body}
                  maxLength={280}
                  placeholder="The light was almost gold..."
                  onChange={(event) => setBody(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  {body.trim().length}/280
                </p>
                <Button type="submit" disabled={saving || !body.trim()}>
                  {saving ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save note"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Something needs attention</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-medium">Notes</h2>
            <p className="text-xs text-muted-foreground">
              Press <kbd>d</kbd> to toggle theme
            </p>
          </div>
          <Separator />
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          ) : notes.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No notes yet. Write the first one above.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm leading-6">{note.body}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatTime(note.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App

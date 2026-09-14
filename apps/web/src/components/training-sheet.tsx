import { useEffect, useState, type FormEvent } from "react"
import { LoaderCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Training, TrainingInput, TrainingStatus, TrainingType } from "@/lib/api"
import { TRAINING_META, TRAINING_STATUSES, TRAINING_TYPES, STATUS_META } from "@/lib/training"
import { cn } from "@/lib/utils"

type TrainingSheetProps = {
  open: boolean
  date: string
  training?: Training
  onClose: () => void
  onSave: (input: TrainingInput, id?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

type FormState = {
  date: string
  title: string
  type: TrainingType
  status: TrainingStatus
  durationMinutes: string
  distanceKm: string
  elevationM: string
  notes: string
}

function emptyForm(date: string, training?: Training): FormState {
  return {
    date: training?.date ?? date,
    title: training?.title ?? TRAINING_META.hike.defaultTitle,
    type: training?.type ?? "hike",
    status: training?.status ?? "planned",
    durationMinutes: training?.durationMinutes?.toString() ?? "",
    distanceKm: training?.distanceKm?.toString() ?? "",
    elevationM: training?.elevationM?.toString() ?? "",
    notes: training?.notes ?? "",
  }
}

function parseOptionalNumber(value: string, integer = false) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }
  if (integer) {
    const rounded = Math.round(parsed)
    return rounded > 0 ? rounded : null
  }
  return parsed
}

export function TrainingSheet({
  open,
  date,
  training,
  onClose,
  onSave,
  onDelete,
}: TrainingSheetProps) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <TrainingSheetForm
      key={training?.id ?? `new-${date}`}
      date={date}
      training={training}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  )
}

function TrainingSheetForm({
  date,
  training,
  onClose,
  onSave,
  onDelete,
}: Omit<TrainingSheetProps, "open">) {
  const [form, setForm] = useState<FormState>(() => emptyForm(date, training))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setError("Give this session a name.")
      return
    }

    setSaving(true)
    try {
      await onSave(
        {
          date: form.date,
          title,
          type: form.type,
          status: form.status,
          durationMinutes: parseOptionalNumber(form.durationMinutes, true),
          distanceKm: parseOptionalNumber(form.distanceKm),
          elevationM: parseOptionalNumber(form.elevationM, true),
          notes: form.notes.trim() || null,
        },
        training?.id
      )
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save training")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!training || !onDelete) {
      return
    }
    setSaving(true)
    try {
      await onDelete(training.id)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete training")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-card ring-1 ring-foreground/10">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
        <form className="flex flex-col gap-5 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]" onSubmit={onSubmit}>
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              {training ? "Edit session" : "New session"}
            </p>
            <h2 className="font-heading mt-1 text-xl font-medium">
              {training ? training.title : "Log a training"}
            </h2>
          </div>

          <fieldset className="flex flex-col gap-2">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      type,
                      title:
                        current.title === TRAINING_META[current.type].defaultTitle
                          ? TRAINING_META[type].defaultTitle
                          : current.title,
                    }))
                  }
                  className={cn(
                    "h-10 rounded-xl text-sm font-medium ring-1 transition-colors",
                    form.type === type
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-background text-muted-foreground ring-border"
                  )}
                >
                  {TRAINING_META[type].shortLabel}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="training-date">Date</Label>
              <Input
                id="training-date"
                type="date"
                className="h-11"
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="training-title">Title</Label>
              <Input
                id="training-title"
                className="h-11"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <Label>Status</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, status }))}
                  className={cn(
                    "h-10 rounded-xl text-sm font-medium ring-1 transition-colors",
                    form.status === status
                      ? "bg-secondary text-secondary-foreground ring-foreground/15"
                      : "bg-background text-muted-foreground ring-border"
                  )}
                >
                  {STATUS_META[status].label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="training-duration">Minutes</Label>
              <Input
                id="training-duration"
                inputMode="numeric"
                className="h-11"
                placeholder="90"
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="training-distance">Km</Label>
              <Input
                id="training-distance"
                inputMode="decimal"
                className="h-11"
                placeholder="12"
                value={form.distanceKm}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    distanceKm: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="training-elevation">Elev m</Label>
              <Input
                id="training-elevation"
                inputMode="numeric"
                className="h-11"
                placeholder="800"
                value={form.elevationM}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    elevationM: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="training-notes">Notes</Label>
            <Textarea
              id="training-notes"
              placeholder="Snow conditions, pack weight, how the legs felt..."
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex items-center gap-2">
            {training && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={saving}
                onClick={() => void handleDelete()}
              >
                <Trash2 />
                Delete
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="lg" className="ml-auto" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" /> : null}
              {training ? "Save" : "Add session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

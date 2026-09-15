import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { ArrowLeft, LoaderCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Training, TrainingInput, TrainingStatus } from "@/lib/api"
import {
  CATEGORY_META,
  TRAINING_STATUSES,
  STATUS_META,
  typeDotClass,
} from "@/lib/training"
import { useTrainings } from "@/lib/trainings-context"
import { cn } from "@/lib/utils"

type TrainingFormProps = {
  date: string
  training?: Training
  onClose: () => void
  onSave: (input: TrainingInput, id?: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

type FormState = {
  date: string
  title: string
  typeId: string
  status: TrainingStatus
  durationMinutes: string
  distanceKm: string
  elevationM: string
  notes: string
}

function emptyForm(
  date: string,
  types: { id: string; name: string }[],
  training?: Training
): FormState {
  const selected =
    types.find((type) => type.id === training?.typeId) ?? types[0]

  return {
    date: training?.date ?? date,
    title: training?.title ?? selected?.name ?? "",
    typeId: training?.typeId ?? selected?.id ?? "",
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

export function TrainingForm({
  date,
  training,
  onClose,
  onSave,
  onDelete,
}: TrainingFormProps) {
  const navigate = useNavigate()
  const { types } = useTrainings()
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(date, types, training)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const selectedType = types.find((type) => type.id === form.typeId)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setError("Give this session a name.")
      return
    }
    if (!form.typeId) {
      setError("Add a training type in Settings first.")
      return
    }

    setSaving(true)
    try {
      await onSave(
        {
          date: form.date,
          title,
          typeId: form.typeId,
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
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <header className="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 mt-0.5"
          aria-label="Back"
          onClick={onClose}
        >
          <ArrowLeft />
        </Button>
        <div>
          <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
            {training ? "Edit session" : "New session"}
          </p>
          <h1 className="font-heading mt-1 text-2xl font-medium">
            {training ? training.title : "Log a training"}
          </h1>
        </div>
      </header>

      <fieldset className="flex flex-col gap-2">
        <Label>Type</Label>
        {types.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border">
            <p className="text-sm text-muted-foreground">
              Create a custom type in Settings before logging a session.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void navigate("/settings")}
            >
              Open settings
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {types.map((type) => {
              const selected = form.typeId === type.id

              return (
                <button
                  key={type.id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${type.name}, ${CATEGORY_META[type.category].label}`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      typeId: type.id,
                      title:
                        current.title === selectedType?.name
                          ? type.name
                          : current.title,
                    }))
                  }
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium ring-1 transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card text-muted-foreground ring-border"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      selected
                        ? "bg-primary-foreground/80"
                        : typeDotClass(type.category)
                    )}
                  />
                  {type.name}
                </button>
              )
            })}
          </div>
        )}
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
              aria-pressed={form.status === status}
              onClick={() => setForm((current) => ({ ...current, status }))}
              className={cn(
                "h-11 rounded-xl text-sm font-medium ring-1 transition-colors",
                form.status === status
                  ? "bg-secondary text-secondary-foreground ring-foreground/15"
                  : "bg-card text-muted-foreground ring-border"
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

      <div className="flex items-center gap-2 pt-1">
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
        <Button
          type="submit"
          size="lg"
          className="ml-auto"
          disabled={saving || types.length === 0}
        >
          {saving ? <LoaderCircle className="animate-spin" /> : null}
          {training ? "Save" : "Add session"}
        </Button>
      </div>
    </form>
  )
}

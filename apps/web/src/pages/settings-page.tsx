import { useState, type FormEvent } from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { TrainingCategory, TrainingType } from "@/lib/api"
import {
  CATEGORY_META,
  TRAINING_CATEGORIES,
  typeDotClass,
  typesForCategory,
} from "@/lib/training"
import { useTrainings } from "@/lib/trainings-context"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { types, loading, error, saveType, removeType } = useTrainings()

  return (
    <main className="flex flex-col gap-6">
      <header>
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Settings
        </p>
        <h1 className="font-heading mt-1 text-2xl font-medium">Training types</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Name the sessions you actually do. Each custom type sits in a category
          so calendar colors stay consistent.
        </p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>The log is unreachable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : (
        TRAINING_CATEGORIES.map((category) => (
          <CategoryTypesCard
            key={category}
            category={category}
            types={typesForCategory(types, category)}
            onSave={saveType}
            onDelete={removeType}
          />
        ))
      )}
    </main>
  )
}

function CategoryTypesCard({
  category,
  types,
  onSave,
  onDelete,
}: {
  category: TrainingCategory
  types: TrainingType[]
  onSave: (input: { name: string; category: TrainingCategory }, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Give this type a name.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({ name: trimmed, category })
      setName("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save type")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", typeDotClass(category))} />
          <h2 className="font-heading text-sm font-medium">
            {CATEGORY_META[category].label}
          </h2>
        </div>

        {types.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No types in this category yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {types.map((type) => (
              <TypeRow
                key={type.id}
                type={type}
                onSave={onSave}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}

        <form className="flex items-center gap-2" onSubmit={onSubmit}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={`Add a ${CATEGORY_META[category].label.toLowerCase()} type`}
            className="h-10"
            maxLength={40}
            aria-label={`Add ${CATEGORY_META[category].label} type`}
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            className="size-10"
            disabled={saving}
            aria-label={`Add ${CATEGORY_META[category].label} type`}
          >
            <Plus />
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}

function TypeRow({
  type,
  onSave,
  onDelete,
}: {
  type: TrainingType
  onSave: (input: { name: string; category: TrainingCategory }, id?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [name, setName] = useState(type.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveName() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Give this type a name.")
      return
    }
    if (trimmed === type.name) {
      setEditing(false)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSave({ name: trimmed, category: type.category }, type.id)
      setEditing(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not rename type")
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    setError(null)
    try {
      await onDelete(type.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete type")
      setConfirmingDelete(false)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-2 rounded-xl bg-background p-2 ring-1 ring-border">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-9"
            maxLength={40}
            aria-label={`Rename ${type.name}`}
            autoFocus
          />
          <Button
            type="button"
            size="icon"
            className="size-9"
            disabled={busy}
            aria-label="Save type name"
            onClick={() => void saveName()}
          >
            <Check />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-9"
            aria-label="Cancel rename"
            onClick={() => {
              setName(type.name)
              setEditing(false)
              setError(null)
            }}
          >
            <X />
          </Button>
        </div>
        {error ? <p className="px-1 text-xs text-destructive">{error}</p> : null}
      </li>
    )
  }

  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 ring-1 ring-border">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{type.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {type.usageCount === 1
              ? "1 session"
              : `${type.usageCount} sessions`}
          </p>
        </div>
        {confirmingDelete ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label="Cancel delete"
              onClick={() => setConfirmingDelete(false)}
            >
              <X />
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label={`Rename ${type.name}`}
              onClick={() => {
                setName(type.name)
                setEditing(true)
              }}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              aria-label={`Delete ${type.name}`}
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
      {error ? <p className="px-1 text-xs text-destructive">{error}</p> : null}
    </li>
  )
}

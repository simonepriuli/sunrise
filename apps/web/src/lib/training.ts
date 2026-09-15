import type { TrainingCategory, TrainingStatus, TrainingType } from "@/lib/api"
import { TRAINING_CATEGORIES } from "@/lib/api"

export { TRAINING_CATEGORIES, type TrainingCategory }

export const TRAINING_STATUSES = [
  "planned",
  "completed",
  "skipped",
] as const satisfies readonly TrainingStatus[]

export const CATEGORY_META: Record<TrainingCategory, { label: string }> = {
  hike: { label: "Hike" },
  ski: { label: "Ski" },
  strength: { label: "Strength" },
  cardio: { label: "Cardio" },
  mobility: { label: "Mobility" },
  rest: { label: "Rest" },
}

export const STATUS_META: Record<TrainingStatus, { label: string }> = {
  planned: { label: "Planned" },
  completed: { label: "Done" },
  skipped: { label: "Skipped" },
}

export function typesForCategory(
  types: TrainingType[],
  category: TrainingCategory
) {
  return types.filter((type) => type.category === category)
}

export function typeDotClass(category: TrainingCategory) {
  switch (category) {
    case "hike":
      return "bg-primary"
    case "ski":
      return "bg-sky-400"
    case "strength":
      return "bg-orange-400"
    case "cardio":
      return "bg-emerald-400"
    case "mobility":
      return "bg-violet-400"
    case "rest":
      return "bg-muted-foreground/50"
  }
}

export function typeTintClass(category: TrainingCategory) {
  switch (category) {
    case "hike":
      return "bg-primary/15 text-primary"
    case "ski":
      return "bg-sky-400/15 text-sky-300"
    case "strength":
      return "bg-orange-400/15 text-orange-300"
    case "cardio":
      return "bg-emerald-400/15 text-emerald-300"
    case "mobility":
      return "bg-violet-400/15 text-violet-300"
    case "rest":
      return "bg-muted text-muted-foreground"
  }
}

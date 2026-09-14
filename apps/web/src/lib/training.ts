import type { TrainingStatus, TrainingType } from "@/lib/api"

export const TRAINING_TYPES = [
  "hike",
  "ski",
  "strength",
  "cardio",
  "mobility",
  "rest",
] as const satisfies readonly TrainingType[]

export const TRAINING_STATUSES = [
  "planned",
  "completed",
  "skipped",
] as const satisfies readonly TrainingStatus[]

export const TRAINING_META: Record<
  TrainingType,
  { label: string; shortLabel: string; defaultTitle: string }
> = {
  hike: { label: "Hike", shortLabel: "Hike", defaultTitle: "Elevation hike" },
  ski: { label: "Ski tour", shortLabel: "Ski", defaultTitle: "Ski tour" },
  strength: {
    label: "Strength",
    shortLabel: "Gym",
    defaultTitle: "Strength session",
  },
  cardio: { label: "Cardio", shortLabel: "Cardio", defaultTitle: "Cardio" },
  mobility: {
    label: "Mobility",
    shortLabel: "Mobility",
    defaultTitle: "Mobility",
  },
  rest: { label: "Rest", shortLabel: "Rest", defaultTitle: "Rest day" },
}

export const STATUS_META: Record<TrainingStatus, { label: string }> = {
  planned: { label: "Planned" },
  completed: { label: "Done" },
  skipped: { label: "Skipped" },
}

export function typeDotClass(type: TrainingType) {
  switch (type) {
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

export function typeTintClass(type: TrainingType) {
  switch (type) {
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

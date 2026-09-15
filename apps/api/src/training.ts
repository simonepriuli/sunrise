export const TRAINING_CATEGORIES = [
  "hike",
  "ski",
  "strength",
  "cardio",
  "mobility",
  "rest",
] as const

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number]

export const DEFAULT_TRAINING_TYPES = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Hike",
    category: "hike",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Ski tour",
    category: "ski",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Strength",
    category: "strength",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Cardio",
    category: "cardio",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Mobility",
    category: "mobility",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Rest",
    category: "rest",
  },
] as const satisfies ReadonlyArray<{
  id: string
  name: string
  category: TrainingCategory
}>

export function isTrainingCategory(value: string): value is TrainingCategory {
  return (TRAINING_CATEGORIES as readonly string[]).includes(value)
}

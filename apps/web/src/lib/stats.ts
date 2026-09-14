import { GOAL } from "@/lib/goal"
import {
  addDays,
  daysBetween,
  parseISODate,
  startOfDay,
  startOfWeek,
  toISODate,
} from "@/lib/dates"
import type { Training } from "@/lib/api"

export function computeStats(trainings: Training[], now = new Date()) {
  const today = startOfDay(now)
  const todayIso = toISODate(today)
  const summit = parseISODate(GOAL.summitDate)
  const start = parseISODate(GOAL.startDate)
  const totalDays = Math.max(1, daysBetween(start, summit))
  const elapsedDays = Math.min(totalDays, Math.max(0, daysBetween(start, today)))
  const daysUntil = Math.max(0, daysBetween(today, summit))
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 6)
  const weekStartIso = toISODate(weekStart)
  const weekEndIso = toISODate(weekEnd)
  const monthKey = todayIso.slice(0, 7)

  const completed = trainings.filter((training) => training.status === "completed")
  const thisWeek = trainings.filter(
    (training) => training.date >= weekStartIso && training.date <= weekEndIso
  )
  const thisMonth = trainings.filter((training) => training.date.startsWith(monthKey))
  const todaySessions = trainings.filter((training) => training.date === todayIso)
  const upcoming = trainings
    .filter(
      (training) =>
        training.date >= todayIso && training.status === "planned"
    )
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 5)

  const elevationM = sum(completed, (training) => training.elevationM)
  const durationMinutes = sum(completed, (training) => training.durationMinutes)
  const distanceKm = sum(completed, (training) => training.distanceKm)
  const weekCompleted = thisWeek.filter((training) => training.status === "completed")

  return {
    todayIso,
    daysUntil,
    elapsedRatio: elapsedDays / totalDays,
    weekDays: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index)
      const iso = toISODate(date)
      const dayTrainings = thisWeek.filter((training) => training.date === iso)
      return {
        iso,
        date,
        label: new Intl.DateTimeFormat(undefined, { weekday: "narrow" }).format(
          date
        ),
        isToday: iso === todayIso,
        hasCompleted: dayTrainings.some((training) => training.status === "completed"),
        hasPlanned: dayTrainings.some((training) => training.status === "planned"),
      }
    }),
    weekCompleted: weekCompleted.length,
    weekPlanned: thisWeek.filter((training) => training.status === "planned").length,
    weekElevationM: sum(weekCompleted, (training) => training.elevationM),
    monthCompleted: thisMonth.filter((training) => training.status === "completed")
      .length,
    monthElevationM: sum(
      thisMonth.filter((training) => training.status === "completed"),
      (training) => training.elevationM
    ),
    completedCount: completed.length,
    elevationM,
    durationMinutes,
    distanceKm,
    adamelloRepeats: elevationM / GOAL.elevationM,
    todaySessions,
    upcoming,
  }
}

function sum(
  items: Training[],
  pick: (training: Training) => number | null
) {
  return items.reduce((total, item) => total + (pick(item) ?? 0), 0)
}

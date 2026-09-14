import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrainingCard } from "@/components/training-card"
import { useAppOutlet } from "@/components/app-shell"
import { formatMonth, isSameDay, parseISODate, startOfDay, toISODate } from "@/lib/dates"
import { typeDotClass } from "@/lib/training"
import { useTrainings } from "@/lib/trainings-context"
import { cn } from "@/lib/utils"

const WEEKDAYS = Array.from({ length: 7 }, (_, index) =>
  new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
    new Date(2026, 8, 7 + index)
  )
)

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []

  for (let index = 0; index < startOffset; index += 1) {
    cells.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day))
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }
  return cells
}

export function CalendarPage() {
  const { trainings, loading, complete } = useTrainings()
  const { openCreate, openEdit } = useAppOutlet()
  const today = startOfDay(new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedIso, setSelectedIso] = useState(() => toISODate(today))

  const cells = useMemo(
    () => monthCells(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  )

  const byDate = useMemo(() => {
    const grouped = new Map<string, typeof trainings>()
    for (const training of trainings) {
      const current = grouped.get(training.date) ?? []
      current.push(training)
      grouped.set(training.date, current)
    }
    return grouped
  }, [trainings])

  const selectedTrainings = byDate.get(selectedIso) ?? []

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
            Calendar
          </p>
          <h1 className="font-heading mt-1 text-2xl font-medium">{formatMonth(cursor)}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelectedIso(toISODate(today))
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Previous month"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Next month"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight />
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
            {WEEKDAYS.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>
          {loading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const iso = toISODate(date)
                const dayTrainings = byDate.get(iso) ?? []
                const selected = iso === selectedIso

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedIso(iso)}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-between rounded-xl py-1.5 text-sm ring-1 ring-transparent",
                      selected && "bg-primary/15 ring-primary/40",
                      isSameDay(date, today) && !selected && "ring-border"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs",
                        isSameDay(date, today) && "bg-primary text-primary-foreground"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <span className="flex h-1.5 items-center justify-center gap-0.5">
                      {dayTrainings.slice(0, 3).map((training) => (
                        <span
                          key={training.id}
                          className={cn("size-1.5 rounded-full", typeDotClass(training.type))}
                        />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-medium">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(parseISODate(selectedIso))}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => openCreate(selectedIso)}>
            Add
          </Button>
        </div>
        {selectedTrainings.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No trainings on this day. Add one to keep the Adamello block honest.
              </p>
            </CardContent>
          </Card>
        ) : (
          selectedTrainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              onOpen={openEdit}
              onComplete={(id) => void complete(id)}
            />
          ))
        )}
      </section>
    </main>
  )
}

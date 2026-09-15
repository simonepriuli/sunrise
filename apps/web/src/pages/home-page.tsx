import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { InstallHint } from "@/components/install-hint"
import { TrainingCard } from "@/components/training-card"
import { useAppOutlet } from "@/components/app-shell"
import { GOAL } from "@/lib/goal"
import { formatNumber, parseISODate } from "@/lib/dates"
import { computeStats } from "@/lib/stats"
import { useTrainings } from "@/lib/trainings-context"
import { cn } from "@/lib/utils"

export function HomePage() {
  const { trainings, loading, error, complete } = useTrainings()
  const { openCreate, openEdit } = useAppOutlet()
  const stats = computeStats(trainings)

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-3xl font-medium tracking-tight">
          Project {GOAL.name}
        </h1>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>The log is unreachable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Days to summit</p>
                  <p className="font-heading mt-1 text-5xl font-medium tracking-tight">
                    {formatNumber(stats.daysUntil)}
                  </p>
                </div>
                <p className="max-w-28 text-right text-xs leading-5 text-muted-foreground">
                  Approach from{" "}
                  {new Intl.DateTimeFormat(undefined, {
                    month: "short",
                    year: "numeric",
                  }).format(parseISODate(GOAL.startDate))}{" "}
                  to {GOAL.summitLabel}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(stats.elapsedRatio * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <section className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">Vertical in the bank</p>
                <p className="font-heading text-2xl font-medium">
                  {formatNumber(stats.elevationM)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">m</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.adamelloRepeats, 2)} × Adamello
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1">
                <p className="text-xs text-muted-foreground">This week</p>
                <p className="font-heading text-2xl font-medium">
                  {stats.weekCompleted}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / {GOAL.weeklyTarget}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(stats.weekElevationM)} m this week
                </p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Week</p>
                <p className="text-xs text-muted-foreground">
                  {stats.monthCompleted === 1
                    ? "1 session this month"
                    : `${stats.monthCompleted} sessions this month`}
                </p>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {stats.weekDays.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => openCreate(day.iso)}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-[11px] text-muted-foreground">{day.label}</span>
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs ring-1",
                        day.hasCompleted
                          ? "bg-primary text-primary-foreground ring-primary"
                          : day.hasPlanned
                            ? "bg-primary/15 text-primary ring-primary/30"
                            : "bg-background text-muted-foreground ring-border",
                        day.isToday && "ring-2 ring-primary"
                      )}
                    >
                      {day.date.getDate()}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <InstallHint />

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-medium">Today</h2>
              <Button type="button" variant="ghost" size="sm" onClick={() => openCreate()}>
                Add
              </Button>
            </div>
            {stats.todaySessions.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nothing logged for today. Add a session when you are ready.
                  </p>
                </CardContent>
              </Card>
            ) : (
              stats.todaySessions.map((training) => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  onOpen={openEdit}
                  onComplete={(id) => void complete(id)}
                />
              ))
            )}
          </section>

          {stats.upcoming.filter((training) => training.date !== stats.todayIso)
            .length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-sm font-medium">Coming up</h2>
              {stats.upcoming
                .filter((training) => training.date !== stats.todayIso)
                .map((training) => (
                  <TrainingCard
                    key={training.id}
                    training={training}
                    onOpen={openEdit}
                    onComplete={(id) => void complete(id)}
                  />
                ))}
            </section>
          ) : null}
        </>
      )}
    </main>
  )
}

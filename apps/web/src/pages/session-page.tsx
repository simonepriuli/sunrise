import { useLocation, useNavigate, useParams, useSearchParams } from "react-router"
import { ArrowLeft } from "lucide-react"
import { TrainingForm } from "@/components/training-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toISODate } from "@/lib/dates"
import { useTrainings } from "@/lib/trainings-context"

function isISODate(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value))
}

export function SessionPage() {
  const { trainingId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { trainings, loading, save, remove } = useTrainings()

  const requestedDate = searchParams.get("date")
  const date = isISODate(requestedDate) ? requestedDate : toISODate(new Date())
  const training = trainingId
    ? trainings.find((item) => item.id === trainingId)
    : undefined

  function onClose() {
    if (location.key === "default") {
      navigate("/")
      return
    }
    navigate(-1)
  }

  if (loading) {
    return (
      <main className="flex flex-col gap-6">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </main>
    )
  }

  if (trainingId && !training) {
    return (
      <main className="flex flex-col gap-6">
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
              Edit session
            </p>
            <h1 className="font-heading mt-1 text-2xl font-medium">Not found</h1>
          </div>
        </header>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This training is no longer in the log.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main>
      <TrainingForm
        key={training?.id ?? `new-${date}`}
        date={date}
        training={training}
        onClose={onClose}
        onSave={save}
        onDelete={remove}
      />
    </main>
  )
}

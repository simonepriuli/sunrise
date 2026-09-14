import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Training } from "@/lib/api"
import { STATUS_META, TRAINING_META, typeTintClass } from "@/lib/training"
import { formatDay, formatNumber } from "@/lib/dates"

type TrainingCardProps = {
  training: Training
  onOpen: (training: Training) => void
  onComplete?: (id: string) => void
}

export function TrainingCard({ training, onOpen, onComplete }: TrainingCardProps) {
  const details = [
    training.durationMinutes ? `${training.durationMinutes} min` : null,
    training.distanceKm != null ? `${formatNumber(training.distanceKm, 1)} km` : null,
    training.elevationM != null ? `${formatNumber(training.elevationM)} m` : null,
  ].filter(Boolean)

  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start gap-1.5 text-left"
          onClick={() => onOpen(training)}
        >
          <div className="flex w-full items-center gap-2">
            <span
              className={`inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium ${typeTintClass(training.type)}`}
            >
              {TRAINING_META[training.type].shortLabel}
            </span>
            <span className="truncate text-sm font-medium">{training.title}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDay(training.date)}
            {details.length ? ` · ${details.join(" · ")}` : ""}
          </p>
          {training.notes ? (
            <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
              {training.notes}
            </p>
          ) : null}
        </button>
        {training.status === "planned" && onComplete ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label={`Mark ${training.title} complete`}
            onClick={() => onComplete(training.id)}
          >
            <Check />
          </Button>
        ) : (
          <Badge variant={training.status === "completed" ? "default" : "outline"}>
            {STATUS_META[training.status].label}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

/* eslint-disable react-refresh/only-export-components */
import { useMemo, useState } from "react"
import { NavLink, Outlet, useOutletContext } from "react-router"
import { CalendarDays, Mountain, Plus } from "lucide-react"
import { TrainingSheet } from "@/components/training-sheet"
import { Button } from "@/components/ui/button"
import type { Training } from "@/lib/api"
import { toISODate } from "@/lib/dates"
import { useTrainings } from "@/lib/trainings-context"
import { cn } from "@/lib/utils"

export type AppOutletContext = {
  openCreate: (date?: string) => void
  openEdit: (training: Training) => void
}

type SheetState =
  | { open: false }
  | { open: true; date: string; training?: Training }

export function AppShell() {
  const { save, remove } = useTrainings()
  const [sheet, setSheet] = useState<SheetState>({ open: false })

  const context = useMemo<AppOutletContext>(
    () => ({
      openCreate: (date = toISODate(new Date())) =>
        setSheet({ open: true, date }),
      openEdit: (training) =>
        setSheet({ open: true, date: training.date, training }),
    }),
    []
  )

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col px-5 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-32">
        <Outlet context={context} />
      </div>

      <Button
        type="button"
        size="icon-lg"
        className="fixed right-5 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-none"
        aria-label="Add training"
        onClick={() => context.openCreate()}
      >
        <Plus className="size-6" />
      </Button>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-2 px-6 pt-2 pb-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <Mountain className="size-5" />
            Home
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <CalendarDays className="size-5" />
            Calendar
          </NavLink>
        </div>
      </nav>

      <TrainingSheet
        open={sheet.open}
        date={sheet.open ? sheet.date : toISODate(new Date())}
        training={sheet.open ? sheet.training : undefined}
        onClose={() => setSheet({ open: false })}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}

export function useAppOutlet() {
  return useOutletContext<AppOutletContext>()
}

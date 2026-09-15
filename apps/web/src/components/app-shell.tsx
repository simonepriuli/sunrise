/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react"
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router"
import { CalendarDays, Mountain, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Training } from "@/lib/api"
import { toISODate } from "@/lib/dates"
import { cn } from "@/lib/utils"

export type AppOutletContext = {
  openCreate: (date?: string) => void
  openEdit: (training: Training) => void
}

const TABS = [
  { to: "/", label: "Home", icon: Mountain, end: true },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
] as const

export function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const hideNav = pathname.startsWith("/session")

  const context = useMemo<AppOutletContext>(
    () => ({
      openCreate: (date = toISODate(new Date())) =>
        navigate(`/session/new?date=${date}`),
      openEdit: (training) => navigate(`/session/${training.id}`),
    }),
    [navigate]
  )

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background text-foreground">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
        <div
          className={cn(
            "mx-auto flex w-full max-w-lg flex-col px-5 pt-[calc(1.25rem+env(safe-area-inset-top))]",
            hideNav
              ? "pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
              : "pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
          )}
        >
          <Outlet context={context} />
        </div>
      </div>

      {hideNav ? null : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3">
            <nav
              aria-label="Primary"
              className="relative grid h-16 flex-1 grid-cols-3 rounded-full bg-card p-1.5 ring-1 ring-foreground/10 shadow-[0_8px_24px_-12px_var(--bar-shadow),0_2px_6px_-3px_var(--bar-shadow)]"
            >
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium outline-none transition-colors",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground"
                    )
                  }
                >
                  <tab.icon className="size-5" />
                  {tab.label}
                </NavLink>
              ))}
            </nav>

            <Button
              type="button"
              size="icon-lg"
              className="size-16 shrink-0 rounded-full shadow-[0_12px_28px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)]"
              aria-label="Add training"
              onClick={() => context.openCreate()}
            >
              <Plus className="size-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function useAppOutlet() {
  return useOutletContext<AppOutletContext>()
}

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  createTraining,
  deleteTraining,
  getHealth,
  listTrainings,
  updateTraining,
  type HealthResponse,
  type Training,
  type TrainingInput,
} from "@/lib/api"

type TrainingsContextValue = {
  trainings: Training[]
  health: HealthResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  save: (input: TrainingInput, id?: string) => Promise<void>
  complete: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

const TrainingsContext = createContext<TrainingsContextValue | undefined>(
  undefined
)

export function TrainingsProvider({ children }: { children: ReactNode }) {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [nextHealth, nextTrainings] = await Promise.all([
      getHealth(),
      listTrainings(),
    ])
    setHealth(nextHealth)
    setTrainings(nextTrainings)
    setError(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        await refresh()
      } catch {
        if (!cancelled) {
          setError("Could not reach the training log yet.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [refresh])

  const save = useCallback(async (input: TrainingInput, id?: string) => {
    if (id) {
      await updateTraining(id, input)
    } else {
      await createTraining(input)
    }
    await refresh()
  }, [refresh])

  const complete = useCallback(
    async (id: string) => {
      await updateTraining(id, { status: "completed" })
      await refresh()
    },
    [refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteTraining(id)
      await refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({
      trainings,
      health,
      loading,
      error,
      refresh,
      save,
      complete,
      remove,
    }),
    [trainings, health, loading, error, refresh, save, complete, remove]
  )

  return (
    <TrainingsContext.Provider value={value}>
      {children}
    </TrainingsContext.Provider>
  )
}

export function useTrainings() {
  const context = useContext(TrainingsContext)
  if (!context) {
    throw new Error("useTrainings must be used within TrainingsProvider")
  }
  return context
}

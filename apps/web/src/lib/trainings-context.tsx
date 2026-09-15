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
  createTrainingType,
  deleteTraining,
  deleteTrainingType,
  getHealth,
  listTrainingTypes,
  listTrainings,
  updateTraining,
  updateTrainingType,
  type HealthResponse,
  type Training,
  type TrainingInput,
  type TrainingType,
  type TrainingTypeInput,
} from "@/lib/api"

type TrainingsContextValue = {
  trainings: Training[]
  types: TrainingType[]
  health: HealthResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  save: (input: TrainingInput, id?: string) => Promise<void>
  complete: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
  saveType: (input: TrainingTypeInput, id?: string) => Promise<void>
  removeType: (id: string) => Promise<void>
}

const TrainingsContext = createContext<TrainingsContextValue | undefined>(
  undefined
)

export function TrainingsProvider({ children }: { children: ReactNode }) {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [types, setTypes] = useState<TrainingType[]>([])
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [nextHealth, nextTrainings, nextTypes] = await Promise.all([
      getHealth(),
      listTrainings(),
      listTrainingTypes(),
    ])
    setHealth(nextHealth)
    setTrainings(nextTrainings)
    setTypes(nextTypes)
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

  const saveType = useCallback(
    async (input: TrainingTypeInput, id?: string) => {
      if (id) {
        await updateTrainingType(id, input)
      } else {
        await createTrainingType(input)
      }
      await refresh()
    },
    [refresh]
  )

  const removeType = useCallback(
    async (id: string) => {
      await deleteTrainingType(id)
      await refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({
      trainings,
      types,
      health,
      loading,
      error,
      refresh,
      save,
      complete,
      remove,
      saveType,
      removeType,
    }),
    [
      trainings,
      types,
      health,
      loading,
      error,
      refresh,
      save,
      complete,
      remove,
      saveType,
      removeType,
    ]
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

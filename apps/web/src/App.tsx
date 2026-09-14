import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { AppShell } from "@/components/app-shell"
import { CalendarPage } from "@/pages/calendar-page"
import { HomePage } from "@/pages/home-page"
import { TrainingsProvider } from "@/lib/trainings-context"

export function App() {
  return (
    <TrainingsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TrainingsProvider>
  )
}

export default App

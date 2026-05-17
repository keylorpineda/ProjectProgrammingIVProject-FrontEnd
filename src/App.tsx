import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login/Login"
import AdmissionNew from "./pages/AdmissionNew/AdmissionNew"
import Admin from "./pages/admin/Admin"
import WorkerLayout from "./pages/worker/WorkerLayout"
import WorkerGuard from "./core/guards/WorkerGuard"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admissions/new" element={<AdmissionNew />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route
          path="/worker/*"
          element={
            <WorkerGuard>
              <WorkerLayout />
            </WorkerGuard>
          }
        />
        <Route path="/register" element={<Navigate to="/admissions/new" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

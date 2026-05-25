import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login/Login"
import AdmissionNew from "./pages/AdmissionNew/AdmissionNew"
import Admin from "./pages/Admin/Admin"
import Register from "./pages/Register/Register"
import WorkerLayout from "./pages/worker/WorkerLayout"
import WorkerGuard from "./core/guards/WorkerGuard"
import CampLeaderLayout from "./pages/CampLeader/CampLeaderLayout"
import DashboardManager from "./features/camp-manager/components/DashboardManager"

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
        <Route path="/campleader/*" element={<CampLeaderLayout />} />
        <Route path="/camp-manager/*" element={<DashboardManager />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

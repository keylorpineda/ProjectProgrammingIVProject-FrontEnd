import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login/Login"
import AdmissionNew from "./pages/AdmissionNew/AdmissionNew"
import Admin from "./pages/Admin/Admin"
import Register from "./pages/Register/Register"
import WorkerLayout from "./pages/worker/WorkerLayout"
import WorkerGuard from "./core/guards/WorkerGuard"
import CampLeaderLayout from "./pages/CampLeader/CampLeaderLayout"
import CampLeaderGuard from "./core/guards/CampLeaderGuard"
import CampManagerGuard from "./core/guards/CampManagerGuard"
import DashboardManager from "./features/camp-manager/components/DashboardManager"
import TravelManagerGuard from "./core/guards/TravelManagerGuard"
import TravelManagerLayout from "./pages/TravelManager/TravelManagerLayout"
import TravelDashboard from "./pages/TravelManager/components/TravelDashboard"
import TravelExplorations from "./pages/TravelManager/components/TravelExplorations"
import TravelTeam from "./pages/TravelManager/components/TravelTeam"
import TravelTransfers from "./pages/TravelManager/components/TravelTransfers"
import TravelResources from "./pages/TravelManager/components/TravelResources"

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
        <Route
          path="/campleader/*"
          element={
            <CampLeaderGuard>
              <CampLeaderLayout />
            </CampLeaderGuard>
          }
        />
        <Route
          path="/camp-manager/*"
          element={
            <CampManagerGuard>
              <DashboardManager />
            </CampManagerGuard>
          }
        />
        <Route
          path="/travel-manager/*"
          element={
            <TravelManagerGuard>
              <TravelManagerLayout />
            </TravelManagerGuard>
          }
        >
          <Route path="dashboard" element={<TravelDashboard />} />
          <Route path="expeditions" element={<TravelExplorations />} />
          <Route path="personnel" element={<TravelTeam />} />
          <Route path="transfers" element={<TravelTransfers />} />
          <Route path="inventory" element={<TravelResources />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

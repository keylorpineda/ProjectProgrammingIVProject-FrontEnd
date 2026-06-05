import { Navigate, Route, Routes, useNavigate } from "react-router-dom"

import AdmissionsBook from "./components/AdmissionsBook"
import Camps from "./components/Camps"
import CampSelector from "./components/CampSelector"
import Dashboard from "./components/Dashboard"
import Explorations from "./components/Explorations"
import InactivityWarning from "./components/InactivityWarning"
import People from "./components/People"
import Resources from "./components/Resources"
import Sidebar from "./components/Sidebar"
import Transfers from "./components/Transfers"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { CampProvider } from "./context/CampContext"
import { SessionProvider } from "./context/SessionContext"
import "./AdminTheme.css"
import "./Admin.css"

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  const role = user?.role?.toLowerCase()
  if (!isAuthenticated || !user || role !== "admin") {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    void logout().finally(() => navigate("/login"))
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main-content">
        <header className="admin-topbar">
          <div className="topbar-title">CONFIDENCIAL // ARCHIVO DE CAMPAMENTOS</div>
          <div className="topbar-actions">
            <CampSelector />
            <div className="user-pill">
              {user?.id ?? "USR"} [{user?.role ?? "role"}]
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              SALIR
            </button>
          </div>
        </header>

        <div className="admin-route-container">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admissions" element={<AdmissionsBook />} />
            <Route path="people" element={<People />} />
            <Route path="camps" element={<Camps />} />
            <Route path="explorations" element={<Explorations />} />
            <Route path="resources" element={<Resources />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
      <InactivityWarning />
    </div>
  )
}

export default function Admin() {
  return (
    <div className="admin-root">
      <AuthProvider>
        <CampProvider>
          <SessionProvider>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </SessionProvider>
        </CampProvider>
      </AuthProvider>
    </div>
  )
}

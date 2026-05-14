import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { CampProvider } from "./context/CampContext"
import { SessionProvider } from "./context/SessionContext"
import Sidebar from "./components/Sidebar"
import CampSelector from "./components/CampSelector"
import InactivityWarning from "./components/InactivityWarning"
import Dashboard from "./components/Dashboard"
import AdmissionsBook from "./components/AdmissionsBook"
import People from "./components/People"
import Camps from "./components/Camps"
import Explorations from "./components/Explorations"
import Resources from "./components/Resources"
import Transfers from "./components/Transfers"
import MapTest from "./components/MapTest"
import "./AdminTheme.css"
import "./Admin.css"

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  // const { isAuthenticated, user } = useAuth()
  // const role = user?.role?.toLowerCase()
  // const isAdmin = role === "admin" || role === "super_admin" || role === "superadmin"
  // if (!isAuthenticated || !user || !isAdmin) {
  //   return <Navigate to="/login" replace />
  // }

  return <>{children}</>
}

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isMapTestRoute = location.pathname.startsWith("/admin/map-test")

  const handleLogout = () => {
    void logout().finally(() => navigate("/login"))
  }

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main-content">
        {!isMapTestRoute ? (
          <header className="admin-topbar">
            <div className="topbar-title">CONFIDENTIAL // CAMP ARCHIVE</div>
            <div className="topbar-actions">
              <CampSelector />
              <div className="user-pill">
                {user?.id ?? "USR"} [{user?.role ?? "role"}]
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                LOGOUT
              </button>
            </div>
          </header>
        ) : (
          <div className="admin-topbar-map-actions">
            <button className="logout-btn" onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        )}

        <div className={`admin-route-container ${isMapTestRoute ? "map-test-mode" : ""}`}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admissions" element={<AdmissionsBook />} />
            <Route path="people" element={<People />} />
            <Route path="camps" element={<Camps />} />
            <Route path="explorations" element={<Explorations />} />
            <Route path="resources" element={<Resources />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="map-test" element={<MapTest />} />
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

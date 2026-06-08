import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"

import AdminProfile from "./components/AdminProfile"
import AdmissionsBook from "./components/AdmissionsBook"
import Camps from "./components/Camps"
import CampSelector from "./components/CampSelector"
import Dashboard from "./components/Dashboard"
import Explorations from "./components/Explorations"
import InactivityWarning from "./components/InactivityWarning"
import MapTest from "./components/MapTest"
import People from "./components/People"
import Resources from "./components/Resources"
import Sidebar from "./components/Sidebar"
import Transfers from "./components/Transfers"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { CampProvider, useCamp } from "./context/CampContext"
import { SessionProvider } from "./context/SessionContext"

import AlertsBanner from "@/components/ui/AlertsBanner"
import { useAlertSocket } from "@/hooks/useAlertSocket"
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
  const { activeCampId } = useCamp()
  useAlertSocket(activeCampId)
  const navigate = useNavigate()
  const location = useLocation()
  const isMapRoute = location.pathname.endsWith("/mapa")

  const handleLogout = () => {
    void logout().finally(() => navigate("/login"))
  }

  const [utcTime, setUtcTime] = useState("")
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const formatted = now.toISOString().replace("T", " ").slice(0, 19) + " UTC"
      setUtcTime(formatted)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen max-h-screen bg-[#0d0c0b] text-[#e0d8cc] relative overflow-hidden font-mono flex flex-col">
      {/* SCANLINE OVERLAY */}
      <div
        className="absolute inset-0 pointer-events-none z-50 opacity-[0.035]"
        style={{
          background:
            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
          backgroundSize: "100% 2px, 3px 100%",
        }}
      ></div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          <header className="bg-[#121110] border-b-2 border-black flex flex-col sm:flex-row justify-between items-center px-4 md:px-6 py-3 gap-4 shrink-0 font-mono select-none z-10 shadow-md">
            {/* Left Portal Badges */}
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9c2720] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#9c2720]"></span>
              </div>
              <div>
                <h2 className="text-xs md:text-sm font-black text-[#e0d8cc] hover:text-[#df8120] transition uppercase tracking-widest">
                  CONFIDENCIAL
                </h2>
                <div className="text-sm text-zinc-500 uppercase font-bold mt-0.5 flex items-center gap-2">
                  <span>ARCHIVO DE CAMPAMENTOS</span>
                  <div className="w-1 h-1 bg-zinc-500 rounded-full mx-1"></div>
                  <CampSelector />
                </div>
              </div>
            </div>

            {/* Center Clock */}
            <div className="hidden lg:flex items-center gap-8 text-center px-6">
              <div className="flex items-center gap-2 text-left text-sm">
                <span className="tracking-widest text-zinc-300 font-bold font-mono">{utcTime}</span>
              </div>
            </div>

            <div className="flex items-center self-end sm:self-center border-2 border-[#3b4d3e] bg-[#0d0c0b] p-3 rounded-sm">
              <div className="flex items-center gap-5 px-4">
                {/* ID Avatar Block */}
                <div className="relative h-14 w-14 bg-black border-2 border-[#c27c2f] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#c27c2f]/20 animate-pulse" />
                  <span className="font-black text-[#c27c2f] text-2xl font-typewriter z-10">
                    {user?.username?.[0]?.toUpperCase() || user?.id?.[0]?.toUpperCase() || "A"}
                  </span>
                  {/* Micro decor */}
                  <div
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full"
                    title="ESTADO: EN LÍNEA"
                  />
                </div>

                {/* ID Info Block */}
                <div className="text-left font-mono">
                  <div className="text-xs text-[#c27c2f] font-bold tracking-widest uppercase mb-1">
                    ID-AUTH: VALIDADO
                  </div>
                  <div className="font-black text-lg text-[#e0d8cc] uppercase tracking-widest leading-none mb-2">
                    {user?.username?.toUpperCase() || user?.id?.toUpperCase() || "ADMIN"}
                  </div>
                  <span className="inline-block bg-[#3b4d3e] text-white text-xs font-bold px-2 py-1 uppercase tracking-widest">
                    RANGO: ADMINISTRADOR
                  </span>
                </div>
              </div>

              {/* Action Divider & Button */}
              <div className="w-px h-14 bg-[#3b4d3e] mx-4" />
              <button
                type="button"
                onClick={handleLogout}
                className="h-14 px-6 bg-transparent hover:bg-red-900/50 border border-transparent hover:border-red-500 text-red-500 hover:text-white transition-all uppercase flex items-center justify-center gap-3 cursor-pointer hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm"
                title="CERRAR SESIÓN"
              >
                <LogOut className="h-6 w-6 shrink-0" />
                <span className="text-sm font-bold tracking-widest whitespace-nowrap">
                  CERRAR SESIÓN
                </span>
              </button>
            </div>
          </header>

          <main
            className={`flex-1 bg-[#0d0c0b] relative admin-route-container${isMapRoute ? " map-test-mode" : " overflow-y-auto"}`}
            style={isMapRoute ? {} : { padding: "16px" }}
          >
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="admissions" element={<AdmissionsBook />} />
              <Route path="people" element={<People />} />
              <Route path="camps" element={<Camps />} />
              <Route path="explorations" element={<Explorations />} />
              <Route path="resources" element={<Resources />} />
              <Route path="transfers" element={<Transfers />} />
              <Route path="mapa" element={<MapTest />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
      <AlertsBanner campId={activeCampId} />
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

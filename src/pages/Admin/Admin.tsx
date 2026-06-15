import { X } from "lucide-react"
import { lazy, Suspense, useEffect, useState } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom"

import AdminProfile from "./components/AdminProfile"
import AdmissionsBook from "./components/AdmissionsBook"
import Camps from "./components/Camps"
import Dashboard from "./components/Dashboard"
import Explorations from "./components/Explorations"
import InactivityWarning from "./components/InactivityWarning"
import MapTest from "./components/MapTest"
import Navbar from "./components/Navbar"
import People from "./components/People"
import Resources from "./components/Resources"
import Transfers from "./components/Transfers"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { CampProvider, useCamp } from "./context/CampContext"
import { SessionProvider } from "./context/SessionContext"

import AlertsBanner from "@/components/ui/AlertsBanner"
import { useAlertSocket } from "@/hooks/useAlertSocket"
import "./AdminTheme.css"
import "./Admin.css"

// El campamento 3D vive como FONDO permanente del panel: se carga una vez al
// entrar (chunk pesado de three.js diferido) y nunca se desmonta, así que
// cambiar de sección no lo recarga. Las secciones se abren como ventanas encima.
const CampScene3DWrapper = lazy(() => import("@/features/camp-3d/components/CampScene3DWrapper"))

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth()
  const role = user?.role?.toLowerCase()
  if (!isAuthenticated || !user || role !== "admin") {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const AdminLayout = () => {
  const { logout } = useAuth()
  const { activeCampId } = useCamp()
  useAlertSocket(activeCampId)
  const navigate = useNavigate()
  const location = useLocation()
  const segment = location.pathname.split("/").filter(Boolean).pop() ?? "camp"
  const isMapRoute = segment === "mapa"
  const isCampHome = segment === "camp"
  // Una sección abre una ventana flotante; el campamento (camp) y el mapa son
  // fondos a pantalla completa, sin ventana.
  const showWindow = !isMapRoute && !isCampHome

  const handleLogout = () => {
    void logout().finally(() => navigate("/login"))
  }

  // Cerrar una ventana vuelve a la vista del campamento 3D (la "base").
  const closeWindow = () => navigate("/admin/camp")

  const WINDOW_TITLES: Record<string, string> = {
    dashboard: "TABLERO DE CONTROL",
    admissions: "LIBRO DE ADMISIONES",
    people: "PERSONAL",
    camps: "CAMPAMENTOS",
    explorations: "EXPLORACIONES",
    resources: "RECURSOS",
    transfers: "TRASLADOS",
    profile: "EXPEDIENTE DEL ADMINISTRADOR",
  }
  const windowTitle = WINDOW_TITLES[segment] ?? "PANEL"

  // Al entrar a /mapa, la capa del mapa pasa de display:none a block; Leaflet
  // mide su tamaño con el contenedor aún en 0, así que disparamos un resize en el
  // siguiente frame para que recalcule (invalidateSize) y no queden tiles grises.
  useEffect(() => {
    if (!isMapRoute) return
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")))
    return () => cancelAnimationFrame(raf)
  }, [isMapRoute])

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

      <Navbar utcTime={utcTime} onLogout={handleLogout} />

      {/* CONTENT STAGE — el campamento 3D es el fondo permanente; el mapa es una
          capa que sólo se hace visible en la ruta /mapa; las secciones se abren
          como ventanas encima. Nada de esto se recarga al navegar. */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden bg-[#0d0c0b]">
        {/* Fondo: campamento 3D (montado una sola vez, persistente) */}
        <div className="absolute inset-0 z-0 bg-[#040804]">
          {activeCampId ? (
            <Suspense fallback={null}>
              <CampScene3DWrapper
                key={activeCampId}
                campId={activeCampId}
                embedded
                onClose={() => navigate("/admin/camp")}
              />
            </Suspense>
          ) : null}
        </div>

        {/* Capa de mapa: montada siempre (no recarga al volver), oculta con
            display:none salvo en /mapa. Leaflet compone sus paneles en capas GPU
            con transform, así que visibility:hidden no las oculta — hay que usar
            display. Al reaparecer se dispara un resize para que recalcule tamaño. */}
        <div
          className="absolute inset-0 z-10 bg-[#0d0c0b]"
          style={{ display: isMapRoute ? "block" : "none" }}
          aria-hidden={!isMapRoute}
        >
          <MapTest />
        </div>

        {/* Ventana emergente de la sección activa (sobre el campamento) */}
        <div
          className="absolute inset-0 z-30 flex items-stretch justify-center bg-black/70 backdrop-blur-[2px] md:p-6"
          style={{ display: showWindow ? "flex" : "none" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeWindow()
          }}
        >
          <div className="relative flex flex-col w-full h-full md:max-w-6xl bg-[#0d0c0b] border-2 border-black shadow-[6px_6px_0px_#000000] overflow-hidden">
            {/* Barra de título de la ventana */}
            <div className="shrink-0 flex items-center justify-between bg-[#121110] border-b-2 border-black px-4 py-2.5 select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9c2720] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9c2720]" />
                </span>
                <span className="text-sm font-black text-[#df8120] uppercase tracking-widest truncate">
                  {windowTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={closeWindow}
                title="CERRAR VENTANA"
                className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-[#9a9080] text-black hover:bg-red-700 hover:text-white transition-colors uppercase text-[11px] font-extrabold tracking-widest cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">CERRAR</span>
              </button>
            </div>

            {/* Cuerpo de la ventana */}
            <div className="flex-1 min-h-0 overflow-y-auto admin-route-container">
              <Routes>
                <Route path="camp" element={null} />
                <Route path="mapa" element={null} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admissions" element={<AdmissionsBook />} />
                <Route path="people" element={<People />} />
                <Route path="camps" element={<Camps />} />
                <Route path="explorations" element={<Explorations />} />
                <Route path="resources" element={<Resources />} />
                <Route path="transfers" element={<Transfers />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="*" element={<Navigate to="camp" replace />} />
              </Routes>
            </div>
          </div>
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

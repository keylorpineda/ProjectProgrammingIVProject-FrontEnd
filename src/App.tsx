import { Suspense } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/layout/ProtectedRoute"
import MainLayout from "./components/layout/MainLayout"
import Login from "./pages/Login/Login"
import AdmissionNew from "./pages/AdmissionNew/AdmissionNew"

// Role-Based Routers for Unified Layout
import DashboardRouter from "./components/routing/DashboardRouter"
import PersonnelRouter from "./components/routing/PersonnelRouter"
import InventoryRouter from "./components/routing/InventoryRouter"
import TransfersRouter from "./components/routing/TransfersRouter"
import ExpeditionsRouter from "./components/routing/ExpeditionsRouter"

import RoleSwitcher from "./components/layout/RoleSwitcher"

// Fallback skeleton for Lazy Loading
const PageSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-black/50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-accent-orange/20 border-t-accent-orange rounded-full animate-spin" />
      <span className="font-mono text-accent-orange/70 tracking-widest text-sm animate-pulse">DECODIFICANDO SECUENCIA...</span>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <RoleSwitcher />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/admissions/new" element={<AdmissionNew />} />
        
        {/* Redirect aliases for legacy compatibility during refactor */}
        <Route path="/register" element={<Navigate to="/admissions/new" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* PROTECTED ROUTES (UNIFIED MAIN LAYOUT) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="dashboard" element={
              <Suspense fallback={<PageSkeleton />}>
                <DashboardRouter />
              </Suspense>
            } />
            <Route path="personnel" element={
              <Suspense fallback={<PageSkeleton />}>
                <PersonnelRouter />
              </Suspense>
            } />
            <Route path="inventory" element={
              <Suspense fallback={<PageSkeleton />}>
                <InventoryRouter />
              </Suspense>
            } />
            <Route path="transfers" element={
              <Suspense fallback={<PageSkeleton />}>
                <TransfersRouter />
              </Suspense>
            } />
            <Route path="expeditions" element={
              <Suspense fallback={<PageSkeleton />}>
                <ExpeditionsRouter />
              </Suspense>
            } />
            {/* Fallback for authenticated users */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App

import { Suspense, lazy } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/layout/ProtectedRoute"
import MainLayout from "./components/layout/MainLayout"
import Login from "./pages/Login/Login"
import AdmissionNew from "./pages/AdmissionNew/AdmissionNew"

// Lazy-loaded components for Code Splitting
const TravelDashboard = lazy(() => import("./pages/TravelManager/components/TravelDashboard"))
const TravelTeam = lazy(() => import("./pages/TravelManager/components/TravelTeam"))
const TravelResources = lazy(() => import("./pages/TravelManager/components/TravelResources"))
const TravelTransfers = lazy(() => import("./pages/TravelManager/components/TravelTransfers"))
const TravelExplorations = lazy(() => import("./pages/TravelManager/components/TravelExplorations"))

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
            
            {/* 
              Every route inside here is wrapped in Suspense for lazy loading.
              We use path parameters or exact matches based on the new unified URLs.
            */}
            
            <Route path="/dashboard" element={
              <Suspense fallback={<PageSkeleton />}>
                <TravelDashboard />
              </Suspense>
            } />
            
            <Route path="/personnel" element={
              <Suspense fallback={<PageSkeleton />}>
                <TravelTeam />
              </Suspense>
            } />
            
            <Route path="/inventory" element={
              <Suspense fallback={<PageSkeleton />}>
                <TravelResources />
              </Suspense>
            } />
            
            <Route path="/transfers" element={
              <Suspense fallback={<PageSkeleton />}>
                <TravelTransfers />
              </Suspense>
            } />
            
            <Route path="/expeditions" element={
              <Suspense fallback={<PageSkeleton />}>
                <TravelExplorations />
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

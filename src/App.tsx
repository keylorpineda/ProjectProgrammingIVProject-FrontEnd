import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Placeholder for future routes */}
        <Route
          path="/register"
          element={
            <div style={{ padding: "2rem", color: "white" }}>
              Ventana de Registro - PRÓXIMAMENTE
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div style={{ padding: "2rem", color: "white" }}>
              Dashboard principal - PRÓXIMAMENTE
            </div>
          }
        />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App

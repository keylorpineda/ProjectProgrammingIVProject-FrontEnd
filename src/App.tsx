import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import AdmissionNew from "./pages/AdmissionNew"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admissions/new" element={<AdmissionNew />} />
        <Route path="/register" element={<Navigate to="/admissions/new" replace />} />
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

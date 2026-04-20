import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import "./Login.css"
import loginImage from "../assets/login-image.webp"
// We will use standard React Router when set up, but for now we link to "#" or valid path
import { useNavigate } from "react-router-dom"

const containerVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
      when: "beforeChildren",
      staggerChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: FormEvent) => {
    e.preventDefault()
    // Later we'll integrate the Auth Service here
    console.log("Intento de inicio de sesión...", { email, password })
    // Navigate to dashboard as a mockup
    navigate("/dashboard")
  }

  const goToRegister = () => {
    navigate("/register")
  }

  return (
    <div className="login-container">
      <div className="scanlines"></div>

      <img src={loginImage} alt="Apocalyptic Background" className="login-background" />
      <div className="login-overlay"></div>

      <div className="login-content">
        <motion.div 
          className="glass-panel login-panel"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="login-header" variants={itemVariants}>
            <div className="system-status">
              <div className="status-dot"></div>
              Protocolo de Emergencia Activo
            </div>
            <h1>Gestión del Fin</h1>
            <p>Identificación Requerida para Acceso de Superviviente</p>
          </motion.div>

          <form onSubmit={handleLogin} className="login-form">
            <motion.div className="form-group" style={{ marginBottom: "1.2rem" }} variants={itemVariants}>
              <label htmlFor="email">Credencial / Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="superviviente@refugio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </motion.div>

            <motion.div className="form-group" variants={itemVariants}>
              <label htmlFor="password">Código de Acceso</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </motion.div>

            <motion.button 
              type="submit" 
              className="btn-primary" 
              style={{ width: "100%" }}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Iniciar Conexión
            </motion.button>
          </form>

          <motion.div className="login-footer" variants={itemVariants}>
            ¿Sobreviviste recientemente pero no tienes acceso?
            <button onClick={goToRegister} className="register-link">
              REGÍSTRATE AQUÍ
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

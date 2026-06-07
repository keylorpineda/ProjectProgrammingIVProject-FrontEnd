import { motion, AnimatePresence } from "framer-motion"

import { useAuthStore } from "@/store/useAuthStore"

export default function SessionExpiredOverlay() {
  const { sessionExpired, setSessionExpired } = useAuthStore()

  const handleOk = () => {
    setSessionExpired(false)
    window.location.href = "/login"
  }

  return (
    <AnimatePresence>
      {sessionExpired ? (
        <motion.div
          key="session-expired"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            backdropFilter: "blur(3px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            style={{
              border: "2px solid #e65c53",
              background: "#0d0c0b",
              padding: "40px 48px",
              textAlign: "center",
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 0 48px rgba(230,92,83,0.18)",
              fontFamily: "monospace",
            }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              style={{ fontSize: "2.8rem", marginBottom: 16, lineHeight: 1 }}
            >
              ☠
            </motion.div>

            <p
              style={{
                margin: "0 0 4px",
                fontSize: "0.6rem",
                letterSpacing: "4px",
                color: "#5a2a27",
                textTransform: "uppercase",
              }}
            >
              PROTOCOLO DE SEGURIDAD
            </p>

            <h2
              style={{
                margin: "8px 0 16px",
                fontSize: "1.3rem",
                letterSpacing: "3px",
                color: "#e65c53",
                textTransform: "uppercase",
                textShadow: "0 0 12px rgba(230,92,83,0.4)",
              }}
            >
              SESIÓN EXPIRADA
            </h2>

            <p
              style={{
                margin: "0 0 28px",
                fontSize: "0.75rem",
                color: "#8a7a6a",
                lineHeight: 1.7,
                letterSpacing: "0.5px",
              }}
            >
              Tu sesión fue cerrada por inactividad.
              <br />
              Vuelve a iniciar sesión para continuar.
            </p>

            <motion.button
              whileHover={{
                backgroundColor: "rgba(230,92,83,0.15)",
                boxShadow: "0 0 16px rgba(230,92,83,0.3)",
              }}
              whileTap={{ scale: 0.96 }}
              onClick={handleOk}
              style={{
                background: "transparent",
                border: "1px solid #e65c53",
                color: "#e65c53",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                letterSpacing: "4px",
                padding: "11px 48px",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "background 0.15s, box-shadow 0.15s",
              }}
            >
              ACEPTAR
            </motion.button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

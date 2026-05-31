import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface Props {
  userId: string | number
  userName?: string
}

function MedalSVG() {
  return (
    <svg viewBox="0 0 120 140" width="120" height="140" xmlns="http://www.w3.org/2000/svg">
      {/* Ribbon left */}
      <polygon points="45,0 60,30 30,50 15,10" fill="#7c2d12" opacity="0.9" />
      {/* Ribbon right */}
      <polygon points="75,0 105,10 90,50 60,30" fill="#9c1c1c" opacity="0.9" />
      {/* Ribbon stripe */}
      <polygon points="50,0 70,0 65,28 55,28" fill="#b45309" />

      {/* Outer ring glow */}
      <circle cx="60" cy="88" r="44" fill="rgba(179,133,54,0.15)" />
      {/* Outer ring */}
      <circle cx="60" cy="88" r="40" fill="none" stroke="#b38536" strokeWidth="3" />
      {/* Middle ring */}
      <circle cx="60" cy="88" r="35" fill="none" stroke="rgba(200,168,75,0.4)" strokeWidth="1" />
      {/* Medal body */}
      <circle cx="60" cy="88" r="33" fill="url(#medalGrad)" />
      {/* Inner detail ring */}
      <circle cx="60" cy="88" r="25" fill="none" stroke="rgba(255,220,100,0.3)" strokeWidth="1" />

      {/* Star */}
      <text
        x="60"
        y="97"
        textAnchor="middle"
        fontSize="28"
        fontFamily="serif"
        fill="#ffe080"
        style={{ filter: "drop-shadow(0 0 4px #b38536)" }}
      >
        ★
      </text>

      {/* Shine */}
      <ellipse
        cx="48"
        cy="74"
        rx="8"
        ry="4"
        fill="rgba(255,255,255,0.15)"
        transform="rotate(-30 48 74)"
      />

      <defs>
        <radialGradient id="medalGrad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffe080" />
          <stop offset="40%" stopColor="#c8a84b" />
          <stop offset="100%" stopColor="#7a5c1e" />
        </radialGradient>
      </defs>
    </svg>
  )
}

export default function FirstLoginAchievement({ userId, userName }: Props) {
  const storageKey = `gdf_first_login_${userId}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!userId) return
    const seen = localStorage.getItem(storageKey)
    if (!seen) {
      // Small delay so layout finishes mounting
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [userId, storageKey])

  const dismiss = () => {
    localStorage.setItem(storageKey, "1")
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="first-login-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(3px)",
          }}
          onClick={dismiss}
        >
          <motion.div
            key="first-login-card"
            initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 340,
              maxWidth: "90vw",
              background: "#1a1712",
              border: "2px solid #b38536",
              boxShadow: "0 0 60px rgba(179,133,54,0.35), 0 0 0 8px rgba(179,133,54,0.06)",
              padding: "36px 28px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Corner decorations */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 18,
                height: 18,
                borderTop: "2px solid #b38536",
                borderLeft: "2px solid #b38536",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 18,
                height: 18,
                borderTop: "2px solid #b38536",
                borderRight: "2px solid #b38536",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: 18,
                height: 18,
                borderBottom: "2px solid #b38536",
                borderLeft: "2px solid #b38536",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 18,
                height: 18,
                borderBottom: "2px solid #b38536",
                borderRight: "2px solid #b38536",
              }}
            />

            {/* Top tag */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.55rem",
                letterSpacing: 3,
                color: "rgba(179,133,54,0.6)",
                textTransform: "uppercase",
                marginBottom: 20,
                padding: "3px 12px",
                border: "1px solid rgba(179,133,54,0.2)",
              }}
            >
              LOGRO DESBLOQUEADO
            </div>

            {/* Medal with glow pulse */}
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 8px rgba(179,133,54,0.5))",
                  "drop-shadow(0 0 24px rgba(179,133,54,0.9))",
                  "drop-shadow(0 0 8px rgba(179,133,54,0.5))",
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ marginBottom: 20 }}
            >
              <MedalSVG />
            </motion.div>

            {/* Title */}
            <div
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "1.35rem",
                color: "#c8a84b",
                letterSpacing: 3,
                textTransform: "uppercase",
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              PRIMER TRABAJO
            </div>

            {/* Stars */}
            <div
              style={{
                color: "#ffe080",
                fontSize: "1rem",
                letterSpacing: 6,
                marginBottom: 14,
              }}
            >
              ★★★★★
            </div>

            {/* Flavor text */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "rgba(154,144,128,0.7)",
                letterSpacing: 1.2,
                lineHeight: 1.7,
                marginBottom: 8,
                padding: "0 8px",
              }}
            >
              {userName
                ? `BIENVENIDO, ${String(userName).toUpperCase()}.`
                : "BIENVENIDO AL SISTEMA."}{" "}
              HAS INICIADO SESIÓN POR PRIMERA VEZ EN EL SISTEMA DE SUPERVIVENCIA.
            </div>

            <div
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "0.7rem",
                color: "rgba(200,168,75,0.45)",
                letterSpacing: 1.5,
                marginBottom: 28,
                fontStyle: "italic",
              }}
            >
              LA SUPERVIVENCIA COMIENZA CON UN SOLO PASO.
            </div>

            {/* Horizontal rule */}
            <div
              style={{
                width: "100%",
                height: 1,
                background:
                  "linear-gradient(to right, transparent, rgba(179,133,54,0.5), transparent)",
                marginBottom: 20,
              }}
            />

            {/* Accept button */}
            <motion.button
              whileHover={{ background: "rgba(179,133,54,0.18)", scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={dismiss}
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "0.85rem",
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#c8a84b",
                background: "transparent",
                border: "1px solid rgba(179,133,54,0.5)",
                padding: "10px 40px",
                cursor: "pointer",
                outline: "none",
                width: "100%",
                transition: "background 0.15s",
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

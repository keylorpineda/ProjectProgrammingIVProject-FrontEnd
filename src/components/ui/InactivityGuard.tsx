import { useInactivity } from "@/hooks/useInactivity"

interface InactivityGuardProps {
  isAuthenticated: boolean
  onLogout: () => void
  children: React.ReactNode
}

/**
 * Wraps any layout with the 20-minute inactivity timeout.
 * Shows a full-screen warning during the last 60 seconds.
 * Moving the mouse / pressing a key / scrolling resets the timer.
 */
export default function InactivityGuard({
  isAuthenticated,
  onLogout,
  children,
}: InactivityGuardProps) {
  const { secondsLeft, isWarning } = useInactivity({ isAuthenticated, onLogout })

  return (
    <>
      {children}

      {isWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
          }}
        >
          <div
            style={{
              border: "2px solid #c27c2f",
              background: "#0d0c0b",
              padding: "48px 56px",
              textAlign: "center",
              color: "#c27c2f",
              fontFamily: "'Courier New', monospace",
              animation: "inactivity-pulse 1s infinite alternate",
              maxWidth: 420,
              width: "90%",
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "0.7rem",
                letterSpacing: "4px",
                color: "#7a6a55",
                textTransform: "uppercase",
              }}
            >
              SISTEMA DE SEGURIDAD — TERMINAL ACTIVA
            </p>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "1.35rem",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#fca311",
              }}
            >
              PÉRDIDA DE SEÑAL INMINENTE
            </h2>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: "0.75rem",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              DESCONEXIÓN DEL TERMINAL EN
            </p>
            <div
              style={{
                fontSize: "4.5rem",
                fontFamily: "'Courier New', monospace",
                margin: "16px 0",
                color: secondsLeft <= 10 ? "#ef4444" : "#c27c2f",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {secondsLeft}
              <span style={{ fontSize: "1.5rem", marginLeft: 6 }}>s</span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.7rem",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#7a6a55",
                animation: "inactivity-blink 0.8s infinite",
              }}
            >
              ▸ MUEVA EL CURSOR PARA ABORTAR ◂
            </p>
          </div>

          {/* Inline keyframes */}
          <style>{`
            @keyframes inactivity-pulse {
              from { box-shadow: 0 0 12px rgba(194,124,47,0.2); }
              to   { box-shadow: 0 0 36px rgba(194,124,47,0.55); }
            }
            @keyframes inactivity-blink {
              0%, 100% { opacity: 1; }
              50%       { opacity: 0.3; }
            }
          `}</style>
        </div>
      )}
    </>
  )
}

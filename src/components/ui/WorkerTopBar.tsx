import { LogOut } from "lucide-react"
import { useState, useEffect } from "react"

interface WorkerTopBarProps {
  campName?: string | number
  userName?: string | number
  onLogout?: () => void
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => n.toString().padStart(2, "0")
  return (
    <>
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
    </>
  )
}

export default function WorkerTopBar({ campName, userName, onLogout }: WorkerTopBarProps) {
  return (
    <header
      style={{
        height: 56,
        minHeight: 56,
        background: "#0e0d0b",
        borderBottom: "1px solid rgba(212,168,67,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* LEFT — wordmark + sector */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <span
          style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.82rem",
            color: "#d4a843",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          GESTIÓN DEL FIN
        </span>

        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.06)" }} />

        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            color: "rgba(212,168,67,0.55)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          CAMPAMENTO <span style={{ color: "#d4a843" }}>{campName ?? "—"}</span>
        </span>
      </div>

      {/* RIGHT — clock + user chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {/* Clock */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(212,168,67,0.42)",
            letterSpacing: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <LiveClock /> UTC
        </span>

        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* User chip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "5px 13px",
              background: "#1a1509",
              border: "1px solid rgba(212,168,67,0.28)",
            }}
          >
            {/* Small active dot */}
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#4c6351",
                display: "inline-block",
                boxShadow: "0 0 6px #4c6351",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "0.75rem",
                color: "#d4a843",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {String(userName ?? "—").toUpperCase()}
            </span>
          </div>
          <button type="button" onClick={onLogout} className="worker-topbar-logout">
            <LogOut size={12} />
            CERRAR SESIÓN
          </button>
        </div>
      </div>
    </header>
  )
}

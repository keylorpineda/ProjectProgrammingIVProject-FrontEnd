import { useState, useEffect } from "react"

interface WorkerTopBarProps {
  campName?: string | number
  userName?: string | number
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

export default function WorkerTopBar({ campName, userName }: WorkerTopBarProps) {
  return (
    <header
      style={{
        height: 56,
        minHeight: 56,
        background: "#0f0e0c",
        borderBottom: "1px solid #1a1917",
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
            color: "rgba(200,168,75,0.7)",
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
            color: "rgba(154,144,128,0.35)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          CAMPAMENTO <span style={{ color: "rgba(200,168,75,0.75)" }}>{campName ?? "—"}</span>
        </span>
      </div>

      {/* RIGHT — clock + user chip */}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {/* Clock */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(179,133,54,0.35)",
            letterSpacing: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <LiveClock /> UTC
        </span>

        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.05)" }} />

        {/* User chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "5px 13px",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(179,133,54,0.15)",
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
              color: "rgba(200,168,75,0.85)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {String(userName ?? "—").toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  )
}

import { LogOut } from "lucide-react"

interface WorkerTopBarProps {
  campName?: string | number
  activeLabel?: string
  onLogout?: () => void
}

export default function WorkerTopBar({ campName, activeLabel, onLogout }: WorkerTopBarProps) {
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
      <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.68rem",
            color: "rgba(212,168,67,0.55)",
            letterSpacing: 2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          CAMPAMENTO <span style={{ color: "#d4a843" }}>{campName ?? "-"}</span>
          <span style={{ color: "rgba(212,168,67,0.35)", padding: "0 10px" }}>›</span>
          <span style={{ color: "#d4a843" }}>{activeLabel ?? "TABLERO"}</span>
        </span>
      </div>

      <button type="button" onClick={onLogout} className="worker-topbar-logout">
        <LogOut size={12} />
        CERRAR SESIÓN
      </button>
    </header>
  )
}

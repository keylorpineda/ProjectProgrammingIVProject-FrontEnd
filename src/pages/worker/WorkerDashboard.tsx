import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import {
  useInventoryStatus,
  useInventoryMovements,
  useProfessionMetrics,
} from "@/features/worker/hooks/useWorkerAPI"
import "./WorkerViews.css"

const MOVEMENT_LABELS: Record<string, string> = {
  addition: "ENTRADA",
  removal: "SALIDA",
  adjustment: "AJUSTE",
  transfer: "TRASLADO",
  consumption: "CONSUMO",
  production: "PRODUCCION",
}

const formatTime = () => {
  const now = new Date()
  return now.toISOString().split("T")[1].split(".")[0] + "Z"
}

export default function WorkerDashboard() {
  const { user } = useAuth()
  const [time, setTime] = useState(formatTime())
  const { stats } = useInventoryStatus(user?.camp_id)
  const { metrics } = useProfessionMetrics()
  const { data: movements } = useInventoryMovements(user?.camp_id, 8)

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const criticalProfessions = metrics.filter((m) => m.status === "CRÍTICO").length
  const deficitProfessions = metrics.filter((m) => m.status === "DÉFICIT").length

  const cards = [
    {
      title: "RECURSOS OK",
      value: stats?.okItems ?? 0,
      label: "Ítems en niveles normales",
      pinClass: "wv-pin-green",
      rotate: -2,
    },
    {
      title: "BAJO MÍNIMO",
      value: stats?.lowItems ?? 0,
      label: "Ítems por debajo del umbral",
      pinClass: "wv-pin-amber",
      rotate: 1,
    },
    {
      title: "RECURSOS CRÍTICOS",
      value: stats?.criticalItems ?? 0,
      label: "Requieren atención inmediata",
      pinClass: "wv-pin-red",
      rotate: -1,
    },
    {
      title: "PROFESIONES DÉFICIT",
      value: criticalProfessions + deficitProfessions,
      label: `${criticalProfessions} críticas · ${deficitProfessions} en déficit`,
      pinClass: criticalProfessions > 0 ? "wv-pin-red" : "wv-pin-amber",
      rotate: 2,
    },
  ]

  return (
    <div className="wv-cork-board">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 32,
          background: "#161513",
          padding: "14px 22px",
          border: "1px solid #000",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-typewriter)",
            color: "var(--bg-paper)",
            fontSize: "1.1rem",
            letterSpacing: 3,
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          TABLERO DEL SECTOR — SECTOR {user?.camp_id ?? "?"}
        </h2>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.82rem",
            color: "var(--accent-emergency)",
            letterSpacing: 1,
          }}
        >
          {time}
        </span>
      </div>

      <div className="wv-cork-grid">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="wv-pinned"
            style={{ transform: `rotate(${card.rotate}deg)` }}
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: card.rotate, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: i * 0.12 }}
            whileHover={{ scale: 1.05, rotate: 0 }}
          >
            <div className={`wv-pin ${card.pinClass}`} />
            <h3 className="wv-card-title">{card.title}</h3>
            <div className="wv-big-number">{card.value}</div>
            <div className="wv-small-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {movements && movements.length > 0 ? (
        <motion.div
          className="wv-paper"
          style={{ marginTop: 32, padding: 24 }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="wv-section-title">ÚLTIMOS MOVIMIENTOS DE ALMACÉN</h3>
          <div className="wv-movement-list">
            {movements.slice(0, 8).map((m, i) => (
              <div key={m.id ?? i} className="wv-movement-row">
                <span className="wv-mv-type">
                  {MOVEMENT_LABELS[m.type] ?? m.type?.toUpperCase() ?? "MOV"}
                </span>
                <span className="wv-mv-resource">
                  {m.resource?.name ?? `Recurso #${m.resource_id}`}
                </span>
                <span className="wv-mv-qty">
                  {m.quantity} {m.resource?.unit ?? ""}
                </span>
                <span className="wv-mv-date">{m.date ? String(m.date).split("T")[0] : "N/D"}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

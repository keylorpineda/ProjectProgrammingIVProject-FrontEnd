import { motion } from "framer-motion"
import { useEffect, useState } from "react"

import {
  useInventoryStatus,
  useInventoryMovements,
  useProfessionMetrics,
  useDailyBalance,
  useMyBadges,
  useCamp,
} from "@/features/worker/hooks/useWorkerAPI"
import { useAuth } from "@/pages/Admin/context/AuthContext"
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

function BalanceBar({
  label,
  production,
  consumption,
}: {
  label: string
  production: number
  consumption: number
}) {
  const max = Math.max(production, consumption, 1)
  const prodPct = Math.min((production / max) * 100, 100)
  const consPct = Math.min((consumption / max) * 100, 100)
  const net = production - consumption
  const netPositive = net >= 0

  return (
    <div className="wv-balance-bar-row">
      <div className="wv-balance-label">{label}</div>
      <div className="wv-balance-bars">
        <div className="wv-balance-track-label">PROD.</div>
        <div className="wv-balance-track">
          <motion.div
            className="wv-balance-fill wv-balance-prod"
            initial={{ width: 0 }}
            animate={{ width: `${prodPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="wv-balance-number">{production}</span>
      </div>
      <div className="wv-balance-bars">
        <div className="wv-balance-track-label">CONS.</div>
        <div className="wv-balance-track">
          <motion.div
            className="wv-balance-fill wv-balance-cons"
            initial={{ width: 0 }}
            animate={{ width: `${consPct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
        <span className="wv-balance-number">{consumption}</span>
      </div>
      <div
        className="wv-balance-net"
        style={{ color: netPositive ? "var(--accent-approved)" : "var(--accent-critical)" }}
      >
        {netPositive ? "+" : ""}
        {net}
      </div>
    </div>
  )
}

export default function WorkerDashboard() {
  const { user } = useAuth()
  const [time, setTime] = useState(formatTime())
  const { stats } = useInventoryStatus(user?.camp_id)
  const { metrics } = useProfessionMetrics()
  const { data: movements } = useInventoryMovements(user?.camp_id, 8)
  const { data: balance } = useDailyBalance(user?.camp_id)
  const { data: badges } = useMyBadges()
  const { data: campData } = useCamp(user?.camp_id)
  const campName = campData?.camp?.name ?? `CAMPAMENTO #${user?.camp_id ?? "?"}`

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const criticalProfessions = metrics.filter((m) => m.status === "CRÍTICO").length
  const deficitProfessions = metrics.filter((m) => m.status === "DÉFICIT").length
  const badgeCount = badges?.length ?? 0

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
      rotate: 1.5,
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
    {
      title: "MIS INSIGNIAS",
      value: badgeCount,
      label: badgeCount === 0 ? "Sin insignias aún" : "Insignias ganadas",
      pinClass: "wv-pin-gold",
      rotate: -0.5,
    },
  ]

  return (
    <div className="wv-cork-board">
      {/* Header bar */}
      <div className="wv-board-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="wv-board-dot wv-board-dot-green" />
          <h2 className="wv-board-title">TABLERO — {campName}</h2>
        </div>
        <span className="wv-board-time">{time}</span>
      </div>

      {/* Pinned stat cards */}
      <div className="wv-cork-grid">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            className="wv-pinned"
            style={{ transform: `rotate(${card.rotate}deg)` }}
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: card.rotate, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: i * 0.1 }}
            whileHover={{ scale: 1.06, rotate: 0 }}
          >
            <div className={`wv-pin ${card.pinClass}`} />
            <h3 className="wv-card-title">{card.title}</h3>
            <div className="wv-big-number">{card.value}</div>
            <div className="wv-small-label">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── SECTOR BALANCE ────────────────────────────────────── */}
      {balance ? (
        <motion.div
          className="wv-paper"
          style={{ marginTop: 32, padding: 24 }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, type: "spring", stiffness: 100 }}
        >
          <div className="wv-section-title-row">
            <h3 className="wv-section-title" style={{ marginBottom: 0 }}>
              BALANCE DIARIO DEL SECTOR
            </h3>
            <span className="wv-section-count">{balance.persons} PERSONAS EN OPERACIÓN</span>
          </div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <BalanceBar
              label="ALIMENTOS"
              production={balance.production.food}
              consumption={balance.consumption.food}
            />
            <BalanceBar
              label="AGUA"
              production={balance.production.water}
              consumption={balance.consumption.water}
            />
          </div>

          <div className="wv-balance-summary">
            <div
              className="wv-balance-summary-item"
              style={{
                color:
                  balance.balance.food >= 0 ? "var(--accent-approved)" : "var(--accent-critical)",
              }}
            >
              COMIDA NET:{" "}
              <strong>
                {balance.balance.food >= 0 ? "+" : ""}
                {balance.balance.food}
              </strong>
            </div>
            <div
              className="wv-balance-summary-item"
              style={{
                color:
                  balance.balance.water >= 0 ? "var(--accent-approved)" : "var(--accent-critical)",
              }}
            >
              AGUA NET:{" "}
              <strong>
                {balance.balance.water >= 0 ? "+" : ""}
                {balance.balance.water}
              </strong>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* ── RECENT MOVEMENTS ──────────────────────────────────── */}
      {movements && movements.length > 0 ? (
        <motion.div
          className="wv-paper"
          style={{ marginTop: 24, padding: 24 }}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
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
                  {m.quantity > 0 ? "+" : ""}
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

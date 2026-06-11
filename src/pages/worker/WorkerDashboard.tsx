import { motion } from "framer-motion"
import { useEffect, useState } from "react"

import { CorkBoard } from "@/components/ui/CorkBoard"
import { PinnedCard } from "@/components/ui/PinnedCard"
import {
  useInventoryStatus,
  useProfessionMetrics,
  useDailyBalance,
  useMyBadges,
  useCamp,
} from "@/features/worker/hooks/useWorkerAPI"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import "./WorkerViews.css"

const formatTime = () => {
  const now = new Date()
  return now.toISOString().split("T")[1].split(".")[0] + "Z"
}

const normalizeStatus = (status: string) =>
  status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()

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
  const { data: balance } = useDailyBalance(user?.camp_id)
  const { data: badges } = useMyBadges()
  const { data: campData } = useCamp(user?.camp_id)
  const campName = campData?.camp?.name ?? `CAMPAMENTO #${user?.camp_id ?? "?"}`

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const criticalProfessions = metrics.filter((m) => normalizeStatus(m.status) === "CRITICO").length
  const deficitProfessions = metrics.filter((m) => normalizeStatus(m.status) === "DEFICIT").length
  const badgeCount = badges?.length ?? 0

  const cards = [
    {
      title: "RECURSOS OK",
      value: stats?.okItems ?? 0,
      label: "Items en niveles normales",
      pinClass: "wv-pin-green",
      rotate: -2,
    },
    {
      title: "BAJO MINIMO",
      value: stats?.lowItems ?? 0,
      label: "Items por debajo del umbral",
      pinClass: "wv-pin-amber",
      rotate: 1.5,
    },
    {
      title: "RECURSOS CRITICOS",
      value: stats?.criticalItems ?? 0,
      label: "Requieren atencion inmediata",
      pinClass: "wv-pin-red",
      rotate: -1,
    },
    {
      title: "PROFESIONES DEFICIT",
      value: criticalProfessions + deficitProfessions,
      label: `${criticalProfessions} criticas / ${deficitProfessions} en deficit`,
      pinClass: criticalProfessions > 0 ? "wv-pin-red" : "wv-pin-amber",
      rotate: 2,
    },
    {
      title: "MIS INSIGNIAS",
      value: badgeCount,
      label: badgeCount === 0 ? "Sin insignias aun" : "Insignias ganadas",
      pinClass: "wv-pin-gold",
      rotate: -0.5,
    },
  ]

  return (
    <CorkBoard
      title={`TABLERO - ${campName}`}
      rightElement={<span className="wv-board-time">{time}</span>}
    >
      <div className="wv-cork-grid">
        {cards.map((card, i) => (
          <PinnedCard
            key={card.title}
            animated
            title={card.title}
            value={card.value}
            label={card.label}
            pinColor={card.pinClass}
            rotate={card.rotate}
            initial={{ scale: 0, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: card.rotate, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, delay: i * 0.1 }}
          />
        ))}
      </div>

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
    </CorkBoard>
  )
}

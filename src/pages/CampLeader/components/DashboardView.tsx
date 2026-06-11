import { motion } from "framer-motion"
import { User } from "lucide-react"
import { useEffect, useState } from "react"

import type {
  CampBalance,
  CampStatistics,
  Exploration,
  Inventory,
  InventoryMovement,
  Transfer,
} from "../types"

import { CorkBoard } from "@/components/ui/CorkBoard"
import { PinnedCard } from "@/components/ui/PinnedCard"

const formatTime = () => {
  const now = new Date()
  return now.toISOString().split("T")[1].split(".")[0] + "Z"
}

interface DashboardViewProps {
  explorations: Exploration[]
  transfers: Transfer[]
  inventory: Inventory[]
  balances: CampBalance[]
  movements: InventoryMovement[]
  statistics: CampStatistics
  onNavigate: (tab: string) => void
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

function getRankInfo(score: number) {
  if (score >= 900)
    return {
      label: "LEYENDA DEL PÁRAMO",
      color: "#fca311",
      nextThreshold: null,
      prevThreshold: 900,
    }
  if (score >= 600)
    return { label: "COMANDANTE", color: "#c27c2f", nextThreshold: 900, prevThreshold: 600 }
  if (score >= 300)
    return { label: "VETERANO", color: "#ab9e8b", nextThreshold: 600, prevThreshold: 300 }
  if (score >= 100)
    return { label: "EXPLORADOR", color: "#3b7a5a", nextThreshold: 300, prevThreshold: 100 }
  return { label: "RECLUTA", color: "#71717a", nextThreshold: 100, prevThreshold: 0 }
}

function cleanDesc(desc: string): string {
  return desc.replace(/\s*\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/, "").trim()
}

export default function DashboardView({
  explorations,
  transfers,
  inventory,
  balances,
  movements,
  statistics,
  onNavigate,
}: DashboardViewProps) {
  const [time, setTime] = useState(formatTime())

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeExplorations = explorations.filter((e) => e.status === "in_progress")
  const pendingTransfers = transfers.filter((t) => t.status === "pending")

  const criticalStocks = inventory.filter(
    (i) => i.alert_active && (i.resource.category === "food" || i.resource.category === "water"),
  )

  const resourceNameMap = new Map(inventory.map((inv) => [inv.resource_id, inv.resource.name]))

  const rank = getRankInfo(statistics.survival_score)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, type: "spring" as const, stiffness: 100 },
    },
  }

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 140 } },
  }

  return (
    <CorkBoard
      animated
      className="flex flex-col gap-5 worker-layout"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      title="TABLERO DE MANDO - RESUMEN OPERATIVO"
      rightElement={<span className="wv-board-time">{time}</span>}
    >
      {/* CUATRO MÉTRICAS */}
      <div className="wv-cork-grid">
        {/* Card 1: Exploraciones */}
        <PinnedCard
          animated
          variants={itemVariants}
          onClick={() => onNavigate("explorations")}
          title="EQUIPOS EN CAMPO"
          value={activeExplorations.length}
          label="EQUIPOS EN ZONA MUERTA"
          pinColor="amber"
          rotate={-1.5}
        />

        {/* Card 2: Traslados */}
        <PinnedCard
          animated
          variants={itemVariants}
          onClick={() => onNavigate("transfers")}
          title="CONVOYES PENDIENTES"
          value={pendingTransfers.length}
          label="TRASLADOS EN ESPERA"
          pinColor="green"
          rotate={2}
        />

        {/* Card 3: Alertas de bodega */}
        <PinnedCard
          animated
          variants={itemVariants}
          onClick={() => onNavigate("inventory")}
          title="ALERTAS DE BODEGA"
          pinColor={criticalStocks.length > 0 ? "red" : "green"}
          rotate={-1}
        >
          {criticalStocks.length > 0 ? (
            <>
              <div className="wv-big-number" style={{ color: "var(--accent-critical)" }}>
                {criticalStocks.length}
              </div>
              <div className="wv-small-label" style={{ color: "var(--accent-critical)" }}>
                RECURSOS BAJO MÍNIMO
              </div>
            </>
          ) : (
            <>
              <div className="wv-big-number" style={{ color: "var(--accent-approved)" }}>
                OK
              </div>
              <div className="wv-small-label">RACIONES ESTABLES</div>
            </>
          )}
        </PinnedCard>

        {/* Card 4: Puntuación */}
        <PinnedCard
          animated
          variants={itemVariants}
          onClick={() => onNavigate("profile")}
          title={`PUNTUACIÓN: ${rank.label}`}
          pinColor="gold"
          rotate={1}
        >
          <div className="wv-big-number" style={{ color: rank.color }}>
            {statistics.survival_score}
          </div>
          <div className="wv-small-label">{statistics.explorations_completed} EXPEDICIONES</div>
        </PinnedCard>
      </div>

      {/* EXCURSIONISTAS ACTIVOS */}
      <motion.div variants={itemVariants} className="wv-paper p-6">
        <div className="wv-section-title-row">
          <h3 className="wv-section-title" style={{ marginBottom: 0 }}>
            EXCURSIONISTAS EN ZONA MUERTA
          </h3>
          <span className="text-xl select-none">🧭</span>
        </div>

        {activeExplorations.length === 0 ? (
          <div className="border-2 border-dashed border-black/20 text-center py-10">
            <p className="font-mono text-xs text-black/40 uppercase font-bold">
              NINGÚN EQUIPO EN OPERACIÓN EXTERIOR
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {activeExplorations.map((exp) => {
              const crewNames = exp.explorationPersons.map((p) => p.person.first_name).join(", ")
              return (
                <div
                  key={exp.id}
                  className="bg-black/5 border border-black/15 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
                  style={{ borderLeft: "4px solid #c27c2f" }}
                >
                  <div className="pl-1">
                    <span className="font-mono text-xs text-[#c27c2f] font-bold tracking-widest block">
                      MISIÓN #{exp.id} &bull; {exp.departure_date.split("T")[0]}
                    </span>
                    <h4 className="font-typewriter text-sm text-black font-bold uppercase mt-0.5">
                      {exp.name}
                    </h4>
                    <p className="font-mono text-xs text-black/60 mt-1 uppercase">
                      DESTINO: {cleanDesc(exp.destination_description)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <User className="w-3.5 h-3.5 text-black/40 shrink-0" />
                      <span className="font-mono text-xs text-black/60">
                        CONTINGENTE: <span className="font-bold text-black">{crewNames}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <span className="font-typewriter text-sm font-bold text-[#c27c2f] block">
                      {exp.estimated_days}D (+{exp.grace_days}G)
                    </span>
                    <span className="font-mono text-[10px] text-black/50 uppercase block mt-1">
                      RETORNO ESTIMADO
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* BALANCE DIARIO */}
      <motion.div variants={itemVariants} className="wv-paper p-6">
        <div className="wv-section-title-row">
          <h3 className="wv-section-title" style={{ marginBottom: 0 }}>
            BALANCE DIARIO DEL SECTOR
          </h3>
          <span className="wv-section-count">{activeExplorations.length} EQUIPOS EN OPERACIÓN</span>
        </div>

        {balances.length === 0 ? (
          <p className="font-mono text-xs text-black/40 text-center py-6 uppercase font-bold">
            SIN DATOS DE BALANCE
          </p>
        ) : (
          <>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {balances.map((bal) => (
                <BalanceBar
                  key={bal.resource_id}
                  label={bal.resource_name.toUpperCase()}
                  production={bal.production}
                  consumption={bal.consumption}
                />
              ))}
            </div>
            <div className="wv-balance-summary">
              {balances.map((bal) => (
                <div
                  key={`summary-${bal.resource_id}`}
                  className="wv-balance-summary-item"
                  style={{
                    color: bal.net >= 0 ? "var(--accent-approved)" : "var(--accent-critical)",
                  }}
                >
                  {bal.resource_name.toUpperCase()} NET:{" "}
                  <strong>
                    {bal.net >= 0 ? "+" : ""}
                    {bal.net}
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* HISTORIAL DE MOVIMIENTOS */}
      <motion.div variants={itemVariants} className="wv-paper p-6">
        <div className="wv-section-title-row">
          <h3 className="wv-section-title" style={{ marginBottom: 0 }}>
            HISTORIAL DE LOGS DE RESERVA
          </h3>
          <span className="text-xl select-none">📋</span>
        </div>

        {movements.length === 0 ? (
          <p className="font-mono text-xs text-black/40 text-center py-6 uppercase font-bold">
            SIN MOVIMIENTOS REGISTRADOS
          </p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black/15">
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">FECHA</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">LOG ID</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">RECURSO</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">CANTIDAD</th>
                  <th className="pb-2 pr-4 text-black/50 uppercase font-bold">TIPO</th>
                  <th className="pb-2 text-black/50 uppercase font-bold">NOTAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {movements.slice(0, 5).map((mov) => {
                  const isAddition = mov.quantity > 0
                  const resourceName =
                    resourceNameMap.get(mov.resource_id) ?? `RECURSO #${mov.resource_id}`
                  return (
                    <tr key={mov.id} className="text-black/70 hover:bg-black/5">
                      <td className="py-2.5 pr-4 text-black/50">
                        {mov.created_at.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-2.5 pr-4 font-bold text-[#c27c2f]">#L-{mov.id}</td>
                      <td className="py-2.5 pr-4 font-bold uppercase text-black">{resourceName}</td>
                      <td
                        className={`py-2.5 pr-4 font-bold ${isAddition ? "text-[#4c6351]" : "text-[#9c2720]"}`}
                      >
                        {isAddition ? `+${mov.quantity}` : `${mov.quantity}`}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`px-2 py-0.5 border border-black/20 uppercase font-bold ${
                            isAddition
                              ? "bg-[#4c6351]/10 text-[#4c6351]"
                              : "bg-[#9c2720]/10 text-[#9c2720]"
                          }`}
                        >
                          {mov.type.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 text-black/50">{mov.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </CorkBoard>
  )
}

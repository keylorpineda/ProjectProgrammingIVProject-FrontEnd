import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { getPendingAdmissions } from "@/features/admissions/services/admissions.service"
import type { CriticalResource } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import { useQuery } from "@tanstack/react-query"
import "./Dashboard.css"

const formatTime = () => {
  const now = new Date()
  return `${now.toISOString().split("T")[1].split(".")[0]}Z`
}

const formatCriticalResource = (resource: CriticalResource) =>
  `${resource.resource_name}: ${resource.current_quantity}/${resource.minimum_required}`

export default function Dashboard() {
  const { activeCampId, camps } = useCamp()
  const [time, setTime] = useState<string>(formatTime())

  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ["adminDashboard", activeCampId],
    queryFn: async () => {
      if (!activeCampId) return null
      const [metricsResponse, admissions] = await Promise.all([
        getDashboardMetrics(activeCampId),
        getPendingAdmissions({ campId: activeCampId, page: 1, limit: 100 }),
      ])
      return {
        metrics: metricsResponse,
        pendingAdmissions: admissions?.total ?? admissions?.data?.length ?? 0,
      }
    },
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
  })

  const metrics = data?.metrics || null
  const pendingAdmissions = data?.pendingAdmissions || 0
  const error = queryError ? "No se pudo cargar el tablero de situación." : ""

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeCampName = camps.find((camp) => camp.id === activeCampId)?.name ?? "CAMPAMENTO ACTIVO"

  const cards = useMemo(() => {
    const peopleGroups = metrics
      ? [
          {
            name: activeCampName.toUpperCase(),
            count: metrics.camp.total_people,
            capacity: metrics.camp.camp_capacity,
          },
        ]
      : []

    const criticalResources = metrics?.warehouse?.critical_resources ?? []
    const resourceAlerts = criticalResources.length
      ? criticalResources.map(formatCriticalResource)
      : ["OK"]

    return [
      {
        title: `POBLACIÓN — ${activeCampName.toUpperCase()}`,
        content: (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {peopleGroups.map((group) => (
              <li key={group.name} style={{ marginBottom: "8px" }}>
                <strong style={{ fontFamily: "var(--font-mono)" }}>{group.name}</strong>
                <br />
                Ocupación: {group.count} / {group.capacity}
              </li>
            ))}
          </ul>
        ),
        className: "",
      },
      {
        title: "ALERTAS RECURSOS",
        content: (
          <ul>
            {resourceAlerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        ),
        className: "warning-card",
        pinClass: "red-pin",
      },
      {
        title: "SOLICITUDES ADMISIÓN",
        content: (
          <div className="flex-row">
            <span className="big-number" style={{ fontSize: "3rem", color: "var(--accent-tape)" }}>
              {pendingAdmissions}
            </span>
            <span className="small-text">PENDIENTES DE REVISIÓN</span>
          </div>
        ),
        className: "",
      },
      {
        title: "MOVIMIENTOS ACORDADOS",
        content: (
          <div className="flex-row">
            <span className="big-number" style={{ fontSize: "3rem" }}>
              {metrics?.transfers.pending_transfers ?? 0}
            </span>
            <span className="small-text">TRANSFERENCIAS PENDIENTES</span>
          </div>
        ),
        className: "",
      },
      {
        title: "CUERPOS EXPLORACIÓN",
        content: (
          <p>{metrics ? `${metrics.camp.active_explorations} Equipos en zona muerta` : "-"}</p>
        ),
        className: "",
      },
    ]
  }, [metrics, pendingAdmissions, activeCampName])

  return (
    <motion.div
      className="dashboard-board"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="board-header">
        <h2>TABLERO DE SITUACIÓN</h2>
        <div className="server-time">HORA DEL SISTEMA: {time}</div>
      </div>

      {error ? (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            padding: "10px",
            color: "var(--accent-critical)",
          }}
        >
          {error}
        </div>
      ) : null}

      {queryLoading && !data ? (
        <div style={{ fontFamily: "var(--font-mono)", opacity: 0.7 }}>CARGANDO...</div>
      ) : (
        <div className="cork-grid">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              className={`pinned-card ${card.className}`}
              initial={{ scale: 0, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: index % 2 === 0 ? -1 : 2, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, delay: index * 0.15 }}
              whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
            >
              <div className={`pin ${card.pinClass ?? ""}`}></div>
              <h3>{card.title}</h3>
              {card.content}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

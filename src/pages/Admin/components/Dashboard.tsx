import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"
import { getPendingAdmissions } from "@/features/admissions/services/admissions.service"
import type { CriticalResource, DashboardMetrics } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./Dashboard.css"

const formatTime = () => {
  const now = new Date()
  return `${now.toISOString().split("T")[1].split(".")[0]}Z`
}

const formatCriticalResource = (resource: CriticalResource) =>
  `${resource.resourceName}: ${resource.currentQuantity}/${resource.minimumRequired}`

export default function Dashboard() {
  const { activeCampId } = useCamp()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [pendingAdmissions, setPendingAdmissions] = useState(0)
  const [time, setTime] = useState<string>(formatTime())
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatTime()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true

    const loadMetrics = async () => {
      setIsLoading(true)
      setError("")
      try {
        const [metricsResponse, admissions] = await Promise.all([
          getDashboardMetrics(activeCampId),
          getPendingAdmissions({ campId: activeCampId, page: 1, limit: 100 }),
        ])

        if (!isMounted) return
        setMetrics(metricsResponse)
        setPendingAdmissions(admissions.length)
      } catch {
        if (!isMounted) return
        setError("No se pudo cargar el tablero de situación.")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadMetrics()

    return () => {
      isMounted = false
    }
  }, [activeCampId])

  const cards = useMemo(() => {
    const peopleGroups = metrics
      ? [
          {
            name: metrics.campId?.toUpperCase() ?? "CAMPAMENTO",
            count: metrics.camp.totalPeople,
            capacity: metrics.camp.campCapacity,
          },
        ]
      : []

    const criticalResources = metrics?.warehouse.criticalResources ?? []
    const resourceAlerts = criticalResources.length
      ? criticalResources.map(formatCriticalResource)
      : ["OK"]

    return [
      {
        title: "POBLACIÓN POR CAMPAMENTO",
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
              {metrics?.transfers.pendingTransfers ?? 0}
            </span>
            <span className="small-text">TRANSFERENCIAS PENDIENTES</span>
          </div>
        ),
        className: "",
      },
      {
        title: "CUERPOS EXPLORACIÓN",
        content: <p>{metrics ? `${metrics.camp.activeExplorations} Equipos en zona muerta` : "-"}</p>,
        className: "",
      },
    ]
  }, [metrics, pendingAdmissions])

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
        <div style={{ fontFamily: "var(--font-mono)", padding: "10px", color: "var(--accent-critical)" }}>
          {error}
        </div>
      ) : null}

      {isLoading ? (
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

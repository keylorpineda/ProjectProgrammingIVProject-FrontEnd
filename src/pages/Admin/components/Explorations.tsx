import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { getExplorations } from "@/features/explorations/services/explorations.service"
import type { Exploration } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./Explorations.css"

const formatDate = (value: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

const formatStatus = (status?: string) => {
  const normalized = status?.toLowerCase() ?? ""
  if (normalized.includes("complete")) return "COMPLETADO"
  if (normalized.includes("progress")) return "EN CURSO"
  return status ? status.toUpperCase() : "N/D"
}

export default function Explorations() {
  const { activeCampId } = useCamp()
  const [explorations, setExplorations] = useState<Exploration[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true

    const loadExplorations = async () => {
      setError("")
      try {
        const response = await getExplorations({ campId: activeCampId })
        if (!isMounted) return
        setExplorations(response)
      } catch {
        if (!isMounted) return
        setError("No se pudieron cargar las exploraciones.")
      }
    }

    void loadExplorations()

    return () => {
      isMounted = false
    }
  }, [activeCampId])

  const logs = useMemo(
    () =>
      explorations.map((exploration) => {
        const group = exploration.persons?.map((person) => person.person?.name ?? person.person_id) ?? []
        return {
          id: exploration.id,
          title: exploration.name,
          date: formatDate(exploration.departure_date),
          status: formatStatus(exploration.status),
          duration: `${exploration.estimated_days} DÍAS`,
          group,
          resources: "Pendiente",
          entry: exploration.notes ?? exploration.destination_description,
        }
      }),
    [explorations],
  )

  return (
    <div className="generic-container">
      <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        BITÁCORAS DE CAMPO
      </motion.h2>

      {error ? (
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-critical)" }}>{error}</div>
      ) : null}

      <div className="journals-container">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            className="field-journal-page"
            initial={{ scale: 0.8, opacity: 0, rotate: -15, y: 100 }}
            animate={{ scale: 1, opacity: 1, rotate: index % 2 === 0 ? -1 : 2, y: 0 }}
            transition={{ type: "spring", stiffness: 80, delay: index * 0.2 }}
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
          >
            <div className="journal-holes">
              <div className="hole"></div>
              <div className="hole"></div>
              <div className="hole"></div>
              <div className="hole"></div>
            </div>
            <div className="journal-content">
              <h3 style={{ borderBottom: "1px solid #000", paddingBottom: "5px", color: "#000" }}>
                {log.title}
                <span
                  style={{
                    float: "right",
                    fontSize: "0.8em",
                    color: log.status === "COMPLETADO" ? "#000" : "var(--accent-warning-deep)",
                  }}
                >
                  [{log.status}]
                </span>
              </h3>
              <div className="j-date" style={{ color: "#000", fontFamily: "var(--font-mono)" }}>
                DÍA/MES/AÑO: {log.date} | {log.duration}
              </div>
              <div style={{ margin: "10px 0", fontSize: "0.9em", fontFamily: "var(--font-mono)", color: "#000" }}>
                <strong>GRUPO:</strong> {log.group.join(", ") || "N/D"}
                <br />
                <strong>RECURSOS EXTRAÍDOS:</strong> {log.resources}
              </div>
              <p style={{ marginTop: "10px", color: "#000" }}>{log.entry}</p>
              <div className="signature-line">
                <span>FIRMA LÍDER DE ESCUADRÓN</span>
                <div className="sign-marker">{log.group[0] ?? "-"}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

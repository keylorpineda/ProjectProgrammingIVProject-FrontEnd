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
          status: exploration.status?.toUpperCase() ?? "N/D",
          duration: `${exploration.estimated_days} DIAS`,
          group,
          entry: exploration.notes ?? exploration.destination_description,
        }
      }),
    [explorations],
  )

  return (
    <div className="generic-container">
      <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        BITACORAS (FIELD JOURNALS)
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
              <h3 style={{ borderBottom: "1px solid var(--ink)", paddingBottom: "5px" }}>
                {log.title}
                <span
                  style={{
                    float: "right",
                    fontSize: "0.8em",
                    color: log.status === "COMPLETED" ? "var(--ink)" : "var(--accent-warning-deep)",
                  }}
                >
                  [{log.status}]
                </span>
              </h3>
              <div className="j-date">
                DIA/MES/ANIO: {log.date} | {log.duration}
              </div>
              <div style={{ margin: "10px 0", fontSize: "0.9em", fontFamily: "var(--font-mono)" }}>
                <strong>GRUPO:</strong> {log.group.length > 0 ? log.group.join(", ") : "N/D"}
              </div>
              <p style={{ marginTop: "10px" }}>{log.entry}</p>
              <div className="signature-line">
                <span>FIRMA LIDER DE ESCUADRON</span>
                <div className="sign-marker">{log.group[0] ?? "-"}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

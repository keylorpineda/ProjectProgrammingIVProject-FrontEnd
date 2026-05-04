import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { getCamps } from "@/features/camps/services/camps.service"
import type { Camp } from "@/types/api.types"
import "./Camps.css"

export default function Camps() {
  const [camps, setCamps] = useState<Camp[]>([])
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    const loadCamps = async () => {
      setError("")
      try {
        const response = await getCamps()
        if (!isMounted) return
        setCamps(response)
      } catch {
        if (!isMounted) return
        setError("No se pudo cargar la red de campamentos.")
      }
    }

    void loadCamps()

    return () => {
      isMounted = false
    }
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.2 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } },
  }

  return (
    <div className="generic-container">
      <h2>RED DE CAMPAMENTOS AUTORIZADOS</h2>

      {error ? (
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-critical)" }}>{error}</div>
      ) : null}

      <motion.div className="camps-grid" variants={containerVariants} initial="hidden" animate="show">
        {camps.map((camp) => {
          const statusLabel = camp.is_active ? "ONLINE" : "OFFLINE"
          const statusClass = camp.is_active ? "online" : "radiated"

          return (
            <motion.div
              key={camp.id}
              className={`camp-card ${statusClass}`}
              variants={itemVariants}
              whileHover={{ y: -10, boxShadow: "10px 10px 0 rgba(0,0,0,0.5)", cursor: "pointer" }}
              onClick={() => setSelectedCamp(camp)}
            >
              <div className="c-status-indicator"></div>
              <h3>{camp.name}</h3>
              <div className="c-info">
                <span>
                  <span>UBICACION:</span> {camp.location ?? "N/D"}
                </span>
                <span>
                  <span>CAPACIDAD:</span> {camp.max_capacity ?? "N/D"}
                </span>
              </div>
              <div className="c-stamp">{statusLabel}</div>
            </motion.div>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {selectedCamp ? (
          <motion.div
            className="person-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCamp(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
            }}
          >
            <motion.div
              className="person-modal-content"
              initial={{ y: 50, rotateX: 20 }}
              animate={{ y: 0, rotateX: 0 }}
              exit={{ y: 50, rotateX: -20, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                padding: "40px",
                backgroundColor: "var(--bg-paper)",
                fontFamily: "var(--font-mono)",
                border: "2px solid var(--ink)",
                boxShadow: "10px 10px 0 #000",
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-typewriter)",
                  borderBottom: "2px solid var(--ink)",
                  paddingBottom: "10px",
                }}
              >
                DETALLES DEL CAMPAMENTO
              </h2>
              <p>
                <strong>NOMBRE:</strong> {selectedCamp.name}
              </p>
              <p>
                <strong>ESTADO:</strong> {selectedCamp.is_active ? "ONLINE" : "OFFLINE"}
              </p>
              <p>
                <strong>UBICACION:</strong> {selectedCamp.location ?? "N/D"}
              </p>
              <p>
                <strong>CAPACIDAD MAXIMA:</strong> {selectedCamp.max_capacity ?? "N/D"}
              </p>
              <div style={{ marginTop: "20px", textAlign: "right" }}>
                <button
                  onClick={() => setSelectedCamp(null)}
                  style={{ border: "1px solid var(--ink)", background: "transparent", padding: "5px 15px", cursor: "pointer" }}
                >
                  CERRAR CINTA CODIGO
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

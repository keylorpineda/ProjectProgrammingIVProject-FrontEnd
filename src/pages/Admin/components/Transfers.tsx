import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"
import type { IntercampRequest } from "@/types/api.types"
import { useCamp } from "../context/CampContext"
import "./Transfers.css"

const getStatusKey = (status: string) => status.toLowerCase().replace(/\s+/g, "_")

const getWatermark = (statusKey: string) => {
  switch (statusKey) {
    case "completed":
    case "approved":
      return "APPROVED"
    case "pending":
      return "WAITING"
    case "rejected":
      return "REJECTED"
    case "cancelled":
      return "CANCELLED"
    default:
      return "IN-TRANSIT"
  }
}

export default function Transfers() {
  const { activeCampId, camps } = useCamp()
  const [transfers, setTransfers] = useState<IntercampRequest[]>([])
  const [filterStatus, setFilterStatus] = useState("")
  const [filterCamp, setFilterCamp] = useState("")
  const [selectedTransfer, setSelectedTransfer] = useState<IntercampRequest | null>(null)
  const [error, setError] = useState("")

  const campById = useMemo(() => new Map(camps.map((camp) => [camp.id, camp.name])), [camps])

  useEffect(() => {
    if (!activeCampId) return
    let isMounted = true

    const loadTransfers = async () => {
      setError("")
      try {
        const response = await getCampTransfers(activeCampId)
        if (!isMounted) return
        setTransfers(response)
      } catch {
        if (!isMounted) return
        setError("No se pudieron cargar las transferencias.")
      }
    }

    void loadTransfers()

    return () => {
      isMounted = false
    }
  }, [activeCampId])

  const filteredTransfers = useMemo(() => {
    const statusFilter = filterStatus.trim().toLowerCase()
    const campFilter = filterCamp.trim().toLowerCase()

    return transfers.filter((transfer) => {
      const statusKey = getStatusKey(transfer.status)
      const originName = campById.get(transfer.camp_origin_id) ?? transfer.camp_origin_id
      const destinationName = campById.get(transfer.camp_destination_id) ?? transfer.camp_destination_id

      if (statusFilter && statusKey !== statusFilter) return false
      if (campFilter) {
        const originMatch = originName.toLowerCase().includes(campFilter)
        const destMatch = destinationName.toLowerCase().includes(campFilter)
        if (!originMatch && !destMatch) return false
      }

      return true
    })
  }, [transfers, filterStatus, filterCamp, campById])

  return (
    <div className="generic-container">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        MANIFIESTOS DE TRANSPORTE (PAPEL CARBON)
      </motion.h2>

      <div className="filters-bar" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <input
          className="vintage-input"
          placeholder="Estado (ej: pending)"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        />
        <input
          className="vintage-input"
          placeholder="Campamento origen/destino"
          value={filterCamp}
          onChange={(event) => setFilterCamp(event.target.value)}
        />
      </div>

      {error ? (
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-critical)" }}>{error}</div>
      ) : null}

      <motion.div
        className="transfers-grid"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { transition: { staggerChildren: 0.15 } },
        }}
      >
        {filteredTransfers.map((transfer) => {
          const statusKey = getStatusKey(transfer.status)
          const originName = campById.get(transfer.camp_origin_id) ?? transfer.camp_origin_id
          const destinationName = campById.get(transfer.camp_destination_id) ?? transfer.camp_destination_id

          return (
            <motion.div
              key={transfer.id}
              className="transfer-carbon-copy"
              variants={{
                hidden: { opacity: 0, scale: 0.95, y: 20 },
                show: { opacity: 1, scale: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02, x: 10, transition: { duration: 0.2 }, cursor: "pointer" }}
              onClick={() => setSelectedTransfer(transfer)}
            >
              <div className="t-header">
                VIAJE #{transfer.id}
                <span className={`t-status ${statusKey}`}>[{statusKey.toUpperCase()}]</span>
              </div>
              <div className="t-route">
                <span className="location">{originName}</span>
                <span className="arrow">➔</span>
                <span className="location">{destinationName}</span>
              </div>
              <div className="t-items">
                <strong>TIPO:</strong> {transfer.type}
              </div>
              {transfer.notes ? (
                <div className="t-items" style={{ opacity: 0.8 }}>
                  <strong>NOTAS:</strong> {transfer.notes}
                </div>
              ) : null}
              <div className="t-date">ESTADO ACTUAL: {transfer.status}</div>
              <div className="watermark-stamp">{getWatermark(statusKey)}</div>
            </motion.div>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {selectedTransfer ? (
          <motion.div
            className="person-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTransfer(null)}
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
                backgroundColor: "#e2ddc8",
                color: "#333",
                fontFamily: "var(--font-typewriter)",
                border: "1px solid #999",
                boxShadow: "5px 5px 0 rgba(0,0,0,0.5)",
                maxWidth: "500px",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  opacity: 0.5,
                }}
              >
                COPIA CARBON #1
              </div>
              <h2 style={{ borderBottom: "2px dotted #555", paddingBottom: "10px" }}>
                MANIFIESTO COMPLETO: {selectedTransfer.id}
              </h2>
              <p>
                <strong>ESTADO:</strong> {selectedTransfer.status}
              </p>
              <p>
                <strong>RUTA:</strong> {campById.get(selectedTransfer.camp_origin_id) ?? selectedTransfer.camp_origin_id} ➔
                {" "}
                {campById.get(selectedTransfer.camp_destination_id) ?? selectedTransfer.camp_destination_id}
              </p>
              <p>
                <strong>TIPO:</strong> {selectedTransfer.type}
              </p>
              {selectedTransfer.approval ? (
                <div style={{ marginTop: "20px", borderTop: "1px dashed #777", paddingTop: "10px" }}>
                  <p>
                    <strong>APROBACION:</strong> {selectedTransfer.approval.decision}
                  </p>
                  {selectedTransfer.approval.notes ? <p>{selectedTransfer.approval.notes}</p> : null}
                </div>
              ) : null}
              <div style={{ marginTop: "30px", textAlign: "right" }}>
                <button
                  onClick={() => setSelectedTransfer(null)}
                  style={{
                    border: "1px solid #333",
                    background: "transparent",
                    padding: "5px 15px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  DOBLAR PAGINA
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"
import { useCamp } from "../context/CampContext"
import "./Transfers.css"

type TransferView = {
  id: string
  status: string
  origin: string
  dest: string
  resources: string[]
  people: string[]
  date: string
}

const statusLabels: Record<string, string> = {
  pending: "PENDIENTE",
  approved: "COMPLETADO",
  completed: "COMPLETADO",
  rejected: "RECHAZADO",
  cancelled: "CANCELADO",
  in_transit: "EN TRÁNSITO",
}

const formatDate = (value?: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

export default function Transfers() {
  const { activeCampId, camps } = useCamp()
  const [transfers, setTransfers] = useState<TransferView[]>([])
  const [filterStatus, setFilterStatus] = useState("")
  const [filterCamp, setFilterCamp] = useState("")
  const [selectedTransfer, setSelectedTransfer] = useState<TransferView | null>(null)
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
        const mapped = response.map((transfer) => {
          const statusKey = transfer.status?.toLowerCase().replace(/\s+/g, "_")
          return {
            id: transfer.id,
            status: statusLabels[statusKey ?? ""] ?? transfer.status,
            origin: campById.get(transfer.camp_origin_id) ?? transfer.camp_origin_id,
            dest: campById.get(transfer.camp_destination_id) ?? transfer.camp_destination_id,
            resources: [transfer.type.toUpperCase()],
            people: [],
            date: formatDate(transfer.request_date),
          }
        })
        setTransfers(mapped)
      } catch {
        if (!isMounted) return
        setError("No se pudieron cargar las transferencias.")
      }
    }

    void loadTransfers()

    return () => {
      isMounted = false
    }
  }, [activeCampId, campById])

  const filteredTransfers = transfers.filter((transfer) => {
    if (filterStatus && transfer.status !== filterStatus) return false
    if (filterCamp && transfer.origin !== filterCamp && transfer.dest !== filterCamp) return false
    return true
  })

  return (
    <div className="generic-container">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        MANIFIESTOS DE TRANSPORTE (PAPEL CARBÓN)
      </motion.h2>

      <div className="filters-bar" style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <input
          className="vintage-input"
          placeholder="Estado de Ruta (ej: PENDING)"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        />
        <input
          className="vintage-input"
          placeholder="Campamento Origen/Destino"
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
        {filteredTransfers.map((transfer) => (
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
              <span
                className={`t-status ${
                  transfer.status === "EN TRÁNSITO"
                    ? "in_transit"
                    : transfer.status === "PENDIENTE"
                      ? "pending"
                      : "completed"
                }`}
              >
                [{transfer.status}]
              </span>
            </div>
            <div className="t-route">
              <span className="location">{transfer.origin}</span>
              <span className="arrow">➔</span>
              <span className="location">{transfer.dest}</span>
            </div>
            <div className="t-items">
              <strong>CARGA:</strong> {transfer.resources.join(", ")}
            </div>
            {transfer.people.length > 0 ? (
              <div className="t-items" style={{ opacity: 0.8 }}>
                <strong>PASAJEROS:</strong> {transfer.people.length}
              </div>
            ) : null}
            <div className="t-date">FECHA ASIGNADA: {transfer.date}</div>
            <div className="watermark-stamp">
              {transfer.status === "COMPLETADO"
                ? "APROBADO"
                : transfer.status === "PENDIENTE"
                  ? "EN ESPERA"
                  : "EN TRÁNSITO"}
            </div>
          </motion.div>
        ))}
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
              <div style={{ position: "absolute", top: 10, right: 10, fontFamily: "var(--font-mono)", fontSize: "0.8rem", opacity: 0.5 }}>
                COPIA CARBÓN #1
              </div>
              <h2 style={{ borderBottom: "2px dotted #555", paddingBottom: "10px" }}>
                MANIFIESTO COMPLETO: {selectedTransfer.id}
              </h2>
              <p>
                <strong>ESTADO:</strong> {selectedTransfer.status}
              </p>
              <p>
                <strong>RUTA:</strong> {selectedTransfer.origin} ➔ {selectedTransfer.dest}
              </p>
              <div style={{ marginTop: "20px", borderTop: "1px dashed #777", paddingTop: "10px" }}>
                <p>
                  <strong>RECURSOS ASIGNADOS:</strong>
                </p>
                <ul>
                  {selectedTransfer.resources.map((resource) => (
                    <li key={resource}>{resource}</li>
                  ))}
                </ul>
                <p>
                  <strong>PERSONAS AUTORIZADAS:</strong>
                </p>
                <ul>
                  {selectedTransfer.people.length > 0 ? (
                    selectedTransfer.people.map((person) => <li key={person}>{person}</li>)
                  ) : (
                    <li>NINGUNA</li>
                  )}
                </ul>
              </div>
              <div style={{ marginTop: "30px", textAlign: "right" }}>
                <button
                  onClick={() => setSelectedTransfer(null)}
                  style={{ border: "1px solid #333", background: "transparent", padding: "5px 15px", cursor: "pointer", fontFamily: "inherit" }}
                >
                  DOBLAR PÁGINA
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

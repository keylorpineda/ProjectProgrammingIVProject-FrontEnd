import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import { useCampExplorations, useCamp, useMyProfile } from "@/features/worker/hooks/useWorkerAPI"
import { ExplorationZoneMap } from "@/features/map-test/components/ExplorationZoneMap"
import "./WorkerViews.css"

type ExplorationStatus = "scheduled" | "in_progress" | "completed" | "cancelled"

interface ExplorationPerson {
  person_id: number
  is_leader: boolean
  person: { first_name: string; last_name: string }
}

interface ExplorationResource {
  resource_id: number
  quantity: number
  resource: { name: string; unit: string }
}

interface Exploration {
  id: number
  name: string
  destination_description: string
  departure_date: string
  estimated_days: number
  grace_days: number
  real_return_date?: string
  status: ExplorationStatus
  notes?: string
  explorationPersons: ExplorationPerson[]
  explorationResources: ExplorationResource[]
}

const STATUS_MAP: Record<ExplorationStatus, { label: string; cls: string }> = {
  scheduled:   { label: "PROGRAMADA",  cls: "wv-badge-warning" },
  in_progress: { label: "EN CURSO",    cls: "wv-badge-critical" },
  completed:   { label: "COMPLETADA",  cls: "wv-badge-ok" },
  cancelled:   { label: "CANCELADA",   cls: "wv-badge-dim" },
}

// Extract coordinates from description if present (format: [lat, lng])
function parseCoords(desc: string): [number, number] | null {
  const match = desc.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/)
  if (!match) return null
  return [parseFloat(match[1]), parseFloat(match[2])]
}

function cleanDesc(desc: string): string {
  return desc.replace(/\s*\[-?\d+\.\d+,\s*-?\d+\.\d+\]/, "").trim()
}

export default function WorkerExpeditions() {
  const { user } = useAuth()
  const { data: campData } = useCamp(user?.camp_id)
  const { data: profile } = useMyProfile()
  const { data: rawExplorations, isLoading } = useCampExplorations(user?.camp_id)

  const campName = campData?.camp?.name ?? `CAMPAMENTO #${user?.camp_id ?? "?"}`
  const myPersonId = profile?.person?.id ?? null

  const explorations = (rawExplorations ?? []) as Exploration[]

  // Separate into active vs history
  const active = explorations.filter((e) =>
    e.status === "in_progress" || e.status === "scheduled",
  )
  const history = explorations.filter((e) =>
    e.status === "completed" || e.status === "cancelled",
  )

  const isMember = (exp: Exploration) =>
    myPersonId != null && exp.explorationPersons.some((ep) => ep.person_id === myPersonId)

  return (
    <div className="wv-page">
      <div className="wv-page-header">
        <h2>EXPEDICIONES DEL SECTOR</h2>
        <span className="wv-breadcrumb">{campName}</span>
      </div>

      {/* ── ACTIVE / SCHEDULED ─────────────────────────────────── */}
      <motion.div
        className="wv-paper"
        style={{ padding: 24, marginBottom: 28 }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <h3 className="wv-section-title">MISIONES ACTIVAS Y PROGRAMADAS</h3>

        {isLoading ? (
          <div className="wv-empty">CARGANDO DATOS DE EXPEDICIONES...</div>
        ) : active.length === 0 ? (
          <div className="wv-empty">SIN EXPEDICIONES EN CURSO</div>
        ) : (
          <div className="wv-expedition-grid">
            <AnimatePresence>
              {active.map((exp, i) => {
                const s = STATUS_MAP[exp.status] ?? STATUS_MAP.scheduled
                const coords = parseCoords(exp.destination_description)
                const dest = cleanDesc(exp.destination_description)
                const imIncluded = isMember(exp)
                const leader = exp.explorationPersons.find((ep) => ep.is_leader)

                return (
                  <motion.div
                    key={exp.id}
                    className={`wv-exp-card ${imIncluded ? "wv-exp-mine" : ""}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 140 }}
                    whileHover={{ translateY: -3 }}
                  >
                    {/* Status bar */}
                    <div className="wv-exp-status-bar">
                      <span className="wv-exp-id">MISIÓN #{exp.id}</span>
                      <span className={`wv-badge ${s.cls}`}>{s.label}</span>
                    </div>

                    {imIncluded ? (
                      <div className="wv-exp-mine-tag">● TU MISIÓN</div>
                    ) : null}

                    <div className="wv-exp-name">{exp.name}</div>

                    {/* Destination + map */}
                    <div className="wv-exp-dest-row">
                      <span className="wv-prof-detail-key">DESTINO</span>
                      <span className="wv-prof-detail-val">{dest || "Sin descripción"}</span>
                    </div>

                    {coords ? (
                      <div className="wv-exp-minimap">
                        <ExplorationZoneMap
                          originCoords={coords}
                          originName={exp.name}
                          destinationLabel={dest}
                        />
                      </div>
                    ) : null}

                    <div className="wv-exp-detail-grid">
                      <div className="wv-prof-detail-row">
                        <span className="wv-prof-detail-key">SALIDA</span>
                        <span className="wv-prof-detail-val">
                          {exp.departure_date.split("T")[0]}
                        </span>
                      </div>
                      <div className="wv-prof-detail-row">
                        <span className="wv-prof-detail-key">DURACIÓN</span>
                        <span className="wv-prof-detail-val">
                          {exp.estimated_days}d (+{exp.grace_days}d gracia)
                        </span>
                      </div>
                      <div className="wv-prof-detail-row">
                        <span className="wv-prof-detail-key">LÍDER</span>
                        <span className="wv-prof-detail-val">
                          {leader
                            ? `${leader.person.first_name} ${leader.person.last_name}`
                            : "SIN ASIGNAR"}
                        </span>
                      </div>
                      <div className="wv-prof-detail-row">
                        <span className="wv-prof-detail-key">EQUIPO</span>
                        <span className="wv-prof-detail-val">
                          {exp.explorationPersons.length} persona(s)
                        </span>
                      </div>
                    </div>

                    {/* Team list */}
                    {exp.explorationPersons.length > 0 ? (
                      <div className="wv-exp-team">
                        {exp.explorationPersons.map((ep) => (
                          <span
                            key={ep.person_id}
                            className={`wv-exp-member ${
                              ep.person_id === myPersonId ? "wv-exp-member-me" : ""
                            }`}
                          >
                            {ep.is_leader ? "★ " : ""}
                            {ep.person.first_name} {ep.person.last_name}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Supplies */}
                    {exp.explorationResources.length > 0 ? (
                      <div className="wv-exp-supplies">
                        <span className="wv-prof-detail-key">SUMINISTROS</span>
                        <span className="wv-prof-detail-val">
                          {exp.explorationResources
                            .map((r) => `${r.quantity} ${r.resource.unit} ${r.resource.name}`)
                            .join(" · ")}
                        </span>
                      </div>
                    ) : null}

                    {exp.notes ? (
                      <div className="wv-exp-notes">
                        <span className="wv-prof-detail-key">NOTAS</span>
                        <span className="wv-prof-detail-val" style={{ fontStyle: "italic" }}>
                          "{exp.notes}"
                        </span>
                      </div>
                    ) : null}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── HISTORY ────────────────────────────────────────────── */}
      {history.length > 0 ? (
        <motion.div
          className="wv-paper-dark"
          style={{ padding: 24 }}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        >
          <h3 className="wv-section-title">HISTORIAL DE EXPEDICIONES</h3>
          <div className="wv-movement-list">
            {history.map((exp, i) => {
              const s = STATUS_MAP[exp.status] ?? STATUS_MAP.completed
              const dest = cleanDesc(exp.destination_description)
              return (
                <motion.div
                  key={exp.id}
                  className="wv-movement-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <span className={`wv-badge ${s.cls}`} style={{ minWidth: 90, textAlign: "center" }}>
                    {s.label}
                  </span>
                  <span className="wv-mv-resource" style={{ fontWeight: "bold" }}>
                    {exp.name}
                  </span>
                  <span className="wv-mv-type">{dest}</span>
                  <span className="wv-mv-date">
                    {exp.real_return_date
                      ? `Retorno: ${exp.real_return_date.split("T")[0]}`
                      : exp.departure_date.split("T")[0]}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}

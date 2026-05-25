import { motion } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import { useAssignedResources, useProfessions } from "@/features/worker/hooks/useWorkerAPI"
import "./WorkerViews.css"

const ROLE_LABELS: Record<string, string> = {
  worker: "TRABAJADOR",
  camp_leader: "LIDER DE CAMPAMENTO",
  admin: "ADMINISTRADOR",
}

export default function WorkerProfile() {
  const { user } = useAuth()
  const { data: assignedResources } = useAssignedResources()
  const { data: professions } = useProfessions()

  const userProfession = professions?.[0] ?? null

  const infoRows = [
    { label: "IDENTIFICADOR", value: user?.username?.toUpperCase() ?? "N/D" },
    {
      label: "ROL DEL SISTEMA",
      value: ROLE_LABELS[user?.role ?? ""] ?? user?.role?.toUpperCase() ?? "N/D",
    },
    { label: "SECTOR ASIGNADO", value: `SECTOR ${user?.camp_id ?? "?"}` },
    { label: "PROFESIÓN", value: userProfession?.name?.toUpperCase() ?? "SIN ASIGNAR" },
    {
      label: "EXPLORACIÓN",
      value: userProfession?.can_explore ? "AUTORIZADO" : "RESTRINGIDO",
    },
    { label: "ESTADO OPERATIVO", value: "ACTIVO" },
  ]

  return (
    <div className="wv-page">
      <div className="wv-page-header">
        <h2>EXPEDIENTE DEL PERSONAL</h2>
        <span className="wv-breadcrumb">SECTOR {user?.camp_id ?? "?"} // TERMINAL PERSONAL</span>
      </div>

      <div className="wv-grid-2" style={{ alignItems: "start" }}>
        <motion.div
          className="wv-paper"
          style={{ padding: 24 }}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160 }}
        >
          <h3 className="wv-section-title">DATOS DE IDENTIFICACIÓN</h3>

          <div
            style={{
              width: 90,
              height: 90,
              background: "var(--bg-paper-dark)",
              border: "2px solid var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="var(--ink)"
              width={48}
              height={48}
              style={{ opacity: 0.4 }}
            >
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
            </svg>
          </div>

          {infoRows.map((row) => (
            <div key={row.label} className="wv-detail-row">
              <span className="wv-detail-label">{row.label}</span>
              <span className="wv-detail-value">{row.value}</span>
            </div>
          ))}

          <div
            style={{
              marginTop: 18,
              padding: "10px 14px",
              border: "1px solid rgba(0,0,0,0.2)",
              background: "rgba(0,0,0,0.05)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              color: "var(--ink-soft)",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            Expediente verificado y auditado por comando central. Datos sujetos a revisión
            periódica.
          </div>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {userProfession ? (
            <motion.div
              className="wv-paper-dark"
              style={{ padding: 20 }}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 160, delay: 0.1 }}
            >
              <h3 className="wv-section-title">MÓDULO OCUPACIONAL</h3>
              <div
                style={{
                  fontFamily: "var(--font-typewriter)",
                  fontSize: "1.3rem",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  color: "var(--ink)",
                }}
              >
                {userProfession.name}
              </div>
              <div className="wv-detail-row">
                <span className="wv-detail-label">PERSONAL ACTIVO</span>
                <span className="wv-detail-value">{userProfession.persons?.length ?? 0}</span>
              </div>
              <div className="wv-detail-row">
                <span className="wv-detail-label">MÍNIMO REQUERIDO</span>
                <span className="wv-detail-value">{userProfession.minimum_active_required}</span>
              </div>
              <div className="wv-detail-row">
                <span className="wv-detail-label">PUEDE EXPLORAR</span>
                <span
                  className="wv-detail-value"
                  style={{
                    color: userProfession.can_explore
                      ? "var(--accent-approved)"
                      : "var(--accent-critical)",
                  }}
                >
                  {userProfession.can_explore ? "SI" : "NO"}
                </span>
              </div>
            </motion.div>
          ) : null}

          <motion.div
            className="wv-paper"
            style={{ padding: 20 }}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, delay: 0.2 }}
          >
            <h3 className="wv-section-title">RECURSOS ASIGNADOS</h3>
            {assignedResources && assignedResources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {assignedResources.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "rgba(0,0,0,0.04)",
                    }}
                  >
                    {r.image_url ? (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          border: "1px solid rgba(0,0,0,0.2)",
                          filter: "sepia(0.3)",
                          flexShrink: 0,
                        }}
                      />
                    ) : null}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-typewriter)",
                          fontSize: "0.85rem",
                          textTransform: "uppercase",
                          color: "var(--ink)",
                        }}
                      >
                        {r.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.68rem",
                          color: "var(--ink-soft)",
                        }}
                      >
                        {r.current_quantity} {r.unit ?? ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="wv-empty">SIN RECURSOS ASIGNADOS</div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

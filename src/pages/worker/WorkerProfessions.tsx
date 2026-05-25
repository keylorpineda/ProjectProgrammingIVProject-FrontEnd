import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import { useProfessions, useProfessionMetrics } from "@/features/worker/hooks/useWorkerAPI"
import "./WorkerViews.css"

type ProfessionDetail = {
  detailA: string
  detailB: string
  roleTag: string
}

const PROFESSION_DETAILS: Record<string, ProfessionDetail> = {
  recolector: { detailA: "Extracción de campo", detailB: "Zonas externas", roleTag: "CAMPO" },
  aguatero: { detailA: "Extracción H₂O", detailB: "Sistema hidráulico", roleTag: "HIDRATACIÓN" },
  explorador: { detailA: "Reconocimiento", detailB: "Zona de exclusión", roleTag: "AVANZADA" },
  guardia: { detailA: "Seguridad perimetral", detailB: "Control de acceso", roleTag: "DEFENSA" },
  médico: { detailA: "Atención sanitaria", detailB: "Enfermería central", roleTag: "SALUD" },
  ingeniero: { detailA: "Mantenimiento técnico", detailB: "Infraestructura", roleTag: "OBRAS" },
  cocinero: { detailA: "Procesado de alimentos", detailB: "Cocina central", roleTag: "COCINA" },
  almacenista: {
    detailA: "Control de inventario",
    detailB: "Depósito logístico",
    roleTag: "ALMACÉN",
  },
  agricultor: { detailA: "Producción primaria", detailB: "Sector agrícola", roleTag: "CULTIVO" },
  constructor: {
    detailA: "Obras y proyectos",
    detailB: "Mejora de instalaciones",
    roleTag: "PROYECTO",
  },
}

const getProfessionDetail = (name: string): ProfessionDetail => {
  const key = Object.keys(PROFESSION_DETAILS).find((k) => name.toLowerCase().includes(k))
  return key
    ? PROFESSION_DETAILS[key]
    : { detailA: "Funciones generales", detailB: "Sector operativo", roleTag: "OPERATIVO" }
}

export default function WorkerProfessions() {
  const { user } = useAuth()
  const { data: professions } = useProfessions()
  const { metrics } = useProfessionMetrics()

  const criticalCount = metrics.filter((m) => m.status === "CRÍTICO").length

  return (
    <div className="wv-page">
      <div className="wv-page-header">
        <h2>MANDO OCUPACIONAL</h2>
        <span className="wv-breadcrumb">
          SECTOR {user?.camp_id ?? "?"} // ASIGNACIÓN ESTRATÉGICA
        </span>
      </div>

      <AnimatePresence>
        {criticalCount > 0 ? (
          <motion.div
            className="wv-alert-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ⚠ ALERTA CRÍTICA — {criticalCount} PROFESIÓN(ES) OPERANDO BAJO MÍNIMOS DE SUPERVIVENCIA
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="wv-profession-grid">
        {(professions ?? []).map((profession, i) => {
          const metric = metrics.find((m) => m.id === profession.id)
          const count = profession.persons?.length ?? 0
          const required = profession.minimum_active_required
          const status = metric?.status ?? "OK"
          const pct = required > 0 ? Math.min((count / required) * 100, 100) : 100
          const detail = getProfessionDetail(profession.name)
          const cornerColor =
            status === "CRÍTICO"
              ? "var(--accent-critical)"
              : status === "DÉFICIT"
                ? "var(--accent-warning)"
                : "var(--accent-approved)"

          return (
            <motion.div
              key={profession.id}
              className={`wv-profession-card ${
                status === "CRÍTICO"
                  ? "wv-prof-critical"
                  : status === "DÉFICIT"
                    ? "wv-prof-warning"
                    : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 160 }}
              whileHover={{ translateY: -4 }}
            >
              <div className="wv-prof-corner-badge" style={{ borderRightColor: cornerColor }} />

              <div className="wv-prof-name">{profession.name}</div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <div>
                  <div className="wv-prof-count">{count}</div>
                  <div className="wv-prof-min">MÍN. REQUERIDO: {required}</div>
                </div>
                <span
                  className={`wv-badge ${
                    status === "CRÍTICO"
                      ? "wv-badge-critical"
                      : status === "DÉFICIT"
                        ? "wv-badge-warning"
                        : "wv-badge-ok"
                  }`}
                  style={{ alignSelf: "flex-end", marginBottom: 6 }}
                >
                  {status}
                </span>
              </div>

              <div className="wv-prof-bar-track">
                <div
                  className={`wv-prof-bar-fill ${
                    status === "CRÍTICO"
                      ? "wv-prof-bar-critical"
                      : status === "DÉFICIT"
                        ? "wv-prof-bar-warning"
                        : "wv-prof-bar-ok"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="wv-prof-detail-row">
                <span className="wv-prof-detail-key">FUNCIÓN</span>
                <span className="wv-prof-detail-val">{detail.detailA}</span>
              </div>
              <div className="wv-prof-detail-row">
                <span className="wv-prof-detail-key">SECTOR</span>
                <span className="wv-prof-detail-val">{detail.detailB}</span>
              </div>
              <div className="wv-prof-detail-row">
                <span className="wv-prof-detail-key">ROL</span>
                <span
                  className="wv-prof-detail-val"
                  style={{
                    background: "var(--ink)",
                    color: "var(--bg-paper)",
                    padding: "1px 6px",
                    fontSize: "0.62rem",
                    letterSpacing: 1,
                  }}
                >
                  {detail.roleTag}
                </span>
              </div>
              <div className="wv-prof-detail-row">
                <span className="wv-prof-detail-key">EXPLORACIÓN</span>
                <span
                  className="wv-prof-detail-val"
                  style={{
                    color: profession.can_explore
                      ? "var(--accent-approved)"
                      : "var(--accent-critical)",
                  }}
                >
                  {profession.can_explore ? "✓ AUTORIZADO" : "✗ RESTRINGIDO"}
                </span>
              </div>
            </motion.div>
          )
        })}

        {(professions ?? []).length === 0 ? (
          <div className="wv-empty">SIN DATOS DE PROFESIONES</div>
        ) : null}
      </div>
    </div>
  )
}

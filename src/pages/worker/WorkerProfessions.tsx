import { motion, AnimatePresence } from "framer-motion"

import {
  useProfessions,
  useProfessionMetrics,
  useCamp,
  useMyProfile,
} from "@/features/worker/hooks/useWorkerAPI"
import { useAuth } from "@/pages/Admin/context/AuthContext"
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
  const { data: campData } = useCamp(user?.camp_id)
  const { data: profile } = useMyProfile()
  const campName = campData?.camp?.name ?? `CAMPAMENTO #${user?.camp_id ?? "?"}`
  const myProfessionId = profile?.person?.profession_id ?? null
  const myProfessionName = profile?.person?.profession?.name ?? null

  const criticalCount = metrics.filter((m) => m.status === "CRÍTICO").length

  return (
    <div className="wv-page">
      <div className="wv-page-header">
        <h2>MANDO OCUPACIONAL</h2>
        <span className="wv-breadcrumb">{campName}</span>
      </div>

      {/* Worker's own profession banner */}
      {myProfessionName ? (
        <motion.div
          className="wv-my-profession-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140 }}
        >
          <span className="wv-my-prof-tag">TU PROFESIÓN</span>
          <span className="wv-my-prof-name">{myProfessionName.toUpperCase()}</span>
          {profile?.person?.can_work ? (
            <span className="wv-my-prof-status active">● OPERATIVO</span>
          ) : (
            <span className="wv-my-prof-status inactive">○ NO DISPONIBLE</span>
          )}
        </motion.div>
      ) : null}

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
          const activeCount = profession.persons?.filter((p) => p.status === "activo").length ?? 0
          const required = profession.minimum_active_required
          const status = metric?.status ?? "OK"
          const pct = required > 0 ? Math.min((count / required) * 100, 100) : 100
          const detail = getProfessionDetail(profession.name)
          const isMine = myProfessionId != null && String(profession.id) === String(myProfessionId)
          const cornerColor =
            status === "CRÍTICO"
              ? "var(--accent-critical)"
              : status === "DÉFICIT"
                ? "var(--accent-warning)"
                : isMine
                  ? "var(--accent-amber)"
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
              } ${isMine ? "wv-prof-mine" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 160 }}
              whileHover={{ scale: 1.04, translateY: -4, zIndex: 10 }}
            >
              <div className="wv-prof-corner-badge" style={{ borderRightColor: cornerColor }} />

              {isMine ? <div className="wv-prof-mine-tag">● TU PROFESIÓN</div> : null}

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
                <motion.div
                  className={`wv-prof-bar-fill ${
                    status === "CRÍTICO"
                      ? "wv-prof-bar-critical"
                      : status === "DÉFICIT"
                        ? "wv-prof-bar-warning"
                        : "wv-prof-bar-ok"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.05 }}
                />
              </div>

              <div className="wv-prof-detail-row">
                <span className="wv-prof-detail-key">ACTIVOS</span>
                <span
                  className="wv-prof-detail-val"
                  style={{
                    color:
                      activeCount < required ? "var(--accent-critical)" : "var(--accent-approved)",
                  }}
                >
                  {activeCount} / {required}
                </span>
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

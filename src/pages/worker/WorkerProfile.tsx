import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import {
  useAssignedResources,
  useMyBadges,
  useCamp,
  useMyProfile,
} from "@/features/worker/hooks/useWorkerAPI"
import "./WorkerViews.css"

// ── Constants ──────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  worker:           "TRABAJADOR",
  camp_leader:      "LÍDER DE CAMPAMENTO",
  admin:            "ADMINISTRADOR",
  camp_manager:     "GESTOR DE CAMPAMENTO",
  travel_manager:   "GESTOR DE TRASLADOS",
  resource_manager: "GESTOR DE RECURSOS",
}

const STATUS_COLORS: Record<string, string> = {
  activo:   "var(--accent-approved)",
  inactivo: "rgba(154,144,128,0.5)",
  enfermo:  "var(--accent-warning)",
  herido:   "var(--accent-critical)",
}

const RARITY_LABELS: Record<number, string> = {
  1: "COMÚN", 2: "INFRECUENTE", 3: "RARO", 4: "ÉPICO", 5: "LEGENDARIO",
}
const RARITY_CLASS: Record<number, string> = {
  1: "wv-rarity-1", 2: "wv-rarity-2", 3: "wv-rarity-3",
  4: "wv-rarity-4", 5: "wv-rarity-5",
}

const RANK_TIERS = [
  { min: 0,  label: "RECLUTA",  color: "rgba(154,144,128,0.6)", next: 2  },
  { min: 2,  label: "SOLDADO",  color: "#3b82f6",               next: 4  },
  { min: 4,  label: "VETERANO", color: "#4c6351",               next: 7  },
  { min: 7,  label: "ÉLITE",    color: "#8b5cf6",               next: 10 },
  { min: 10, label: "LEYENDA",  color: "#c8a84b",               next: 10 },
]

function getRank(n: number) {
  return [...RANK_TIERS].reverse().find((t) => n >= t.min) ?? RANK_TIERS[0]
}

// ── XP Bar ─────────────────────────────────────────────────────
function XPBar({ count }: { count: number }) {
  const rank = getRank(count)
  const idx = RANK_TIERS.findIndex((t) => t.label === rank.label)
  const next = RANK_TIERS[idx + 1]
  const pct = next
    ? Math.min(Math.round(((count - rank.min) / (next.min - rank.min)) * 100), 100)
    : 100
  return (
    <div className="wv-xp-bar-wrap">
      <div className="wv-xp-bar-header">
        <span style={{ color: rank.color }}>{rank.label}</span>
        <span className="wv-xp-bar-next">
          {next ? `→ ${next.label} (${count}/${next.min})` : "RANGO MÁX."}
        </span>
      </div>
      <div className="wv-xp-track">
        <motion.div
          className="wv-xp-fill"
          style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <div className="wv-xp-label">{pct}% AL SIGUIENTE RANGO</div>
    </div>
  )
}

// ── Profession chip ─────────────────────────────────────────────
function ProfessionChip({ name, canExplore }: { name: string; canExplore: boolean }) {
  return (
    <div className="wv-profession-chip">
      <span className="wv-profession-chip-label">PROFESIÓN</span>
      <span className="wv-profession-chip-name">{name.toUpperCase()}</span>
      {canExplore ? (
        <span className="wv-profession-chip-explore">PUEDE EXPLORAR</span>
      ) : null}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────
export default function WorkerProfile() {
  const { user } = useAuth()
  const { data: assignedResources } = useAssignedResources()
  const { data: badges, isLoading: badgesLoading } = useMyBadges()
  const { data: campData } = useCamp(user?.camp_id)
  const { data: profile } = useMyProfile()

  const camp = campData?.camp
  const campMetrics = campData?.metrics
  const person = profile?.person
  const profession = person?.profession

  const badgeCount = badges?.length ?? 0
  const rank = getRank(badgeCount)

  // ID code
  const prefix = (user?.username ?? "USR").slice(0, 3).toUpperCase()
  const suffix = String(user?.id ?? "0000").slice(-4).padStart(4, "0")
  const idCode = `GDF-${prefix}-${suffix}`

  // Synthetic "first login" badge from localStorage
  const firstLoginKey = `gdf_first_login_${user?.id}`
  const hasFirstLogin = typeof window !== "undefined" && !!localStorage.getItem(firstLoginKey)

  const localBadge = useMemo(() => {
    if (!hasFirstLogin) return null
    return {
      id: -1,
      isLocal: true,
      name: "PRIMER TRABAJO",
      description: "Primera vez que iniciaste sesión en el sistema.",
      rarity: 1,
      stars: "★☆☆☆☆",
      acquiredAt: null,
    }
  }, [hasFirstLogin])

  return (
    <div className="wv-page">
      {/* ── Page header ── */}
      <div className="wv-page-header">
        <h2>EXPEDIENTE DEL SUPERVIVIENTE</h2>
        <span className="wv-breadcrumb">
          {camp?.name ?? `CAMPAMENTO #${user?.camp_id ?? "?"}`}
        </span>
      </div>

      {/* ── ID CARD ── */}
      <motion.div
        className="wv-id-card"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 130 }}
      >
        {/* Left column */}
        <div className="wv-id-left">
          <div className="wv-avatar-box">
            <span className="wv-avatar-letter">
              {(user?.username ?? "?")[0].toUpperCase()}
            </span>
          </div>

          <div className="wv-id-code">{idCode}</div>

          <div className="wv-rank-chip" style={{ borderColor: rank.color, color: rank.color }}>
            {rank.label}
          </div>

          <div className="wv-badge-count-pill">
            {badgeCount} INSIGNIA{badgeCount !== 1 ? "S" : ""}
          </div>

          <div className="wv-id-stars">
            {Array.from({ length: RANK_TIERS.findIndex((t) => t.label === rank.label) + 1 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                style={{ color: rank.color }}
              >★</motion.span>
            ))}
          </div>

          {/* Person status if available */}
          {person ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.58rem",
              color: STATUS_COLORS[person.status] ?? "rgba(154,144,128,0.5)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 4,
              padding: "2px 8px",
              border: `1px solid ${STATUS_COLORS[person.status] ?? "rgba(154,144,128,0.2)"}`,
            }}>
              {person.status.toUpperCase()}
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="wv-id-right">
          <div className="wv-id-classified-tag">[ DOCUMENTO CLASIFICADO — NIVEL 1 ]</div>

          {/* Profession banner — prominent if we have it */}
          {profession ? (
            <ProfessionChip name={profession.name} canExplore={profession.can_explore} />
          ) : null}

          {[
            { label: "IDENTIFICADOR",   value: (user?.username ?? "N/D").toUpperCase() },
            { label: "CORREO DE ENLACE", value: user?.email ?? "N/D" },
            { label: "ROL DEL SISTEMA",  value: ROLE_LABELS[user?.role ?? ""] ?? (user?.role?.toUpperCase() ?? "N/D") },
            {
              label: "SECTOR ASIGNADO",
              value: camp ? `${camp.name} (#${camp.id})` : `CAMPAMENTO #${user?.camp_id ?? "?"}`,
            },
            ...(person ? [
              {
                label: "NOMBRE COMPLETO",
                value: `${person.first_name} ${person.last_name}`,
              },
              {
                label: "NIVEL DE EXPERIENCIA",
                value: `${person.experience_level} / 10`,
              },
            ] : []),
          ].map((row) => (
            <div key={row.label} className="wv-id-row">
              <span className="wv-id-row-label">{row.label}</span>
              <span className="wv-id-row-value">{row.value}</span>
            </div>
          ))}

          <div className="wv-status-line">
            <span className="wv-status-dot-green" />
            <span>ESTADO OPERATIVO: ACTIVO</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <XPBar count={badgeCount} />
          </div>
        </div>
      </motion.div>

      {/* ── CAMP INTEL ── */}
      {camp ? (
        <motion.div
          className="wv-paper-dark"
          style={{ padding: 24, marginTop: 20 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.1 }}
        >
          <div className="wv-section-title-row">
            <h3 className="wv-section-title" style={{ marginBottom: 0 }}>INTELIGENCIA DE SECTOR</h3>
            <span className="wv-section-count" style={{ color: camp.active ? "var(--accent-approved)" : "var(--accent-critical)" }}>
              {camp.active ? "● ACTIVO" : "○ INACTIVO"}
            </span>
          </div>
          <div className="wv-camp-grid">
            {[
              { label: "NOMBRE DEL CAMPAMENTO", value: camp.name },
              { label: "UBICACIÓN",             value: camp.location_description ?? "CLASIFICADA" },
              { label: "CAPACIDAD MÁXIMA",      value: camp.max_capacity ? `${camp.max_capacity} PERSONAS` : "N/D" },
              { label: "FECHA DE FUNDACIÓN",    value: camp.foundation_date ? String(camp.foundation_date).split("T")[0] : "DESCONOCIDA" },
              ...(campMetrics ? [
                { label: "RECURSOS TOTALES",    value: String(campMetrics.totalResources) },
                { label: "RECURSOS CON ALERTA", value: String(campMetrics.resourcesWithAlerts) },
              ] : []),
            ].map((row) => (
              <div key={row.label} className="wv-camp-row">
                <span className="wv-id-row-label">{row.label}</span>
                <span className="wv-id-row-value">{row.value}</span>
              </div>
            ))}
          </div>
          {camp.latitude != null && camp.longitude != null ? (
            <div className="wv-coords">
              COORDS: {Number(camp.latitude).toFixed(4)}°N / {Number(camp.longitude).toFixed(4)}°W
            </div>
          ) : null}
        </motion.div>
      ) : null}

      {/* ── INSIGNIAS ── */}
      <motion.div
        className="wv-paper"
        style={{ padding: 24, marginTop: 24 }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 110, delay: 0.18 }}
      >
        <div className="wv-section-title-row">
          <h3 className="wv-section-title" style={{ marginBottom: 0 }}>INSIGNIAS DEL SUPERVIVIENTE</h3>
          <span className="wv-section-count">{badgeCount + (localBadge ? 1 : 0)} OBTENIDAS</span>
        </div>

        {badgesLoading ? (
          <div className="wv-loading">CARGANDO INSIGNIAS...</div>
        ) : (badges && badges.length > 0) || localBadge ? (
          <div className="wv-badge-grid">
            {/* Local first-login badge */}
            {localBadge ? (
              <motion.div
                className="wv-badge-card wv-rarity-1 wv-local-badge"
                initial={{ scale: 0, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220 }}
                whileHover={{ scale: 1.08, rotate: -2, zIndex: 10 }}
              >
                <div className="wv-badge-rarity-corner wv-rarity-1" />
                <div className="wv-badge-img-wrap">
                  <div className="wv-badge-icon-placeholder">🏅</div>
                </div>
                <div className="wv-badge-name">PRIMER TRABAJO</div>
                <div className="wv-badge-stars">★<span className="wv-badge-stars-empty">☆☆☆☆</span></div>
                <div className="wv-badge-rarity-label">COMÚN</div>
                <div className="wv-badge-displayed-tag">DEBUT</div>
              </motion.div>
            ) : null}

            {/* Backend badges */}
            {(badges ?? []).map((badge, i) => {
              const rarity = badge.asset?.rarity ?? 1
              const rarityClass = RARITY_CLASS[rarity] ?? "wv-rarity-1"
              const imgUrl = badge.asset?.thumbnail_url || badge.asset?.url
              return (
                <motion.div
                  key={badge.id}
                  className={`wv-badge-card ${rarityClass}`}
                  initial={{ scale: 0, opacity: 0, rotate: -8 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ delay: i * 0.05 + 0.05, type: "spring", stiffness: 220 }}
                  whileHover={{ scale: 1.08, rotate: -2, zIndex: 10 }}
                >
                  <div className={`wv-badge-rarity-corner ${rarityClass}`} />
                  <div className="wv-badge-img-wrap">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={badge.asset?.name ?? "insignia"}
                        className="wv-badge-img"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                          ;(e.target as HTMLImageElement).parentElement?.classList.add("wv-badge-no-img")
                        }}
                      />
                    ) : (
                      <div className="wv-badge-icon-placeholder">★</div>
                    )}
                  </div>
                  <div className="wv-badge-name">{badge.asset?.name ?? "Insignia"}</div>
                  <div className="wv-badge-stars">
                    {"★".repeat(Math.min(rarity, 5))}
                    <span className="wv-badge-stars-empty">{"☆".repeat(Math.max(5 - rarity, 0))}</span>
                  </div>
                  <div className="wv-badge-rarity-label">{RARITY_LABELS[rarity] ?? "COMÚN"}</div>
                  {badge.acquired_at ? (
                    <div className="wv-badge-date">{String(badge.acquired_at).split("T")[0]}</div>
                  ) : null}
                  {badge.is_displayed ? (
                    <div className="wv-badge-displayed-tag">EN EXHIBICIÓN</div>
                  ) : null}
                </motion.div>
              )
            })}
          </div>
        ) : (
          <AnimatePresence>
            <motion.div className="wv-empty-badges" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="wv-empty-badge-icon">☐</div>
              <div>AÚN SIN INSIGNIAS</div>
              <div className="wv-empty-badge-sub">
                COMPLETE MISIONES Y EXPEDICIONES PARA OBTENER INSIGNIAS
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* ── EQUIPO ASIGNADO ── */}
      <motion.div
        className="wv-paper-dark"
        style={{ padding: 24, marginTop: 20, marginBottom: 12 }}
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 110, delay: 0.28 }}
      >
        <h3 className="wv-section-title">EQUIPO ASIGNADO PERSONALMENTE</h3>
        {assignedResources && assignedResources.length > 0 ? (
          <div className="wv-equip-list">
            {assignedResources.map((r) => {
              const raw = r as unknown as Record<string, unknown>
              const assetData = raw.asset as Record<string, unknown> | undefined
              const imgUrl =
                (raw.image_url as string | undefined) ||
                (assetData?.url as string | undefined) ||
                (assetData?.thumbnail_url as string | undefined) || ""
              const name = (raw.name as string | undefined) || (assetData?.name as string | undefined) || "Equipo"
              const desc = (raw.description as string | undefined) || (assetData?.description as string | undefined) || ""
              const cat = (raw.category as string | undefined) || (assetData?.category as string | undefined) || "general"
              const rarity = (assetData?.rarity as number | undefined) ?? null
              return (
                <motion.div
                  key={r.id}
                  className="wv-equip-row"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="wv-equip-img">
                    {imgUrl ? (
                      <img src={imgUrl} alt={name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { ;(e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <span className="wv-equip-fallback-icon">⚙</span>
                    )}
                  </div>
                  <div className="wv-equip-info">
                    <div className="wv-equip-name">{name}</div>
                    {desc ? <div className="wv-equip-desc">{desc}</div> : null}
                  </div>
                  <div className="wv-equip-meta">
                    <span className="wv-equip-cat">{cat.toUpperCase()}</span>
                    {rarity != null ? <span className="wv-equip-rarity">{"★".repeat(Math.min(rarity, 5))}</span> : null}
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="wv-empty">SIN EQUIPO ASIGNADO</div>
        )}
      </motion.div>
    </div>
  )
}

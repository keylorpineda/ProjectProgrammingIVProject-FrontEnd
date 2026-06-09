import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Award, Camera, Shield, Star, Trophy, Upload } from "lucide-react"
import { useRef, useState } from "react"

import { useAuth } from "../context/AuthContext"
import { useCamp } from "../context/CampContext"

import { getMe, updateMyAvatar, uploadAvatarImage } from "@/features/auth/services/auth.service"
import { getDashboardMetrics } from "@/features/dashboard/services/dashboard.service"

import "@/pages/worker/WorkerViews.css"

// ─── Ranks ────────────────────────────────────────────────────────────────────

const RANK_TIERS = [
  { min: 0, label: "RECLUTA", color: "rgba(154,144,128,0.6)" },
  { min: 3, label: "GESTOR ACTIVO", color: "#3b7a5a" },
  { min: 10, label: "DIRECTOR CAMPO", color: "#8f581e" },
  { min: 25, label: "COMANDANTE", color: "#c27c2f" },
  { min: 50, label: "LEYENDA ADM.", color: "#b38536" },
]

function getRank(n: number) {
  return [...RANK_TIERS].reverse().find((t) => n >= t.min) ?? RANK_TIERS[0]
}

// ─── Trofeos ──────────────────────────────────────────────────────────────────

interface Trophy {
  id: string
  name: string
  description: string
  icon: string
  rarity: 1 | 2 | 3 | 4 | 5
  unlocked: boolean
  progress?: number
  progressLabel?: string
}

const RARITY_LABEL: Record<number, string> = {
  1: "COMÚN",
  2: "INFRECUENTE",
  3: "RARO",
  4: "ÉPICO",
  5: "LEGENDARIO",
}

interface AdminStats {
  totalPeople: number
  activeWorkers: number
  activeExplorations: number
  completedTransfers: number
  pendingTransfers: number
}

function buildTrophies(s: AdminStats): Trophy[] {
  return [
    {
      id: "primer_mando",
      name: "PRIMER MANDO",
      description: "Accediste al sistema como Administrador.",
      icon: "⚔️",
      rarity: 1,
      unlocked: true,
    },
    {
      id: "primera_gestion",
      name: "PRIMERA GESTIÓN",
      description: "Al menos 1 traslado completado en el sistema.",
      icon: "📋",
      rarity: 1,
      unlocked: s.completedTransfers >= 1,
      progress: Math.min(100, s.completedTransfers * 100),
      progressLabel: `${s.completedTransfers}/1`,
    },
    {
      id: "campamento_activo",
      name: "CAMPAMENTO ACTIVO",
      description: "10+ personas registradas en el campamento.",
      icon: "🏕️",
      rarity: 2,
      unlocked: s.totalPeople >= 10,
      progress: Math.min(100, (s.totalPeople / 10) * 100),
      progressLabel: `${s.totalPeople}/10`,
    },
    {
      id: "fuerza_laboral",
      name: "FUERZA LABORAL",
      description: "5+ trabajadores activos simultáneamente.",
      icon: "👷",
      rarity: 2,
      unlocked: s.activeWorkers >= 5,
      progress: Math.min(100, (s.activeWorkers / 5) * 100),
      progressLabel: `${s.activeWorkers}/5`,
    },
    {
      id: "expediciones_ctrl",
      name: "CAMPO CONTROLADO",
      description: "Al menos 1 expedición activa supervisada.",
      icon: "🧭",
      rarity: 2,
      unlocked: s.activeExplorations >= 1,
      progress: Math.min(100, s.activeExplorations * 100),
      progressLabel: `${s.activeExplorations}/1`,
    },
    {
      id: "gestor_eficiente",
      name: "GESTOR EFICIENTE",
      description: "5+ traslados completados con éxito.",
      icon: "🚛",
      rarity: 3,
      unlocked: s.completedTransfers >= 5,
      progress: Math.min(100, (s.completedTransfers / 5) * 100),
      progressLabel: `${s.completedTransfers}/5`,
    },
    {
      id: "red_organizada",
      name: "RED ORGANIZADA",
      description: "20+ personas registradas en el campamento.",
      icon: "🏙️",
      rarity: 3,
      unlocked: s.totalPeople >= 20,
      progress: Math.min(100, (s.totalPeople / 20) * 100),
      progressLabel: `${s.totalPeople}/20`,
    },
    {
      id: "maestro_traslados",
      name: "MAESTRO TRASLADOS",
      description: "10+ traslados completados exitosamente.",
      icon: "🎖️",
      rarity: 4,
      unlocked: s.completedTransfers >= 10,
      progress: Math.min(100, (s.completedTransfers / 10) * 100),
      progressLabel: `${s.completedTransfers}/10`,
    },
    {
      id: "campo_veteranos",
      name: "CAMPO VETERANOS",
      description: "10+ trabajadores activos en base.",
      icon: "🌟",
      rarity: 4,
      unlocked: s.activeWorkers >= 10,
      progress: Math.min(100, (s.activeWorkers / 10) * 100),
      progressLabel: `${s.activeWorkers}/10`,
    },
    {
      id: "leyenda_admin",
      name: "LEYENDA ADMINISTRATIVA",
      description: "20+ traslados completados. Autoridad máxima.",
      icon: "👑",
      rarity: 5,
      unlocked: s.completedTransfers >= 20,
      progress: Math.min(100, (s.completedTransfers / 20) * 100),
      progressLabel: `${s.completedTransfers}/20`,
    },
  ]
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────

function XPBar({ score }: { score: number }) {
  const rank = getRank(score)
  const idx = RANK_TIERS.findIndex((t) => t.label === rank.label)
  const next = RANK_TIERS[idx + 1]
  const pct = next
    ? Math.min(Math.round(((score - rank.min) / (next.min - rank.min)) * 100), 100)
    : 100
  return (
    <div className="mt-3">
      <div className="flex justify-between font-mono text-[10px] uppercase mb-1.5">
        <span style={{ color: rank.color }}>{rank.label}</span>
        <span className="text-[rgba(154,144,128,0.55)]">
          {next ? `→ ${next.label} (${score}/${next.min})` : "RANGO MÁX."}
        </span>
      </div>
      <div className="h-2 bg-[rgba(0,0,0,0.4)] border border-[rgba(179,133,54,0.28)] overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: rank.color, boxShadow: `0 0 8px ${rank.color}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      <div className="font-mono text-[9px] text-[rgba(154,144,128,0.4)] mt-1 uppercase">
        {pct}% AL SIGUIENTE RANGO
      </div>
    </div>
  )
}

// ─── Trophy modal ─────────────────────────────────────────────────────────────

function TrophyModal({ trophy, onClose }: { trophy: Trophy | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {trophy ? (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80" />
          <motion.div
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 bg-[#161513] border-2 border-[rgba(179,133,54,0.55)] p-8 max-w-sm w-full text-center shadow-[0_0_32px_rgba(179,133,54,0.2)]"
          >
            {/* Tape strip */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-[rgba(179,133,54,0.2)] border border-dashed border-[rgba(179,133,54,0.4)]" />
            <button
              onClick={onClose}
              className="absolute top-2.5 right-2.5 bg-[rgba(0,0,0,0.5)] border border-[rgba(179,133,54,0.3)] text-[rgba(212,190,140,0.8)] px-2 py-0.5 font-mono text-xs cursor-pointer hover:border-[rgba(179,133,54,0.7)]"
            >
              ✕
            </button>
            <div
              className={`text-5xl mb-4 leading-none ${!trophy.unlocked ? "grayscale opacity-40" : ""}`}
            >
              {trophy.icon}
            </div>
            <div className="font-mono text-[9px] text-[rgba(154,144,128,0.6)] tracking-[3px] uppercase mb-1.5">
              {RARITY_LABEL[trophy.rarity]} · {trophy.unlocked ? "✓ DESBLOQUEADO" : "✗ BLOQUEADO"}
            </div>
            <div className="font-typewriter text-base font-bold uppercase tracking-wider text-[rgba(212,190,140,0.92)] border-b border-dashed border-[rgba(154,144,128,0.3)] pb-3 mb-3">
              {trophy.name}
            </div>
            <p className="font-mono text-xs text-[rgba(154,144,128,0.6)] leading-relaxed mb-3">
              {trophy.description}
            </p>
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < trophy.rarity ? "fill-current" : ""}`}
                  style={{ color: i < trophy.rarity ? "#b38536" : "rgba(154,144,128,0.25)" }}
                />
              ))}
            </div>
            {!trophy.unlocked && trophy.progress !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between font-mono text-[9px] text-[rgba(154,144,128,0.5)] uppercase mb-1">
                  <span>PROGRESO</span>
                  <span>{trophy.progressLabel}</span>
                </div>
                <div className="h-1.5 bg-[rgba(0,0,0,0.5)] border border-[rgba(179,133,54,0.2)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trophy.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[rgba(179,133,54,0.6)]"
                  />
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="mt-2 bg-[rgba(179,133,54,0.15)] border border-[rgba(179,133,54,0.4)] text-[rgba(212,190,140,0.8)] font-mono text-xs uppercase tracking-widest px-6 py-2 cursor-pointer hover:bg-[rgba(179,133,54,0.25)] transition-colors"
            >
              CERRAR
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

// ─── Avatar Upload ────────────────────────────────────────────────────────────

function AvatarUpload({
  username,
  avatarUrl,
  onUploaded,
}: {
  username: string
  avatarUrl: string | null
  onUploaded: (url: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [hover, setHover] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploaded = await uploadAvatarImage(file)
      await updateMyAvatar(uploaded.url, uploaded.publicId)
      onUploaded(uploaded.thumbnailUrl || uploaded.url)
    } catch {
      // silently fail — avatar stays as before
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="relative cursor-pointer"
      onClick={() => !uploading && fileRef.current?.click()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar box */}
      <div
        className="w-20 h-20 border flex items-center justify-center relative overflow-hidden"
        style={{
          background: "rgba(0,0,0,0.6)",
          borderColor: hover ? "rgba(179,133,54,0.8)" : "rgba(179,133,54,0.45)",
          transition: "border-color 0.15s",
        }}
      >
        {/* Corner mark */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[rgba(179,133,54,0.8)] pointer-events-none" />

        {uploading ? (
          <Upload className="w-6 h-6 text-[rgba(179,133,54,0.7)] animate-pulse" />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-typewriter text-[2.6rem] leading-none"
            style={{ color: "#c27c2f", textShadow: "0 0 16px rgba(179,133,54,0.5)" }}
          >
            {(username ?? "?")[0].toUpperCase()}
          </span>
        )}

        {/* Hover overlay */}
        {hover && !uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-0.5">
            <Camera className="w-5 h-5 text-[rgba(212,190,140,0.9)]" />
            <span className="font-mono text-[8px] text-[rgba(212,190,140,0.7)] uppercase tracking-wider">
              CAMBIAR
            </span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e)}
      />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminProfile() {
  const { user } = useAuth()
  const { activeCampId, camps } = useCamp()
  const queryClient = useQueryClient()
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)

  // Cargar avatar actual del usuario
  const { data: meData } = useQuery({
    queryKey: ["adminMe"],
    queryFn: getMe,
    staleTime: 1000 * 60 * 5,
  })

  // Cargar métricas del campamento
  const { data } = useQuery({
    queryKey: ["adminDashboard", activeCampId],
    queryFn: () => getDashboardMetrics(activeCampId),
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
  })

  const avatarUrl = localAvatarUrl ?? meData?.avatar_url ?? null

  const activeCamp = camps.find((c) => c.id === activeCampId)

  const stats: AdminStats = {
    totalPeople: data?.camp?.total_people ?? 0,
    activeWorkers: data?.camp?.active_workers ?? 0,
    activeExplorations: data?.camp?.active_explorations ?? 0,
    completedTransfers: data?.transfers?.completed_transfers ?? 0,
    pendingTransfers: data?.transfers?.pending_transfers ?? 0,
  }

  const rankScore = stats.completedTransfers
  const rank = getRank(rankScore)
  const trophies = buildTrophies(stats)
  const unlockedCount = trophies.filter((t) => t.unlocked).length

  const prefix = (user?.username ?? "ADM").slice(0, 3).toUpperCase()
  const suffix = String(user?.id ?? "0000")
    .slice(-4)
    .padStart(4, "0")
  const idCode = `ADM-${prefix}-${suffix}`

  return (
    <div className="worker-layout" style={{ background: "transparent" }}>
      <div
        className="wv-profile-page"
        style={{ fontFamily: "var(--font-mono)", padding: "32px 32px 80px" }}
      >
        {/* ── HEADER ── */}
        <div className="wv-page-header">
          <h2>EXPEDIENTE DEL ADMINISTRADOR</h2>
          <div
            className="font-typewriter font-bold text-xs uppercase px-4 py-1 rotate-[-1deg]"
            style={{
              background: "rgba(179,133,54,0.12)",
              border: "2px dashed rgba(179,133,54,0.4)",
              color: "rgba(212,190,140,0.7)",
              letterSpacing: "2px",
            }}
          >
            CONFIDENCIAL
          </div>
        </div>

        {/* ── ID CARD ── */}
        <motion.div
          className="wv-id-card"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 130 }}
          whileHover={{ scale: 1.008, zIndex: 10 }}
        >
          {/* Columna izquierda */}
          <div className="wv-id-left">
            <AvatarUpload
              username={user?.username ?? "A"}
              avatarUrl={avatarUrl}
              onUploaded={(url) => {
                setLocalAvatarUrl(url)
                void queryClient.invalidateQueries({ queryKey: ["adminMe"] })
              }}
            />

            <div className="wv-id-code">{idCode}</div>

            <div className="wv-rank-chip" style={{ borderColor: rank.color, color: rank.color }}>
              {rank.label}
            </div>

            <div className="wv-badge-count-pill">
              <Trophy className="inline w-3 h-3 mr-1 opacity-60" />
              {unlockedCount}/{trophies.length}
            </div>

            <div className="wv-id-stars">
              {Array.from({
                length: RANK_TIERS.findIndex((t) => t.label === rank.label) + 1,
              }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                  style={{ color: rank.color }}
                >
                  ★
                </motion.span>
              ))}
            </div>

            {/* Status operativo */}
            <div
              className="font-mono text-[9px] uppercase tracking-widest mt-1 px-2 py-0.5 border"
              style={{
                color: "var(--accent-approved)",
                borderColor: "rgba(76,99,81,0.4)",
              }}
            >
              EN LÍNEA
            </div>
          </div>

          {/* Columna derecha */}
          <div className="wv-id-right">
            <div className="wv-id-classified-tag">[ DOCUMENTO CLASIFICADO — NIVEL ALFA ]</div>

            {[
              { label: "IDENTIFICADOR", value: (user?.username ?? "N/D").toUpperCase() },
              { label: "ROL DEL SISTEMA", value: "ADMINISTRADOR" },
              {
                label: "SECTOR ACTIVO",
                value: activeCamp ? `${activeCamp.name}` : `#${activeCampId || "?"}`,
              },
              { label: "TRASLADOS COMPLETOS", value: `${stats.completedTransfers}` },
              { label: "POBLACIÓN", value: `${stats.totalPeople} PERSONAS` },
              { label: "TRABAJADORES", value: `${stats.activeWorkers} ACTIVOS` },
              { label: "EXPEDICIONES", value: `${stats.activeExplorations} ACTIVAS` },
            ].map((row) => (
              <div key={row.label} className="wv-id-row">
                <span className="wv-id-row-label">{row.label}</span>
                <span className="wv-id-row-value">{row.value}</span>
              </div>
            ))}

            <div className="wv-status-line mt-2">
              <span className="wv-status-dot-green" />
              <span>ESTADO OPERATIVO: ACTIVO</span>
            </div>

            <XPBar score={rankScore} />
          </div>
        </motion.div>

        {/* ── STATS BAR ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: "POBLACIÓN", value: stats.totalPeople },
            { label: "ACTIVOS", value: stats.activeWorkers },
            { label: "EXPEDICIONES", value: stats.activeExplorations },
            { label: "TRASLADOS", value: stats.completedTransfers },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="wv-paper text-center py-4 px-3"
            >
              <div className="font-mono text-[9px] text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                {s.label}
              </div>
              <div
                className="font-typewriter text-3xl font-bold leading-none"
                style={{ color: "var(--text-amber)" }}
              >
                {s.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── SALA DE TROFEOS ── */}
        <motion.div
          className="wv-paper mt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 110, delay: 0.15 }}
        >
          {/* Header */}
          <div
            className="flex justify-between items-center px-5 py-3 border-b"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <h3
              className="wv-section-title"
              style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 8 }}
            >
              <Award className="w-4 h-4" />
              SALA DE TROFEOS
            </h3>
            <span className="wv-section-count">
              {unlockedCount}/{trophies.length} OBTENIDOS
            </span>
          </div>

          {/* Grid */}
          <div className="wv-badge-grid" style={{ padding: 20 }}>
            {trophies.map((trophy, i) => (
              <motion.div
                key={trophy.id}
                initial={{ scale: 0, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.08, rotate: -2, zIndex: 10 }}
                onClick={() => setSelectedTrophy(trophy)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedTrophy(trophy)}
                className={`wv-badge-card ${trophy.unlocked ? "" : "wv-badge-dim"}`}
                style={{ cursor: "pointer", opacity: trophy.unlocked ? 1 : 0.45 }}
              >
                {trophy.unlocked && <div className="wv-badge-rarity-corner wv-rarity-1" />}
                <div className="wv-badge-img-wrap">
                  <div className="wv-badge-icon-placeholder">{trophy.icon}</div>
                </div>
                <div className="wv-badge-name">{trophy.name}</div>
                <div className="wv-badge-stars">
                  {"★".repeat(trophy.rarity)}
                  <span className="wv-badge-stars-empty">{"☆".repeat(5 - trophy.rarity)}</span>
                </div>
                <div className="wv-badge-rarity-label">{RARITY_LABEL[trophy.rarity]}</div>
                {!trophy.unlocked && trophy.progress !== undefined && (
                  <div
                    style={{
                      height: 3,
                      background: "rgba(154,144,128,0.2)",
                      border: "1px solid rgba(179,133,54,0.2)",
                      overflow: "hidden",
                      marginTop: 4,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${trophy.progress}%`,
                        background: "rgba(179,133,54,0.5)",
                      }}
                    />
                  </div>
                )}
                {trophy.unlocked && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "rgba(179,133,54,0.6)",
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── NOTAS DE MANDO ── */}
        <motion.div
          className="wv-paper-dark mt-4 mb-3 p-5"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 110, delay: 0.28 }}
        >
          <h4
            className="font-mono text-[10px] uppercase tracking-[3px] mb-3 flex items-center gap-2"
            style={{ color: "rgba(154,144,128,0.55)" }}
          >
            <Shield className="w-3.5 h-3.5" /> NOTAS DE MANDO
          </h4>
          <p
            className="font-mono text-xs leading-relaxed italic"
            style={{
              color: "rgba(154,144,128,0.5)",
              borderLeft: "2px solid rgba(179,133,54,0.3)",
              paddingLeft: 12,
              margin: 0,
            }}
          >
            &quot;La supervivencia de la red de campamentos depende de la información precisa y las
            decisiones rápidas. Como administrador, tienes acceso total al sistema. Úsalo con
            responsabilidad. Cada cifra representa una vida.&quot;
          </p>
          <div
            className="font-mono text-[9px] uppercase tracking-widest mt-2"
            style={{ color: "rgba(154,144,128,0.3)" }}
          >
            — PROTOCOLO ALFA · NIVEL DE ACCESO: ADMINISTRADOR
          </div>
        </motion.div>

        <TrophyModal trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />
      </div>
    </div>
  )
}

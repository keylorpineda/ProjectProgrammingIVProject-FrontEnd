import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Award, FileText, Radio, Star, Trophy } from "lucide-react"
import { useState } from "react"

import { getExplorations } from "@/features/explorations/services/explorations.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { getCampTransfers } from "@/features/transfers/services/transfers.service"
import { useAuthStore } from "@/store/useAuthStore"

// ── Palette: same Admin paper palette as CampLeader ────────────────────────────
const PAPER = "#e3ddcd"
const PAPER_D = "#cdc8bc"
const PAPER_S = "#635b50"
const INK = "#000000"
const AMB = "#c27c2f"
const SHADOW = "3px 3px 0px #000"
const SHADOW_L = "5px 5px 0px #000"

const paperCard = {
  background: PAPER,
  border: `2px solid ${INK}`,
  boxShadow: SHADOW,
  color: INK,
}

// ── Rank tiers ─────────────────────────────────────────────────────────────────
const RANK_TIERS = [
  { min: 0, label: "MENSAJERO", color: PAPER_S },
  { min: 2, label: "COORDINADOR DE RUTA", color: "#3b7a5a" },
  { min: 5, label: "OFICIAL DE LOGÍSTICA", color: "#8f581e" },
  { min: 10, label: "JEFE DE OPERACIONES", color: AMB },
  { min: 20, label: "COMANDANTE MÓVIL", color: "#b38536" },
]

function getRank(score: number) {
  return [...RANK_TIERS].reverse().find((t) => score >= t.min) ?? RANK_TIERS[0]
}
function getNextRank(score: number) {
  return RANK_TIERS.find((t) => t.min > score) ?? null
}

// ── Trophies ───────────────────────────────────────────────────────────────────
interface TrophyDef {
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

interface TravelStats {
  totalTransfers: number
  totalPersons: number
  activeExplorations: number
  pendingTransfers: number
}

function buildTrophies(s: TravelStats): TrophyDef[] {
  return [
    {
      id: "coordinador",
      name: "COORDINADOR ACTIVO",
      description: "Accediste al sistema como Travel Manager.",
      icon: "📡",
      rarity: 1,
      unlocked: true,
    },
    {
      id: "primera_ruta",
      name: "PRIMERA RUTA",
      description: "Al menos 1 traslado registrado en el sistema.",
      icon: "🚗",
      rarity: 1,
      unlocked: s.totalTransfers >= 1,
      progress: Math.min(100, s.totalTransfers * 100),
      progressLabel: `${s.totalTransfers}/1`,
    },
    {
      id: "equipo_campo",
      name: "EQUIPO DE CAMPO",
      description: "5+ personas en el campamento bajo coordinación.",
      icon: "👥",
      rarity: 2,
      unlocked: s.totalPersons >= 5,
      progress: Math.min(100, (s.totalPersons / 5) * 100),
      progressLabel: `${s.totalPersons}/5`,
    },
    {
      id: "ojo_mando",
      name: "OJO DE MANDO",
      description: "Al menos 1 expedición activa monitoreada.",
      icon: "🔭",
      rarity: 2,
      unlocked: s.activeExplorations >= 1,
      progress: Math.min(100, s.activeExplorations * 100),
      progressLabel: `${s.activeExplorations}/1`,
    },
    {
      id: "logistico",
      name: "LOGÍSTICO EFICIENTE",
      description: "5+ traslados gestionados con éxito.",
      icon: "📦",
      rarity: 3,
      unlocked: s.totalTransfers >= 5,
      progress: Math.min(100, (s.totalTransfers / 5) * 100),
      progressLabel: `${s.totalTransfers}/5`,
    },
    {
      id: "coordinacion_avanzada",
      name: "COORDINACIÓN AVANZADA",
      description: "10+ personas bajo supervisión directa.",
      icon: "🏕️",
      rarity: 3,
      unlocked: s.totalPersons >= 10,
      progress: Math.min(100, (s.totalPersons / 10) * 100),
      progressLabel: `${s.totalPersons}/10`,
    },
    {
      id: "veterano_ruta",
      name: "VETERANO DE RUTA",
      description: "10+ traslados completados en el sistema.",
      icon: "🗺️",
      rarity: 4,
      unlocked: s.totalTransfers >= 10,
      progress: Math.min(100, (s.totalTransfers / 10) * 100),
      progressLabel: `${s.totalTransfers}/10`,
    },
    {
      id: "explorador_monitor",
      name: "MONITOR DE CAMPO",
      description: "5+ expediciones monitoreadas activamente.",
      icon: "🧭",
      rarity: 4,
      unlocked: s.activeExplorations >= 5,
      progress: Math.min(100, (s.activeExplorations / 5) * 100),
      progressLabel: `${s.activeExplorations}/5`,
    },
    {
      id: "red_vial",
      name: "RED VIAL COMPLETA",
      description: "20+ personas coordinadas en el campamento.",
      icon: "🌐",
      rarity: 4,
      unlocked: s.totalPersons >= 20,
      progress: Math.min(100, (s.totalPersons / 20) * 100),
      progressLabel: `${s.totalPersons}/20`,
    },
    {
      id: "maestro",
      name: "MAESTRO COORDINADOR",
      description: "20+ traslados gestionados. Rango máximo alcanzado.",
      icon: "👑",
      rarity: 5,
      unlocked: s.totalTransfers >= 20,
      progress: Math.min(100, (s.totalTransfers / 20) * 100),
      progressLabel: `${s.totalTransfers}/20`,
    },
  ]
}

// ── Trophy modal ───────────────────────────────────────────────────────────────
function TrophyModal({ trophy, onClose }: { trophy: TrophyDef | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {trophy && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
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
            style={{
              position: "relative",
              zIndex: 1,
              background: PAPER,
              border: `3px solid ${INK}`,
              boxShadow: SHADOW_L,
              padding: "36px 32px",
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
              color: INK,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -10,
                left: "50%",
                transform: "translateX(-50%)",
                background: "#ab9e8b",
                width: 80,
                height: 20,
                border: `1px dashed ${INK}`,
                opacity: 0.85,
              }}
            />
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: PAPER_D,
                border: `1px solid ${INK}`,
                cursor: "pointer",
                padding: "2px 6px",
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: "0.9rem",
              }}
            >
              ✕
            </button>
            <div
              style={{
                fontSize: "3.5rem",
                lineHeight: 1,
                marginBottom: 14,
                filter: trophy.unlocked ? "none" : "grayscale(1) opacity(0.35)",
              }}
            >
              {trophy.icon}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.55rem",
                color: PAPER_S,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {RARITY_LABEL[trophy.rarity]} · {trophy.unlocked ? "✓ DESBLOQUEADO" : "✗ BLOQUEADO"}
            </div>
            <div
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "1.1rem",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 12,
                borderBottom: `1px dashed ${PAPER_S}`,
                paddingBottom: 10,
              }}
            >
              {trophy.name}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.72rem",
                color: PAPER_S,
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {trophy.description}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 14 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < trophy.rarity ? "fill-current" : ""}`}
                  style={{ color: i < trophy.rarity ? PAPER_S : "#c5bfb4" }}
                />
              ))}
            </div>
            {!trophy.unlocked && trophy.progress !== undefined && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "monospace",
                    fontSize: "0.6rem",
                    color: PAPER_S,
                    textTransform: "uppercase",
                    marginBottom: 5,
                  }}
                >
                  <span>PROGRESO</span>
                  <span>{trophy.progressLabel}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: PAPER_D,
                    border: `1px solid ${INK}`,
                    overflow: "hidden",
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${trophy.progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ height: "100%", background: PAPER_S }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              style={{
                marginTop: 20,
                background: INK,
                color: PAPER,
                border: `2px solid ${INK}`,
                fontFamily: "'Special Elite', monospace",
                fontWeight: 900,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: 2,
                padding: "8px 24px",
                cursor: "pointer",
                boxShadow: "2px 2px 0 #444",
              }}
            >
              CERRAR
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function TravelProfile() {
  const { user } = useAuthStore()
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyDef | null>(null)

  const baseCampId = user?.camp_id ? String(user.camp_id) : ""

  const { data: transfers = [] } = useQuery({
    queryKey: ["transfers", baseCampId],
    queryFn: () => getCampTransfers(baseCampId),
    enabled: !!baseCampId,
  })

  const { data: explorations = [] } = useQuery({
    queryKey: ["explorations", baseCampId],
    queryFn: () => getExplorations({ campId: baseCampId }),
    enabled: !!baseCampId,
  })

  const { data: personsResponse } = useQuery({
    queryKey: ["persons", baseCampId],
    queryFn: () => getPersons({ campId: baseCampId, limit: 1000 }),
    enabled: !!baseCampId,
  })
  const persons = personsResponse?.data ?? []

  const activeExplorations = explorations.filter((e) => {
    const key = String(e.status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    return key === "active" || key === "in_progress"
  })
  const pendingTransfers = transfers.filter((t) => {
    const key = String(t.status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    return key === "pending"
  })

  const stats: TravelStats = {
    totalTransfers: transfers.length,
    totalPersons: persons.length,
    activeExplorations: activeExplorations.length,
    pendingTransfers: pendingTransfers.length,
  }

  const rankScore = stats.totalTransfers
  const rank = getRank(rankScore)
  const nextRank = getNextRank(rankScore)
  const rankProgress = nextRank
    ? Math.min(100, Math.round(((rankScore - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100

  const trophies = buildTrophies(stats)
  const unlockedCount = trophies.filter((t) => t.unlocked).length

  const prefix = (user?.username ?? "TRV").slice(0, 3).toUpperCase()
  const suffix = String(user?.id ?? "0000")
    .slice(-4)
    .padStart(4, "0")
  const idCode = `TRV-${prefix}-${suffix}`

  return (
    <div
      className="overflow-y-auto custom-scrollbar h-full"
      style={{
        background: "#0d0c0b",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          borderBottom: `4px solid ${INK}`,
          paddingBottom: 18,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: "1.5rem",
              fontWeight: 900,
              color: PAPER,
              textTransform: "uppercase",
              letterSpacing: 3,
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: 0,
            }}
          >
            <FileText className="w-7 h-7 shrink-0" />
            EXPEDIENTE DEL COORDINADOR
          </h2>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: PAPER_D,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            SISTEMA CENTRAL · REGISTRO DE MOVILIDAD
          </p>
        </div>
        <div
          style={{
            background: "#ab9e8b",
            border: `2px dashed ${INK}`,
            fontFamily: "'Special Elite', monospace",
            fontWeight: 900,
            fontSize: "0.75rem",
            textTransform: "uppercase",
            padding: "4px 16px",
            transform: "rotate(-1deg)",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
            color: INK,
            letterSpacing: 2,
          }}
        >
          CONFIDENCIAL
        </div>
      </div>

      {/* ── ID CARD ── */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 130 }}
        style={{
          ...paperCard,
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          overflow: "hidden",
        }}
      >
        {/* Left column */}
        <div
          style={{
            background: PAPER_D,
            borderRight: `2px solid ${INK}`,
            padding: "24px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: PAPER_S,
              border: `2px solid ${INK}`,
              boxShadow: "2px 2px 0 #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "2.2rem",
                fontWeight: 900,
                color: INK,
              }}
            >
              {(user?.username ?? "T")[0].toUpperCase()}
            </span>
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "0.55rem",
              color: PAPER_S,
              letterSpacing: 2,
              textTransform: "uppercase",
              border: `1px solid ${PAPER_S}`,
              padding: "2px 8px",
            }}
          >
            {idCode}
          </div>
          <div
            style={{
              background: INK,
              color: PAPER,
              fontFamily: "monospace",
              fontSize: "0.5rem",
              fontWeight: 900,
              padding: "4px 10px",
              textTransform: "uppercase",
              letterSpacing: 2,
              textAlign: "center",
            }}
          >
            {rank.label}
          </div>
          <div
            style={{
              background: PAPER,
              border: `1px solid ${INK}`,
              fontFamily: "monospace",
              fontSize: "0.6rem",
              fontWeight: 900,
              color: INK,
              padding: "3px 10px",
              letterSpacing: 1,
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Trophy className="w-3 h-3" />
            {unlockedCount}/{trophies.length}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {Array.from({ length: RANK_TIERS.indexOf(rank) + 1 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 200 }}
                style={{ color: INK, fontSize: "1rem" }}
              >
                ★
              </motion.span>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 0 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "0.55rem",
              color: PAPER_S,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 12,
              borderBottom: `1px dashed ${PAPER_S}`,
              paddingBottom: 8,
            }}
          >
            [ DOCUMENTO CLASIFICADO — NIVEL COORDINACIÓN ]
          </div>
          {[
            { label: "IDENTIFICADOR", value: (user?.username ?? "N/D").toUpperCase() },
            { label: "ROL DEL SISTEMA", value: "TRAVEL MANAGER" },
            { label: "CAMPAMENTO BASE", value: `#${user?.camp_id ?? "?"}` },
            { label: "TRASLADOS GESTIONADOS", value: `${stats.totalTransfers}` },
            { label: "PERSONAL A CARGO", value: `${stats.totalPersons} PERSONAS` },
            { label: "EXPEDICIONES ACTIVAS", value: `${stats.activeExplorations}` },
            { label: "TRASLADOS PENDIENTES", value: `${stats.pendingTransfers}` },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "7px 0",
                borderBottom: `1px dashed ${PAPER_S}40`,
                fontFamily: "monospace",
              }}
            >
              <span
                style={{
                  fontSize: "0.62rem",
                  color: PAPER_S,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 900,
                  color: INK,
                  textTransform: "uppercase",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "monospace",
                fontSize: "0.58rem",
                color: PAPER_S,
                textTransform: "uppercase",
                marginBottom: 5,
              }}
            >
              <span style={{ fontWeight: 900 }}>{rank.label}</span>
              <span>
                {nextRank ? `→ ${nextRank.label} (${rankScore}/${nextRank.min})` : "RANGO MÁXIMO"}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: PAPER_D,
                border: `1px solid ${INK}`,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rankProgress}%` }}
                transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
                style={{ height: "100%", background: INK }}
              />
            </div>
            <div
              style={{ fontFamily: "monospace", fontSize: "0.55rem", color: PAPER_S, marginTop: 4 }}
            >
              {rankProgress}% AL SIGUIENTE RANGO
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── STATS BAR ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { label: "TRASLADOS", value: stats.totalTransfers },
          { label: "PERSONAL", value: stats.totalPersons },
          { label: "EXPEDICIONES", value: stats.activeExplorations },
          { label: "PENDIENTES", value: stats.pendingTransfers },
        ].map((s) => (
          <div key={s.label} style={{ ...paperCard, padding: "16px 12px", textAlign: "center" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.55rem",
                color: PAPER_S,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "2.4rem",
                fontWeight: 900,
                color: INK,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── TROPHY GRID ── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 110, delay: 0.15 }}
        style={{ ...paperCard }}
      >
        <div
          style={{
            background: INK,
            color: PAPER,
            padding: "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: "1rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 3,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Award className="w-5 h-5" />
            SALA DE TROFEOS
          </h3>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.65rem",
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            {unlockedCount}/{trophies.length} OBTENIDOS
          </span>
        </div>
        <div
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 14,
          }}
        >
          {trophies.map((trophy, i) => (
            <motion.div
              key={trophy.id}
              initial={{ scale: 0, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.06, rotate: -2, zIndex: 10 }}
              onClick={() => setSelectedTrophy(trophy)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedTrophy(trophy)}
              style={{
                background: trophy.unlocked ? PAPER_D : PAPER_S,
                border: `2px solid ${INK}`,
                boxShadow: trophy.unlocked ? SHADOW : "2px 2px 0 #000",
                padding: "16px 10px",
                textAlign: "center",
                cursor: "pointer",
                color: INK,
                position: "relative",
                opacity: trophy.unlocked ? 1 : 0.55,
                filter: trophy.unlocked ? "none" : "grayscale(0.5)",
              }}
            >
              {trophy.unlocked && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: -1,
                    background: INK,
                    fontFamily: "monospace",
                    fontSize: "0.42rem",
                    fontWeight: 900,
                    color: PAPER,
                    padding: "2px 5px",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {RARITY_LABEL[trophy.rarity][0]}
                </div>
              )}
              <div style={{ fontSize: "2rem", lineHeight: 1, marginBottom: 8 }}>{trophy.icon}</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontWeight: 900,
                  fontSize: "0.58rem",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                {trophy.name}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 6 }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <span
                    key={si}
                    style={{ color: si < trophy.rarity ? INK : PAPER, fontSize: "0.6rem" }}
                  >
                    ★
                  </span>
                ))}
              </div>
              {!trophy.unlocked && trophy.progress !== undefined && (
                <div
                  style={{
                    height: 3,
                    background: PAPER_S,
                    border: `1px solid ${INK}`,
                    overflow: "hidden",
                    marginTop: 4,
                  }}
                >
                  <div style={{ height: "100%", width: `${trophy.progress}%`, background: INK }} />
                </div>
              )}
              {trophy.unlocked && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: INK,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── NOTES ── */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 110, delay: 0.28 }}
        style={{ ...paperCard, padding: "20px 24px" }}
      >
        <h4
          style={{
            fontFamily: "monospace",
            fontSize: "0.65rem",
            color: INK,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 900,
          }}
        >
          <Radio className="w-4 h-4" /> DIRECTIVA DE COORDINACIÓN
        </h4>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: PAPER_S,
            lineHeight: 1.7,
            fontStyle: "italic",
            borderLeft: `3px solid ${INK}`,
            paddingLeft: 14,
            margin: 0,
          }}
        >
          &quot;La movilidad entre campamentos es el pulso de la red de supervivencia. Cada traslado
          autorizado, cada expedición coordinada, refuerza nuestra capacidad colectiva de resistir.
          Mantén las rutas abiertas y el personal informado.&quot;
        </p>
        <div
          style={{
            marginTop: 10,
            fontFamily: "monospace",
            fontSize: "0.55rem",
            color: PAPER_S,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          — PROTOCOLO BRAVO · NIVEL DE ACCESO: COORDINACIÓN
        </div>
      </motion.div>

      <div style={{ height: 20 }} />
      <TrophyModal trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />
    </div>
  )
}

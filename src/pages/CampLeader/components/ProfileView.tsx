import { motion, AnimatePresence } from "framer-motion"
import {
  Award,
  CheckCircle,
  FileText,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react"
import { useState } from "react"

import Badge, { ACHIEVEMENTS_DICT } from "./Badge"

import type { Person, CampStatistics } from "../types"
import type { AuthUser } from "@/types/api.types"

interface ProfileViewProps {
  user: AuthUser | null
  statistics: CampStatistics
  residents: Person[]
}

function getRankInfo(score: number) {
  if (score >= 900)
    return {
      label: "LEYENDA DEL PARAMO",
      color: "#fca311",
      nextThreshold: null,
      prevThreshold: 900,
    }
  if (score >= 600)
    return { label: "COMANDANTE", color: "#c27c2f", nextThreshold: 900, prevThreshold: 600 }
  if (score >= 300)
    return { label: "VETERANO", color: "#ab9e8b", nextThreshold: 600, prevThreshold: 300 }
  if (score >= 100)
    return { label: "EXPLORADOR", color: "#3b7a5a", nextThreshold: 300, prevThreshold: 100 }
  return { label: "RECLUTA", color: "#71717a", nextThreshold: 100, prevThreshold: 0 }
}

export default function ProfileView({ user, statistics, residents }: ProfileViewProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const rank = getRankInfo(statistics.survival_score)
  const rankProgress =
    rank.nextThreshold !== null
      ? Math.min(
          100,
          ((statistics.survival_score - rank.prevThreshold) /
            (rank.nextThreshold - rank.prevThreshold)) *
            100,
        )
      : 100

  // Status color badges
  const getStatusBadge = (status: Person["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
            ACTIVO
          </span>
        )
      case "sick":
        return (
          <span className="bg-amber-950/40 text-amber-500 border border-amber-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
            ENFERMO
          </span>
        )
      case "injured":
        return (
          <span className="bg-red-950/40 text-red-400 border border-red-500/35 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
            LESIONADO
          </span>
        )
      case "exploring":
        return (
          <span className="bg-blue-950/40 text-blue-400 border border-blue-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">
            EMBARCADO
          </span>
        )
      case "deceased":
        return (
          <span className="bg-zinc-900 border border-zinc-700 text-[9px] text-zinc-500 font-mono px-1.5 py-0.5 rounded uppercase font-bold">
            FALLECIDO
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#c27c2f] pb-5">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider">
            EXPEDIENTE DEL REFUGIO
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
            REGISTRO VITAL · BUNKER ALFA
          </p>
        </div>
        <div className="vintage-tape shrink-0 text-sm px-4 py-2">CONFIDENCIAL</div>
      </div>

      {/* COMANDANTE + ESTADÍSTICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COL 1: COMANDANTE */}
        <div
          id="commander-manifest-card"
          className="bg-[#e8dcc8] text-black border-2 border-black shadow-[5px_5px_0_#000] p-6 flex flex-col gap-5"
          style={{ borderLeft: `6px solid ${rank.color}` }}
        >
          <div>
            <span className="font-mono text-xs font-bold text-black/40 block uppercase tracking-widest">
              IDENTIFICACIÓN — CONSEJO MILITAR
            </span>
            <h3 className="font-typewriter text-xl font-bold text-black uppercase mt-1">
              COMANDANCIA ALFA
            </h3>
          </div>

          <div className="border-2 border-black/20 p-4 bg-black/5 space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-black/50 uppercase font-bold">NOMBRE:</span>
              <span className="font-bold text-black uppercase truncate ml-3">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/50 uppercase font-bold">ROL:</span>
              <span className="font-bold text-black">LÍDER DE CAMPAMENTO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/50 uppercase font-bold">BASE:</span>
              <span className="font-bold text-[#9c2720]">REFUGIO CENTRAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black/50 uppercase font-bold">RANGO:</span>
              <span className="font-bold uppercase" style={{ color: rank.color }}>
                {rank.label}
              </span>
            </div>
          </div>

          {/* PUNTUACIÓN */}
          <div className="border-2 border-black/20 p-4 bg-black/5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider">
                PUNTUACIÓN DE SUPERVIVENCIA
              </span>
              <Trophy className="w-4 h-4 text-black/40" />
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="font-typewriter text-5xl font-black" style={{ color: rank.color }}>
                {statistics.survival_score}
              </span>
              <span className="font-mono text-sm text-black/50 uppercase mb-1">PTS</span>
            </div>
            <div className="w-full h-2.5 bg-black/15 border border-black/20 overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${rankProgress}%`, backgroundColor: rank.color }}
              />
            </div>
            {rank.nextThreshold !== null && (
              <p className="font-mono text-xs text-black/50 mt-2 uppercase">
                FALTAN {rank.nextThreshold - statistics.survival_score} PTS PARA{" "}
                {getRankInfo(rank.nextThreshold).label}
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 border-t-2 border-black/15 pt-4 mt-auto">
            <Shield className="w-5 h-5 text-black/40 shrink-0 mt-0.5" />
            <p className="text-sm font-mono text-black/60 uppercase leading-5">
              EL COMANDANTE ASUME RESPONSABILIDAD POR LAS BAJAS EN ZONA MUERTA.
            </p>
          </div>
        </div>

        {/* COL 2-3: ESTADÍSTICAS */}
        <div
          id="bunker-audit-card"
          className="bg-[#e8dcc8] text-black border-2 border-black shadow-[5px_5px_0_#000] p-6 flex flex-col gap-6 col-span-1 lg:col-span-2"
          style={{ borderLeft: "6px solid #4c6351" }}
        >
          <div className="flex items-center gap-3 border-b-2 border-black/15 pb-4">
            <Users className="w-5 h-5 text-black/40" />
            <h3 className="font-typewriter text-xl font-bold text-black uppercase tracking-wider">
              INFORME BUNKER ALFA-01
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "POBLACIÓN",
                value: statistics.total_persons,
                sub: "SOBREVIVIENTES",
                color: "#c27c2f",
              },
              {
                label: "MANO DE OBRA",
                value: statistics.active_workers,
                sub: "ACTIVOS",
                color: "#4c6351",
              },
              {
                label: "EN EXPEDICIÓN",
                value: statistics.exploring,
                sub: "EMBARCADOS",
                color: "#3b6fa0",
              },
              {
                label: "BAJAS / HERIDOS",
                value: statistics.injured_or_sick,
                sub: "EN CUIDADOS",
                color: "#9c2720",
              },
            ].map((s) => (
              <div key={s.label} className="border-2 border-black/20 p-4 text-center bg-black/5">
                <span className="text-xs font-mono text-black/50 block uppercase mb-2 font-bold">
                  {s.label}
                </span>
                <span
                  className="font-typewriter text-4xl font-bold block"
                  style={{ color: s.color }}
                >
                  {s.value}
                </span>
                <span className="text-xs font-mono text-black/40 block uppercase mt-2">
                  {s.sub}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-black/15 pt-4">
            <div className="flex gap-3 items-center">
              <TrendingUp className="w-5 h-5 text-black/40 shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-mono text-black/50 font-bold block uppercase mb-2">
                  OCUPACIÓN BUNKER
                </span>
                <div className="w-full h-2.5 bg-black/15 border border-black/20 overflow-hidden">
                  <div
                    className="bg-[#c27c2f] h-full"
                    style={{ width: `${statistics.occupancy_rate}%` }}
                  />
                </div>
                <span className="text-xs text-black/50 font-mono mt-1 block">
                  {statistics.occupancy_rate}% OCUPADO
                </span>
              </div>
            </div>
            <div className="flex gap-3 items-center justify-end">
              <Award className="w-5 h-5 text-black/40" />
              <div className="text-right">
                <span className="text-sm font-mono text-black/50 font-bold block uppercase">
                  EXPEDICIONES EXITOSAS
                </span>
                <span className="font-typewriter text-3xl font-bold text-black">
                  {statistics.explorations_completed}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PERSONAL DEL BUNKER */}
      <div id="citizens-manifest-section" className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#c27c2f]" />
          <h3 className="font-typewriter text-xl font-bold tracking-wider text-[#fca311] uppercase">
            PERSONAL EN BUNKER ALFA
          </h3>
          <span className="ml-auto font-mono text-sm text-[#9a8a74]">{residents.length} REG.</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {residents.map((p) => {
            const levelStars = Array.from({ length: p.experience_level ?? 0 }, (_, i) => i)

            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPerson(p)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedPerson(p)}
                className="bg-[#e8dcc8] text-black border-2 border-black shadow-[3px_3px_0_#000] p-5 flex gap-4 hover:shadow-[5px_5px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-pointer select-none"
              >
                {/* Avatar */}
                <div className="w-14 h-14 border-2 border-black shrink-0 flex items-center justify-center overflow-hidden bg-black/10">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.first_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter contrast-110 saturate-50"
                    />
                  ) : (
                    <User className="w-6 h-6 text-black/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-typewriter text-base font-bold text-black uppercase truncate">
                      {p.first_name} {p.last_name}
                    </h4>
                    {getStatusBadge(p.status)}
                  </div>

                  <p className="font-mono text-xs text-black/60 uppercase mb-2">
                    {p.profession?.name ?? "Desconocida"}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-0.5 text-[#c27c2f]">
                      {levelStars.map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-mono text-xs text-black/50">
                      EXPED: <span className="font-bold text-black">{p.expeditionsSurvived}</span>
                    </span>
                  </div>

                  {p.achievements && p.achievements.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.achievements.slice(0, 3).map((ach) => (
                        <Badge key={ach} code={ach} showText={false} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* DOSSIER MODAL - GAMIFICACION */}
      <AnimatePresence>
        {selectedPerson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerson(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Body Card */}
            <motion.div
              id="person-modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative max-w-xl w-full bg-[#161513] border-2 border-[#c27c2f] rounded shadow-[8px_8px_0px_#000000] p-6 text-left text-zinc-100 overflow-y-auto max-h-[90vh] z-20"
            >
              {/* Retro top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#c27c2f] via-zinc-900 to-[#c27c2f] animate-pulse" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedPerson(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white hover:bg-zinc-900/60 p-1.5 border border-zinc-700 rounded transition-all duration-150 cursor-pointer"
                title="Cerrar Expediente"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Stamp Tab */}
              <div className="vintage-tape mb-6 mt-2">
                EXPEDIENTE MILITAR CLASIFICADO: #{selectedPerson.id}
              </div>

              {/* Modal Grid: AVATAR + STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-5 border-b border-[#3b4d3e]/40">
                {/* Avatar */}
                <div className="sm:col-span-1 flex flex-col items-center">
                  <div className="w-32 h-32 bg-zinc-950 border-2 border-zinc-800 rounded overflow-hidden relative shadow-[4px_4px_0px_rgba(0,0,0,0.7)]">
                    {selectedPerson.photo_url ? (
                      <img
                        src={selectedPerson.photo_url}
                        alt={selectedPerson.first_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover filter contrast-125 saturate-50"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                        <User className="w-12 h-12 text-zinc-600 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-red-950/80 px-1 py-0.5 rounded text-[8px] text-red-500 font-bold border border-red-800 tracking-widest font-mono">
                      RAD-BIO
                    </div>
                  </div>
                  <div className="mt-4 w-full text-center">
                    {getStatusBadge(selectedPerson.status)}
                  </div>
                </div>

                {/* Profile Details */}
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">
                      [SUJETO ARCHIVADO]
                    </span>
                    <h3 className="font-typewriter text-2xl font-bold text-white uppercase tracking-wider leading-none mt-1">
                      {selectedPerson.first_name} {selectedPerson.last_name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-black/60 p-3 rounded border border-[#3b4d3e]/30 font-mono">
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">
                        PROFESION
                      </span>
                      <span className="text-white font-bold block truncate mt-0.5">
                        {selectedPerson.profession?.name ?? "Desconocida"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">
                        VIAJES SUPERADOS
                      </span>
                      <span className="text-emerald-400 font-bold block mt-0.5">
                        {selectedPerson.expeditionsSurvived} EXITOSAS
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">
                        PUNTOS DE COMBATE
                      </span>
                      <span className="text-[#fca311] font-bold block mt-0.5">
                        {selectedPerson.experience_points} EXP PTS
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] font-bold uppercase">
                        LOGISTICA / RANGO
                      </span>
                      <div className="flex text-amber-500 mt-0.5">
                        {Array.from({ length: selectedPerson.experience_level ?? 0 }).map(
                          (_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-current shrink-0" />
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Psych Notes */}
              <div className="py-4 space-y-1.5">
                <h4 className="text-[10px] text-[#fca311] tracking-widest font-bold uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#c27c2f]" /> NOTAS PSICOLÓGICAS Y DE
                  CAMPAMENTO:
                </h4>
                <p className="bg-neutral-950/60 p-3 rounded text-[11.5px] leading-4 text-zinc-300 border border-zinc-900 italic font-mono">
                  &quot;
                  {selectedPerson.previous_skills ||
                    "No existen antecedentes psiquiatricos reportados para este sobreviviente en las terminales."}
                  &quot;
                </p>
              </div>

              {/* LOGROS CLASIFICADOS - GAMIFICACION */}
              <div className="pt-2 pb-1 space-y-2.5">
                <h4 className="text-[10px] text-[#ab9e8b] tracking-widest font-bold uppercase flex items-center gap-1.5 border-t border-zinc-900 pt-4">
                  <Award className="w-4 h-4 text-[#fca311]" /> LOGROS CLASIFICADOS:
                </h4>

                {selectedPerson.achievements && selectedPerson.achievements.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {selectedPerson.achievements.map((achCode) => (
                      <div
                        key={achCode}
                        className="flex items-start gap-3 bg-black/40 p-2.5 rounded border border-[#3b4d3e]/20"
                      >
                        <div className="shrink-0 pt-0.5">
                          <Badge code={achCode} showText={false} />
                        </div>
                        <div className="text-[11px] space-y-0.5 font-mono">
                          <p className="font-bold text-[#fafafa] uppercase tracking-wider text-[11px]">
                            {ACHIEVEMENTS_DICT[achCode]?.name || achCode}
                          </p>
                          <p className="text-zinc-400 text-[10px] leading-3.5 italic">
                            {ACHIEVEMENTS_DICT[achCode]?.description ||
                              "Sin descripcion disponible para esta medalla de servicio militar."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center bg-zinc-900/20 rounded border border-dashed border-zinc-800/40 opacity-55">
                    <span className="text-[11px] text-zinc-500 font-mono font-bold uppercase tracking-wider">
                      - SIN LOGROS REGISTRADOS -
                    </span>
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="mt-5 pt-3.5 border-t border-zinc-900 flex justify-end">
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="cursor-pointer px-4 py-1.5 text-xs text-black font-bold uppercase tracking-widest bg-[#c27c2f] border border-amber-900 hover:bg-amber-500 transition-colors rounded"
                >
                  Cerrar Expediente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Trophy, RefreshCw, ShieldAlert, Flame, Droplet } from "lucide-react"
import { useEffect } from "react"

import { api } from "../config/api"

interface RankEntry {
  rank: number
  person_id: number
  name: string
  profession: string
  food_production: number
  water_production: number
  total_production: number
  experience_level: number
}

interface ManagerRankingProps {
  campId: string
  refreshTrigger: number
}

const PROF_EMOJI: Record<string, string> = {
  farmer: "🌾",
  cocinero: "🍳",
  cook: "🍳",
  doctor: "⚕️",
  medico: "⚕️",
  médico: "⚕️",
  engineer: "⚙️",
  ingeniero: "⚙️",
  soldier: "⚔️",
  guardia: "⚔️",
  scavenger: "🎒",
  recolector: "🎒",
  aguatero: "💧",
  almacenista: "📦",
}

function getProfEmoji(profession: string) {
  const key = profession.toLowerCase()
  for (const [k, v] of Object.entries(PROF_EMOJI)) {
    if (key.includes(k)) return v
  }
  return "👤"
}

const MEDAL: Record<number, { label: string; color: string }> = {
  1: { label: "ORO", color: "#f59e0b" },
  2: { label: "PLATA", color: "#94a3b8" },
  3: { label: "BRONCE", color: "#b45309" },
}

export default function ManagerRanking({ campId, refreshTrigger }: ManagerRankingProps) {
  const {
    data: ranking = [],
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["managerRanking", campId],
    queryFn: async () => {
      const res = await api.get(`/resources/production-ranking/${campId}`)
      return (Array.isArray(res.data) ? res.data : []) as RankEntry[]
    },
    staleTime: 1000 * 60 * 2,
  })

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  const error = queryError ? (queryError as any).message || "Error al cargar ranking." : null

  if (isLoading) return <div className="min-h-[400px]" />

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-start gap-6 bg-[#1a1a1a] border-2 border-black p-6 md:p-10 font-mono">
        <div>
          <h3 className="text-lg md:text-xl font-black text-[#c27c2f] uppercase tracking-wider flex items-center gap-3">
            <Trophy className="h-6 w-6" /> RANKING DE PRODUCTIVIDAD
          </h3>
          <p className="text-sm text-zinc-500 mt-1 uppercase">
            Clasificación por producción diaria estimada.
          </p>
        </div>
      </div>

      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-200 font-mono text-xs p-3.5 flex items-start gap-4">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>
            <span className="font-bold">ERROR:</span> {error}
          </span>
        </div>
      )}

      {ranking.length === 0 ? (
        <div className="border-2 border-black bg-[#161513] p-10 text-center text-zinc-600 font-mono uppercase text-xs tracking-widest">
          SIN TRABAJADORES ACTIVOS EN EL CAMPAMENTO
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map((entry) => {
            const medal = MEDAL[entry.rank]
            const maxTotal = ranking[0]?.total_production || 1
            const barPct = Math.round((entry.total_production / maxTotal) * 100)

            return (
              <motion.div
                key={entry.person_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: entry.rank * 0.04 }}
                className="border-2 border-black bg-[#161513] font-mono overflow-hidden"
              >
                <div className="flex items-center gap-4 p-5 md:p-6">
                  {/* Rank */}
                  <div
                    className="shrink-0 w-12 h-12 flex items-center justify-center border-2 border-black font-black text-xl"
                    style={{
                      backgroundColor: medal ? medal.color + "22" : "#2a2824",
                      color: medal ? medal.color : "#9a8a7a",
                      borderColor: medal ? medal.color : "#2a2824",
                    }}
                  >
                    {medal ? "★" : `#${entry.rank}`}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl">{getProfEmoji(entry.profession)}</span>
                      <span className="font-black text-[#e0d8cc] uppercase text-base">
                        {entry.name.toUpperCase()}
                      </span>
                      {medal && (
                        <span
                          className="text-xs border px-2 py-0.5 font-black uppercase"
                          style={{ color: medal.color, borderColor: medal.color }}
                        >
                          {medal.label}
                        </span>
                      )}
                      <span className="text-xs text-zinc-600 uppercase border border-zinc-700 px-2 py-0.5">
                        NVL {entry.experience_level}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 uppercase mt-1">{entry.profession}</div>
                    {/* Bar */}
                    <div className="mt-2 w-full bg-[#121110] border border-black h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full"
                        style={{ backgroundColor: medal ? medal.color : "#c27c2f" }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 text-right space-y-1.5 w-24">
                    <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-black text-sm">
                      <Flame className="h-3.5 w-3.5 shrink-0" />
                      <span>+{entry.food_production}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-blue-400 font-black text-sm">
                      <Droplet className="h-3.5 w-3.5 shrink-0" />
                      <span>+{entry.water_production}</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-1.5">
                      <div className="text-xl font-black text-[#c27c2f]">
                        {entry.total_production}
                      </div>
                      <div className="text-xs text-zinc-600 uppercase tracking-wide">TOTAL/DÍA</div>
                    </div>
                  </div>
                </div>

                {/* Bottom accent for top 3 */}
                {medal && <div className="h-0.5 w-full" style={{ backgroundColor: medal.color }} />}
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => refetch()}
          className="cursor-pointer flex items-center gap-2 mx-auto border-2 border-zinc-700 text-zinc-500 hover:text-[#c27c2f] hover:border-[#c27c2f] px-5 py-2 text-xs font-black uppercase transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> ACTUALIZAR DATOS
        </button>
      </div>
    </motion.div>
  )
}

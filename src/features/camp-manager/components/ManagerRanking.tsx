/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { RefreshCw, ShieldAlert, Flame, Droplet } from "lucide-react"
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
      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-200 font-mono text-xs p-3.5 flex items-start gap-4">
          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>
            <span className="font-bold">ERROR:</span> {error}
          </span>
        </div>
      )}

      {ranking.length === 0 ? (
        <div
          style={{
            backgroundColor: "#cec8b6",
            border: "1px solid rgba(0,0,0,0.2)",
            padding: "40px",
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            color: "#9a8a6a",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          SIN TRABAJADORES ACTIVOS EN EL CAMPAMENTO
        </div>
      ) : (
        <div className="space-y-5">
          {ranking.map((entry, idx) => {
            const medal = MEDAL[entry.rank]
            const maxTotal = ranking[0]?.total_production || 1
            const barPct = Math.round((entry.total_production / maxTotal) * 100)
            const paperBg =
              entry.rank === 1
                ? "#e8e0c0"
                : entry.rank === 2
                  ? "#dcdcd8"
                  : entry.rank === 3
                    ? "#e0d4c0"
                    : "#d8d2bf"
            const rotation = idx % 2 === 0 ? -0.8 : 0.6
            const accentColor = medal?.color ?? "#6a4a1a"

            return (
              <motion.div
                key={entry.person_id}
                initial={{ opacity: 0, x: -20, rotate: rotation - 2 }}
                animate={{ opacity: 1, x: 0, rotate: rotation }}
                whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
                transition={{ delay: entry.rank * 0.05, type: "spring", stiffness: 120 }}
                style={{
                  backgroundColor: paperBg,
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
                  border: "1px solid rgba(0,0,0,0.18)",
                  borderLeft: `4px solid ${accentColor}`,
                  boxShadow: "-3px 8px 24px rgba(0,0,0,0.7)",
                  position: "relative",
                  overflow: "hidden",
                  color: "#1a1208",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                {/* Rank badge */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `2px solid ${accentColor}`,
                    fontFamily: "monospace",
                    fontWeight: 900,
                    fontSize: medal ? "1.4rem" : "1rem",
                    color: accentColor,
                    backgroundColor: `${accentColor}18`,
                  }}
                >
                  {medal ? "★" : `#${entry.rank}`}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>
                      {getProfEmoji(entry.profession)}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "1rem",
                        textTransform: "uppercase",
                        color: "#0d0a04",
                        letterSpacing: "1px",
                      }}
                    >
                      {entry.name.toUpperCase()}
                    </span>
                    {medal && (
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.65rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: accentColor,
                          border: `1px solid ${accentColor}`,
                          padding: "2px 8px",
                          letterSpacing: "1px",
                        }}
                      >
                        {medal.label}
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.65rem",
                        color: "#7a6a4a",
                        border: "1px solid rgba(0,0,0,0.2)",
                        padding: "2px 7px",
                        textTransform: "uppercase",
                      }}
                    >
                      NVL {entry.experience_level}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      color: "#7a6a4a",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 8,
                    }}
                  >
                    {entry.profession}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      backgroundColor: "rgba(0,0,0,0.15)",
                      border: "1px solid rgba(0,0,0,0.2)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ height: "100%", backgroundColor: accentColor }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ flexShrink: 0, textAlign: "right", width: 100 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 6,
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: "0.9rem",
                      color: "#2a4a35",
                      marginBottom: 4,
                    }}
                  >
                    <Flame style={{ width: 14, height: 14 }} />
                    <span>+{entry.food_production}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 6,
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: "0.9rem",
                      color: "#1a4a6a",
                      marginBottom: 8,
                    }}
                  >
                    <Droplet style={{ width: 14, height: 14 }} />
                    <span>+{entry.water_production}</span>
                  </div>
                  <div style={{ borderTop: "1px dashed rgba(0,0,0,0.25)", paddingTop: 8 }}>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "2rem",
                        color: accentColor,
                        lineHeight: 1,
                      }}
                    >
                      {entry.total_production}
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.6rem",
                        color: "#9a8a6a",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      TOTAL/DÍA
                    </div>
                  </div>
                </div>

                {/* Bottom accent strip for top 3 */}
                {medal && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: accentColor,
                      opacity: 0.5,
                    }}
                  />
                )}
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

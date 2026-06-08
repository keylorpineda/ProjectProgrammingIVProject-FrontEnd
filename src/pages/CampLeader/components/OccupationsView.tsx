import { motion } from "framer-motion"
import { Briefcase } from "lucide-react"
import { useMemo } from "react"

import type { Person, Profession } from "../types"

interface OccupationsViewProps {
  residents: Person[]
}

interface ProfessionGroup {
  profession: Profession | null
  count: number
  activeCount: number
  members: Person[]
}

const PROF_EMOJI: Record<string, string> = {
  farmer: "🌾",
  agricultor: "🌾",
  recolector: "🌿",
  cook: "🍳",
  cocinero: "🍳",
  doctor: "⚕️",
  medico: "⚕️",
  médico: "⚕️",
  engineer: "⚙️",
  ingeniero: "⚙️",
  constructor: "🔧",
  soldier: "⚔️",
  guardia: "⚔️",
  scavenger: "🎒",
  explorador: "🧭",
  aguatero: "💧",
  almacenista: "📦",
}

function getProfEmoji(name?: string): string {
  if (!name) return "👤"
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(PROF_EMOJI)) {
    if (key.includes(k)) return v
  }
  return "👤"
}

const ACTIVE_STATUSES = new Set(["active", "exploring"])

function StatusBar({ active, total }: { active: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((active / total) * 100)
  const color = pct >= 70 ? "#4c6351" : pct >= 40 ? "#c27c2f" : "#9c2720"

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "rgba(26,15,5,0.5)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          OPERATIVOS
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color, fontWeight: 900 }}>
          {active}/{total} · {pct}%
        </span>
      </div>
      <div
        style={{
          height: 5,
          background: "rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: color }}
        />
      </div>
    </div>
  )
}

export default function OccupationsView({ residents }: OccupationsViewProps) {
  const groups = useMemo<ProfessionGroup[]>(() => {
    const map = new Map<number | null, ProfessionGroup>()

    for (const person of residents) {
      const profId = person.profession?.id ?? null
      if (!map.has(profId)) {
        map.set(profId, {
          profession: person.profession ?? null,
          count: 0,
          activeCount: 0,
          members: [],
        })
      }
      const grp = map.get(profId)!
      grp.count++
      if (ACTIVE_STATUSES.has(person.status)) grp.activeCount++
      grp.members.push(person)
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [residents])

  const totalActive = residents.filter((p) => ACTIVE_STATUSES.has(p.status)).length

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="border-b-4 border-[#c27c2f] pb-5">
        <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider flex items-center gap-3">
          <Briefcase className="w-7 h-7 shrink-0" />
          OCUPACIONES DEL CAMPAMENTO
        </h2>
        <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
          FUERZA LABORAL · {totalActive}/{residents.length} OPERATIVOS
        </p>
      </div>

      {/* SUMMARY TAPE */}
      <div
        style={{
          background: "rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.2)",
          padding: "14px 20px",
          display: "flex",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        {[
          { label: "TOTAL PERSONAL", value: residents.length },
          { label: "OCUPACIONES", value: groups.length },
          { label: "ACTIVOS", value: totalActive, color: "#4c6351" },
          { label: "FUERA DE SERVICIO", value: residents.length - totalActive, color: "#9c2720" },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "0.55rem",
                color: "rgba(232,220,200,0.45)",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: "1.6rem",
                fontWeight: 900,
                color: color ?? "#e8dcc8",
                lineHeight: 1,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* OCCUPATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {groups.map((grp, i) => {
          const name = grp.profession?.name ?? "SIN ASIGNAR"
          const emoji = getProfEmoji(grp.profession?.name)
          const pct = grp.count === 0 ? 0 : Math.round((grp.activeCount / grp.count) * 100)
          const statusColor = pct >= 70 ? "#4c6351" : pct >= 40 ? "#c27c2f" : "#9c2720"
          const statusLabel = pct >= 70 ? "OPERATIVO" : pct >= 40 ? "REDUCIDO" : "CRÍTICO"

          return (
            <motion.div
              key={grp.profession?.id ?? "none"}
              initial={{ opacity: 0, y: 20, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
              animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
              whileHover={{ rotate: 0, scale: 1.02, zIndex: 10 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 130 }}
              style={{
                backgroundColor: "#e8dcc8",
                border: "2px solid #000",
                borderTop: `5px solid ${statusColor}`,
                boxShadow:
                  i % 2 === 0 ? "-3px 6px 14px rgba(0,0,0,0.55)" : "3px 6px 14px rgba(0,0,0,0.55)",
                color: "#1a0f05",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* TOP ROW */}
              <div
                style={{
                  padding: "16px 18px 12px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ fontSize: "2.2rem", lineHeight: 1, flexShrink: 0 }}>{emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: "1rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      lineHeight: 1.1,
                    }}
                  >
                    {name}
                  </div>
                  {grp.profession?.description && (
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.6rem",
                        color: "rgba(26,15,5,0.5)",
                        marginTop: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {grp.profession.description}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    background: statusColor,
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "0.5rem",
                    fontWeight: 900,
                    padding: "3px 8px",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  {statusLabel}
                </div>
              </div>

              {/* DIVIDER */}
              <div style={{ borderTop: "1px dashed rgba(0,0,0,0.2)", margin: "0 18px" }} />

              {/* STATS ROW */}
              <div style={{ padding: "10px 18px 6px", display: "flex", gap: 24 }}>
                <div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.55rem",
                      color: "rgba(26,15,5,0.45)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    TOTAL
                  </div>
                  <div
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: "2rem",
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {grp.count}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.55rem",
                      color: "rgba(26,15,5,0.45)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    ACTIVOS
                  </div>
                  <div
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: "2rem",
                      fontWeight: 900,
                      lineHeight: 1,
                      color: "#4c6351",
                    }}
                  >
                    {grp.activeCount}
                  </div>
                </div>
                {grp.profession?.can_explore && (
                  <div style={{ marginLeft: "auto", alignSelf: "flex-end" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.5rem",
                        fontWeight: 900,
                        color: "#3b7a5a",
                        border: "1px solid #3b7a5a",
                        padding: "2px 7px",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      EXPLORAN
                    </span>
                  </div>
                )}
              </div>

              {/* STATUS BAR */}
              <div style={{ padding: "0 18px 14px" }}>
                <StatusBar active={grp.activeCount} total={grp.count} />
              </div>

              {/* MEMBER AVATAR STRIP */}
              {grp.members.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.12)", padding: "10px 18px 14px" }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.55rem",
                      color: "rgba(26,15,5,0.4)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    PERSONAL ASIGNADO
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {grp.members.slice(0, 10).map((m) => {
                      const initials =
                        `${m.first_name[0] ?? "?"}${m.last_name?.[0] ?? ""}`.toUpperCase()
                      const isActive = ACTIVE_STATUSES.has(m.status)
                      return (
                        <div
                          key={m.id}
                          title={`${m.first_name} ${m.last_name} · ${m.status}`}
                          style={{
                            width: 28,
                            height: 28,
                            background: isActive ? "rgba(76,99,81,0.25)" : "rgba(0,0,0,0.1)",
                            border: `1.5px solid ${isActive ? "#4c6351" : "rgba(0,0,0,0.2)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Special Elite', monospace",
                            fontSize: "0.6rem",
                            fontWeight: 900,
                            color: isActive ? "#4c6351" : "rgba(26,15,5,0.4)",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {m.photo_url ? (
                            <img
                              src={m.photo_url}
                              alt={initials}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: isActive ? "none" : "grayscale(1)",
                              }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                      )
                    })}
                    {grp.members.length > 10 && (
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          background: "rgba(0,0,0,0.08)",
                          border: "1.5px dashed rgba(0,0,0,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "monospace",
                          fontSize: "0.5rem",
                          color: "rgba(26,15,5,0.4)",
                        }}
                      >
                        +{grp.members.length - 10}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

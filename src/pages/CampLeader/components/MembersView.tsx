import { motion } from "framer-motion"
import { Search, User } from "lucide-react"
import { useState } from "react"

import type { Person, PersonStatus } from "../types"

interface MembersViewProps {
  residents: Person[]
}

const STATUS_LABEL: Record<PersonStatus, string> = {
  active: "ACTIVO",
  sick: "ENFERMO",
  injured: "LESIONADO",
  exploring: "EN CAMPO",
  deceased: "FALLECIDO",
}

const STATUS_COLOR: Record<PersonStatus, string> = {
  active: "#4c6351",
  sick: "#c27c2f",
  injured: "#c27c2f",
  exploring: "#3b7a5a",
  deceased: "#9c2720",
}

const STATUS_BG: Record<PersonStatus, string> = {
  active: "#4c6351",
  sick: "#c27c2f",
  injured: "#c27c2f",
  exploring: "#3b5a4a",
  deceased: "#9c2720",
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

function getProfEmoji(prof?: string): string {
  if (!prof) return "👤"
  const key = prof.toLowerCase()
  for (const [k, v] of Object.entries(PROF_EMOJI)) {
    if (key.includes(k)) return v
  }
  return "👤"
}

function XPBar({ level, xp }: { level: number; xp: number }) {
  const pct = Math.min(100, ((xp % 100) / 100) * 100)
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "rgba(26,15,5,0.55)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          NVL {level}
        </span>
        <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(26,15,5,0.45)" }}>
          {xp} XP
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", background: "#c27c2f" }}
        />
      </div>
    </div>
  )
}

const STATUS_FILTERS: Array<{ key: PersonStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "TODOS" },
  { key: "active", label: "ACTIVOS" },
  { key: "exploring", label: "EN CAMPO" },
  { key: "sick", label: "ENFERMOS" },
  { key: "injured", label: "LESIONADOS" },
  { key: "deceased", label: "FALLECIDOS" },
]

export default function MembersView({ residents }: MembersViewProps) {
  const [filterStatus, setFilterStatus] = useState<PersonStatus | "ALL">("ALL")
  const [search, setSearch] = useState("")

  const filtered = residents.filter((p) => {
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus
    const matchSearch =
      search === "" ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.profession?.name ?? "").toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="border-b-4 border-[#c27c2f] pb-5">
        <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider flex items-center gap-3">
          <User className="w-7 h-7 shrink-0" />
          EXPEDIENTES DEL PERSONAL
        </h2>
        <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
          REGISTRO OPERATIVO · {residents.length} MIEMBROS EN BASE
        </p>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as PersonStatus | "ALL")}
              className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider border-2 cursor-pointer transition-all ${
                filterStatus === key
                  ? "bg-[#c27c2f] text-white border-[#c27c2f] shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                  : "bg-transparent border-[#9a8a74]/60 text-[#c8bfae] hover:border-[#c27c2f] hover:text-[#fca311]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
          <input
            type="text"
            placeholder="BUSCAR NOMBRE / ROL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-[#d4c9b0] border-2 border-black/30 text-black font-mono text-sm uppercase focus:outline-none focus:border-[#c27c2f]"
          />
        </div>
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#9a8a74]/30">
          <p className="font-typewriter text-base text-[#9a8a74] uppercase font-bold">
            SIN REGISTROS QUE COINCIDAN
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((person, i) => {
            const statusColor = STATUS_COLOR[person.status] ?? "#9a8a74"
            const statusBg = STATUS_BG[person.status] ?? "#9a8a74"
            const profEmoji = getProfEmoji(person.profession?.name)
            const initials =
              `${person.first_name[0] ?? "?"}${person.last_name?.[0] ?? ""}`.toUpperCase()

            return (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 20, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
                animate={{ opacity: 1, y: 0, rotate: i % 2 === 0 ? -0.6 : 0.6 }}
                whileHover={{ rotate: 0, scale: 1.03, zIndex: 10 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 130 }}
                style={{
                  backgroundColor: "#e8dcc8",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
                  border: "2px solid #000",
                  borderLeft: `6px solid ${statusColor}`,
                  boxShadow:
                    i % 2 === 0
                      ? "-3px 6px 14px rgba(0,0,0,0.55)"
                      : "3px 6px 14px rgba(0,0,0,0.55)",
                  color: "#1a0f05",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* STATUS BADGE */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: statusBg,
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: "0.55rem",
                    fontWeight: 900,
                    padding: "3px 8px",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  {STATUS_LABEL[person.status] ?? person.status.toUpperCase()}
                </div>

                {/* AVATAR + NAME */}
                <div
                  style={{
                    padding: "18px 16px 14px",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  {person.photo_url ? (
                    <img
                      src={person.photo_url}
                      alt={person.first_name}
                      style={{
                        width: 56,
                        height: 56,
                        objectFit: "cover",
                        border: "2px solid rgba(0,0,0,0.25)",
                        filter: "sepia(0.2)",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        background: "rgba(0,0,0,0.15)",
                        border: "2px solid rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Special Elite', monospace",
                        fontSize: "1.3rem",
                        fontWeight: 900,
                        color: "rgba(26,15,5,0.5)",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: "0.65rem",
                        color: "rgba(26,15,5,0.45)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      ID-{String(person.id).padStart(4, "0")}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: "1rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        lineHeight: 1.1,
                        color: "#1a0f05",
                      }}
                    >
                      {person.first_name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: "0.9rem",
                        textTransform: "uppercase",
                        lineHeight: 1.1,
                        color: "rgba(26,15,5,0.7)",
                      }}
                    >
                      {person.last_name}
                    </div>
                  </div>
                </div>

                {/* PROFESSION */}
                <div
                  style={{
                    borderTop: "1px dashed rgba(0,0,0,0.2)",
                    margin: "0 16px",
                    paddingTop: 10,
                    paddingBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.1rem" }}>{profEmoji}</span>
                    <div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.6rem",
                          color: "rgba(26,15,5,0.45)",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        PROFESIÓN
                      </div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: "0.78rem",
                          textTransform: "uppercase",
                          color: "#1a0f05",
                          letterSpacing: 0.5,
                        }}
                      >
                        {person.profession?.name ?? "SIN ASIGNAR"}
                      </div>
                    </div>
                    {person.profession?.can_explore && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontFamily: "monospace",
                          fontSize: "0.55rem",
                          fontWeight: 900,
                          color: "#4c6351",
                          border: "1px solid #4c6351",
                          padding: "2px 6px",
                          letterSpacing: 1,
                          textTransform: "uppercase",
                        }}
                      >
                        EXPLORADOR
                      </span>
                    )}
                  </div>
                </div>

                {/* XP BAR */}
                <div style={{ padding: "0 16px 16px" }}>
                  <XPBar level={person.experience_level} xp={person.experience_points} />

                  {/* ACHIEVEMENTS */}
                  {person.achievements && person.achievements.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {person.achievements.slice(0, 3).map((ach, ai) => (
                        <span
                          key={ai}
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.5rem",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            background: "rgba(0,0,0,0.1)",
                            border: "1px solid rgba(0,0,0,0.15)",
                            padding: "2px 5px",
                            color: "rgba(26,15,5,0.65)",
                          }}
                        >
                          ★ {ach}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

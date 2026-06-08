/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any, react/prop-types */

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Users, ShieldAlert, Cpu } from "lucide-react"
import { useEffect, useState } from "react"

import { api } from "../config/api"

import type { Person, ProfessionAlert } from "../types/api.types"

interface ManagerWorkforceProps {
  campId: string
  onDataChanged?: () => void
  refreshTrigger: number
}

const PAPER_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")"

export default function ManagerWorkforce({
  campId,
  onDataChanged,
  refreshTrigger,
}: ManagerWorkforceProps) {
  void onDataChanged
  const [page, setPage] = useState<number>(1)
  const limit = 4

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["managerWorkforce", campId, page],
    queryFn: async () => {
      const [personsRes, alertsRes, professionsRes] = await Promise.all([
        api.get(`/users/persons?campId=${campId}&page=${page}&limit=${limit}`),
        api.get("/users/professions/alerts/needing-workers"),
        api.get("/users/professions"),
      ])
      return {
        persons: personsRes.data.data as Person[],
        total: personsRes.data.total as number,
        alerts: alertsRes.data as ProfessionAlert[],
        professions: professionsRes.data as { id: number; name: string }[],
      }
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  })

  const error = queryError
    ? (queryError as any).message || "Fallo de enlace biométrico de sobrevivientes."
    : null

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  const [localPersons, setLocalPersons] = useState<Person[]>([])

  useEffect(() => {
    if (data?.persons) {
      setLocalPersons(data.persons)
    }
  }, [data?.persons])

  const persons = localPersons
  const total = data?.total || 0
  const alerts = data?.alerts || []

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
      style={{ maxWidth: "72rem", margin: "1.5rem auto", padding: "1rem 0" }}
    >
      {/* IA ALERTS — paper bulletin board notice */}
      <div className="w-full space-y-4">
        <div
          style={{
            backgroundColor: "#cec8b6",
            backgroundImage: PAPER_TEXTURE,
            borderLeft: "4px solid #c27c2f",
            boxShadow: "-3px 10px 32px rgba(0,0,0,0.75)",
            color: "#1a1208",
            padding: "28px 32px",
            position: "relative",
          }}
        >
          {/* Amber pin */}
          <div
            style={{
              position: "absolute",
              top: -8,
              left: 44,
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#c27c2f",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              zIndex: 2,
              border: "2px solid #8a5c1a",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: "2px dashed rgba(0,0,0,0.2)",
              paddingBottom: 16,
              marginBottom: 16,
            }}
          >
            <Cpu style={{ width: 24, height: 24, color: "#9c2720" }} className="animate-pulse" />
            <h4
              style={{
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: "1.1rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#1a1208",
              }}
            >
              SISTEMA IA — ANÁLISIS DE PERSONAL
            </h4>
          </div>

          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: "#7a6a4a",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 20,
            }}
          >
            Cuellos de botella detectados por especialización en búnker.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {!alerts || alerts.length === 0 ? (
              <div
                className="col-span-full"
                style={{
                  backgroundColor: "#d0d8cc",
                  border: "1px solid rgba(0,0,0,0.15)",
                  padding: "16px 20px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#2a4a35",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  letterSpacing: "1px",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>✔</span>
                DISTRIBUCIÓN LABORAL ÓPTIMA — Sin cuellos de botella.
              </div>
            ) : (
              (alerts || []).map((alert, i) => {
                const profName = String(
                  (alert.profession as any)?.name || alert.profession || "—",
                ).toUpperCase()
                const count = alert.neededCount ?? (alert as any).needed_count ?? 0
                const isHigh = alert.severity === "high"
                const isMed = alert.severity === "medium"
                const accentColor = isHigh ? "#9c2720" : isMed ? "#b86a1a" : "#5a5a5a"
                const paperBg = isHigh ? "#e8d0c8" : isMed ? "#e8dcc8" : "#d8d2bf"

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      backgroundColor: paperBg,
                      backgroundImage: PAPER_TEXTURE,
                      borderLeft: `4px solid ${accentColor}`,
                      border: "1px solid rgba(0,0,0,0.18)",
                      borderLeftWidth: 4,
                      boxShadow: "2px 4px 12px rgba(0,0,0,0.35)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column" as const,
                      gap: 10,
                      color: "#1a1208",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: "2.4rem",
                          color: accentColor,
                          lineHeight: 1,
                        }}
                      >
                        {count}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.6rem",
                          fontWeight: 900,
                          textTransform: "uppercase" as const,
                          color: accentColor,
                          border: `1px solid ${accentColor}`,
                          padding: "2px 8px",
                          letterSpacing: "1px",
                        }}
                      >
                        {String(alert.severity || "").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: "0.85rem",
                          textTransform: "uppercase" as const,
                          color: "#0d0a04",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {profName}
                      </div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.68rem",
                          color: "#7a6a4a",
                          textTransform: "uppercase" as const,
                          marginTop: 2,
                        }}
                      >
                        {count === 1 ? "falta 1 trabajador" : `faltan ${count} trabajadores`}
                      </div>
                    </div>
                    {alert.impactDescription && (
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.65rem",
                          color: "#5a4a2a",
                          textTransform: "uppercase" as const,
                          borderTop: "1px dashed rgba(0,0,0,0.2)",
                          paddingTop: 8,
                        }}
                      >
                        {String(alert.impactDescription || "").toUpperCase()}
                      </p>
                    )}
                  </motion.div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* WORKERS TABLE — personnel roster ledger */}
      <div className="w-full space-y-4">
        {error && (
          <div className="border-2 border-black bg-[#9c2720]/20 text-red-250 font-mono text-xs p-3.5 flex items-start gap-4">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <span className="font-bold">CONEXIÓN RECHAZADA:</span> {error}
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: "#d8d2bf",
            backgroundImage: PAPER_TEXTURE,
            borderLeft: "4px solid #6a4a1a",
            boxShadow: "-3px 10px 32px rgba(0,0,0,0.75)",
            color: "#1a1208",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Brown pin */}
          <div
            style={{
              position: "absolute",
              top: -8,
              right: 64,
              width: 14,
              height: 14,
              borderRadius: "50%",
              backgroundColor: "#6a4a1a",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              zIndex: 2,
              border: "2px solid #3a2a0a",
            }}
          />

          {/* HEADER BAR */}
          <div
            style={{
              backgroundColor: "#b8b29e",
              borderBottom: "2px solid rgba(0,0,0,0.2)",
              padding: "20px 24px",
              display: "flex",
              flexWrap: "wrap" as const,
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Users style={{ width: 22, height: 22, color: "#6a4a1a" }} />
              <span
                style={{
                  fontFamily: "monospace",
                  fontWeight: 900,
                  fontSize: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  color: "#1a1208",
                }}
              >
                CENSO LABORAL ACTIVO
              </span>
            </div>

            {/* STACKED HEALTH BAR */}
            <div style={{ flex: 1, maxWidth: 380, minWidth: 200 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "monospace",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "#2a5a35" }}>SANO</span>
                <span style={{ color: "#7a5a1a" }}>HERIDO</span>
                <span style={{ color: "#7a1a18" }}>ENFERMO</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 10,
                  backgroundColor: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(0,0,0,0.3)",
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <div
                  className="transition-all duration-500"
                  style={{
                    height: "100%",
                    backgroundColor: "#4a8a5a",
                    width: `${(persons.filter((p) => p.status === "active").length / (persons.length || 1)) * 100}%`,
                  }}
                />
                <div
                  className="transition-all duration-500"
                  style={{
                    height: "100%",
                    backgroundColor: "#b86a1a",
                    width: `${(persons.filter((p) => p.status === "injured").length / (persons.length || 1)) * 100}%`,
                  }}
                />
                <div
                  className="transition-all duration-500"
                  style={{
                    height: "100%",
                    backgroundColor: "#9c2720",
                    width: `${(persons.filter((p) => p.status === "sick").length / (persons.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#6a5a3a",
                textTransform: "uppercase",
                fontWeight: 700,
                whiteSpace: "nowrap" as const,
              }}
            >
              Pág. {page} / {Math.ceil(total / limit) || 1}
            </span>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table
              className="table-auto w-full border-collapse font-mono text-sm md:text-base"
              style={{ color: "#1a1208" }}
            >
              <thead
                style={{
                  backgroundColor: "#b8b29e",
                  borderBottom: "2px solid rgba(0,0,0,0.2)",
                  textAlign: "left" as const,
                  textTransform: "uppercase" as const,
                  fontSize: "0.8rem",
                  letterSpacing: "1px",
                  fontWeight: 700,
                  color: "#3a2a0a",
                }}
              >
                <tr>
                  <th
                    style={{
                      padding: "12px 20px",
                      borderRight: "1px solid rgba(0,0,0,0.15)",
                      fontFamily: "monospace",
                    }}
                  >
                    SOBREVIVIENTE
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      borderRight: "1px solid rgba(0,0,0,0.15)",
                      fontFamily: "monospace",
                    }}
                  >
                    PROFESIÓN
                  </th>
                  <th
                    style={{
                      padding: "12px 20px",
                      borderRight: "1px solid rgba(0,0,0,0.15)",
                      textAlign: "center" as const,
                      fontFamily: "monospace",
                    }}
                  >
                    ESTADO FÍSICO
                  </th>
                </tr>
              </thead>
              <tbody>
                {(persons || []).map((person, idx) => {
                  const isEven = idx % 2 === 0
                  let rowBg = isEven ? "#d8d2bf" : "#cec8b6"
                  let rowBorderLeft = "4px solid transparent"

                  if (person.status === "sick") {
                    rowBg = isEven ? "#e0ccc8" : "#d8c4c0"
                    rowBorderLeft = "4px solid #9c2720"
                  } else if (person.status === "injured") {
                    rowBg = isEven ? "#e0d4c0" : "#d8cbb4"
                    rowBorderLeft = "4px solid #b86a1a"
                  }

                  const getLatestDiagnosis = (logStr: string) => {
                    if (!logStr) return ""
                    const logs = logStr.split("[").filter(Boolean)
                    const lastLog = logs[logs.length - 1] || logStr
                    const parts = lastLog.split(": ")
                    return parts.length > 1 ? parts.slice(1).join(": ").trim() : lastLog.trim()
                  }

                  const cleanAlert = person.injuryDetails
                    ? getLatestDiagnosis(person.injuryDetails)
                    : ""

                  return (
                    <tr
                      key={person.id}
                      className="transition-colors"
                      style={{
                        backgroundColor: rowBg,
                        borderLeft: rowBorderLeft,
                        borderBottom: "1px dashed rgba(0,0,0,0.15)",
                      }}
                    >
                      <td
                        style={{
                          padding: "16px 20px",
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            textTransform: "uppercase",
                            color: "#0d0a04",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: "1.2rem" }} title={person.profession || ""}>
                            {person.profession === "Farmer" && "🌾"}
                            {person.profession === "Doctor" && "⚕️"}
                            {person.profession === "Engineer" && "⚙️"}
                            {person.profession === "Soldier" && "⚔️"}
                            {person.profession === "Scavenger" && "🎒"}
                            {!person.profession && "👤"}
                          </span>
                          {person.name}
                        </div>
                        {person.skills && person.skills.length > 0 && (
                          <div
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.65rem",
                              color: "#7a6a4a",
                              textTransform: "uppercase",
                              marginTop: 4,
                            }}
                          >
                            {person.skills.join(", ").toUpperCase()}
                          </div>
                        )}
                        {cleanAlert && (
                          <div
                            style={{
                              marginTop: 10,
                              borderLeft: "3px solid #9c2720",
                              paddingLeft: 10,
                              paddingTop: 6,
                              paddingBottom: 6,
                              backgroundColor: "rgba(156,39,32,0.1)",
                            }}
                            title={person.injuryDetails?.toUpperCase()}
                          >
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: "0.6rem",
                                color: "#9c2720",
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                marginBottom: 2,
                              }}
                              className="animate-pulse"
                            >
                              ☣ DIAGNÓSTICO MÉDICO:
                            </div>
                            <div
                              style={{
                                fontFamily: "monospace",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                color: "#5a1a18",
                                textTransform: "uppercase",
                              }}
                            >
                              {cleanAlert.toUpperCase()}
                            </div>
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            border: "1px solid rgba(0,0,0,0.25)",
                            backgroundColor: "rgba(0,0,0,0.08)",
                            fontFamily: "monospace",
                            fontWeight: 900,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            color: "#3a2a0a",
                          }}
                        >
                          {person.profession?.toUpperCase() || "SIN ASIGNAR"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          borderRight: "1px solid rgba(0,0,0,0.12)",
                          textAlign: "center",
                        }}
                      >
                        {(() => {
                          const statusMap: Record<
                            string,
                            { label: string; color: string; bg: string; border: string }
                          > = {
                            active: {
                              label: "✓ SANO",
                              color: "#2a5a35",
                              bg: "rgba(42,90,53,0.12)",
                              border: "#4a8a5a",
                            },
                            sick: {
                              label: "⚠ ENFERMO",
                              color: "#7a4a1a",
                              bg: "rgba(122,74,26,0.12)",
                              border: "#b86a1a",
                            },
                            injured: {
                              label: "✕ HERIDO",
                              color: "#7a1a18",
                              bg: "rgba(122,26,24,0.12)",
                              border: "#9c2720",
                            },
                            dead: {
                              label: "— M.I.A.",
                              color: "#6a6a5a",
                              bg: "rgba(80,80,70,0.1)",
                              border: "#9a9a8a",
                            },
                          }
                          const s = statusMap[person.status] ?? statusMap.dead
                          return (
                            <span
                              style={{
                                display: "inline-block",
                                width: "100%",
                                padding: "6px 10px",
                                fontFamily: "monospace",
                                fontWeight: 900,
                                fontSize: "0.75rem",
                                textTransform: "uppercase",
                                color: s.color,
                                backgroundColor: s.bg,
                                border: `1px solid ${s.border}`,
                                letterSpacing: "1px",
                              }}
                            >
                              {s.label}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div
            style={{
              backgroundColor: "#b8b29e",
              borderTop: "2px solid rgba(0,0,0,0.2)",
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "monospace",
            }}
          >
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #6a4a1a",
                backgroundColor: "transparent",
                color: "#3a2a0a",
                padding: "6px 16px",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 900,
                textTransform: "uppercase",
                cursor: "pointer",
                opacity: page === 1 ? 0.35 : 1,
              }}
            >
              « ANTERIOR
            </button>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.65rem",
                color: "#6a5a3a",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: 700,
              }}
            >
              {total} SOBREVIVIENTES REGISTRADOS
            </span>
            <button
              type="button"
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #6a4a1a",
                backgroundColor: "transparent",
                color: "#3a2a0a",
                padding: "6px 16px",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                fontWeight: 900,
                textTransform: "uppercase",
                cursor: "pointer",
                opacity: page * limit >= total ? 0.35 : 1,
              }}
            >
              SIGUIENTE »
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

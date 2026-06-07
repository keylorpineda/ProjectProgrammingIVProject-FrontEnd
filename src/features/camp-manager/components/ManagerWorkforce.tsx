/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Users, ShieldAlert, Cpu, Briefcase } from "lucide-react"
import { useEffect, useState } from "react"
import { type FormEvent } from "react"

import { api } from "../config/api"

import type { Person, ProfessionAlert } from "../types/api.types"

interface ManagerWorkforceProps {
  campId: string
  onDataChanged: () => void
  refreshTrigger: number
}

export default function ManagerWorkforce({
  campId,
  onDataChanged,
  refreshTrigger,
}: ManagerWorkforceProps) {
  // Pagination State
  const [page, setPage] = useState<number>(1)
  const limit = 4 // Compact page size

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
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  // Catálogo de profesiones para resolver nombre → id al asignar
  const { data: professionsCatalog = [] } = useQuery({
    queryKey: ["professionsCatalog"],
    queryFn: async () => {
      const res = await api.get("/users/professions")
      return (res.data ?? []) as Array<{ id: number | string; name: string }>
    },
    staleTime: 1000 * 60 * 60,
  })

  const [errorState, setErrorState] = useState<string | null>(null)
  const error = queryError
    ? (queryError as any).message || "Fallo de enlace biométrico de sobrevivientes."
    : errorState

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
  const professionsList = data?.professions || []

  // Temporary Assignment Modal State
  const [assigningPerson, setAssigningPerson] = useState<Person | null>(null)
  const [selectedProfession, setSelectedProfession] = useState<string>("")
  const [submittingAssignment, setSubmittingAssignment] = useState<boolean>(false)

  const handleOpenAssignModal = (person: Person) => {
    setAssigningPerson(person)
    setSelectedProfession(professionsList.length > 0 ? professionsList[0].id.toString() : "1")
  }

  const handleSaveAssignment = async (e: FormEvent) => {
    e.preventDefault()
    if (!assigningPerson) return

    setSubmittingAssignment(true)
    setErrorState(null)
    try {
      const matchedProfession = professionsCatalog.find(
        (p) => p.name?.toLowerCase() === selectedProfession.toLowerCase(),
      )
      if (!matchedProfession) {
        setErrorState(`Profesión "${selectedProfession}" no encontrada en el catálogo del sistema.`)
        setSubmittingAssignment(false)
        return
      }
      await api.post("/users/temporary-assignments", {
        person_id: Number(assigningPerson.id),
        profession_temporary_id: Number(matchedProfession.id),
      })
      setAssigningPerson(null)
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.message || "Error al asignar la orden temporal de trabajo.")
    } finally {
      setSubmittingAssignment(false)
    }
  }

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* TOP ROW: IA ALERTS / ADVISORY WIDGET (FULL WIDTH) */}
      <div className="w-full space-y-4">
        <div className="border-2 border-black bg-[#1a1a1a] p-6 md:p-10 font-mono text-[#e0d8cc] space-y-6">
          <div className="flex items-center gap-3 text-[#c27c2f] border-b-2 border-black pb-4">
            <Cpu className="h-6 w-6 animate-pulse text-[#c27c2f]" />
            <h4 className="font-black text-lg uppercase tracking-wider">
              SISTEMA IA — ANÁLISIS DE PERSONAL
            </h4>
          </div>

          <p className="text-sm text-zinc-500 uppercase">
            Cuellos de botella detectados por especialización en búnker.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {!alerts || alerts.length === 0 ? (
              <div className="col-span-full text-emerald-400 bg-[#161513] border-2 border-black px-5 py-4 font-bold uppercase tracking-wide flex items-center gap-3">
                <span className="text-xl">✔</span>
                <span className="text-sm">
                  DISTRIBUCIÓN LABORAL ÓPTIMA — Sin cuellos de botella.
                </span>
              </div>
            ) : (
              (alerts || []).map((alert, i) => {
                const profName = String(
                  (alert.profession as any)?.name || alert.profession || "—",
                ).toUpperCase()
                const count = alert.neededCount ?? (alert as any).needed_count ?? 0
                const isHigh = alert.severity === "high"
                const isMed = alert.severity === "medium"
                const accentColor = isHigh ? "#9c2720" : isMed ? "#c27c2f" : "#6b7280"
                const bgClass = isHigh
                  ? "bg-[#9c2720]/10 border-[#9c2720]"
                  : isMed
                    ? "bg-[#c27c2f]/10 border-[#c27c2f]"
                    : "bg-[#2a2824] border-zinc-700"

                return (
                  <div key={i} className={`p-4 flex flex-col gap-3 font-mono border-2 ${bgClass}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-3xl font-black leading-none"
                        style={{ color: accentColor }}
                      >
                        {count}
                      </span>
                      <span
                        className="text-xs uppercase font-black px-2 py-0.5 border"
                        style={{ color: accentColor, borderColor: accentColor }}
                      >
                        {String(alert.severity || "").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-black text-sm uppercase text-[#e0d8cc]">{profName}</div>
                      <div className="text-xs text-zinc-600 mt-0.5 uppercase">
                        {count === 1 ? "falta 1 trabajador" : `faltan ${count} trabajadores`}
                      </div>
                    </div>
                    {alert.impactDescription && (
                      <p className="text-xs text-zinc-500 uppercase border-t border-zinc-800 pt-2">
                        {String(alert.impactDescription || "").toUpperCase()}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: WORKERS TABLE PAGINATED (FULL WIDTH) */}
      <div className="w-full space-y-4">
        {error && (
          <div className="border-2 border-black bg-[#9c2720]/20 text-red-250 font-mono text-xs p-3.5 flex items-start gap-4">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <span className="font-bold">CONEXIÓN RECHAZADA:</span> {error}
            </div>
          </div>
        )}

        <div className="border-2 border-black bg-[#161513] overflow-hidden">
          {/* HEADER BAR & HEALTH STACKED BAR */}
          <div className="bg-black border-b border-black p-5 md:p-6 font-mono flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 text-sm md:text-base">
            <div className="flex items-center gap-3 shrink-0">
              <Users className="h-6 w-6 text-[#c27c2f]" />
              <span className="text-base md:text-lg text-[#c27c2f] font-black uppercase tracking-wider">
                CENSO LABORAL ACTIVO
              </span>
            </div>

            {/* STACKED HEALTH BAR (CURRENT PAGE) */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="flex justify-between text-xs mb-2 font-bold tracking-widest">
                <span className="text-emerald-500 uppercase">SANO</span>
                <span className="text-yellow-600 uppercase">HERIDO</span>
                <span className="text-[#9c2720] uppercase">ENFERMO</span>
              </div>
              <div className="w-full h-4 bg-zinc-900 border-2 border-black flex overflow-hidden shadow-[inset_0_0_5px_rgba(0,0,0,0.8)]">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${(persons.filter((p) => p.status === "active").length / (persons.length || 1)) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-yellow-600 transition-all duration-500"
                  style={{
                    width: `${(persons.filter((p) => p.status === "injured").length / (persons.length || 1)) * 100}%`,
                  }}
                />
                <div
                  className="h-full bg-[#9c2720] transition-all duration-500"
                  style={{
                    width: `${(persons.filter((p) => p.status === "sick").length / (persons.length || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <span className="text-base font-mono text-zinc-500 uppercase font-bold whitespace-nowrap shrink-0">
              Pág. {page} / {Math.ceil(total / limit) || 1}
            </span>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse font-mono text-sm md:text-base text-[#e0d8cc]">
              <thead className="bg-[#121110] border-b border-black text-left uppercase text-[#c27c2f] text-base tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3 border-r border-black">SOBREVIVIENTE</th>
                  <th className="px-5 py-3 border-r border-black">PROFESIÓN</th>
                  <th className="px-5 py-3 border-r border-black text-center">ESTADO FÍSICO</th>
                  <th className="px-5 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {(persons || []).map((person) => {
                  let rowColor = "border-b border-black hover:bg-[#2a2824]/40"

                  if (person.status === "sick") {
                    rowColor =
                      "bg-[#2a1111] hover:bg-[#321515] border-b border-black text-[#e0d8cc]"
                  } else if (person.status === "injured") {
                    rowColor =
                      "bg-[#2a1e12] hover:bg-[#322315] border-b border-black text-[#e0d8cc]"
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
                    <tr key={person.id} className={`${rowColor} transition-colors`}>
                      <td className="px-5 py-4 border-r border-black">
                        <div className="text-base font-bold flex items-center gap-2 uppercase">
                          <span className="text-xl" title={person.profession || ""}>
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
                          <div className="text-xs text-zinc-500 font-normal uppercase mt-0.5">
                            {person.skills.join(", ").toUpperCase()}
                          </div>
                        )}
                        {cleanAlert && (
                          <div
                            className="text-sm leading-relaxed text-[#9c2720] font-black uppercase tracking-wider mt-3 border-l-4 border-[#9c2720] pl-3 py-2 bg-[#9c2720]/10 rounded-r-sm"
                            title={person.injuryDetails?.toUpperCase()}
                          >
                            <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                              <span className="animate-pulse">☣ DIAGNÓSTICO MÉDICO:</span>
                            </div>
                            <div className="text-white">{cleanAlert.toUpperCase()}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 border-r border-black">
                        <span className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-black text-[#c27c2f] font-black uppercase text-sm">
                          {person.profession?.toUpperCase() || "SIN ASIGNAR"}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-r border-black text-center">
                        {(() => {
                          const statusMap: Record<string, { label: string; cls: string }> = {
                            active: {
                              label: "✓ SANO",
                              cls: "border-emerald-700 text-emerald-400 bg-emerald-900/20",
                            },
                            sick: {
                              label: "⚠ ENFERMO",
                              cls: "border-yellow-700 text-yellow-400 bg-yellow-900/20",
                            },
                            injured: {
                              label: "✕ HERIDO",
                              cls: "border-red-700 text-red-400 bg-red-900/20",
                            },
                            dead: {
                              label: "— M.I.A.",
                              cls: "border-zinc-700 text-zinc-500 bg-zinc-900/20",
                            },
                          }
                          const s = statusMap[person.status] ?? statusMap.dead
                          return (
                            <span
                              className={`inline-block w-full py-2 px-3 font-black uppercase text-sm border-2 ${s.cls}`}
                            >
                              {s.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(person)}
                          className="w-full bg-[#1a1a1a] hover:bg-[#c27c2f] hover:text-black border-2 border-[#c27c2f] text-[#c27c2f] px-4 py-2 text-sm font-black uppercase transition shadow-md active:translate-y-0.5"
                        >
                          ORDEN ROL
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="bg-[#121110] border-t-2 border-black px-5 py-4 flex justify-between items-center font-mono">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-2 border-2 border-[#c27c2f] bg-[#161513] text-[#c27c2f] hover:bg-[#c27c2f] hover:text-black text-sm font-black px-5 py-2 uppercase transition disabled:opacity-30 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-[#161513] disabled:hover:text-zinc-500 disabled:cursor-not-allowed"
            >
              « ANTERIOR
            </button>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-black">
              {total} SOBREVIVIENTES REGISTRADOS
            </span>
            <button
              type="button"
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-2 border-2 border-[#c27c2f] bg-[#161513] text-[#c27c2f] hover:bg-[#c27c2f] hover:text-black text-sm font-black px-5 py-2 uppercase transition disabled:opacity-30 disabled:border-zinc-700 disabled:text-zinc-500 disabled:hover:bg-[#161513] disabled:hover:text-zinc-500 disabled:cursor-not-allowed"
            >
              SIGUIENTE »
            </button>
          </div>
        </div>
      </div>

      {/* TEMPORARY ASSIGNMENT MODAL (POST /users/temporary-assignments) */}
      {assigningPerson && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-[#161513] border-4 border-double border-[#c27c2f] p-8 md:p-10 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6 text-[#c27c2f]">
              <Briefcase className="h-8 w-8 animate-pulse text-[#c27c2f]" />
              <h4 className="font-black uppercase tracking-widest text-lg md:text-xl">
                DESPACHAR ORDEN TEMPORAL
              </h4>
            </div>

            <p className="text-sm md:text-base text-zinc-400 mb-6 leading-relaxed uppercase">
              Asigna de manera forzosa el rol operacional a{" "}
              <span className="font-black text-white bg-black px-2 py-1">
                {assigningPerson.name?.toUpperCase()}
              </span>
              . La IA reestructurará su perfil de habilidades de inmediato.
            </p>

            <form onSubmit={handleSaveAssignment} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="field-391"
                  className="text-sm text-zinc-500 uppercase font-black block"
                >
                  ASIGNAR ROL / PROFESIÓN:
                </label>
                <select
                  id="field-391"
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                >
                  {professionsList.map((prof) => (
                    <option key={prof.id} value={prof.id} className="bg-[#161513] text-[#e0d8cc]">
                      {prof.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setAssigningPerson(null)}
                  className="flex-1 border-2 border-black uppercase text-sm md:text-base py-3 md:py-4 font-black transition"
                  style={{ backgroundColor: "#9c2720", color: "#ffffff" }}
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="flex-1 border-2 border-black uppercase text-sm md:text-base py-3 md:py-4 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#c27c2f", color: "#161513" }}
                >
                  {submittingAssignment ? "COMUNICANDO..." : "REASIGNAR HUMANO"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

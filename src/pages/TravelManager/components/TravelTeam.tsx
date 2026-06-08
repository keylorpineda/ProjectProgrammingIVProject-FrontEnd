import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Star,
  Archive,
  FileText,
  AlertCircle,
} from "lucide-react"
import { useState, useMemo } from "react"

import type { Person } from "@/types/api.types"
import type { Variants } from "framer-motion"

import { getCamps } from "@/features/camps/services/camps.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { useAuthStore } from "@/store/useAuthStore"
import { PersonStatus } from "@/types/api.types"

type ActiveStatusFilter = PersonStatus | "all"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export default function TravelTeam() {
  const { user } = useAuthStore()
  const baseCampId = user?.camp_id ?? ""

  const { data: personsResponse, isError: personsError } = useQuery({
    queryKey: ["persons", baseCampId],
    queryFn: () => getPersons({ campId: baseCampId, limit: 1000 }),
    enabled: !!baseCampId,
  })
  const persons: Person[] = useMemo(() => personsResponse?.data ?? [], [personsResponse])

  const { data: camps = [], isError: campsError } = useQuery({
    queryKey: ["camps"],
    queryFn: getCamps,
  })

  const hasError = personsError || campsError

  // ── Local State ────────────────────────────────────────────────────────────
  const [activeStatus, setActiveStatus] = useState<ActiveStatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [professionFilter, setProfessionFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const baseCamp = useMemo(
    () => camps.find((c) => String(c.id) === String(baseCampId)),
    [camps, baseCampId],
  )

  const getCampName = (id: string | number) =>
    camps.find((c) => String(c.id) === String(id))?.name || String(id)

  // ── Derived State ──────────────────────────────────────────────────────────
  const filteredTeam = useMemo(() => {
    return persons.filter((p) => {
      const pStatus = String(p.status ?? "")
        .toLowerCase()
        .replace(/\s+/g, "_")
      if (
        activeStatus !== "all" &&
        pStatus !== String(activeStatus).toLowerCase().replace(/\s+/g, "_")
      )
        return false

      const pProfession = p.profession?.name || "Desconocido"
      if (professionFilter !== "all" && pProfession !== professionFilter) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        return fullName.includes(query) || String(p.id).toLowerCase().includes(query)
      }
      return true
    })
  }, [persons, activeStatus, professionFilter, searchQuery])

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedId) || null,
    [persons, selectedId],
  )

  const professions = useMemo(() => {
    const allProfs = persons.map((p) => p.profession?.name).filter(Boolean) as string[]
    return ["all", ...Array.from(new Set(allProfs))]
  }, [persons])

  const activeCount = persons.filter((p) => {
    const key = String(p.status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    return key === "active" || key === "idle"
  }).length

  const inFieldCount = persons.filter((p) => {
    const key = String(p.status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    return key === "exploring"
  }).length

  const injuredCount = persons.filter((p) => {
    const key = String(p.status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    return key === "injured"
  }).length

  const getStatusLabel = (status: any) => {
    switch (status) {
      case PersonStatus.Active:
        return "Activo"
      case PersonStatus.Idle:
        return "Disponible"
      case PersonStatus.Exploring:
        return "En Exploración"
      case PersonStatus.Injured:
        return "Herido"
      case PersonStatus.Sick:
        return "Enfermo"
      case PersonStatus.Traveling:
        return "En Viaje"
      case PersonStatus.Resting:
        return "Descansando"
      case PersonStatus.OutOfCamp:
        return "Fuera del Camp."
      case PersonStatus.Deceased:
        return "Fallecido"
      default:
        return status
    }
  }

  const getStatusColor = (status: any) => {
    switch (status) {
      case PersonStatus.Active:
      case PersonStatus.Idle:
        return "text-accent-approved"
      case PersonStatus.Exploring:
      case PersonStatus.Traveling:
        return "text-[#c27c2f]"
      case PersonStatus.Injured:
      case PersonStatus.Deceased:
        return "text-accent-critical"
      case PersonStatus.Sick:
        return "text-[#89633e]"
      default:
        return "text-white/40"
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="tm-container"
    >
      {/* ── Vista Header ── */}
      <div className="tm-board-header">
        <div className="tm-board-left">
          <div className="tm-online-dot" />
          <div>
            <h2 className="tm-board-title leading-none">Personal Operativo</h2>
            <p className="tm-board-sub mt-1">
              Base: {baseCamp?.name?.toUpperCase() ?? baseCampId.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="tm-folder-tabs">
            <button
              onClick={() => setActiveStatus("all")}
              className={`tm-tab ${activeStatus === "all" ? "tm-tab-active" : ""}`}
            >
              TODOS ({persons.length})
            </button>
            <button
              onClick={() =>
                setActiveStatus(activeStatus === PersonStatus.Active ? "all" : PersonStatus.Active)
              }
              className={`tm-tab ${activeStatus === PersonStatus.Active ? "tm-tab-active" : ""}`}
            >
              DISPONIBLES ({activeCount})
            </button>
            <button
              onClick={() =>
                setActiveStatus(
                  activeStatus === PersonStatus.Exploring ? "all" : PersonStatus.Exploring,
                )
              }
              className={`tm-tab ${activeStatus === PersonStatus.Exploring ? "tm-tab-active" : ""}`}
            >
              EN CAMPO ({inFieldCount})
            </button>
            <button
              onClick={() =>
                setActiveStatus(
                  activeStatus === PersonStatus.Injured ? "all" : PersonStatus.Injured,
                )
              }
              className={`tm-tab ${activeStatus === PersonStatus.Injured ? "tm-tab-active" : ""}`}
            >
              HERIDOS ({injuredCount})
            </button>
          </div>
        </div>
      </div>

      {hasError && (
        <div className="tm-alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      {/* 2. OPERATIONAL GRID */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* LEFT: Roster de Personal */}
        <div className="w-[290px] flex flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border-2 border-black shadow-[3px_3px_0px_#000]">
          <div className="tm-folder-header-row mb-1">
            <h4 className="tm-folder-title">REGISTRO DE PERSONAL</h4>
            <span className="text-[10px] font-mono font-medium text-white/30 uppercase tracking-wider">
              {filteredTeam.length} REG
            </span>
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Buscar nombre o ID..."
                className="vintage-input w-full pl-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-[#121110] border border-[#d4a373]/20 px-3 py-1.5 rounded">
              <Filter className="h-3.5 w-3.5 text-white/30" />
              <select
                value={professionFilter}
                onChange={(e) => setProfessionFilter(e.target.value)}
                className="bg-transparent text-[10px] font-mono text-[#c27c2f] font-black focus:outline-none uppercase cursor-pointer w-full"
              >
                {professions.map((p) => (
                  <option key={p} value={p} className="bg-[#121110] text-[#c27c2f]">
                    {p === "all" ? "TODAS LAS PROFESIONES" : String(p).toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* List */}
          <div className="tm-op-list">
            <AnimatePresence>
              {filteredTeam.map((person) => {
                const pStatus = (person.status || "idle") as PersonStatus
                const rowStatusClass =
                  pStatus === PersonStatus.Active || pStatus === PersonStatus.Idle
                    ? "tm-row-active"
                    : pStatus === PersonStatus.Exploring || pStatus === PersonStatus.Traveling
                      ? "tm-row-transit"
                      : "tm-row-pending"
                return (
                  <motion.button
                    key={person.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedId(person.id)}
                    className={`tm-op-row cursor-pointer transition-all ${rowStatusClass} ${
                      selectedId === person.id ? "selected" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="px-2 py-0.5 bg-white/10 text-[8px] font-mono text-[#e8dcc8] font-bold tracking-wider rounded-sm">
                        COD-{String(person.id).substring(0, 6).toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider ${getStatusColor(pStatus)}`}
                      >
                        {getStatusLabel(pStatus).toUpperCase()}
                      </span>
                    </div>

                    <h5
                      className={`text-[12px] font-mono font-bold uppercase tracking-tight truncate mt-0.5 w-full ${
                        selectedId === person.id ? "text-[#df8120]" : "text-white"
                      }`}
                    >
                      {person.first_name} {person.last_name}
                    </h5>

                    <div className="flex justify-between items-center w-full mt-1.5 text-[8px] font-mono text-white/40 uppercase">
                      <span className="truncate max-w-[140px]">
                        {person.profession?.name || "SIN PROFESIÓN"}
                      </span>
                      <span className="text-[#c8bfae] font-bold shrink-0">
                        NIVEL {person.experience_level || 1}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </AnimatePresence>

            {filteredTeam.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Archive className="h-10 w-10 text-[#df8120]/15 mb-4" />
                <p className="text-xs font-mono text-white/30 uppercase leading-relaxed font-black">
                  Sin personal registrado
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Visualizador */}
        <div className="flex-1 flex flex-col bg-[#1c1208] border-2 border-black overflow-hidden shadow-[3px_3px_0px_#000]">
          <AnimatePresence mode="wait">
            {selectedPerson ? (
              <motion.div
                key={selectedPerson.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-[#d4a373]/15 flex items-center justify-between shrink-0 bg-black/20">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#df8120] shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-black block mb-0.5">
                        EXPEDIENTE DE PERSONAL
                      </span>
                      <h3 className="text-sm font-typewriter font-black text-white uppercase leading-none tracking-wider">
                        {selectedPerson.first_name} {selectedPerson.last_name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="tm-op-btn md:hidden"
                      style={{ padding: "6px 12px" }}
                    >
                      Volver
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto relative bg-black/25 p-4">
                  <div className="tm-paper tm-paper-texture w-full h-full relative flex flex-col overflow-hidden shadow-2xl">
                    {/* Sello confidencial */}
                    <div className="absolute top-10 right-10 flex flex-col items-center rotate-12 select-none opacity-15 pointer-events-none z-10">
                      <div className="border-4 border-ink p-1 mb-0.5">
                        <span className="text-base font-black font-mono px-2 tracking-widest">
                          CONFIDENCIAL
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-black italic text-ink">
                        COMITÉ DE RESISTENCIA
                      </span>
                    </div>

                    {/* Header con foto + datos básicos */}
                    <div className="flex gap-10 px-10 py-8 border-b-2 border-dashed border-ink/20">
                      {/* Foto de perfil */}
                      <div className="shrink-0 flex flex-col items-center gap-4">
                        <div className="w-36 h-44 border-2 border-ink/40 overflow-hidden bg-ink/5 relative flex items-center justify-center shadow-md">
                          {selectedPerson.photo_url ? (
                            <img
                              src={selectedPerson.photo_url}
                              alt={`${selectedPerson.first_name} ${selectedPerson.last_name}`}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full text-ink/20">
                              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                              </svg>
                              <span className="text-[9px] font-mono font-black uppercase mt-2 opacity-50">
                                SIN FOTO
                              </span>
                            </div>
                          )}
                        </div>
                        {/* Badge de estado debajo de la foto */}
                        <span
                          className={`text-xs font-mono font-black uppercase px-4 py-1.5 border rounded-sm tracking-wider ${
                            selectedPerson.status === "active" || selectedPerson.status === "idle"
                              ? "text-green-700 border-green-700/40 bg-green-700/8"
                              : selectedPerson.status === "exploring" ||
                                  selectedPerson.status === "traveling"
                                ? "text-[#c27c2f] border-[#c27c2f]/40 bg-[#c27c2f]/8"
                                : "text-[#9c2720] border-[#9c2720]/40 bg-[#9c2720]/8"
                          }`}
                        >
                          {getStatusLabel(selectedPerson.status || "idle").toUpperCase()}
                        </span>
                      </div>

                      {/* Datos de identidad */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-[11px] font-mono text-ink-soft/50 uppercase tracking-[0.2em] font-black block mb-2">
                          REGISTRO DEL RESISTENTE
                        </span>
                        <h2 className="font-typewriter text-3xl font-black text-ink uppercase leading-none mb-2">
                          {selectedPerson.first_name} {selectedPerson.last_name}
                          {selectedPerson.last_name2 ? ` ${selectedPerson.last_name2}` : ""}
                        </h2>
                        <p className="text-sm font-mono text-ink-soft uppercase mb-8 flex items-center gap-2">
                          {selectedPerson.profession?.name || "SIN PROFESIÓN ASIGNADA"}
                          {selectedPerson.profession?.can_explore && (
                            <span className="px-2 py-1 bg-[#df8120]/15 border border-[#df8120]/30 text-[#df8120] text-xs font-black rounded-sm">
                              EXPLORADOR
                            </span>
                          )}
                        </p>

                        {/* Campos como tarjetas */}
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            ...(selectedPerson.identification_code
                              ? [
                                  {
                                    label: "Cód. Identificación",
                                    value: selectedPerson.identification_code,
                                    color: "text-ink",
                                  },
                                ]
                              : []),
                            ...(selectedPerson.birth_date
                              ? [
                                  {
                                    label: "Fecha Nacimiento",
                                    value: new Date(selectedPerson.birth_date).toLocaleDateString(),
                                    color: "text-ink",
                                  },
                                ]
                              : []),
                            ...(selectedPerson.join_date
                              ? [
                                  {
                                    label: "Ingreso al Refugio",
                                    value: new Date(selectedPerson.join_date).toLocaleDateString(),
                                    color: "text-ink",
                                  },
                                ]
                              : []),
                            {
                              label: "Base de Enlace",
                              value: getCampName(selectedPerson.camp_id ?? ""),
                              color: "text-ink",
                            },
                            {
                              label: "Capacidad Laboral",
                              value: selectedPerson.can_work ? "APTO" : "RESTRINGIDO",
                              color: selectedPerson.can_work ? "text-green-700" : "text-red-700",
                            },
                            {
                              label: "Puntos de Exp.",
                              value: `${selectedPerson.experience_points ?? 0} XP`,
                              color: "text-[#df8120]",
                            },
                          ].map((field) => (
                            <div
                              key={field.label}
                              className="bg-ink/4 border border-ink/10 rounded-sm px-4 py-3"
                            >
                              <span className="text-[9px] font-mono text-ink-soft/50 uppercase tracking-widest font-black block mb-1.5 leading-none">
                                {field.label}
                              </span>
                              <span
                                className={`text-sm font-mono font-black ${field.color} leading-tight uppercase`}
                              >
                                {field.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nivel de experiencia */}
                    <div className="px-10 py-6 border-b border-dashed border-ink/15">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-mono font-black text-ink-soft/70 uppercase tracking-[0.15em] flex items-center gap-2">
                          <Star className="h-3.5 w-3.5" /> Rango de Experiencia
                        </span>
                        <span className="text-sm font-mono font-black text-ink">
                          NIVEL {selectedPerson.experience_level || 1} / 10
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-3 flex-1 rounded-sm transition-all ${i < (selectedPerson.experience_level || 1) ? "bg-[#df8120]" : "bg-ink/8"}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Estado Operativo + Habilidades previas */}
                    <div className="grid grid-cols-2 border-b border-dashed border-ink/15">
                      <div className="px-10 py-8 border-r border-dashed border-ink/15">
                        <h4 className="text-xs font-black text-ink-soft/70 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                          <Activity className="h-4 w-4" /> Estado Operativo
                        </h4>
                        <div className="space-y-3 font-mono">
                          {[
                            {
                              label: "Estado Vital",
                              value: getStatusLabel(selectedPerson.status || "idle").toUpperCase(),
                              color: getStatusColor(
                                selectedPerson.status || ("idle" as PersonStatus),
                              ),
                            },
                            {
                              label: "Capacidad",
                              value: selectedPerson.can_work ? "OPERATIVO" : "INACTIVO",
                              color: selectedPerson.can_work ? "text-green-700" : "text-red-700",
                            },
                            {
                              label: "Explorador",
                              value: selectedPerson.profession?.can_explore
                                ? "AUTORIZADO"
                                : "NO AUTORIZADO",
                              color: selectedPerson.profession?.can_explore
                                ? "text-[#df8120]"
                                : "text-ink-soft/50",
                            },
                          ].map((row) => (
                            <div
                              key={row.label}
                              className="flex justify-between items-center bg-ink/4 border border-ink/10 rounded-sm px-4 py-3"
                            >
                              <span className="text-ink-soft/60 font-bold text-xs">
                                {row.label}
                              </span>
                              <span className={`font-black uppercase text-sm ${row.color}`}>
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="px-10 py-8">
                        <h4 className="text-xs font-black text-ink-soft/70 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> Habilidades Previas
                        </h4>
                        {selectedPerson.previous_skills ? (
                          <p className="font-mono text-sm text-ink/70 leading-[1.8] italic">
                            {selectedPerson.previous_skills}
                          </p>
                        ) : (
                          <p className="font-mono text-sm text-ink-soft/40 uppercase italic leading-relaxed">
                            Sin habilidades previas registradas.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notas del comité */}
                    <div className="px-10 py-8 border-b border-dashed border-ink/15">
                      <h4 className="text-xs font-black text-ink-soft/70 uppercase tracking-[0.15em] mb-4">
                        Anotaciones del Comité de Resistencia
                      </h4>
                      <div className="p-5 bg-ink/4 border border-dashed border-ink/12 rounded-sm min-h-[80px]">
                        {selectedPerson.notes ? (
                          <p className="font-mono text-sm text-ink/70 italic leading-[1.8]">
                            {selectedPerson.notes}
                          </p>
                        ) : (
                          <p className="font-mono text-xs text-ink-soft/35 uppercase italic leading-relaxed">
                            Sin anotaciones registradas en bitácora.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-10 py-5 flex justify-between items-center text-ink-soft/40 font-mono text-[10px] uppercase tracking-[0.15em] mt-auto">
                      <span>
                        Registro: {new Date(selectedPerson.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        Actualizado: {new Date(selectedPerson.updated_at).toLocaleDateString()}
                      </span>
                      <span className="border border-dashed border-ink/20 px-4 py-1.5">
                        ID: {String(selectedPerson.id).substring(0, 12).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/15">
                <ShieldCheck className="h-20 w-20 mb-6 text-[#c27c2f] opacity-20" />
                <h3 className="font-typewriter text-2xl text-white/20 font-black uppercase mb-3">
                  Seleccione Superviviente
                </h3>
                <p className="font-mono text-sm text-white/20 uppercase tracking-widest">
                  Para visualizar su ficha operativa clasificada.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

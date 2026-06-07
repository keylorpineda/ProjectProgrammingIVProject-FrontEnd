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
      const pStatus = String(p.status ?? "").toLowerCase().replace(/\s+/g, "_")
      if (activeStatus !== "all" && pStatus !== String(activeStatus).toLowerCase().replace(/\s+/g, "_")) return false

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
    const key = String(p.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "active" || key === "idle"
  }).length

  const inFieldCount = persons.filter((p) => {
    const key = String(p.status ?? "").toLowerCase().replace(/\s+/g, "_")
    return key === "exploring"
  }).length

  const injuredCount = persons.filter((p) => {
    const key = String(p.status ?? "").toLowerCase().replace(/\s+/g, "_")
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
            <p className="tm-board-sub mt-1">Base: {baseCamp?.name?.toUpperCase() ?? baseCampId.toUpperCase()}</p>
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
              onClick={() => setActiveStatus(activeStatus === PersonStatus.Active ? "all" : PersonStatus.Active)}
              className={`tm-tab ${activeStatus === PersonStatus.Active ? "tm-tab-active" : ""}`}
            >
              DISPONIBLES ({activeCount})
            </button>
            <button
              onClick={() => setActiveStatus(activeStatus === PersonStatus.Exploring ? "all" : PersonStatus.Exploring)}
              className={`tm-tab ${activeStatus === PersonStatus.Exploring ? "tm-tab-active" : ""}`}
            >
              EN CAMPO ({inFieldCount})
            </button>
            <button
              onClick={() => setActiveStatus(activeStatus === PersonStatus.Injured ? "all" : PersonStatus.Injured)}
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
        <div className="w-[290px] flex flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border border-[#d4a373]/20 rounded-md shadow-lg">
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
                const rowStatusClass = (pStatus === PersonStatus.Active || pStatus === PersonStatus.Idle) ? "tm-row-active"
                                     : (pStatus === PersonStatus.Exploring || pStatus === PersonStatus.Traveling) ? "tm-row-transit"
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
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${getStatusColor(pStatus)}`}>
                        {getStatusLabel(pStatus).toUpperCase()}
                      </span>
                    </div>

                    <h5 className={`text-[12px] font-mono font-bold uppercase tracking-tight truncate mt-0.5 w-full ${
                      selectedId === person.id ? "text-[#df8120]" : "text-white"
                    }`}>
                      {person.first_name} {person.last_name}
                    </h5>

                    <div className="flex justify-between items-center w-full mt-1.5 text-[8px] font-mono text-white/40 uppercase">
                      <span className="truncate max-w-[140px]">{person.profession?.name || "SIN PROFESIÓN"}</span>
                      <span className="text-[#c8bfae] font-bold shrink-0">NIVEL {person.experience_level || 1}</span>
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
        <div className="flex-1 flex flex-col bg-[#1c1208] border border-[#d4a373]/20 rounded-md overflow-hidden shadow-lg">
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

                <div className="flex-1 p-5 flex flex-col overflow-hidden items-center justify-center relative bg-black/25">
                  <div className="tm-paper tm-paper-texture w-full h-full max-w-2xl relative overflow-hidden p-8 flex flex-col shadow-2xl justify-between">
                    {/* Stamp */}
                    <div className="absolute top-10 right-10 flex flex-col items-center rotate-6 select-none opacity-20">
                      <div className="border-4 border-ink p-1 mb-1">
                        <span className="text-lg font-black font-mono px-2">CONFIDENCIAL</span>
                      </div>
                      <span className="text-xs font-mono font-black italic">
                        Refugio GDF - Comité
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      {/* Top section */}
                      <div className="border-b-2 border-dashed border-ink/20 pb-3 mb-6">
                        <span className="text-[10px] font-mono text-ink-soft uppercase tracking-widest font-black block mb-1">
                          REGISTRO DEL RESISTENTE
                        </span>
                        <h2 className="font-typewriter text-2xl font-black text-ink uppercase leading-none">
                          {selectedPerson.first_name} {selectedPerson.last_name}
                        </h2>
                        <span className="text-[9px] font-mono text-ink-soft uppercase block mt-1">
                          Profesión: <span className="font-bold text-ink">{selectedPerson.profession?.name || "NO ASIGNADA"}</span>
                        </span>
                      </div>

                      {/* Main grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {/* Info vital */}
                        <div className="bg-[#faf4e6]/50 p-4 border border-dashed border-ink/20 rounded-sm space-y-3 font-mono text-[11px] text-ink/80">
                          <h4 className="text-[10px] font-black text-ink-soft uppercase border-b border-ink/10 pb-1 flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" /> Estado Operativo
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-ink-soft font-bold">Estado Vital:</span>
                              <span className={`font-bold uppercase ${getStatusColor(selectedPerson.status || ("idle" as PersonStatus))}`}>
                                {getStatusLabel(selectedPerson.status || ("idle" as PersonStatus)).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ink-soft font-bold">Base de Enlace:</span>
                              <span className="font-bold text-ink uppercase">
                                {getCampName(selectedPerson.camp_id ?? "")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-ink-soft font-bold">Capacidad Laboral:</span>
                              <span className={`font-bold uppercase ${selectedPerson.can_work ? "text-green-700" : "text-red-700"}`}>
                                {selectedPerson.can_work ? "APTO" : "RESTRINGIDO"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Calificación técnica */}
                        <div className="bg-[#faf4e6]/50 p-4 border border-dashed border-ink/20 rounded-sm space-y-3 font-mono text-[11px] text-ink/80">
                          <h4 className="text-[10px] font-black text-ink-soft uppercase border-b border-ink/10 pb-1 flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5" /> Ficha Técnica
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <span className="text-ink-soft font-bold block mb-1">Rango / Nivel de Experiencia</span>
                              <div className="flex gap-1">
                                {[...Array(10)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-1.5 flex-1 rounded-sm ${i < (selectedPerson.experience_level || 1) ? "bg-[#df8120]" : "bg-ink/10"}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>NIVEL {selectedPerson.experience_level || 1} DE 10</span>
                              <span>{selectedPerson.profession?.can_explore ? "EXPLORADOR AUTORIZADO" : "SOPORTE INTERNO"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic / Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="md:col-span-1 p-4 bg-[#c27c2f]/5 border border-[#c27c2f]/20 rounded-sm font-mono text-[10px] text-ink/80">
                          <h5 className="font-black text-[#df8120] uppercase mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Riesgo
                          </h5>
                          <p className="leading-relaxed">
                            Sujeto asignado a la base operativa. Acreditación de seguridad de Nivel 1 activa.
                          </p>
                          <span className="block mt-3 text-ink-soft font-bold">
                            ACTUALIZADO: {new Date(selectedPerson.updated_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="md:col-span-2 p-4 bg-white/40 border border-ink/10 rounded-sm flex flex-col font-mono text-[10px] text-ink/80">
                          <h5 className="font-black text-ink-soft uppercase mb-1.5 border-b border-ink/5 pb-1">
                            Anotaciones del Comité de Resistencia
                          </h5>
                          <div className="flex-1 italic leading-relaxed min-h-[60px] p-2 bg-[#faf4e6]/30 rounded-sm border border-ink/5">
                            Sujeto enrolado en basecamp. Comportamiento alineado con directivas de seguridad. No se reportan incidentes críticos ni desacatos en bitácora.
                          </div>
                        </div>
                      </div>

                      {/* Footer block */}
                      <div className="border-t border-ink/15 pt-3 mt-6 flex justify-between items-center text-ink-soft/70 font-mono text-[9px] uppercase tracking-wider">
                        <span>Registro: {new Date(selectedPerson.created_at).toLocaleDateString()}</span>
                        <span className="border border-dashed border-ink/30 px-2 py-0.5">ID: {String(selectedPerson.id).substring(0, 12).toUpperCase()}</span>
                      </div>
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

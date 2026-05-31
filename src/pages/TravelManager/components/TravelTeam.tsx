import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Briefcase,
  Activity,
  AlertTriangle,
  Star,
  Archive,
  Navigation,
  FileText,
  AlertCircle,
} from "lucide-react"
import { useState, useMemo } from "react"

import type { Person } from "@/types/api.types"
import type { Variants } from "framer-motion"

import { getCamps } from "@/features/camps/services/camps.service"
import { getPersons } from "@/features/persons/services/persons.service"
import { useAuth } from "@/pages/Admin/context/AuthContext"
import { PersonStatus } from "@/types/api.types"

type ActiveStatusFilter = PersonStatus | "all"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
}

export default function TravelTeam() {
  const { user } = useAuth()

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const { data: personsResponse, isError: personsError } = useQuery({
    queryKey: ["persons"],
    queryFn: () => getPersons({}),
  })
  const persons: Person[] = useMemo(() => personsResponse?.data ?? [], [personsResponse])

  const { data: camps = [], isError: campsError } = useQuery({
    queryKey: ["camps"],
    queryFn: getCamps,
  })

  const hasError = personsError || campsError

  // ── Local State ────────────────────────────────────────────────────────────
  const baseCampId = user?.camp_id ?? ""
  const [activeStatus, setActiveStatus] = useState<ActiveStatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [professionFilter, setProfessionFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const baseCamp = useMemo(
    () => camps.find((c) => String(c.id) === String(baseCampId)),
    [camps, baseCampId],
  )
  const consultedCamp = baseCamp

  const getCampName = (id: string | number) =>
    camps.find((c) => String(c.id) === String(id))?.name || String(id)

  // ── Derived State ──────────────────────────────────────────────────────────
  const filteredTeam = useMemo(() => {
    return persons.filter((p) => {
      if (baseCampId && String(p.camp_id ?? "") !== String(baseCampId)) return false
      if (activeStatus !== "all" && p.status !== activeStatus) return false

      const pProfession = p.profession?.name || "Desconocido"
      if (professionFilter !== "all" && pProfession !== professionFilter) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        return fullName.includes(query) || String(p.id).toLowerCase().includes(query)
      }
      return true
    })
  }, [persons, baseCampId, activeStatus, professionFilter, searchQuery])

  const selectedPerson = useMemo(
    () => persons.find((p) => p.id === selectedId) || null,
    [persons, selectedId],
  )

  const professions = useMemo(() => {
    const allProfs = persons.map((p) => p.profession?.name).filter(Boolean) as string[]
    return ["all", ...Array.from(new Set(allProfs))]
  }, [persons])

  const activeCount = persons.filter(
    (p) =>
      String(p.camp_id ?? "") === String(baseCampId) &&
      (p.status === PersonStatus.Active || p.status === PersonStatus.Idle),
  ).length
  const inFieldCount = persons.filter(
    (p) => String(p.camp_id ?? "") === String(baseCampId) && p.status === PersonStatus.Exploring,
  ).length
  const injuredCount = persons.filter(
    (p) => String(p.camp_id ?? "") === String(baseCampId) && p.status === PersonStatus.Injured,
  ).length

  const getStatusLabel = (status: PersonStatus) => {
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

  const getStatusColor = (status: PersonStatus) => {
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
      className="h-full flex-1 flex flex-col gap-3 w-full overflow-y-auto bg-[#0a0a0a] p-4 custom-scrollbar"
    >
      {/* 1. MASTER HUD - CONTROL DE EQUIPO */}
      <motion.div
        variants={itemVariants}
        className="archive-panel p-3 rounded-lg shrink-0 border-l-4 border-l-[#d4a373] bg-[#12110f]"
      >
        <div className="flex justify-between items-center mb-1 border-b border-[#d4a373]/10 pb-1">
          <div className="flex items-center gap-4">
            <span className="archive-header italic text-xs text-white/40 uppercase">
              Base de Viajes // Gestión de Personal
            </span>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-white/20 uppercase">
                Panel de Coordinación Local
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="archive-header text-sm text-accent-approved animate-pulse">
              ENLACE_ACTIVO
            </span>
            <span className="archive-header text-sm text-white/30 tracking-widest">
              OP_BASE::{baseCamp?.name?.toUpperCase() ?? baseCampId}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#d4a373]/20 p-2 border border-[#d4a373]/30">
              <Users className="h-6 w-6 text-[#d4a373]" />
            </div>
            <div>
              <h1 className="archive-title text-xl lg:text-2xl text-white uppercase">
                EQUIPO - {consultedCamp?.name ?? baseCampId}
              </h1>
              <p className="text-sm font-mono text-[#d4a373] uppercase tracking-[0.2em] font-black">
                Personal Operativo y Logístico
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <button
              onClick={() =>
                setActiveStatus(activeStatus === PersonStatus.Active ? "all" : PersonStatus.Active)
              }
              className={`bg-[#d4a373]/10 border px-4 py-1.5 rounded text-center min-w-[90px] transition-all hover:bg-[#d4a373]/20 ${activeStatus === PersonStatus.Active ? "border-accent-approved shadow-inner shadow-accent-approved/20" : "border-[#d4a373]/30"}`}
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-accent-approved/60 uppercase font-black">
                  Operativos
                </span>
                <span className="text-sm font-mono text-accent-approved uppercase font-black">
                  Disponibles
                </span>
              </div>
              <span className="text-xl font-mono font-black text-white">{activeCount}</span>
            </button>
            <button
              onClick={() =>
                setActiveStatus(
                  activeStatus === PersonStatus.Exploring ? "all" : PersonStatus.Exploring,
                )
              }
              className={`bg-[#d4a373]/10 border px-4 py-1.5 rounded text-center min-w-[90px] transition-all hover:bg-[#d4a373]/20 ${activeStatus === PersonStatus.Exploring ? "border-[#c27c2f] shadow-inner shadow-accent-warning/20" : "border-[#d4a373]/30"}`}
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-[#c27c2f]/60 uppercase font-black">
                  Personal
                </span>
                <span className="text-sm font-mono text-[#c27c2f] uppercase font-black">
                  En Campo
                </span>
              </div>
              <span className="text-xl font-mono font-black text-white">{inFieldCount}</span>
            </button>
            <button
              onClick={() =>
                setActiveStatus(
                  activeStatus === PersonStatus.Injured ? "all" : PersonStatus.Injured,
                )
              }
              className={`bg-[#d4a373]/10 border px-4 py-1.5 rounded text-center min-w-[90px] transition-all hover:bg-[#d4a373]/20 ${activeStatus === PersonStatus.Injured ? "border-accent-critical shadow-inner shadow-accent-critical/20" : "border-[#d4a373]/30"}`}
            >
              <div className="flex flex-col mb-0.5 leading-none">
                <span className="text-sm font-mono text-accent-critical/60 uppercase font-black">
                  Bajas
                </span>
                <span className="text-sm font-mono text-accent-critical uppercase font-black">
                  Heridos
                </span>
              </div>
              <span className="text-xl font-mono font-black text-white">{injuredCount}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {hasError && (
        <div className="bg-red-950/40 border border-red-500/50 p-3 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg mb-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      {/* 2. OPERATIONAL GRID */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        {/* COL 1: ROSTER DE PERSONAL */}
        <motion.section
          variants={itemVariants}
          className="md:col-span-4 flex flex-col gap-4 overflow-hidden h-full"
        >
          <div className="archive-panel p-4 rounded-lg flex-1 flex flex-col overflow-hidden shadow-2xl bg-[#12100d]">
            <div className="flex items-center justify-between mb-4 border-b border-[#d4a373]/20 pb-2 shrink-0">
              <h2 className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4" /> Registro de Personal
              </h2>
            </div>

            {/* Filtros locales */}
            <div className="flex flex-col gap-2 mb-3 shrink-0">
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded border border-white/10 focus-within:border-[#d4a373]/40">
                <Search className="h-3 w-3 text-white/20" />
                <input
                  type="text"
                  placeholder="BUSCAR NOMBRE O CÓDIGO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-xs font-mono text-white uppercase w-full placeholder:text-white/10"
                />
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded border border-white/10">
                <Filter className="h-3 w-3 text-white/20" />
                <select
                  value={professionFilter}
                  onChange={(e) => setProfessionFilter(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-[#d4a373] uppercase w-full focus:outline-none cursor-pointer"
                >
                  {professions.map((p) => (
                    <option key={p} value={p} className="bg-[#12110f]">
                      {p === "all" ? "TODAS LAS PROFESIONES" : String(p).toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              <AnimatePresence>
                {filteredTeam.map((person) => (
                  <motion.button
                    key={person.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedId(person.id)}
                    className={`w-full text-left p-3 rounded flex items-center justify-between border transition-all group ${
                      selectedId === person.id
                        ? "bg-[#d4a373]/10 border-[#d4a373] shadow-[0_0_15px_rgba(212,163,115,0.15)]"
                        : "bg-black/40 border-white/5 hover:border-[#d4a373]/30"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1 mr-4">
                      <span
                        className={`text-sm font-mono font-black uppercase truncate ${selectedId === person.id ? "text-[#d4a373]" : "text-white"}`}
                      >
                        {person.first_name} {person.last_name}
                      </span>
                      <span className="text-sm font-mono text-white/40 uppercase tracking-widest">
                        COD-{String(person.id).substring(0, 6)} {"//"}{" "}
                        {person.profession?.name || "S/N"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${getStatusColor((person.status || "idle") as PersonStatus).replace("text-", "bg-")}`}
                        />
                        <span
                          className={`text-sm font-black uppercase tracking-widest ${getStatusColor((person.status || "idle") as PersonStatus)}`}
                        >
                          {getStatusLabel((person.status || "idle") as PersonStatus)}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>

              {filteredTeam.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <Archive className="h-8 w-8 text-white/10 mb-3" />
                  <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
                    Sin personal encontrado
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* COL 2: EXPEDIENTE ACTIVO */}
        <motion.section
          variants={itemVariants}
          className="md:col-span-8 flex flex-col gap-4 overflow-hidden h-full"
        >
          <div className="archive-panel p-6 rounded-lg flex-1 flex flex-col overflow-hidden bg-[#110e0c] relative">
            <h2 className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest mb-4 border-b border-[#d4a373]/20 pb-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Expediente Clasificado
              </div>
              {selectedPerson && (
                <span className="text-xs text-white/20">
                  B-SER-{String(selectedPerson.id).substring(0, 8).toUpperCase()}
                </span>
              )}
            </h2>

            {selectedPerson ? (
              <motion.div
                key={selectedPerson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative"
              >
                <div className="absolute top-0 right-0 p-4 border border-[#d4a373]/20 rounded bg-black/40 backdrop-blur-sm flex flex-col items-center">
                  <span className="text-sm font-mono text-white/40 uppercase mb-1">
                    Cód_Registro
                  </span>
                  <span className="text-[12px] font-mono font-black uppercase text-accent-approved">
                    {String(selectedPerson.id).substring(0, 8)}
                  </span>
                </div>

                <div className="mb-8 max-w-lg">
                  <h3 className="text-3xl font-mono font-black text-white uppercase tracking-tight leading-none mb-1">
                    {selectedPerson.first_name} {selectedPerson.last_name}
                  </h3>
                  <p className="text-sm font-mono text-[#d4a373] uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />{" "}
                    {selectedPerson.profession?.name || "No Registrada"}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Panel Vitales/Operativo */}
                  <div className="bg-black/30 border border-white/5 rounded p-4 space-y-4">
                    <h4 className="text-sm font-mono text-white/40 uppercase font-black border-b border-white/10 pb-1 flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Estado Vital y Operativo
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-white/60 uppercase">
                          Estado Actual
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`h-2 w-2 rounded-full ${getStatusColor((selectedPerson.status || "idle") as PersonStatus).replace("text-", "bg-")}`}
                          />
                          <span
                            className={`text-sm font-mono font-black uppercase ${getStatusColor((selectedPerson.status || "idle") as PersonStatus)}`}
                          >
                            {getStatusLabel((selectedPerson.status || "idle") as PersonStatus)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-white/60 uppercase">
                          Base Asignada
                        </span>
                        <span className="text-sm font-mono font-black text-white uppercase flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-[#d4a373]" />{" "}
                          {getCampName(selectedPerson.camp_id ?? "")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-white/60 uppercase">
                          Capacidad Trabajo
                        </span>
                        <span
                          className={`text-sm font-mono font-black uppercase ${selectedPerson.can_work ? "text-accent-approved" : "text-accent-critical"}`}
                        >
                          {selectedPerson.can_work ? "ACTIVO" : "RESTRINGIDO"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono text-white/60 uppercase">
                          Alta Médica
                        </span>
                        <span
                          className={`text-sm font-mono font-black uppercase ${selectedPerson.status !== PersonStatus.Sick && selectedPerson.status !== PersonStatus.Injured ? "text-accent-approved" : "text-accent-critical"}`}
                        >
                          {selectedPerson.status !== PersonStatus.Sick &&
                          selectedPerson.status !== PersonStatus.Injured
                            ? "APTO"
                            : "NO_APTO"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Panel Capacidades */}
                  <div className="bg-black/30 border border-white/5 rounded p-4 space-y-4">
                    <h4 className="text-sm font-mono text-white/40 uppercase font-black border-b border-white/10 pb-1 flex items-center gap-2">
                      <Star className="h-3.5 w-3.5" /> Calificación Técnica
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-mono text-white/40 uppercase block mb-1">
                          Desempeño Operativo
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${i < 3 ? "bg-[#d4a373]" : "bg-white/10"}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-mono text-white/40 uppercase block mb-2">
                          Historial
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-4 py-2 bg-[#d4a373]/10 border border-[#d4a373]/20 text-[#d4a373] text-xs font-mono font-black uppercase rounded">
                            {new Date(selectedPerson.created_at).getFullYear()} INGRESO
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Diagnóstico y Notas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 p-4 bg-[#c27c2f]/5 border border-[#c27c2f]/20 rounded">
                    <h5 className="text-sm font-mono font-black text-[#c27c2f] uppercase mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> Riesgo & Logística
                    </h5>
                    <p className="text-xs font-mono text-white/60 uppercase leading-relaxed mb-4">
                      Sujeto registrado en la base de datos central de supervivientes. Verificación
                      cruzada completada.
                    </p>
                    <span className="text-sm font-mono text-white/30 uppercase">
                      Actualización:
                    </span>
                    <ul className="mt-1 space-y-1">
                      <li className="text-xs font-mono text-white/80 uppercase flex items-center gap-2">
                        <div className="h-1 w-1 bg-white/20 rounded-full" />{" "}
                        {new Date(selectedPerson.updated_at).toLocaleDateString()}
                      </li>
                    </ul>
                  </div>

                  <div className="lg:col-span-2 p-4 bg-black/30 border border-white/5 rounded flex flex-col">
                    <h5 className="text-sm font-mono font-black text-white/40 uppercase mb-2 border-b border-white/10 pb-1">
                      Anotaciones del Comité de Resistencia
                    </h5>
                    <div className="flex-1 text-sm font-mono text-white/70 uppercase leading-relaxed italic bg-black/40 p-3 rounded border border-white/5">
                      El comité no ha adjuntado notas adicionales para este sujeto en el registro
                      actual.
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-[#d4a373]/10 rounded bg-black/20">
                <ShieldCheck className="h-12 w-12 text-[#d4a373] opacity-20 mb-4" />
                <span className="text-[12px] font-mono font-black text-[#d4a373]/40 uppercase tracking-[0.2em] mb-2">
                  Ningún Expediente Seleccionado
                </span>
                <span className="text-sm font-mono text-white/20 uppercase tracking-widest max-w-xs text-center">
                  Seleccione un superviviente del registro para desplegar su ficha operativa
                  clasificada.
                </span>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}

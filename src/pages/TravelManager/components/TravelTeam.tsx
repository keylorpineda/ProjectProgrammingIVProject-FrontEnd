import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Briefcase,
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

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
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
  const consultedCamp = baseCamp

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
      className="flex-1 h-full flex flex-col gap-3 w-full bg-[#0a0a0a] min-h-0 overflow-hidden"
    >
      {/* HEADER — paper tag style unificado */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#12110f] py-4 px-4 border-b border-b-[#d4a373]/20 border-t-2 border-t-[#d4a373]/60 shrink-0 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-[#d4a373]/10 p-2 border border-[#d4a373]/30">
            <Users className="h-6 w-6 text-[#d4a373]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-bg-paper paper-texture text-ink text-xs font-mono font-black uppercase rotate-1 shadow-sm border border-[#8b7355]/30">
                Personal_Operativo
              </span>
              <span className="text-xs font-mono text-[#d4a373]/40 uppercase tracking-widest font-black">
                EQUIPO_BASE
              </span>
            </div>
            <h2 className="text-lg font-typewriter font-bold text-white uppercase tracking-tight leading-none">
              EQUIPO — {consultedCamp?.name?.toUpperCase() ?? baseCampId}
            </h2>
            <p className="font-mono text-xs text-[#d4a373]/60 uppercase tracking-widest mt-1">
              Base operativa: {baseCampId}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4 md:mt-0 relative z-10 w-full md:w-auto">
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <button
              onClick={() =>
                setActiveStatus(activeStatus === PersonStatus.Active ? "all" : PersonStatus.Active)
              }
              className={`bg-[#d4a373]/10 border px-4 py-3 rounded text-center min-w-[90px] transition-all hover:bg-[#d4a373]/20 ${activeStatus === PersonStatus.Active ? "border-accent-approved shadow-inner shadow-accent-approved/20" : "border-[#d4a373]/30"}`}
            >
              <span className="text-3xl font-mono font-black text-white leading-none block mb-1">
                {activeCount}
              </span>
              <span className="text-[10px] font-mono text-accent-approved/70 uppercase tracking-wider font-medium block leading-snug">
                Operativos
                <br />
                disponibles
              </span>
            </button>
            <button
              onClick={() =>
                setActiveStatus(
                  activeStatus === PersonStatus.Exploring ? "all" : PersonStatus.Exploring,
                )
              }
              className={`bg-[#d4a373]/10 border px-4 py-3 rounded text-center min-w-[90px] transition-all hover:bg-[#d4a373]/20 ${activeStatus === PersonStatus.Exploring ? "border-[#c27c2f] shadow-inner shadow-[#c27c2f]/20" : "border-[#d4a373]/30"}`}
            >
              <span className="text-3xl font-mono font-black text-white leading-none block mb-1">
                {inFieldCount}
              </span>
              <span className="text-[10px] font-mono text-[#c27c2f]/70 uppercase tracking-wider font-medium block leading-snug">
                Personal
                <br />
                en campo
              </span>
            </button>
            <button
              onClick={() =>
                setActiveStatus(
                  activeStatus === PersonStatus.Injured ? "all" : PersonStatus.Injured,
                )
              }
              className={`bg-[#d4a373]/10 border px-4 py-3 rounded text-center min-w-[90px] transition-all hover:bg-[#d4a373]/20 ${activeStatus === PersonStatus.Injured ? "border-accent-critical shadow-inner shadow-accent-critical/20" : "border-[#d4a373]/30"}`}
            >
              <span className="text-3xl font-mono font-black text-white leading-none block mb-1">
                {injuredCount}
              </span>
              <span className="text-[10px] font-mono text-accent-critical/70 uppercase tracking-wider font-medium block leading-snug">
                Bajas
                <br />
                heridos
              </span>
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
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden px-4 pb-4">
        {/* COL 1: ROSTER DE PERSONAL */}
        <motion.section
          variants={itemVariants}
          className="md:col-span-4 flex flex-col gap-4 overflow-hidden h-full"
        >
          <div className="flex-1 flex flex-col overflow-hidden bg-[#12110f] border border-[#d4a373]/15 shadow-2xl p-3 relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3 border-b border-[#d4a373]/10 pb-2 shrink-0 relative z-10">
              <span className="text-[10px] font-mono font-semibold text-[#d4a373] uppercase tracking-widest flex items-center gap-2">
                <Users className="h-3.5 w-3.5" /> Registro de Personal
              </span>
            </div>

            {/* Filtros locales */}
            <div className="flex flex-col gap-2 mb-3 shrink-0 relative z-10">
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 border border-white/10 focus-within:border-[#d4a373]/40">
                <Search className="h-3 w-3 text-white/20" />
                <input
                  type="text"
                  placeholder="Buscar nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-xs font-mono text-white/70 w-full placeholder:text-white/20"
                />
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-3 py-2 border border-white/10">
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

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10">
              <AnimatePresence>
                {filteredTeam.map((person) => {
                  const isSelected = selectedId === person.id
                  return (
                    <motion.button
                      key={person.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ x: 2 }}
                      onClick={() => setSelectedId(person.id)}
                      className={`w-full text-left p-3 relative border transition-all ${
                        isSelected
                          ? "tm-paper-texture scale-[1.02] z-10 border-[#d4a373]/10"
                          : "bg-[#b69e7e]/5 hover:bg-[#b69e7e]/10 border-[#d4a373]/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#d4a373]" />
                      )}
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 border shrink-0 ${isSelected ? "bg-ink/5 border-ink/10" : "bg-black/20 border-white/5"}`}
                        >
                          <Users
                            className={`h-3.5 w-3.5 ${isSelected ? "text-ink/60" : "text-[#d4a373]/40"}`}
                          />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={`text-xs font-typewriter font-bold uppercase truncate ${isSelected ? "text-ink" : "text-[#d4a373]"}`}
                          >
                            {person.first_name} {person.last_name}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase tracking-widest ${isSelected ? "text-ink/40" : "text-white/30"}`}
                          >
                            COD-{String(person.id).substring(0, 6)} {"//"}{" "}
                            {person.profession?.name || "S/N"}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
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
                      </div>
                    </motion.button>
                  )
                })}
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

        {/* COL 2: FICHA DE PERSONAL — MANIFIESTO DE PAPEL */}
        <motion.section
          variants={itemVariants}
          className="md:col-span-8 flex flex-col gap-4 overflow-hidden h-full"
        >
          <div className="flex-1 flex flex-col overflow-hidden bg-[#12110f] border border-white/5 shadow-2xl">
            {/* Panel header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-[#b69e7e]/10 p-2 border border-[#b69e7e]/20">
                  <FileText className="h-5 w-5 text-[#d4a373]" />
                </div>
                <div>
                  <h3 className="text-sm font-typewriter font-bold text-white uppercase tracking-wider">
                    Ficha de Personal
                  </h3>
                  <p className="text-[10px] font-mono text-[#d4a373]/50 uppercase tracking-wide">
                    {selectedPerson
                      ? `Ref. B-SER-${String(selectedPerson.id).substring(0, 8).toUpperCase()}`
                      : "Seleccione un superviviente"}
                  </p>
                </div>
              </div>
              {selectedPerson && (
                <div
                  className={`px-3 py-1.5 border inline-flex items-center gap-1.5 ${
                    selectedPerson.can_work
                      ? "bg-[#4c6351]/10 border-[#4c6351]/30 text-[#4c6351]"
                      : "bg-[#9c2720]/10 border-[#9c2720]/30 text-[#9c2720]"
                  }`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${selectedPerson.can_work ? "bg-[#4c6351] animate-pulse" : "bg-[#9c2720]"}`}
                  />
                  <span className="text-xs font-mono font-black uppercase tracking-widest">
                    {selectedPerson.can_work ? "OPERATIVO" : "RESTRINGIDO"}
                  </span>
                </div>
              )}
            </div>

            {/* Paper manifest area */}
            <div className="flex-1 flex flex-col overflow-auto bg-[#0c0c0c] items-center justify-start p-6">
              <AnimatePresence mode="wait">
                {selectedPerson ? (
                  <motion.div
                    key={selectedPerson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full max-w-2xl tm-paper-texture shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden p-10 border-[8px] border-[#8b7355]/10 flex flex-col"
                  >
                    {/* Stamp decoration */}
                    <div className="absolute top-8 right-8 flex flex-col items-center rotate-6 select-none opacity-25 pointer-events-none">
                      <div className="border-4 border-ink p-1 mb-1">
                        <span className="text-base font-black font-mono px-2 text-ink uppercase">
                          {selectedPerson.can_work ? "ACTIVO" : "BAJA"}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-black italic text-ink">
                        Registro Central
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col relative z-10">
                      {/* Person name header */}
                      <div className="mb-8 pb-5 border-b-4 border-double border-ink/20">
                        <p className="text-xs font-mono text-ink/40 uppercase tracking-widest mb-3">
                          Ficha de Superviviente — Comité de Resistencia
                        </p>
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-ink/10 border-2 border-ink/20 flex items-center justify-center shrink-0">
                            <Users className="h-7 w-7 text-ink/40" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-typewriter font-bold text-ink uppercase leading-none">
                              {selectedPerson.first_name} {selectedPerson.last_name}
                            </h2>
                            <p className="text-sm font-mono text-ink/60 uppercase tracking-widest mt-1 flex items-center gap-2">
                              <Briefcase className="h-3.5 w-3.5" />
                              {selectedPerson.profession?.name || "Profesión no registrada"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data grid */}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-5 mb-8">
                        <div>
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                            Estado Operativo
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusColor((selectedPerson.status || "idle") as PersonStatus).replace("text-", "bg-")}`}
                            />
                            <p
                              className={`text-sm font-typewriter font-bold uppercase ${getStatusColor((selectedPerson.status || "idle") as PersonStatus)}`}
                            >
                              {getStatusLabel((selectedPerson.status || "idle") as PersonStatus)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                            Base Asignada
                          </span>
                          <p className="text-sm font-mono font-semibold text-ink uppercase mt-1 flex items-center gap-1.5">
                            <Navigation className="h-3 w-3 text-ink/40" />
                            {getCampName(selectedPerson.camp_id ?? "")}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                            Capacidad de Trabajo
                          </span>
                          <p
                            className={`text-sm font-mono font-bold uppercase mt-1 ${selectedPerson.can_work ? "text-[#4c6351]" : "text-[#9c2720]"}`}
                          >
                            {selectedPerson.can_work ? "APTO" : "RESTRINGIDO"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                            Alta Médica
                          </span>
                          <p
                            className={`text-sm font-mono font-bold uppercase mt-1 ${
                              selectedPerson.status !== PersonStatus.Sick &&
                              selectedPerson.status !== PersonStatus.Injured
                                ? "text-[#4c6351]"
                                : "text-[#9c2720]"
                            }`}
                          >
                            {selectedPerson.status !== PersonStatus.Sick &&
                            selectedPerson.status !== PersonStatus.Injured
                              ? "APTO"
                              : "NO APTO"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                            Año de Ingreso
                          </span>
                          <p className="text-sm font-mono text-ink mt-1">
                            {new Date(selectedPerson.created_at).getFullYear()}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                            Última Actualización
                          </span>
                          <p className="text-sm font-mono text-ink mt-1">
                            {new Date(selectedPerson.updated_at).toLocaleDateString("es-CR")}
                          </p>
                        </div>
                      </div>

                      {/* Notes section */}
                      <div className="mb-6">
                        <h4 className="text-xs font-mono font-black text-ink/40 border-b border-ink/5 pb-1 mb-3 uppercase">
                          Anotaciones del Comité
                        </h4>
                        <div className="p-4 bg-white/40 border border-ink/10 italic font-typewriter text-sm text-ink/60 leading-relaxed min-h-[60px]">
                          Sin anotaciones adicionales registradas por el comité de resistencia.
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex justify-between items-center text-[10px] font-mono text-ink/30 uppercase border-t border-ink/10">
                        <span>Generado: {new Date().toLocaleDateString("es-CR")}</span>
                        <span className="text-ink/40">
                          Ref. B-SER-{String(selectedPerson.id).substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center w-full">
                    <ShieldCheck className="h-16 w-16 text-[#d4a373] opacity-20 mb-6" />
                    <h3 className="text-base font-typewriter font-bold text-white/40 uppercase mb-2">
                      Ningún Expediente Seleccionado
                    </h3>
                    <p className="text-xs font-mono text-white/25 max-w-xs leading-relaxed">
                      Seleccione un superviviente del registro para desplegar su ficha operativa.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Compass,
  Users,
  Archive,
  Search,
  MapPin,
  X,
  CheckCircle2,
  AlertCircle,
  Radio,
  Target,
  Shield,
  Zap,
  FileText,
  Flag,
  Check,
  Footprints,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { useState, useMemo } from "react"

import type { Exploration, Person, InventoryItem } from "@/types/api.types"
import type { ReturnExplorationFormData } from "@/types/travel-comms.types"

import {
  getExplorations,
  createExploration,
  departExploration,
  returnExploration,
  cancelExploration,
} from "@/features/explorations/services/explorations.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { MapCoordPicker } from "@/features/map-test/components/MapCoordPicker"
import { getPersons } from "@/features/persons/services/persons.service"
import { useAuthStore } from "@/store/useAuthStore"

// ── Status helpers ──────────────────────────────────────────────────────────

function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
    case "in_progress":
      return "En curso"
    case "scheduled":
      return "Programada"
    case "returned":
    case "completed":
      return "Retornada"
    case "cancelled":
      return "Cancelada"
    default:
      return status
  }
}

function getStatusColorClass(status: string): string {
  switch (status) {
    case "active":
    case "in_progress":
      return "text-accent-approved"
    case "scheduled":
      return "text-[#c27c2f]"
    case "cancelled":
      return "text-accent-critical"
    default:
      return "text-paper-dark/40"
  }
}

// ── Timeline step type ──────────────────────────────────────────────────────

interface TimelineStep {
  label: string
  status: "completed" | "current" | "pending"
  Icon: React.FC<{ className?: string }>
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TravelExplorations() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const baseCampId = user?.camp_id ?? ""

  // ── Local UI state ───────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [formError, setFormError] = useState("")

  // New exploration form state
  const [newName, setNewName] = useState("")
  const [newDestination, setNewDestination] = useState("")
  const [newDepartureDate, setNewDepartureDate] = useState(
    new Date().toISOString().substring(0, 16),
  )
  const [newEstimatedDays, setNewEstimatedDays] = useState(3)
  const [newGraceDays, setNewGraceDays] = useState(0)
  const [newSelectedPersons, setNewSelectedPersons] = useState<
    Array<{ person_id: string; is_leader: boolean }>
  >([])
  const [newSelectedResources, setNewSelectedResources] = useState<
    Array<{ resource_id: string; quantity: number }>
  >([])
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)

  // Return form state
  const [returnDate, setReturnDate] = useState(new Date().toISOString().substring(0, 10))
  const [returnNotes, setReturnNotes] = useState("")

  // ── React Query ──────────────────────────────────────────────────────────
  const { data: explorations = [], error } = useQuery({
    queryKey: ["explorations", baseCampId],
    queryFn: () => getExplorations({ campId: baseCampId }),
    enabled: !!baseCampId,
  })

  const { data: personsData } = useQuery({
    queryKey: ["persons", baseCampId],
    queryFn: () => getPersons({ campId: baseCampId }),
    enabled: !!baseCampId && isNewModalOpen,
  })
  const persons: Person[] = personsData?.data ?? []

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["inventory", baseCampId],
    queryFn: () => getInventory(baseCampId),
    enabled: !!baseCampId && isNewModalOpen,
  })

  const createMutation = useMutation({
    mutationFn: createExploration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["explorations", baseCampId] })
      resetNewForm()
      setIsNewModalOpen(false)
    },
    onError: () => setFormError("Error al crear la expedición. Intente nuevamente."),
  })

  const departMutation = useMutation({
    mutationFn: (id: string) => departExploration(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["explorations", baseCampId] }),
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnExplorationFormData }) =>
      returnExploration(id, { real_return_date: body.real_return_date, notes: body.notes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["explorations", baseCampId] })
      setIsReturnModalOpen(false)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelExploration(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["explorations", baseCampId] }),
  })

  // ── Derived state ────────────────────────────────────────────────────────
  const filteredExplorations = useMemo(() => {
    return explorations.filter((exp) => {
      const q = search.toLowerCase()
      const matchesSearch =
        String(exp.name || "")
          .toLowerCase()
          .includes(q) ||
        String(exp.destination_description || "")
          .toLowerCase()
          .includes(q)
      const matchesStatus = filterStatus === "" || exp.status === filterStatus
      return matchesSearch && matchesStatus
    })
  }, [explorations, search, filterStatus])

  const selectedExp = useMemo<Exploration | null>(() => {
    if (filteredExplorations.length === 0) return null
    if (selectedId && filteredExplorations.some((e) => e.id === selectedId)) {
      return filteredExplorations.find((e) => e.id === selectedId) ?? null
    }
    return filteredExplorations[0] ?? null
  }, [filteredExplorations, selectedId])

  const stats = useMemo(
    () => [
      {
        id: "scheduled",
        label: "Programadas",
        count: filteredExplorations.filter((e) => e.status === "scheduled").length,
      },
      {
        id: "in_progress",
        label: "En Curso",
        count: filteredExplorations.filter(
          (e) => e.status === "active" || e.status === "in_progress",
        ).length,
      },
      {
        id: "completed",
        label: "Historial",
        count: filteredExplorations.filter((e) => e.status === "completed").length,
      },
    ],
    [filteredExplorations],
  )

  const timelineSteps = useMemo<TimelineStep[]>(() => {
    if (!selectedExp) return []
    return [
      { label: "PLANIFICADA", status: "completed", Icon: FileText },
      {
        label: "SALIDA",
        status:
          selectedExp.status !== "scheduled" && selectedExp.status !== "cancelled"
            ? "completed"
            : "pending",
        Icon: Zap,
      },
      {
        label: "EN CURSO",
        status:
          selectedExp.status === "active" || selectedExp.status === "in_progress"
            ? "current"
            : selectedExp.status === "completed"
              ? "completed"
              : "pending",
        Icon: Flag,
      },
      {
        label: "RETORNO",
        status: selectedExp.status === "completed" ? "completed" : "pending",
        Icon: Check,
      },
    ]
  }, [selectedExp])

  // ── Handlers ─────────────────────────────────────────────────────────────
  function resetNewForm() {
    setNewName("")
    setNewDestination("")
    setNewEstimatedDays(3)
    setNewGraceDays(0)
    setNewSelectedPersons([])
    setNewSelectedResources([])
    setDestLat(null)
    setDestLng(null)
    setFormError("")
  }

  function handleCreateExploration(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!newName.trim()) {
      setFormError("Escriba un nombre para la expedición.")
      return
    }
    if (!newDestination.trim()) {
      setFormError("Describa el destino exterior.")
      return
    }
    if (newSelectedPersons.length === 0) {
      setFormError("Incluya al menos un (1) miembro de equipo.")
      return
    }
    if (!newSelectedPersons.some((p) => p.is_leader)) {
      setFormError("Asigne un líder a la expedición.")
      return
    }

    const coordSuffix =
      destLat !== null && destLng !== null ? ` [${destLat.toFixed(5)}, ${destLng.toFixed(5)}]` : ""

    createMutation.mutate({
      camp_id: baseCampId,
      name: newName,
      destination_description: newDestination + coordSuffix,
      departure_date: newDepartureDate,
      estimated_days: newEstimatedDays,
      grace_days: newGraceDays,
      persons: newSelectedPersons,
      resources: newSelectedResources.map((r) => ({ ...r, flow: "out" as const })),
    })
  }

  function handleMarkDeparture(id: string) {
    departMutation.mutate(id)
  }

  function handleCancelExploration(id: string) {
    if (window.confirm("¿Confirmar la cancelación de esta expedición?")) {
      cancelMutation.mutate(id)
    }
  }

  function handleRegisterReturn() {
    if (!selectedExp) return
    returnMutation.mutate({
      id: selectedExp.id,
      body: { real_return_date: returnDate, notes: returnNotes },
    })
  }

  function handleTogglePersonSelect(personId: string) {
    const exists = newSelectedPersons.find((p) => p.person_id === personId)
    if (exists) {
      const filtered = newSelectedPersons.filter((p) => p.person_id !== personId)
      if (exists.is_leader && filtered.length > 0) {
        filtered[0].is_leader = true
      }
      setNewSelectedPersons(filtered)
    } else {
      const isLeader = newSelectedPersons.length === 0
      setNewSelectedPersons([...newSelectedPersons, { person_id: personId, is_leader: isLeader }])
    }
  }

  function handleSetLeader(personId: string) {
    setNewSelectedPersons(
      newSelectedPersons.map((p) => ({ ...p, is_leader: p.person_id === personId })),
    )
  }

  function handleToggleResourceSelect(resourceId: string) {
    const exists = newSelectedResources.find((r) => r.resource_id === resourceId)
    if (exists) {
      setNewSelectedResources(newSelectedResources.filter((r) => r.resource_id !== resourceId))
    } else {
      setNewSelectedResources([...newSelectedResources, { resource_id: resourceId, quantity: 1 }])
    }
  }

  function handleResourceQuantityChange(resourceId: string, qty: number) {
    setNewSelectedResources(
      newSelectedResources.map((r) =>
        r.resource_id === resourceId ? { ...r, quantity: Math.max(1, qty) } : r,
      ),
    )
  }

  // ── Loading / Error guards ────────────────────────────────────────────────
  // El loader bloqueante ha sido desactivado para que la UI cargue inmediatamente
  // if (isLoading) {
  //   return (
  //     <div className="travelmanager-page-content flex-1 flex items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-[#c27c2f]" />
  //       <span className="ml-3 font-mono text-sm uppercase text-paper-dark">
  //         Cargando expediciones...
  //       </span>
  //     </div>
  //   )
  // }

  // if (error) {
  //   return (
  //     <div className="travelmanager-page-content">
  //       <div className="warning-card p-4 font-mono text-sm text-accent-critical uppercase">
  //         Error al cargar expediciones. Verifique la conexión con el servidor.
  //       </div>
  //     </div>
  //   )
  // }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden bg-bunker-bg">
      {/* ── Vista Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-industrial-metal py-4 pl-4 pr-8 md:pr-16 border-l-4 border-l-accent-warning shrink-0 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-[#c27c2f]/10 p-2 border border-[#c27c2f]/30">
            <Compass className="h-6 w-6 text-[#c27c2f]" />
          </div>
          <div>
            <h2 className="text-2xl font-typewriter font-black text-white uppercase tracking-tight leading-none">
              OPERACIONES DE CAMPO
            </h2>
            <p className="font-mono text-xs text-[#c27c2f] font-black uppercase tracking-[0.2em] mt-2 opacity-80">
              Protocolo de Archivo: {baseCampId.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-0 relative z-10 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 md:gap-4 border-r border-white/10 pr-4 md:pr-6">
            {stats.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterStatus(filterStatus === s.id ? "" : s.id)}
                className={`flex flex-col items-center transition-all px-2 md:px-4 py-2 border border-transparent ${
                  filterStatus === s.id
                    ? "bg-[#c27c2f]/10 border-[#c27c2f]/20 shadow-inner"
                    : "hover:bg-[#d4a373]/20"
                }`}
              >
                <span className="text-base md:text-lg font-mono font-black text-[#c27c2f]">
                  {s.count}
                </span>
                <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-tighter text-white/40">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="text-white px-4 md:px-6 py-2.5 text-xs md:text-sm font-mono font-black uppercase hover:brightness-110 hover:shadow-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 border-b-2 border-r-2 border-black/20 whitespace-nowrap"
            style={{ backgroundColor: "#c27c2f" }}
          >
            <Plus className="h-3.5 w-3.5" /> NUEVA EXPLORACIÓN
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 bg-red-950/40 border border-red-500/50 p-3 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden px-4 pb-4">
        {/* ── Filtros ── */}
        <div className="flex flex-wrap gap-3 shrink-0 items-center bg-industrial-metal/60 p-2 border border-white/5">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              type="text"
              placeholder="Buscar ruta o destino..."
              className="vintage-input w-full pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-[#c27c2f]/10 px-4 py-2.5">
            <span className="text-sm font-mono text-white/30 uppercase font-black">Estado:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">TODOS</option>
              {stats.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Layout 3 columnas ── */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* LEFT: Lista fichero */}
          <div className="w-[280px] flex flex-col gap-2 shrink-0 overflow-hidden bg-industrial-metal p-3 border-l-2 border-l-accent-warning/40">
            <div className="flex items-center justify-between px-1 mb-1 border-b border-[#c27c2f]/10 pb-2">
              <span className="text-xs font-mono font-black text-[#c27c2f] uppercase tracking-widest">
                Fichero Operativo
                {filteredExplorations.length} REG
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {filteredExplorations.length > 0 ? (
                filteredExplorations.map((exp) => (
                  <motion.button
                    key={exp.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedId(exp.id)}
                    className={`w-full text-left p-3 relative transition-all border border-[#c27c2f]/10 ${
                      selectedExp?.id === exp.id
                        ? "bg-bg-paper shadow-xl scale-[1.02] z-10"
                        : "bg-[#c27c2f]/5 hover:bg-[#c27c2f]/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`absolute top-2 right-3 font-mono text-sm font-black tracking-tighter ${
                        selectedExp?.id === exp.id ? "text-ink-soft/50" : "text-[#c27c2f]/30"
                      }`}
                    >
                      REF-{exp.id.slice(0, 4).toUpperCase()}
                    </div>
                    <h5
                      className={`text-[12px] font-typewriter font-black uppercase leading-tight mb-1 ${
                        selectedExp?.id === exp.id ? "text-ink" : "text-[#c27c2f]"
                      }`}
                    >
                      {exp.name}
                    </h5>
                    <p
                      className={`text-sm font-mono uppercase tracking-tighter font-bold ${
                        selectedExp?.id === exp.id ? "text-ink/80" : "text-white/40"
                      }`}
                    >
                      Destino: {exp.destination_description}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex -space-x-2">
                        {exp.explorationPersons.slice(0, 3).map((ep, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border border-[#1a1a1a] bg-[#43523d] flex items-center justify-center shadow-md z-10"
                            title={ep.person?.first_name || "Explorador"}
                          >
                            <span className="text-sm font-bold text-white uppercase">
                              {(ep.person?.first_name || "X").substring(0, 2)}
                            </span>
                          </div>
                        ))}
                        {exp.explorationPersons.length > 3 && (
                          <div className="w-6 h-6 rounded-full border border-[#1a1a1a] bg-black/40 flex items-center justify-center shadow-md z-0">
                            <span className="text-sm font-bold text-white uppercase">
                              +{exp.explorationPersons.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`h-2 w-2 rounded-full border border-black/10 ${
                            exp.status === "active" || exp.status === "in_progress"
                              ? "bg-accent-approved animate-pulse"
                              : exp.status === "scheduled"
                                ? "bg-[#c27c2f]"
                                : exp.status === "cancelled"
                                  ? "bg-accent-critical"
                                  : "bg-black/20"
                          }`}
                        />
                        <span
                          className={`text-sm font-mono font-black uppercase tracking-widest ${
                            selectedExp?.id === exp.id
                              ? getStatusColorClass(exp.status)
                              : "text-white/20"
                          }`}
                        >
                          {getStatusLabel(exp.status)}
                        </span>
                      </div>
                    </div>
                    {selectedExp?.id === exp.id && (
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#c27c2f]" />
                    )}
                  </motion.button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-10 w-10 text-[#c27c2f]/10 mb-4" />
                  <p className="text-sm font-mono text-white/30 uppercase leading-relaxed font-black mb-3">
                    Sin expediciones para esta consulta
                  </p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="px-4 py-2 border border-[#c27c2f]/30 text-sm font-mono font-bold text-[#c27c2f] hover:bg-[#c27c2f]/10 transition-colors uppercase"
                  >
                    Nueva exploración
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Mapa / Detalle */}
          <div className="flex-1 flex flex-col overflow-hidden bg-industrial-metal border border-[#c27c2f]/10">
            {selectedExp ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Panel header */}
                <div className="p-4 border-b border-[#c27c2f]/10 flex justify-between items-center bg-black/20 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#c27c2f]/10 p-2">
                      <MapPin className="h-4 w-4 text-[#c27c2f]" />
                    </div>
                    <div>
                      <span className="text-sm font-mono font-black text-[#c27c2f] uppercase tracking-[0.3em] block mb-0.5">
                        Bitácora de Coordenadas
                      </span>
                      <h3 className="text-lg font-typewriter font-black text-white uppercase leading-none tracking-tight">
                        {selectedExp.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-2 py-0.5 border inline-flex items-center gap-1.5 ${
                        selectedExp.status === "active" || selectedExp.status === "in_progress"
                          ? "bg-accent-mil/10 border-accent-mil/20 text-accent-approved"
                          : selectedExp.status === "scheduled"
                            ? "bg-[#c27c2f]/10 border-[#c27c2f]/20 text-[#c27c2f]"
                            : "bg-white/5 border-white/10 text-white/40"
                      }`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${
                          selectedExp.status === "active" || selectedExp.status === "in_progress"
                            ? "bg-accent-approved animate-pulse"
                            : selectedExp.status === "scheduled"
                              ? "bg-[#c27c2f]"
                              : "bg-white/40"
                        }`}
                      />
                      <span className="text-sm font-mono font-black uppercase tracking-widest leading-none">
                        {getStatusLabel(selectedExp.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsDetailOpen(true)}
                      className="text-xs font-mono font-black text-[#c27c2f] border border-[#c27c2f]/30 px-4 py-2.5 hover:bg-[#c27c2f] hover:text-ink-black transition-all"
                    >
                      VER EXPEDIENTE
                    </button>
                  </div>
                </div>

                {/* Paper map visualization */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden bg-black/40 items-center justify-center relative">
                  <div className="w-full h-full max-w-4xl bg-bg-paper shadow-[0_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden p-8 border-[12px] border-bg-paper-shadow/20 flex flex-col">
                    <div className="relative h-full flex flex-col">
                      <div className="flex-1 flex items-center justify-between px-20 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-[2px] border-t-2 border-dashed border-ink/10 -translate-y-1/2 mx-32" />

                        {(selectedExp.status === "active" ||
                          selectedExp.status === "in_progress") && (
                          <motion.div
                            animate={{ left: ["20%", "80%"] }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 -translate-y-1/2 z-10"
                          >
                            <Footprints className="h-5 w-5 text-ink/30 -rotate-90" />
                          </motion.div>
                        )}

                        {/* Origin node */}
                        <div className="flex flex-col items-center gap-4 z-20">
                          <div className="p-1.5 bg-bg-paper border-2 border-accent-mil rotate-2 shadow-lg">
                            <Radio className="h-6 w-6 text-accent-mil" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-mono font-black text-ink/30 uppercase block mb-1">
                              Origen_Nudo
                            </span>
                            <span className="text-sm font-typewriter font-black text-ink uppercase border-b border-ink/10">
                              {baseCampId}
                            </span>
                          </div>
                        </div>

                        {/* Destination node */}
                        <div className="flex flex-col items-center gap-4 z-20">
                          <div className="p-1.5 bg-bg-paper border-2 border-bg-paper-shadow -rotate-2 shadow-lg">
                            <Target className="h-6 w-6 text-ink/60" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-mono font-black text-ink/30 uppercase block mb-1">
                              Coordenada_Fin
                            </span>
                            <span className="text-sm font-typewriter font-black text-ink uppercase border-b border-ink/10 max-w-[120px] block truncate">
                              {selectedExp.destination_description}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom info strip */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end border-t border-ink/15 pt-4">
                        <div className="flex gap-10">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-mono text-ink/40 font-black uppercase leading-none opacity-60">
                              Salida_Protocolo
                            </span>
                            <span className="text-sm font-mono font-black text-ink whitespace-nowrap">
                              {new Date(selectedExp.departure_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-mono text-ink/40 font-black uppercase leading-none opacity-60">
                              Días Estimados
                            </span>
                            <span className="text-sm font-mono font-black text-ink whitespace-nowrap">
                              {selectedExp.estimated_days} días{" "}
                              {selectedExp.grace_days > 0 ? "(+1 Gracia)" : ""}
                            </span>
                          </div>
                        </div>
                        <div className="inline-block px-4 py-2.5 border-2 border-bg-paper-shadow/40 rotate-1 bg-bg-paper text-bg-paper-shadow font-mono font-black text-xs uppercase shadow-sm">
                          ARCHIVO_B3_DESPLIEGUE
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="h-28 bg-black/40 border-t border-[#c27c2f]/10 p-4 flex flex-col shrink-0 relative overflow-hidden">
                  <div className="flex items-center justify-between px-16 relative flex-1">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#c27c2f]/10 -translate-y-1/2 mx-20" />
                    {timelineSteps.map((step, i) => {
                      const StepIcon = step.Icon
                      return (
                        <div key={i} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${
                              step.status === "completed"
                                ? "bg-paper-dark border-white/20 text-white"
                                : step.status === "current"
                                  ? "bg-accent-mil border-[#c27c2f] text-white animate-pulse"
                                  : "bg-black/80 border-[#c27c2f]/10 text-[#c27c2f]/20"
                            }`}
                          >
                            <StepIcon className="h-3.5 w-3.5" />
                          </div>
                          <span
                            className={`absolute top-full mt-2 text-sm font-mono font-black tracking-widest whitespace-nowrap ${
                              step.status !== "pending"
                                ? "text-[#c27c2f] opacity-80"
                                : "text-[#c27c2f]/10"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-3 border-t border-[#c27c2f]/10 flex gap-2 shrink-0 bg-black/20">
                  {selectedExp.status === "scheduled" && (
                    <>
                      <button
                        onClick={() => handleMarkDeparture(selectedExp.id)}
                        disabled={departMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-accent-mil text-white text-xs font-mono font-black uppercase hover:bg-accent-approved transition-all disabled:opacity-50"
                      >
                        {departMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Zap className="h-3 w-3" />
                        )}
                        Marcar Salida
                      </button>
                      <button
                        onClick={() => handleCancelExploration(selectedExp.id)}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-accent-critical/10 border border-accent-critical/30 text-accent-critical text-xs font-mono font-black uppercase hover:bg-accent-critical hover:text-[#fca311] transition-all disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                    </>
                  )}
                  {(selectedExp.status === "active" || selectedExp.status === "in_progress") && (
                    <button
                      onClick={() => setIsReturnModalOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent-emergency/80 text-ink-black text-xs font-mono font-black uppercase hover:bg-accent-emergency transition-all"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Registrar Retorno
                    </button>
                  )}
                  {(selectedExp.status === "completed" || selectedExp.status === "cancelled") && (
                    <span className="text-xs font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                      <Shield className="h-3 w-3" />
                      Expedición archivada
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Compass className="h-20 w-20 mb-6 text-[#c27c2f] opacity-20 animate-spin" />
                <p className="font-typewriter text-2xl text-white/20 font-black uppercase mb-3">
                  Seleccione una Expedición
                </p>
                <p className="font-mono text-sm text-white/20 uppercase tracking-widest">
                  o cree una nueva para comenzar
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Team panel */}
          {selectedExp && (
            <div className="w-60 flex flex-col gap-3 shrink-0 overflow-hidden bg-industrial-metal p-3 border-r-2 border-r-accent-warning/20">
              <div className="border-b border-[#c27c2f]/10 pb-2">
                <div className="flex items-center gap-1.5 min-w-[70px]">
                  <Users className="w-3.5 h-3.5 text-[#d4a373]/60" />
                  <span className="text-xs font-mono font-black text-[#c27c2f] uppercase tracking-widest">
                    Equipo Asignado
                  </span>
                  <span className="text-sm font-mono text-[#d4a373] uppercase ml-auto">
                    {selectedExp.explorationPersons.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {selectedExp.explorationPersons.map((ep, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-black/40 p-2 rounded border border-white/5"
                  >
                    <div className="w-8 h-8 bg-[#2a3026] rounded-full border border-[#43523d] flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-[#43523d]" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-mono font-black text-white uppercase truncate">
                        {ep.person?.first_name || "Desconocido"} {ep.person?.last_name || ""}
                      </span>
                      <span className="text-sm font-mono text-white/40 uppercase">
                        {ep.person?.profession?.name || "OPERARIO"} {"//"} COD-
                        {String(ep.person_id).substring(0, 4)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Nueva Exploración ── */}
      <AnimatePresence>
        {isNewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-industrial-metal border-4 border-double border-[#c27c2f]/50 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-[#c27c2f]/30 bg-black/50">
                <div className="flex items-center gap-4">
                  <Compass className="h-8 w-8 text-[#c27c2f] animate-pulse" />
                  <h3 className="font-typewriter font-black text-white uppercase text-xl md:text-2xl tracking-widest">
                    Nueva Expedición
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsNewModalOpen(false)
                    resetNewForm()
                  }}
                  className="text-white/40 hover:text-[#fca311] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <form
                onSubmit={handleCreateExploration}
                className="flex-1 overflow-y-auto custom-scrollbar"
              >
                <div className="p-8 space-y-8">
                  {/* Basic info */}
                  <div className="grid grid-grid-cols-1 gap-6">
                    <div>
                      <label
                        htmlFor="te-name"
                        className="text-sm md:text-base font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2"
                      >
                        Nombre de la Expedición *
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej: EXPEDICIÓN NORTE-7"
                        className="vintage-input w-full p-4 text-base md:text-lg"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="te-dest"
                        className="text-sm md:text-base font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2"
                      >
                        Descripción del Destino *
                      </label>
                      <input
                        type="text"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        placeholder="Ej: Sector norte, cuadrícula B-7"
                        className="vintage-input w-full p-4 text-base md:text-lg"
                      />
                    </div>
                  </div>

                  {/* Map coord picker */}
                  <div>
                    <div className="text-sm md:text-base font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Zona de Destino en el Mapa
                      <span className="text-white/30 font-normal normal-case tracking-normal text-xs">
                        — haz clic para marcar coordenadas
                      </span>
                    </div>
                    <div className="border border-[#c27c2f]/30 overflow-hidden">
                      <MapCoordPicker
                        lat={destLat}
                        lng={destLng}
                        onChange={(lat, lng) => {
                          setDestLat(lat)
                          setDestLng(lng)
                        }}
                      />
                    </div>
                    {destLat !== null && destLng !== null && (
                      <p className="mt-1 text-xs font-mono text-[#c27c2f]/70 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#c27c2f] animate-pulse" />
                        COORDENADAS: {destLat.toFixed(5)}, {destLng.toFixed(5)}
                        <button
                          type="button"
                          onClick={() => {
                            setDestLat(null)
                            setDestLng(null)
                          }}
                          className="text-white/30 hover:text-white/70 ml-2 underline"
                        >
                          limpiar
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Dates and duration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label
                        htmlFor="te-departure"
                        className="text-sm md:text-base font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2"
                      >
                        Fecha de Salida *
                      </label>
                      <input
                        type="datetime-local"
                        value={newDepartureDate}
                        onChange={(e) => setNewDepartureDate(e.target.value)}
                        className="vintage-input w-full text-base p-4"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="te-days"
                        className="text-sm md:text-base font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2"
                      >
                        Días Estimados *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newEstimatedDays}
                        onChange={(e) => setNewEstimatedDays(Number(e.target.value))}
                        className="vintage-input w-full text-base p-4"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="te-grace"
                        className="text-sm md:text-base font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2"
                      >
                        Días de Gracia
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newGraceDays}
                        onChange={(e) => setNewGraceDays(Number(e.target.value))}
                        className="vintage-input w-full text-base p-4"
                      />
                    </div>
                  </div>

                  {/* Team selection */}
                  <div>
                    <div className="text-xs font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2">
                      Seleccionar Equipo * ({newSelectedPersons.length} seleccionado(s))
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-[#c27c2f]/10 p-2 bg-black/20">
                      {persons.length === 0 ? (
                        <p className="text-xs font-mono text-white/30 uppercase text-center py-4">
                          Cargando personas disponibles...
                        </p>
                      ) : (
                        persons
                          .filter(
                            (p) =>
                              p.status === "active" ||
                              p.status === "activo" ||
                              p.status === "idle" ||
                              p.status === "inactivo" ||
                              p.status === "resting" ||
                              p.status === "available" ||
                              !p.status,
                          )
                          .map((person) => {
                            const sel = newSelectedPersons.find((s) => s.person_id === person.id)
                            const isSelected = !!sel
                            return (
                              <div
                                key={person.id}
                                role="button"
                                tabIndex={0}
                                className={`flex items-center justify-between p-2 border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#c27c2f]/10 border-[#c27c2f]/30"
                                    : "bg-black/20 border-white/5 hover:border-[#c27c2f]/20"
                                }`}
                                onClick={() => handleTogglePersonSelect(person.id)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleTogglePersonSelect(person.id)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3 w-3 border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "border-[#c27c2f] bg-[#c27c2f]/20"
                                        : "border-white/20"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-2 w-2 text-[#c27c2f]" />}
                                  </div>
                                  <span className="text-sm font-mono text-white/80 uppercase">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {person.profession && (
                                    <span className="text-sm font-mono text-white/30">
                                      [{person.profession.name}]
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation()
                                      handleSetLeader(person.id)
                                    }}
                                    className={`text-sm font-mono font-black uppercase px-2 py-0.5 border transition-all ${
                                      sel?.is_leader
                                        ? "bg-[#c27c2f] text-black hover:bg-[#fca311] border-[#c27c2f]"
                                        : "border-[#c27c2f]/30 text-[#c27c2f]/60 hover:bg-[#c27c2f]/10"
                                    }`}
                                  >
                                    {sel?.is_leader ? "LÍDER ✓" : "Líder?"}
                                  </button>
                                )}
                              </div>
                            )
                          })
                      )}
                    </div>
                  </div>

                  {/* Resource selection */}
                  {inventory.length > 0 && (
                    <div>
                      <div className="text-xs font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-2">
                        Recursos para la Expedición (opcional)
                      </div>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-[#c27c2f]/10 p-2 bg-black/20">
                        {inventory.map((item) => {
                          const sel = newSelectedResources.find(
                            (r) => r.resource_id === item.resource_id,
                          )
                          const isSelected = !!sel
                          return (
                            <div
                              key={item.resource_id}
                              className={`flex items-center justify-between p-2 border transition-all ${
                                isSelected
                                  ? "bg-[#c27c2f]/10 border-[#c27c2f]/30"
                                  : "bg-black/20 border-white/5"
                              }`}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                className="flex items-center gap-2 cursor-pointer flex-1"
                                onClick={() => handleToggleResourceSelect(item.resource_id)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleToggleResourceSelect(item.resource_id)
                                }
                              >
                                <div
                                  className={`h-3 w-3 border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? "border-[#c27c2f] bg-[#c27c2f]/20"
                                      : "border-white/20"
                                  }`}
                                >
                                  {isSelected && <Check className="h-2 w-2 text-[#c27c2f]" />}
                                </div>
                                <span className="text-sm font-mono font-black text-white/80 uppercase">
                                  {item.resource!.name}
                                </span>
                                <span className="text-sm font-mono text-white/40 uppercase">
                                  {item.resource!.category} {"//"} {item.current_quantity}{" "}
                                  {item.resource!.unit}
                                </span>
                              </div>
                              {isSelected && (
                                <input
                                  type="number"
                                  min={1}
                                  max={item.current_quantity}
                                  value={sel.quantity}
                                  onClick={(ev) => ev.stopPropagation()}
                                  onChange={(e) =>
                                    handleResourceQuantityChange(
                                      item.resource_id,
                                      Number(e.target.value),
                                    )
                                  }
                                  className="vintage-input w-16 text-sm ml-2"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {formError && (
                    <div className="flex items-center gap-2 text-accent-critical text-sm font-mono uppercase bg-accent-critical/10 border border-accent-critical/30 p-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {formError}
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="p-8 border-t-2 border-[#c27c2f]/30 flex justify-end gap-6 bg-black/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false)
                      resetNewForm()
                    }}
                    className="px-6 py-4 text-lg font-mono font-black text-white uppercase border-2 border-white/30 hover:border-white/70 hover:bg-white/10 transition-all shadow-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-10 py-4 bg-[#c27c2f] text-white hover:bg-[#fca311] text-lg font-mono font-black uppercase hover:text-black transition-all disabled:opacity-50 flex items-center gap-3 shadow-[0_0_15px_rgba(194,124,47,0.5)]"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <ChevronRight className="h-6 w-6" />
                    )}
                    Crear Expedición
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Registrar Retorno ── */}
      <AnimatePresence>
        {isReturnModalOpen && selectedExp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-industrial-metal border border-[#c27c2f]/30 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#c27c2f]/20 bg-black/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent-approved" />
                  <h3 className="font-typewriter font-black text-white uppercase">
                    Registrar Retorno
                  </h3>
                </div>
                <button
                  onClick={() => setIsReturnModalOpen(false)}
                  className="text-white/40 hover:text-[#fca311] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm font-mono text-white/50 uppercase">
                  Expedición: <span className="text-[#c27c2f] font-black">{selectedExp.name}</span>
                </p>
                <div>
                  <label
                    htmlFor="te-return-date"
                    className="text-xs font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-1"
                  >
                    Fecha Real de Retorno *
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="vintage-input w-full"
                  />
                </div>
                <div>
                  <label
                    htmlFor="te-return-notes"
                    className="text-xs font-mono font-black text-[#c27c2f] uppercase tracking-widest block mb-1"
                  >
                    Notas del Retorno
                  </label>
                  <textarea
                    id="te-return-notes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Condiciones del retorno, hallazgos, incidentes..."
                    rows={3}
                    className="vintage-input w-full resize-none"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-[#c27c2f]/20 flex justify-end gap-3 bg-black/20">
                <button
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-sm font-mono font-black text-white/50 uppercase border border-white/10 hover:border-white/30 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRegisterReturn}
                  disabled={returnMutation.isPending}
                  className="px-6 py-2 bg-accent-approved text-white text-sm font-mono font-black uppercase hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {returnMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Confirmar Retorno
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Expediente Detalle ── */}
      <AnimatePresence>
        {isDetailOpen && selectedExp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-bg-paper border-4 border-bg-paper-shadow w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.9)] relative"
            >
              {/* Tape decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-24 h-6 bg-accent-tape/80 rotate-1 z-10 border-l-2 border-r-2 border-dashed border-ink/20" />

              <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-ink/20">
                <div>
                  <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                    Expediente Clasificado // Acceso Autorizado
                  </p>
                  <h3 className="font-typewriter text-2xl font-black text-ink uppercase">
                    {selectedExp.name}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-ink/40 hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                      Destino
                    </p>
                    <p className="font-typewriter text-ink font-black uppercase text-sm">
                      {selectedExp.destination_description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                      Estado
                    </p>
                    <p
                      className={`font-mono font-black uppercase text-sm ${getStatusColorClass(selectedExp.status)}`}
                    >
                      {getStatusLabel(selectedExp.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                      Salida Programada
                    </p>
                    <p className="font-mono text-ink font-black text-sm">
                      {new Date(selectedExp.departure_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                      Duración
                    </p>
                    <p className="font-mono text-ink font-black text-sm">
                      {selectedExp.estimated_days} días (+{selectedExp.grace_days} gracia)
                    </p>
                  </div>
                  {selectedExp.real_return_date && (
                    <div>
                      <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                        Retorno Real
                      </p>
                      <p className="font-mono text-ink font-black text-sm">
                        {new Date(selectedExp.real_return_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedExp.notes && (
                    <div className="col-span-2">
                      <p className="text-sm font-mono text-ink/40 uppercase tracking-widest mb-1">
                        Notas
                      </p>
                      <p className="font-mono text-ink/80 text-sm">{selectedExp.notes}</p>
                    </div>
                  )}
                </div>

                {/* Team list in detail */}
                {selectedExp.explorationPersons.length > 0 && (
                  <div>
                    <p className="text-xs font-mono text-ink/40 uppercase tracking-widest mb-3 border-t border-dashed border-ink/20 pt-4">
                      Integrantes del Equipo
                    </p>
                    <div className="space-y-2">
                      {selectedExp.explorationPersons.map((ep) => (
                        <div
                          key={ep.person_id}
                          className="flex items-center gap-3 bg-ink/5 px-3 py-2"
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${ep.is_leader ? "bg-[#c27c2f]" : "bg-ink/20"}`}
                          />
                          <span className="font-mono text-ink text-sm font-black uppercase">
                            {ep.person
                              ? `${ep.person.first_name} ${ep.person.last_name}`
                              : ep.person_id}
                          </span>
                          {ep.is_leader && (
                            <span className="ml-auto text-sm font-mono bg-[#c27c2f] text-black hover:bg-[#fca311] px-1.5 font-black uppercase">
                              LÍDER
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

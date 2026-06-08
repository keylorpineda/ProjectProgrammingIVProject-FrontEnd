import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import * as L from "leaflet"
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
  Shield,
  Zap,
  FileText,
  Flag,
  Check,
  Footprints,
  Loader2,
  ChevronRight,
  Package,
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      setTimeout(() => {
        map.invalidateSize()
        map.fitBounds(bounds, { padding: [20, 20] })
      }, 100)
    }
  }, [map, bounds])
  return null
}

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

function getStatusLabel(rawStatus: string): string {
  const status = String(rawStatus ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
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
      return rawStatus
  }
}

function getStatusColorClass(rawStatus: string): string {
  const status = String(rawStatus ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
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
  const [returnFoundResources, setReturnFoundResources] = useState<
    Array<{ resource_id: string; quantity: number }>
  >([])

  // ── React Query ──────────────────────────────────────────────────────────
  const { data: explorations = [], error } = useQuery({
    queryKey: ["explorations", baseCampId],
    queryFn: () => getExplorations({ campId: baseCampId }),
    enabled: !!baseCampId,
  })

  const { data: personsData } = useQuery({
    queryKey: ["persons", baseCampId],
    queryFn: () => getPersons({ campId: baseCampId, limit: 1000 }),
    enabled: !!baseCampId && isNewModalOpen,
  })
  const persons: Person[] = (personsData?.data ?? []).filter((p) => {
    const pCampId = p.camp_id ?? p.userAccount?.camp_id
    return String(pCampId) === String(baseCampId)
  })

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
    onError: (error: any) => {
      const msg = error.response?.data?.message || error.message
      setFormError(Array.isArray(msg) ? msg.join(", ") : msg || "Error al crear la expedición.")
    },
  })

  const departMutation = useMutation({
    mutationFn: (id: string) => departExploration(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["explorations", baseCampId] }),
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReturnExplorationFormData }) =>
      returnExploration(id, {
        real_return_date: body.real_return_date,
        notes: body.notes,
        found_resources: body.found_resources,
      }),
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
      const expStatus = String(exp.status ?? "")
        .toLowerCase()
        .replace(/\s+/g, "_")
      const matchesStatus =
        filterStatus === "" || expStatus === String(filterStatus).toLowerCase().replace(/\s+/g, "_")
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

    const allApt = newSelectedPersons.every((sel) => {
      const p = persons.find((per) => per.id === sel.person_id)
      if (!p) return false
      const st = String(p.status ?? "").toLowerCase()
      const isAvailable =
        st === "active" ||
        st === "activo" ||
        st === "idle" ||
        st === "inactivo" ||
        st === "resting" ||
        st === "available" ||
        !p.status
      return isAvailable && p.profession?.can_explore === true
    })
    if (!allApt) {
      setFormError(
        "Operación denegada. Personal seleccionado no apto o no disponible para exploración.",
      )
      return
    }

    const totalDays = (Number(newEstimatedDays) || 1) + (Number(newGraceDays) || 0)
    const requiredRations = totalDays * newSelectedPersons.length * 1
    const foodResources = inventory.filter(
      (i) =>
        String(i.resource?.category).toLowerCase() === "food" ||
        String(i.resource?.category).toLowerCase() === "comida",
    )
    const waterResources = inventory.filter(
      (i) =>
        String(i.resource?.category).toLowerCase() === "water" ||
        String(i.resource?.category).toLowerCase() === "agua",
    )
    const totalFood = foodResources.reduce((sum, item) => sum + item.current_quantity, 0)
    const totalWater = waterResources.reduce((sum, item) => sum + item.current_quantity, 0)

    if (totalFood < requiredRations || totalWater < requiredRations) {
      setFormError(
        `Operación denegada. Insumos insuficientes. Se requieren ${requiredRations} raciones de comida y agua para la misión.`,
      )
      return
    }

    const coordSuffix =
      destLat !== null && destLng !== null ? ` [${destLat.toFixed(5)}, ${destLng.toFixed(5)}]` : ""

    createMutation.mutate({
      camp_id: Number(baseCampId),
      name: newName,
      destination_description: newDestination + coordSuffix,
      departure_date: new Date(newDepartureDate).toISOString(),
      estimated_days: Number(newEstimatedDays) || 1,
      grace_days: Number(newGraceDays) || 0,
      persons: newSelectedPersons.map((p) => ({
        person_id: Number(p.person_id),
        is_leader: p.is_leader,
      })),
      resources: newSelectedResources.map((r) => ({
        resource_id: Number(r.resource_id),
        quantity: Number(r.quantity),
        flow: "out" as const,
      })),
    })
  }

  function handleMarkDeparture(id: string) {
    const exp = explorations.find((e) => e.id === id)
    if (exp && exp.departure_date) {
      if (new Date() < new Date(exp.departure_date)) {
        if (
          !window.confirm(
            `La expedición está programada para ${new Date(exp.departure_date).toLocaleString()}. ¿Desea forzar la salida anticipada bajo su responsabilidad?`,
          )
        ) {
          return
        }
      }
    }
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
      body: {
        real_return_date: new Date(returnDate).toISOString(),
        notes: returnNotes,
        found_resources: returnFoundResources.map((r) => ({
          resource_id: Number(r.resource_id),
          flow: "in",
          quantity: r.quantity,
        })),
      },
    })
  }

  function handleToggleReturnResourceSelect(resourceId: string) {
    const exists = returnFoundResources.find((r) => r.resource_id === String(resourceId))
    if (exists) {
      setReturnFoundResources(
        returnFoundResources.filter((r) => r.resource_id !== String(resourceId)),
      )
    } else {
      setReturnFoundResources([
        ...returnFoundResources,
        { resource_id: String(resourceId), quantity: 1 },
      ])
    }
  }

  function handleReturnResourceQuantityChange(resourceId: string, quantity: number) {
    setReturnFoundResources(
      returnFoundResources.map((r) =>
        r.resource_id === String(resourceId) ? { ...r, quantity: Math.max(1, quantity) } : r,
      ),
    )
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
  const getRowClass = (status: string) => {
    const s = String(status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    if (s === "active" || s === "in_progress") return "tm-row-active"
    if (s === "scheduled") return "tm-row-transit"
    if (s === "cancelled") return "tm-row-pending"
    return "tm-row-sched"
  }

  const getChipClass = (status: string) => {
    const s = String(status ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")
    if (s === "active" || s === "in_progress") return "tm-chip-active"
    if (s === "scheduled") return "tm-chip-transit"
    if (s === "cancelled") return "tm-chip-pending"
    return "tm-chip-sched"
  }

  return (
    <div className="tm-container">
      {/* ── Vista Header ── */}
      <div className="tm-board-header">
        <div className="tm-board-left">
          <div className="tm-online-dot" />
          <div>
            <h2 className="tm-board-title leading-none">Operaciones de Campo</h2>
            <p className="tm-board-sub mt-1">Base: {baseCampId.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="tm-action-btn tm-action-btn-primary"
            style={{ padding: "8px 16px", borderRadius: "4px" }}
          >
            <span className="tm-action-label">
              <Plus className="h-3.5 w-3.5" /> Nueva exploración
            </span>
            <span className="tm-action-sub">Protocolo de salida</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="tm-alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* ── Filtros ── */}
        <div className="flex flex-wrap gap-3 shrink-0 items-center bg-[#1c1208] p-3 border-2 border-black shadow-[2px_2px_0px_#000]">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar ruta o destino..."
              className="vintage-input w-full pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[#121110] border border-[#d4a373]/20 px-4 py-2 rounded-md">
            <span className="text-xs font-mono text-white/30 uppercase font-black">Estado:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase cursor-pointer"
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
          <div className="w-[290px] flex flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border-2 border-black shadow-[3px_3px_0px_#000]">
            <div className="tm-folder-header-row mb-1">
              <h4 className="tm-folder-title">FICHERO OPERATIVO</h4>
              <span className="text-[10px] font-mono font-medium text-white/30 uppercase tracking-wider">
                {filteredExplorations.length} REG
              </span>
            </div>

            <div className="tm-op-list">
              {filteredExplorations.length > 0 ? (
                filteredExplorations.map((exp) => (
                  <motion.button
                    key={exp.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedId(exp.id)}
                    className={`tm-op-row cursor-pointer transition-all ${getRowClass(exp.status)} ${
                      selectedExp?.id === exp.id ? "selected" : ""
                    }`}
                  >
                    {/* Header: ID + Status */}
                    <div className="flex items-center justify-between w-full">
                      <span className="px-2 py-0.5 bg-white/10 text-[8px] font-mono text-[#e8dcc8] font-bold tracking-wider rounded-sm">
                        REF-{exp.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase tracking-wider ${getStatusColorClass(exp.status)}`}
                      >
                        {getStatusLabel(exp.status)}
                      </span>
                    </div>

                    {/* Name: Crisp and Bolder */}
                    <h5
                      className={`text-[12px] font-mono font-bold uppercase tracking-tight truncate mt-0.5 w-full ${
                        selectedExp?.id === exp.id ? "text-[#df8120]" : "text-white"
                      }`}
                    >
                      {exp.name}
                    </h5>

                    {/* Destination Description */}
                    <p className="text-[10px] font-mono text-[#faf4e6]/90 truncate flex items-center gap-1 w-full">
                      <span className="text-[#df8120] font-bold">➔</span>{" "}
                      {exp.destination_description}
                    </p>

                    {/* Footer: Crew + Duration */}
                    <div className="flex justify-between items-center w-full mt-1.5">
                      <div className="flex -space-x-1">
                        {exp.explorationPersons.slice(0, 3).map((ep, i) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-full border border-[#121110] bg-[#4c6351] flex items-center justify-center shadow-sm z-10"
                            title={ep.person?.first_name || "Explorador"}
                          >
                            <span className="text-[8px] font-mono font-black text-white uppercase">
                              {(ep.person?.first_name || "X").substring(0, 2)}
                            </span>
                          </div>
                        ))}
                        {exp.explorationPersons.length > 3 && (
                          <div className="w-5 h-5 rounded-full border border-[#121110] bg-black/40 flex items-center justify-center shadow-sm z-0">
                            <span className="text-[7px] font-mono font-black text-white uppercase">
                              +{exp.explorationPersons.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] font-mono text-[#c8bfae] uppercase font-bold">
                        Duración: {exp.estimated_days}d
                      </span>
                    </div>
                  </motion.button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-10 w-10 text-[#df8120]/15 mb-4" />
                  <p className="text-xs font-mono text-white/30 uppercase leading-relaxed font-black mb-3">
                    Sin expediciones registradas
                  </p>
                  <button type="button" onClick={() => setIsNewModalOpen(true)} className="tm-btn">
                    <Plus className="h-3.5 w-3.5" /> Nueva Exploración
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE: Visualizador */}
          <div className="flex-1 flex flex-col bg-[#1c1208] border-2 border-black overflow-hidden shadow-[3px_3px_0px_#000]">
            {selectedExp ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header visualizador */}
                <div className="p-4 border-b border-[#d4a373]/15 flex items-center justify-between shrink-0 bg-black/20">
                  <div className="flex items-center gap-3">
                    <Compass className="h-5 w-5 text-[#df8120] shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-black block mb-0.5">
                        OPERACIÓN SELECCIONADA
                      </span>
                      <h3 className="text-sm font-typewriter font-black text-white uppercase leading-none tracking-wider">
                        {selectedExp.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`tm-op-chip ${getChipClass(selectedExp.status)} text-xs px-3 py-1`}
                    >
                      {getStatusLabel(selectedExp.status).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Paper map & Dossier visualization */}
                <div className="flex-1 p-5 flex flex-col overflow-hidden items-center justify-center relative bg-black/25">
                  <div className="tm-paper tm-paper-texture w-full h-full max-w-4xl relative overflow-hidden p-6 flex flex-col shadow-2xl">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-height-0 overflow-hidden">
                      {/* Left: Logística y Ruta */}
                      <div className="flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar h-full">
                        <div className="border-b-2 border-dashed border-ink/20 pb-2.5">
                          <span className="text-[10px] font-mono text-ink-soft uppercase tracking-widest font-black block mb-1">
                            HOJA DE LOGÍSTICA
                          </span>
                          <h4 className="font-typewriter text-base font-black text-ink uppercase">
                            RUTA: {baseCampId} ➔ {selectedExp.destination_description}
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#f5ecd7] p-3 border border-[#d4c4a8]/50 rounded-sm">
                              <span className="text-[9px] font-mono text-ink-soft uppercase tracking-wider block mb-1 font-bold">
                                Salida Programada
                              </span>
                              <span className="text-xs font-mono font-black text-ink">
                                {new Date(selectedExp.departure_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="bg-[#f5ecd7] p-3 border border-[#d4c4a8]/50 rounded-sm">
                              <span className="text-[9px] font-mono text-ink-soft uppercase tracking-wider block mb-1 font-bold">
                                Tiempo Estimado
                              </span>
                              <span className="text-xs font-mono font-black text-ink">
                                {selectedExp.estimated_days} DÍAS{" "}
                                {selectedExp.grace_days > 0 ? `(+${selectedExp.grace_days} G)` : ""}
                              </span>
                            </div>
                            {selectedExp.real_return_date && (
                              <div className="bg-[#f5ecd7] p-3 border border-[#d4c4a8]/50 rounded-sm col-span-2">
                                <span className="text-[9px] font-mono text-[#4c6351] uppercase tracking-wider block mb-1 font-bold">
                                  Retorno Registrado
                                </span>
                                <span className="text-xs font-mono font-black text-[#4c6351]">
                                  {new Date(selectedExp.real_return_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          {selectedExp.notes && (
                            <div className="bg-[#f5ecd7] p-3.5 border border-[#d4c4a8]/50 rounded-sm">
                              <span className="text-[9px] font-mono text-ink-soft uppercase tracking-wider block mb-1 font-bold">
                                Bitácora de Observaciones
                              </span>
                              <p className="text-xs font-mono text-ink/80 leading-relaxed whitespace-pre-wrap">
                                {selectedExp.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Compact Visual Map */}
                        <div className="mt-auto border border-dashed border-ink/20 rounded-sm relative overflow-hidden h-48 flex items-center justify-between z-0">
                          {(() => {
                            const destMatch = selectedExp.destination_description?.match(
                              /\[([\d.-]+),\s*([\d.-]+)\]/,
                            )
                            const destLat = destMatch ? parseFloat(destMatch[1]) : null
                            const destLng = destMatch ? parseFloat(destMatch[2]) : null
                            const campLat = selectedExp.camp?.latitude ?? 9.934739
                            const campLng = selectedExp.camp?.longitude ?? -84.087502
                            const hasCoords = destLat !== null && destLng !== null

                            if (!hasCoords) {
                              return (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#faf4e6]/50">
                                  <Footprints className="h-6 w-6 text-ink/30 mb-2" />
                                  <span className="text-[9px] font-mono text-ink-soft uppercase font-bold">
                                    Sin coordenadas disponibles
                                  </span>
                                </div>
                              )
                            }

                            const bounds: L.LatLngBoundsExpression = [
                              [campLat, campLng],
                              [destLat, destLng],
                            ]

                            return (
                              <MapContainer
                                center={[(campLat + destLat) / 2, (campLng + destLng) / 2]}
                                bounds={bounds}
                                boundsOptions={{ padding: [20, 20] }}
                                className="w-full h-full"
                                zoomControl={false}
                                scrollWheelZoom={false}
                                dragging={false}
                                doubleClickZoom={false}
                                attributionControl={false}
                                style={{ background: "#e0d2b5" }}
                              >
                                <FitBounds bounds={bounds} />
                                <TileLayer
                                  url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                                  opacity={0.6}
                                />
                                <Marker
                                  position={[campLat, campLng]}
                                  icon={L.divIcon({
                                    className: "",
                                    html: "<div style='width:12px;height:12px;background:#df8120;border:2px solid #000;border-radius:50%;'></div>",
                                    iconSize: [12, 12],
                                    iconAnchor: [6, 6],
                                  })}
                                />
                                <Marker
                                  position={[destLat, destLng]}
                                  icon={L.divIcon({
                                    className: "",
                                    html: "<div style='width:12px;height:12px;background:#9c2720;border:2px solid #000;border-radius:50%;'></div>",
                                    iconSize: [12, 12],
                                    iconAnchor: [6, 6],
                                  })}
                                />
                                <Polyline
                                  positions={[
                                    [campLat, campLng],
                                    [destLat, destLng],
                                  ]}
                                  pathOptions={{ color: "#9c2720", weight: 2, dashArray: "4 4" }}
                                />
                              </MapContainer>
                            )
                          })()}
                        </div>
                      </div>

                      {/* Right: Manifiesto de Carga */}
                      <div className="flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar h-full justify-between">
                        <div className="flex flex-col gap-5">
                          <div className="border-b-2 border-dashed border-ink/20 pb-2.5">
                            <span className="text-[10px] font-mono text-ink-soft uppercase tracking-widest font-black block mb-1">
                              MANIFIESTO DE CARGA
                            </span>
                            <h4 className="font-typewriter text-base font-black text-ink uppercase">
                              RECURSOS Y EQUIPAMIENTO
                            </h4>
                          </div>

                          {/* Resources Taken */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-mono font-black text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-ink-soft" />
                              Suministros de Salida
                            </h5>
                            <div className="space-y-1.5">
                              {selectedExp.explorationResources.filter((r) => r.flow === "out")
                                .length > 0 ? (
                                selectedExp.explorationResources
                                  .filter((r) => r.flow === "out")
                                  .map((er) => (
                                    <div
                                      key={er.resource_id}
                                      className="flex justify-between items-center bg-[#f5ecd7] px-3.5 py-2 border border-[#d4c4a8]/50 rounded-sm"
                                    >
                                      <span className="text-xs font-mono font-bold text-ink uppercase">
                                        {er.resource?.name || `Recurso #${er.resource_id}`}
                                      </span>
                                      <span className="text-xs font-mono font-black text-[#df8120] bg-[#df8120]/10 border border-[#df8120]/25 px-2 py-0.5 rounded-sm">
                                        {er.quantity} {er.resource?.unit || "uds"}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-[10px] font-mono text-ink-soft/40 uppercase italic pl-1">
                                  Ningún suministro asignado para la salida.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Resources Recovered / Return */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-mono font-black text-ink uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-ink-soft" />
                              Suministros de Retorno / Recuperados
                            </h5>
                            <div className="space-y-1.5">
                              {selectedExp.explorationResources.filter((r) => r.flow === "in")
                                .length > 0 ? (
                                selectedExp.explorationResources
                                  .filter((r) => r.flow === "in")
                                  .map((er) => (
                                    <div
                                      key={er.resource_id}
                                      className="flex justify-between items-center bg-[#e2eed8] px-3.5 py-2 border border-[#b8cfa8]/50 rounded-sm"
                                    >
                                      <span className="text-xs font-mono font-bold text-[#2d4a22] uppercase">
                                        {er.resource?.name || `Recurso #${er.resource_id}`}
                                      </span>
                                      <span className="text-xs font-mono font-black text-[#2d4a22] bg-[#2d4a22]/10 border border-[#2d4a22]/25 px-2 py-0.5 rounded-sm">
                                        {er.quantity} {er.resource?.unit || "uds"}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-[10px] font-mono text-ink-soft/40 uppercase italic pl-1">
                                  Ningún recurso reportado al retorno.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom strip details */}
                    <div className="border-t border-ink/15 pt-3 mt-4 flex justify-between items-center text-ink-soft/70 font-mono text-[9px] uppercase tracking-wider">
                      <span>Ref: REF-{selectedExp.id.slice(0, 8).toUpperCase()}</span>
                      <span className="border border-dashed border-ink/30 px-2 py-0.5 rotate-1">
                        CÓDIGO OPERATIVO CENTRAL DE LOGÍSTICA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="h-24 bg-black/20 border-t border-[#d4a373]/15 p-4 flex flex-col shrink-0 relative overflow-hidden">
                  <div className="flex items-center justify-between px-16 relative flex-1">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#d4a373]/10 -translate-y-1/2 mx-20" />
                    {timelineSteps.map((step, i) => {
                      const StepIcon = step.Icon
                      return (
                        <div key={i} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${
                              step.status === "completed"
                                ? "bg-[#4c6351] border-none text-white"
                                : step.status === "current"
                                  ? "bg-[#df8120] border-none text-white animate-pulse"
                                  : "bg-[#1c1208] border-[#d4a373]/15 text-[#d4a373]/25"
                            }`}
                          >
                            <StepIcon className="h-3.5 w-3.5" />
                          </div>
                          <span
                            className={`absolute top-full mt-2 text-[10px] font-mono font-black tracking-widest whitespace-nowrap ${
                              step.status !== "pending"
                                ? "text-[#df8120] opacity-80"
                                : "text-white/20"
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
                <div className="p-4 border-t border-[#d4a373]/15 flex gap-3 shrink-0 bg-black/40">
                  {selectedExp.status === "scheduled" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMarkDeparture(selectedExp.id)}
                        disabled={departMutation.isPending}
                        className="tm-action-btn tm-action-btn-primary"
                        style={{ padding: "8px 16px", borderRadius: "4px" }}
                      >
                        <span className="tm-action-label flex items-center gap-2">
                          {departMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                          Marcar Salida
                        </span>
                        <span className="tm-action-sub">Despliegue operativo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelExploration(selectedExp.id)}
                        disabled={cancelMutation.isPending}
                        className="tm-action-btn tm-action-btn-danger"
                        style={{ padding: "8px 16px", borderRadius: "4px" }}
                      >
                        <span className="tm-action-label flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Cancelar
                        </span>
                        <span className="tm-action-sub">Abortar misión</span>
                      </button>
                    </>
                  )}
                  {(selectedExp.status === "active" || selectedExp.status === "in_progress") && (
                    <button
                      type="button"
                      onClick={() => setIsReturnModalOpen(true)}
                      className="tm-action-btn tm-action-btn-primary"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "4px",
                        backgroundColor: "var(--tm-approved)",
                      }}
                    >
                      <span className="tm-action-label flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Registrar Retorno
                      </span>
                      <span className="tm-action-sub">Cierre de bitácora</span>
                    </button>
                  )}
                  {(selectedExp.status === "completed" || selectedExp.status === "cancelled") && (
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5 pl-2">
                      <Shield className="h-3.5 w-3.5 text-white/30" />
                      Expedición archivada en histórico
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/15">
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
            <div className="w-[240px] flex flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border-2 border-black shadow-[3px_3px_0px_#000]">
              <div className="tm-folder-header-row mb-1">
                <h4 className="tm-folder-title">EQUIPO ASIGNADO</h4>
                <span className="text-[10px] font-mono font-medium text-[#df8120] uppercase tracking-wider">
                  {selectedExp.explorationPersons.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                {selectedExp.explorationPersons.map((ep, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-[#f5ecd7] p-2.5 border border-[#d4c4a8]/35 rounded-sm shadow-sm"
                  >
                    <div className="w-8 h-8 bg-black/10 rounded-full border border-ink/10 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-ink-soft" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-mono font-bold text-ink uppercase truncate">
                        {ep.person?.first_name || "Desconocido"} {ep.person?.last_name || ""}
                      </span>
                      <span className="text-[9px] font-mono text-ink-soft uppercase leading-none mt-1">
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
              className="tm-paper tm-paper-texture w-full max-w-5xl flex flex-col shadow-2xl relative p-0 border-4 border-double border-ink/40"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-ink/20 bg-black/5">
                <div className="flex items-center gap-4">
                  <Compass className="h-8 w-8 text-[#df8120] animate-pulse" />
                  <h3 className="font-typewriter font-black text-ink uppercase text-xl md:text-2xl tracking-widest leading-none">
                    Nueva Expedición
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false)
                    resetNewForm()
                  }}
                  className="text-ink-soft hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleCreateExploration} className="flex flex-col">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {/* Basic info */}
                    <div className="grid grid-cols-1 gap-5">
                      <div>
                        <label
                          htmlFor="te-name"
                          className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                        >
                          Nombre de la Expedición *
                        </label>
                        <input
                          id="te-name"
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Ej: EXPEDICIÓN NORTE-7"
                          className="vintage-input w-full p-3 text-base"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="te-dest"
                          className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                        >
                          Descripción del Destino *
                        </label>
                        <input
                          id="te-dest"
                          type="text"
                          value={newDestination}
                          onChange={(e) => setNewDestination(e.target.value)}
                          placeholder="Ej: Sector norte, cuadrícula B-7"
                          className="vintage-input w-full p-3 text-base"
                        />
                      </div>
                    </div>

                    {/* Map coord picker */}
                    <div>
                      <div className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-ink-soft" />
                        Zona de Destino en el Mapa
                        <span className="text-ink-soft/50 font-normal normal-case tracking-normal text-[11px]">
                          — haz clic para marcar coordenadas
                        </span>
                      </div>
                      <div className="border-2 border-dashed border-ink/20 overflow-hidden rounded-sm">
                        <MapCoordPicker
                          lat={destLat}
                          lng={destLng}
                          onChange={(lat, lng) => {
                            setDestLat(lat)
                            setDestLng(lng)
                          }}
                          campLat={explorations[0]?.camp?.latitude ?? 9.934739}
                          campLng={explorations[0]?.camp?.longitude ?? -84.087502}
                          campName={`Base ${baseCampId.toUpperCase()}`}
                        />
                      </div>
                      {destLat !== null && destLng !== null && (
                        <p className="mt-1 text-[11px] font-mono text-ink-soft/70 flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-ink animate-pulse" />
                          COORDENADAS REGISTRADAS: {destLat.toFixed(5)}, {destLng.toFixed(5)}
                          <button
                            type="button"
                            onClick={() => {
                              setDestLat(null)
                              setDestLng(null)
                            }}
                            className="text-ink-soft hover:text-ink ml-2 underline"
                          >
                            limpiar
                          </button>
                        </p>
                      )}
                    </div>

                    {/* Dates and duration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label
                          htmlFor="te-departure"
                          className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                        >
                          Fecha de Salida *
                        </label>
                        <input
                          id="te-departure"
                          type="datetime-local"
                          value={newDepartureDate}
                          onChange={(e) => setNewDepartureDate(e.target.value)}
                          className="vintage-input w-full p-3"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="te-days"
                          className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                        >
                          Días Estimados *
                        </label>
                        <input
                          id="te-days"
                          type="number"
                          min={1}
                          value={newEstimatedDays}
                          onChange={(e) => setNewEstimatedDays(Number(e.target.value))}
                          className="vintage-input w-full p-3"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="te-grace-days"
                          className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                        >
                          Días de Gracia
                        </label>
                        <input
                          id="te-grace-days"
                          type="number"
                          min={0}
                          value={newGraceDays}
                          onChange={(e) => setNewGraceDays(Number(e.target.value))}
                          className="vintage-input w-full p-3"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Personnel selection */}
                    <div>
                      <div className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2">
                        Personal Asignado *
                      </div>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-ink/20 p-2 bg-black/5 rounded-sm">
                        {(() => {
                          if (persons.length === 0) {
                            return (
                              <p className="text-xs font-mono text-ink-soft/40 uppercase text-center py-4">
                                Cargando personas disponibles...
                              </p>
                            )
                          }

                          const availableExplorers = persons.filter(
                            (p) =>
                              (p.status === "active" ||
                                p.status === "activo" ||
                                p.status === "idle" ||
                                p.status === "inactivo" ||
                                p.status === "resting" ||
                                p.status === "available" ||
                                !p.status) &&
                              p.profession?.can_explore === true,
                          )

                          if (availableExplorers.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-6 text-center opacity-80">
                                <AlertCircle className="h-6 w-6 text-[#df8120] mb-2" />
                                <p className="text-xs font-mono text-[#df8120] uppercase font-bold">
                                  Sin personal capacitado
                                </p>
                                <p className="text-[10px] font-mono text-ink-soft mt-1 uppercase">
                                  No hay Exploradores ni Recolectores activos.
                                </p>
                              </div>
                            )
                          }

                          return availableExplorers.map((person) => {
                            const sel = newSelectedPersons.find((s) => s.person_id === person.id)
                            const isSelected = !!sel
                            return (
                              <div
                                key={person.id}
                                role="button"
                                tabIndex={0}
                                className={`flex items-center justify-between p-2 border transition-all cursor-pointer rounded-sm ${
                                  isSelected
                                    ? "bg-ink/5 border-ink/40"
                                    : "bg-transparent border-dashed border-ink/15 hover:border-ink/30"
                                }`}
                                onClick={() => handleTogglePersonSelect(person.id)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleTogglePersonSelect(person.id)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-3.5 w-3.5 border flex items-center justify-center shrink-0 rounded-sm ${
                                      isSelected ? "border-ink bg-ink/10" : "border-ink/20"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-2.5 w-2.5 text-ink" />}
                                  </div>
                                  <span className="text-xs font-mono font-bold text-ink uppercase">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {person.profession && (
                                    <span className="text-[10px] font-mono text-ink-soft/60">
                                      [{person.profession.name.toUpperCase()}]
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
                                    className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border transition-all rounded-sm ${
                                      sel?.is_leader
                                        ? "bg-[#df8120] text-black border-[#df8120]"
                                        : "border-ink/20 text-ink-soft hover:bg-ink/5"
                                    }`}
                                  >
                                    {sel?.is_leader ? "LÍDER ✓" : "Líder?"}
                                  </button>
                                )}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    {/* Resource selection */}
                    {inventory.filter((i) => i.current_quantity > 0).length > 0 && (
                      <div>
                        <div className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2">
                          Recursos para la Expedición (opcional)
                        </div>
                        <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-ink/20 p-2 bg-black/5 rounded-sm">
                          {inventory
                            .filter((i) => i.current_quantity > 0)
                            .map((item) => {
                              const sel = newSelectedResources.find(
                                (r) => r.resource_id === item.resource_id,
                              )
                              const isSelected = !!sel
                              return (
                                <div
                                  key={item.resource_id}
                                  className={`flex items-center justify-between p-2 border transition-all rounded-sm ${
                                    isSelected
                                      ? "bg-ink/5 border-ink/40"
                                      : "bg-transparent border-dashed border-ink/15"
                                  }`}
                                >
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                    onClick={() => handleToggleResourceSelect(item.resource_id)}
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      handleToggleResourceSelect(item.resource_id)
                                    }
                                  >
                                    <div
                                      className={`h-3.5 w-3.5 border flex items-center justify-center shrink-0 rounded-sm ${
                                        isSelected ? "border-ink bg-ink/10" : "border-ink/20"
                                      }`}
                                    >
                                      {isSelected && <Check className="h-2.5 w-2.5 text-ink" />}
                                    </div>
                                    <span className="text-xs font-mono font-bold text-ink uppercase">
                                      {item.resource!.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-ink-soft/60 uppercase">
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
                                      className="vintage-input w-16 text-sm ml-2 p-1"
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
                      <div className="flex items-center gap-2 text-[#9c2720] text-xs font-mono uppercase bg-[#9c2720]/15 border border-[#9c2720]/30 p-3 rounded-sm">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {formError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal footer */}
                <div className="p-6 border-t-2 border-dashed border-ink/20 flex justify-end gap-6 bg-black/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false)
                      resetNewForm()
                    }}
                    className="tm-action-btn tm-action-btn-danger"
                    style={{ padding: "8px 16px", borderRadius: "4px" }}
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
              className="tm-paper tm-paper-texture w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative p-0 border-4 border-double border-ink/40"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-ink/20 bg-black/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#4c6351]" />
                  <h3 className="font-typewriter font-black text-ink uppercase text-lg md:text-xl tracking-widest leading-none">
                    Registrar Retorno
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="text-ink-soft hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                <p className="text-xs font-mono text-ink-soft uppercase font-black">
                  Expedición: <span className="text-[#df8120] font-black">{selectedExp.name}</span>
                </p>
                <div>
                  <label
                    htmlFor="te-return-date"
                    className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                  >
                    Fecha Real de Retorno *
                  </label>
                  <input
                    id="te-return-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="vintage-input w-full p-2.5 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="te-return-notes"
                    className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                  >
                    Notas del Retorno
                  </label>
                  <textarea
                    id="te-return-notes"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="Condiciones del retorno, hallazgos, incidentes..."
                    rows={3}
                    className="vintage-input w-full resize-none p-2.5 text-sm"
                  />
                </div>
                {inventory.length > 0 && (
                  <div>
                    <div className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2">
                      Recursos Recuperados / Encontrados
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-ink/20 p-2 bg-black/5 rounded-sm">
                      {inventory.map((item) => {
                        const sel = returnFoundResources.find(
                          (r) => r.resource_id === String(item.resource_id),
                        )
                        const isSelected = !!sel
                        return (
                          <div
                            key={item.resource_id}
                            className={`flex items-center justify-between p-2 border transition-all rounded-sm ${
                              isSelected
                                ? "bg-ink/5 border-ink/40"
                                : "bg-transparent border-dashed border-ink/15 hover:border-ink/30"
                            }`}
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              className="flex items-center gap-2 cursor-pointer flex-1"
                              onClick={() =>
                                handleToggleReturnResourceSelect(String(item.resource_id))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                handleToggleReturnResourceSelect(String(item.resource_id))
                              }
                            >
                              <div
                                className={`h-3.5 w-3.5 border flex items-center justify-center shrink-0 rounded-sm ${
                                  isSelected ? "border-ink bg-ink/10" : "border-ink/20"
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 text-ink" />}
                              </div>
                              <span className="text-xs font-mono font-bold text-ink uppercase">
                                {item.resource!.name}
                              </span>
                              <span className="text-[10px] font-mono text-ink-soft/60 uppercase">
                                [{item.resource!.unit}]
                              </span>
                            </div>
                            {isSelected && (
                              <input
                                type="number"
                                min={1}
                                value={sel.quantity}
                                onClick={(ev) => ev.stopPropagation()}
                                onChange={(e) =>
                                  handleReturnResourceQuantityChange(
                                    String(item.resource_id),
                                    Number(e.target.value),
                                  )
                                }
                                className="vintage-input w-16 text-sm ml-2 p-1"
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-6 border-t-2 border-dashed border-ink/20 flex justify-end gap-4 bg-black/5">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="tm-action-btn tm-action-btn-danger"
                  style={{ padding: "8px 16px", borderRadius: "4px" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleRegisterReturn}
                  disabled={returnMutation.isPending}
                  className="px-6 py-2.5 bg-[#4c6351] text-white hover:bg-[#3d5041] text-sm font-mono font-black uppercase transition-all disabled:opacity-50 flex items-center gap-2 shadow-md border-2 border-ink active:translate-y-0.5"
                >
                  {returnMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar Retorno
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

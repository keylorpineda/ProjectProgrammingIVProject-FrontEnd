import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  ArrowLeftRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Check,
  Filter,
  Truck,
  Archive,
  Package,
  Users,
  Droplets,
  Utensils,
  HeartPulse,
  Hammer,
  Crosshair,
  Flame,
  Bed,
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { io } from "socket.io-client"

import type { IntercampRequest, Person, InventoryItem } from "@/types/api.types"

import { getCamps } from "@/features/camps/services/camps.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
import {
  getCampTransfers,
  createTransferRequest,
  cancelTransfer,
  confirmTransferArrival,
} from "@/features/transfers/services/transfers.service"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

// ── Status helpers ──────────────────────────────────────────────────────────

function getTransferStatusLabel(rawStatus: string): string {
  const status = String(rawStatus ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
  switch (status) {
    case "pending":
      return "Pendiente"
    case "approved":
      return "Aprobado"
    case "in_transit":
      return "En Tránsito"
    case "completed":
      return "Completado"
    case "rejected":
      return "Rechazado"
    case "cancelled":
      return "Cancelado"
    default:
      return rawStatus
  }
}

function getTransferTypeBadge(rawType: string): string {
  const type = String(rawType ?? "").toLowerCase()
  switch (type) {
    case "resources":
      return "RECURSOS"
    case "people":
      return "PERSONAS"
    case "both":
      return "MIXTO"
    default:
      return rawType.toUpperCase()
  }
}

function getTypeIcon(rawType: string) {
  const type = String(rawType ?? "").toLowerCase()
  if (type === "resources") return Package
  if (type === "people") return Users
  return Truck
}

function getStatusDotClass(rawStatus: string): string {
  const status = String(rawStatus ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
  if (status === "in_transit" || status === "approved") return "bg-[#d4a373] animate-pulse"
  if (status === "pending") return "bg-[#c27c2f]"
  if (status === "rejected" || status === "cancelled") return "bg-[#9c2720]"
  return "bg-black/20"
}

function getStatusColorOnPaper(rawStatus: string): string {
  const status = String(rawStatus ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
  switch (status) {
    case "completed":
    case "approved":
    case "in_transit":
      return "text-[#4c6351]"
    case "rejected":
    case "cancelled":
      return "text-[#9c2720]"
    case "pending":
      return "text-[#c27c2f]"
    default:
      return "text-[#1a0f05]/40"
  }
}

function getCategoryIcon(category: string | null | undefined) {
  switch (String(category ?? "").toLowerCase()) {
    case "water":
      return Droplets
    case "food":
      return Utensils
    case "medicine":
      return HeartPulse
    case "tools":
      return Hammer
    case "weapons":
      return Crosshair
    case "fuel":
      return Flame
    case "shelter":
      return Bed
    default:
      return Package
  }
}

// ── Selected resource/person for new transfer ───────────────────────────────

interface SelectedResource {
  resource_id: string
  requested_quantity: number
}

interface SelectedPerson {
  person_id: string
}

// ── Main component ──────────────────────────────────────────────────────────

export default function TravelTransfers() {
  const { user } = useAuthStore()
  const token = useTokenStore((state) => state.token)
  const queryClient = useQueryClient()
  const campId = user?.camp_id ?? ""
  const location = useLocation()

  // ── Local UI state ───────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "origin" | "destination">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    const locState = location.state as { openNewTransfer?: boolean } | null
    if (locState?.openNewTransfer) {
      setIsNewModalOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // New transfer form
  const [destCampId, setDestCampId] = useState("")
  const [transferType, setTransferType] = useState<"resources" | "people" | "both">("resources")
  const [notes, setNotes] = useState("")
  const [travelDays, setTravelDays] = useState(1)
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([])
  const [selectedPersons, setSelectedPersons] = useState<SelectedPerson[]>([])

  // ── React Query ──────────────────────────────────────────────────────────
  const {
    data: transfers = [],
    error,
    refetch,
  } = useQuery({
    queryKey: ["transfers", campId],
    queryFn: () => getCampTransfers(campId),
    enabled: !!campId,
  })

  useEffect(() => {
    if (!token) return

    const socketUrl =
      import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:3000"
    const socket = io(socketUrl, {
      auth: { token },
    })

    socket.on("transfer.requested", () => {
      refetch()
    })

    return () => {
      socket.disconnect()
    }
  }, [token, refetch])

  const { data: personsData } = useQuery({
    queryKey: ["persons", campId],
    queryFn: () => getPersons({ campId }),
    enabled: !!campId && isNewModalOpen,
  })
  const persons: Person[] = (personsData?.data ?? []).filter((p) => {
    const pCampId = p.camp_id ?? p.userAccount?.camp_id
    return String(pCampId) === String(campId)
  })

  const { data: campsResponse } = useQuery({
    queryKey: ["camps"],
    queryFn: getCamps,
    enabled: isNewModalOpen,
  })
  const camps = campsResponse ?? []

  const { data: allCamps = [] } = useQuery({
    queryKey: ["camps"],
    queryFn: getCamps,
  })

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["inventory", campId],
    queryFn: () => getInventory(campId),
    enabled: !!campId && isNewModalOpen,
  })

  const createMutation = useMutation({
    mutationFn: createTransferRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transfers", campId] })
      resetForm()
      setIsNewModalOpen(false)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const msg = error?.response?.data?.message
      if (Array.isArray(msg) && msg.length > 0) {
        setFormError(msg[0])
      } else if (typeof msg === "string") {
        setFormError(msg)
      } else {
        setFormError("Error al crear el traslado. Intente nuevamente.")
      }
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelTransfer(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["transfers", campId] }),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmTransferArrival(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["transfers", campId] }),
  })

  // ── Derived state ────────────────────────────────────────────────────────
  const normalize = (s: string | null | undefined) =>
    String(s ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_")

  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        String(t.id).toLowerCase().includes(search.toLowerCase()) ||
        String(t.camp_origin_id).toLowerCase().includes(search.toLowerCase()) ||
        String(t.camp_destination_id).toLowerCase().includes(search.toLowerCase())
      const tStatus = normalize(t.status)
      const matchesStatus = statusFilter === "all" || tStatus === normalize(statusFilter)
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "origin" && String(t.camp_origin_id) === String(campId)) ||
        (roleFilter === "destination" && String(t.camp_destination_id) === String(campId))
      return matchesSearch && matchesStatus && matchesRole
    })
  }, [transfers, search, statusFilter, roleFilter, campId])

  const selectedTransfer = useMemo<IntercampRequest | null>(() => {
    if (filteredTransfers.length === 0) return null
    if (selectedId && filteredTransfers.some((t) => t.id === selectedId)) {
      return filteredTransfers.find((t) => t.id === selectedId) ?? null
    }
    return filteredTransfers[0] ?? null
  }, [filteredTransfers, selectedId])

  const stats = useMemo(
    () => ({
      pending: transfers.filter((t) => normalize(t.status) === "pending").length,
      inTransit: transfers.filter((t) => {
        const s = normalize(t.status)
        return s === "in_transit" || s === "approved"
      }).length,
      sent: transfers.filter((t) => String(t.camp_origin_id) === String(campId)).length,
      received: transfers.filter((t) => String(t.camp_destination_id) === String(campId)).length,
    }),
    [transfers, campId],
  )

  const getCampName = (id: string | number) =>
    allCamps.find((c) => String(c.id) === String(id))?.name || `Base #${id}`

  // ── Handlers ─────────────────────────────────────────────────────────────
  function resetForm() {
    setDestCampId("")
    setTransferType("resources")
    setNotes("")
    setTravelDays(1)
    setSelectedResources([])
    setSelectedPersons([])
    setFormError("")
  }

  function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!destCampId.trim()) {
      setFormError("Ingrese el ID del campamento destino.")
      return
    }
    if (destCampId === campId) {
      setFormError("El campamento destino no puede ser el mismo que el origen.")
      return
    }
    if (
      (transferType === "resources" || transferType === "both") &&
      selectedResources.length === 0
    ) {
      setFormError("Seleccione al menos un recurso para transferir.")
      return
    }
    if ((transferType === "people" || transferType === "both") && selectedPersons.length === 0) {
      setFormError("Seleccione al menos una persona para transferir.")
      return
    }

    createMutation.mutate({
      camp_origin_id: Number(campId),
      camp_destination_id: Number(destCampId),
      type: transferType,
      notes: notes || undefined,
      travel_days: travelDays,
      resource_details:
        transferType !== "people"
          ? selectedResources.map((r) => ({
              resource_id: Number(r.resource_id),
              requested_quantity: Number(r.requested_quantity),
            }))
          : undefined,
      person_details:
        transferType !== "resources"
          ? selectedPersons.map((p) => ({ person_id: Number(p.person_id) }))
          : undefined,
    })
  }

  function handleCancelTransfer(id: string) {
    if (window.confirm("¿Confirmar la cancelación de este traslado?")) {
      cancelMutation.mutate(id)
    }
  }

  function handleConfirmArrival(id: string) {
    if (window.confirm("¿Confirmar la llegada de este traslado?")) {
      confirmMutation.mutate(id)
    }
  }

  function handleToggleResource(resourceId: string) {
    const exists = selectedResources.find((r) => r.resource_id === resourceId)
    if (exists) {
      setSelectedResources(selectedResources.filter((r) => r.resource_id !== resourceId))
    } else {
      setSelectedResources([
        ...selectedResources,
        { resource_id: resourceId, requested_quantity: 1 },
      ])
    }
  }

  function handleResourceQtyChange(resourceId: string, qty: number) {
    setSelectedResources(
      selectedResources.map((r) =>
        r.resource_id === resourceId ? { ...r, requested_quantity: Math.max(1, qty) } : r,
      ),
    )
  }

  function handleTogglePerson(personId: string) {
    const exists = selectedPersons.find((p) => p.person_id === personId)
    if (exists) {
      setSelectedPersons(selectedPersons.filter((p) => p.person_id !== personId))
    } else {
      setSelectedPersons([...selectedPersons, { person_id: personId }])
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 h-full flex flex-col gap-3 overflow-hidden bg-[#0a0a0a] min-h-0 min-w-0">
      {/* ── Vista Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#12110f] py-4 px-4 border-b border-b-[#d4a373]/20 border-t-2 border-t-[#d4a373]/60 shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-[#d4a373]/10 p-2 border border-[#d4a373]/30">
            <ArrowLeftRight className="h-6 w-6 text-[#d4a373]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-bg-paper paper-texture text-ink text-xs font-mono font-black uppercase rotate-1 shadow-sm border border-[#8b7355]/30">
                Logística_Enlace
              </span>
              <span className="text-xs font-mono text-[#d4a373]/40 uppercase tracking-widest font-black">
                TRASLADOS_OP
              </span>
            </div>
            <h2 className="text-lg font-typewriter font-bold text-white uppercase tracking-tight leading-none">
              GESTIÓN DE TRASLADOS
            </h2>
            <p className="font-mono text-xs text-[#d4a373]/60 uppercase tracking-widest mt-1">
              Base operativa: {campId}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-0 relative z-10 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 md:gap-4 border-r border-white/10 pr-4 md:pr-6">
            {[
              { label: "Pendientes", count: stats.pending, color: "text-[#c27c2f]" },
              { label: "En Tránsito", count: stats.inTransit, color: "text-[#d4a373]" },
              { label: "Enviados", count: stats.sent, color: "text-white/50" },
              { label: "Recibidos", count: stats.received, color: "text-white/50" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center px-2">
                <span className={`text-base md:text-lg font-mono font-black ${s.color}`}>
                  {s.count}
                </span>
                <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-tighter text-white/40">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-[#c27c2f] text-black px-4 md:px-6 py-2.5 text-xs md:text-sm font-mono font-black uppercase hover:bg-[#df8120] hover:shadow-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 border-b-2 border-r-2 border-black/20 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> NUEVO TRASLADO
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 bg-red-950/40 border border-red-500/50 p-3 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error de conexión con la central. Modo fuera de línea activo.</span>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden px-4 pb-4">
        {/* ── Filtros ── */}
        <div className="bg-[#12110f] p-2 px-4 flex flex-wrap items-center gap-3 shrink-0 border border-white/5">
          <div className="flex-1 flex items-center gap-3 bg-black/40 px-3 py-2 border border-white/10 focus-within:border-[#d4a373]/40 transition-all min-w-[160px]">
            <Search className="h-3.5 w-3.5 text-white/20 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por ID o campamento..."
              className="bg-transparent border-none focus:outline-none text-xs font-mono text-white/70 w-full placeholder:text-white/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-[#d4a373]/10 px-4 py-2.5">
            <Filter className="h-3 w-3 text-white/20" />
            <span className="text-xs font-mono text-white/30 uppercase font-black">Estado:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#d4a373] font-black focus:outline-none uppercase"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">TODOS</option>
              <option value="pending">PENDIENTE</option>
              <option value="approved">APROBADO</option>
              <option value="in_transit">EN TRÁNSITO</option>
              <option value="completed">COMPLETADO</option>
              <option value="rejected">RECHAZADO</option>
              <option value="cancelled">CANCELADO</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-[#d4a373]/10 px-4 py-2.5">
            <span className="text-xs font-mono text-white/30 uppercase font-black">Rol:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#d4a373] font-black focus:outline-none uppercase"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | "origin" | "destination")}
            >
              <option value="all">TODOS</option>
              <option value="origin">ENVIADOS</option>
              <option value="destination">RECIBIDOS</option>
            </select>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* LEFT: Transfer list */}
          <div className="w-[300px] flex flex-col gap-2 shrink-0 overflow-hidden bg-[#12110f] p-3 border border-[#d4a373]/15 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between px-1 mb-1 border-b border-[#d4a373]/10 pb-2 relative z-10">
              <span className="text-[10px] font-mono font-semibold text-[#d4a373] uppercase tracking-widest">
                Registro de Traslados
              </span>
              <span className="text-[10px] font-mono text-white/30 uppercase bg-white/5 px-1.5 py-0.5 tabular-nums">
                {filteredTransfers.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10">
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((transfer) => {
                  const isOrigin = String(transfer.camp_origin_id) === String(campId)
                  const TypeIcon = getTypeIcon(transfer.type)
                  const isSelected = selectedTransfer?.id === transfer.id
                  return (
                    <motion.button
                      key={transfer.id}
                      whileHover={{ x: 2 }}
                      onClick={() => setSelectedId(transfer.id)}
                      className={`w-full text-left p-3 relative transition-all border border-[#d4a373]/10 group shadow-md ${
                        isSelected
                          ? "tm-paper-texture scale-[1.02] z-10"
                          : "bg-[#b69e7e]/5 hover:bg-[#b69e7e]/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#d4a373]" />
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 border shrink-0 ${
                            isSelected ? "bg-ink/5 border-ink/10" : "bg-black/20 border-white/5"
                          }`}
                        >
                          <TypeIcon
                            className={`h-4 w-4 ${isSelected ? "text-ink/60" : "text-[#d4a373]/40"}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5
                            className={`text-xs font-typewriter font-bold uppercase truncate ${
                              isSelected ? "text-ink" : "text-[#d4a373]"
                            }`}
                          >
                            {isOrigin
                              ? `→ ${getCampName(transfer.camp_destination_id)}`
                              : `← ${getCampName(transfer.camp_origin_id)}`}
                          </h5>
                          <div className="flex justify-between items-center mt-1">
                            <span
                              className={`text-[10px] font-mono uppercase tracking-wide ${
                                isSelected ? "text-ink/40" : "text-[#d4a373]/40"
                              }`}
                            >
                              {isOrigin ? "↑ ENVIADO" : "↓ RECIBIDO"}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-semibold tabular-nums ${
                                isSelected ? "text-ink/70" : "text-white/40"
                              }`}
                            >
                              {getTransferTypeBadge(transfer.type)}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div
                              className={`h-1.5 w-1.5 rounded-full border border-black/10 ${getStatusDotClass(transfer.status)}`}
                            />
                            <span
                              className={`text-[10px] font-mono font-semibold uppercase ${
                                isSelected
                                  ? getStatusColorOnPaper(transfer.status)
                                  : "text-white/20"
                              }`}
                            >
                              {getTransferStatusLabel(transfer.status)}
                            </span>
                          </div>

                          <p
                            className={`text-[10px] font-mono uppercase mt-1.5 ${
                              isSelected ? "text-ink/30" : "text-white/15"
                            }`}
                          >
                            REF: {transfer.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-10 w-10 text-[#d4a373]/10 mb-4" />
                  <p className="text-sm font-mono text-white/20 uppercase font-black">
                    Sin traslados para esta consulta
                  </p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="mt-3 px-4 py-2 border border-[#d4a373]/30 text-xs font-mono font-bold text-[#d4a373] hover:bg-[#d4a373]/10 transition-colors uppercase"
                  >
                    Nuevo traslado
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Transfer detail — paper manifest */}
          <div
            className={`flex-1 flex flex-col overflow-hidden bg-[#12110f] border border-white/5 shadow-2xl relative ${
              !selectedTransfer ? "hidden md:flex" : "flex"
            }`}
          >
            <AnimatePresence mode="wait">
              {selectedTransfer ? (
                <motion.div
                  key={selectedTransfer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {/* Detail header */}
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#b69e7e]/10 p-2 border border-[#b69e7e]/20">
                        <ArrowLeftRight className="h-5 w-5 text-[#d4a373]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-typewriter font-bold text-white uppercase tracking-wider">
                          Orden de Traslado
                        </h3>
                        <p className="text-[10px] font-mono text-[#d4a373]/50 uppercase tracking-wide">
                          Ref. #{selectedTransfer.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1.5 border inline-flex items-center gap-1.5 ${
                        normalize(selectedTransfer.status) === "in_transit" ||
                        normalize(selectedTransfer.status) === "approved"
                          ? "bg-[#d4a373]/10 border-[#d4a373]/30 text-[#d4a373]"
                          : normalize(selectedTransfer.status) === "pending"
                            ? "bg-[#c27c2f]/10 border-[#c27c2f]/30 text-[#c27c2f]"
                            : "bg-white/5 border-white/10 text-white/40"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(selectedTransfer.status)}`}
                      />
                      <span className="text-xs font-mono font-black uppercase tracking-widest">
                        {getTransferStatusLabel(selectedTransfer.status)}
                      </span>
                    </div>
                  </div>

                  {/* Paper manifest */}
                  <div className="flex-1 p-6 flex flex-col overflow-auto bg-[#0c0c0c] items-center justify-start">
                    <div className="w-full max-w-2xl tm-paper-texture shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden p-10 border-[8px] border-[#8b7355]/10 flex flex-col">
                      {/* Stamp decoration */}
                      <div className="absolute top-8 right-8 flex flex-col items-center rotate-6 select-none opacity-25 pointer-events-none">
                        <div className="border-4 border-ink p-1 mb-1">
                          <span className="text-base font-black font-mono px-2 text-ink uppercase">
                            {normalize(selectedTransfer.status) === "completed"
                              ? "COMPLETADO"
                              : normalize(selectedTransfer.status) === "rejected"
                                ? "RECHAZADO"
                                : normalize(selectedTransfer.status) === "cancelled"
                                  ? "CANCELADO"
                                  : normalize(selectedTransfer.status) === "in_transit"
                                    ? "EN TRÁNSITO"
                                    : "EN PROCESO"}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black italic text-ink">
                          Logística Central
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col relative z-10">
                        {/* Manifest header */}
                        <div className="mb-8 pb-5 border-b-4 border-double border-ink/20">
                          <p className="text-xs font-mono text-ink/40 uppercase tracking-widest mb-3">
                            Manifiesto de Traslado Intercampal
                          </p>
                          <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-ink/40 uppercase tracking-wider mb-0.5">
                                Origen
                              </span>
                              <h2 className="text-2xl font-typewriter font-bold text-ink uppercase leading-none">
                                {getCampName(selectedTransfer.camp_origin_id)}
                              </h2>
                            </div>
                            <ArrowLeftRight className="h-5 w-5 text-ink/20 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-ink/40 uppercase tracking-wider mb-0.5">
                                Destino
                              </span>
                              <h2 className="text-2xl font-typewriter font-bold text-ink uppercase leading-none">
                                {getCampName(selectedTransfer.camp_destination_id)}
                              </h2>
                            </div>
                          </div>
                        </div>

                        {/* Data grid */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Tipo de Carga
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {(() => {
                                const TIcon = getTypeIcon(selectedTransfer.type)
                                return <TIcon className="h-4 w-4 text-ink/40" />
                              })()}
                              <p className="text-sm font-typewriter font-bold text-ink uppercase">
                                {getTransferTypeBadge(selectedTransfer.type)}
                              </p>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Días de Viaje
                            </span>
                            <p className="text-sm font-mono font-semibold text-ink uppercase mt-1">
                              {selectedTransfer.travel_days ?? "—"} días
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Fecha de Solicitud
                            </span>
                            <p className="text-sm font-mono text-ink mt-1">
                              {new Date(selectedTransfer.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Última Actualización
                            </span>
                            <p className="text-sm font-mono text-ink mt-1">
                              {new Date(selectedTransfer.updated_at).toLocaleString()}
                            </p>
                          </div>

                          {selectedTransfer.notes && (
                            <div className="col-span-2">
                              <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                                Notas Operativas
                              </span>
                              <div className="mt-1 p-3 bg-white/40 border border-ink/10 italic font-typewriter text-sm text-ink/80 leading-relaxed">
                                {selectedTransfer.notes}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Approval section */}
                        <div>
                          <h4 className="text-xs font-mono font-black text-ink/40 border-b border-ink/5 pb-1 mb-3 uppercase">
                            Historial de Aprobación
                          </h4>
                          {selectedTransfer.approvals && selectedTransfer.approvals.length > 0 ? (
                            <div className="space-y-2">
                              {selectedTransfer.approvals.map((app, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 p-2 bg-ink/5 border border-ink/10"
                                >
                                  <span
                                    className={`text-xs font-mono font-black uppercase px-2 py-0.5 border ${
                                      app.status === "approved"
                                        ? "border-[#4c6351] text-[#4c6351] bg-[#4c6351]/10"
                                        : "border-[#9c2720] text-[#9c2720] bg-[#9c2720]/10"
                                    }`}
                                  >
                                    {app.status === "approved" ? "APROBADO" : "RECHAZADO"}
                                  </span>
                                  <span className="font-mono text-ink/60 text-sm">
                                    {app.user?.username || "Sistema"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-mono text-ink/30 uppercase italic">
                              Pendiente de revisión por el comité logístico.
                            </p>
                          )}
                        </div>

                        <div className="mt-8 pt-4 flex justify-between items-center text-[10px] font-mono text-ink/30 uppercase border-t border-ink/10">
                          <span>Generado: {new Date().toLocaleDateString("es-CR")}</span>
                          <span className="text-ink/40">Ref. {selectedTransfer.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="p-4 border-t border-white/5 flex gap-3 shrink-0 bg-black/20">
                    {normalize(selectedTransfer.status) === "pending" &&
                      String(selectedTransfer.camp_origin_id) === String(campId) && (
                        <button
                          onClick={() => handleCancelTransfer(selectedTransfer.id)}
                          disabled={cancelMutation.isPending}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#9c2720]/20 border border-[#9c2720]/60 text-[#ff4a4a] text-sm font-mono font-semibold uppercase hover:bg-[#9c2720] hover:text-white transition-all disabled:opacity-50 shadow-md tracking-wider"
                        >
                          {cancelMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Cancelar Traslado
                        </button>
                      )}
                    {normalize(selectedTransfer.status) === "in_transit" &&
                      String(selectedTransfer.camp_destination_id) === String(campId) && (
                        <button
                          onClick={() => handleConfirmArrival(selectedTransfer.id)}
                          disabled={confirmMutation.isPending}
                          className="flex items-center gap-2 px-8 py-2.5 bg-[#4c6351] text-white text-sm font-mono font-black uppercase hover:opacity-90 transition-all disabled:opacity-50 shadow-lg tracking-wider"
                        >
                          {confirmMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Confirmar Llegada
                        </button>
                      )}
                    {(normalize(selectedTransfer.status) === "completed" ||
                      normalize(selectedTransfer.status) === "rejected" ||
                      normalize(selectedTransfer.status) === "cancelled") && (
                      <span className="text-xs font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                        <Archive className="h-3.5 w-3.5" />
                        Traslado archivado
                      </span>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <Truck className="h-16 w-16 mb-6 text-[#d4a373] opacity-20" />
                  <h3 className="text-base font-typewriter font-bold text-white/40 uppercase mb-2">
                    Selecciona un Traslado
                  </h3>
                  <p className="text-xs font-mono text-white/25 max-w-xs leading-relaxed">
                    Elige una orden del registro para ver su manifiesto completo.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Modal: Nuevo Traslado ── */}
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
              className="bg-[#141414] border-4 border-double border-[#d4a373]/40 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-[#d4a373]/20 bg-black/50">
                <div className="flex items-center gap-4">
                  <ArrowLeftRight className="h-7 w-7 text-[#d4a373] animate-pulse" />
                  <div>
                    <h3 className="font-typewriter font-black text-white uppercase text-xl tracking-widest">
                      Nueva Solicitud de Traslado
                    </h3>
                    <p className="text-[10px] font-mono text-[#d4a373]/50 uppercase tracking-widest mt-0.5">
                      Protocolo Logístico Intercampal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsNewModalOpen(false)
                    resetForm()
                  }}
                  className="text-white/40 hover:text-[#d4a373] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <form
                onSubmit={handleCreateTransfer}
                className="flex-1 overflow-y-auto custom-scrollbar"
              >
                <div className="p-8 space-y-8">
                  {formError && (
                    <div className="bg-red-950/40 border border-red-500/50 p-4 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Origin indicator */}
                  <div className="bg-black/60 border-2 border-[#d4a373]/15 px-6 py-4 flex items-center gap-4">
                    <span className="text-sm font-mono text-white/50 uppercase font-black tracking-widest">
                      Campamento Origen:
                    </span>
                    <span className="text-lg font-mono font-black text-[#d4a373] uppercase">
                      {campId}
                    </span>
                    <span className="text-white/30 text-xl">→</span>
                  </div>

                  <div>
                    <label
                      htmlFor="destCampId"
                      className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest block mb-2"
                    >
                      Campamento Destino *
                    </label>
                    <select
                      id="destCampId"
                      value={destCampId}
                      onChange={(e) => setDestCampId(e.target.value)}
                      className="vintage-input w-full p-4 text-base"
                    >
                      <option value="" disabled>
                        Seleccione un destino...
                      </option>
                      {camps
                        .filter((c) => String(c.id) !== String(campId))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="transferType"
                        className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest block mb-2"
                      >
                        Tipo de Traslado *
                      </label>
                      <select
                        id="transferType"
                        value={transferType}
                        onChange={(e) =>
                          setTransferType(e.target.value as "resources" | "people" | "both")
                        }
                        className="vintage-input w-full p-4 text-base"
                      >
                        <option value="resources">RECURSOS</option>
                        <option value="people">PERSONAS</option>
                        <option value="both">MIXTO (AMBOS)</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="travelDays"
                        className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest block mb-2"
                      >
                        Días de Viaje
                      </label>
                      <input
                        id="travelDays"
                        type="number"
                        min={1}
                        value={travelDays}
                        onChange={(e) => setTravelDays(Number(e.target.value))}
                        className="vintage-input w-full p-4 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="text-sm font-mono font-black text-[#d4a373] uppercase tracking-widest block mb-2"
                    >
                      Notas / Motivo
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Razón del traslado, instrucciones especiales..."
                      rows={3}
                      className="vintage-input w-full resize-none p-4 text-base"
                    />
                  </div>

                  {/* Resources section */}
                  {(transferType === "resources" || transferType === "both") && (
                    <div>
                      <label className="text-xs font-mono font-black text-[#d4a373] uppercase tracking-widest block mb-2">
                        Recursos a Transferir * ({selectedResources.length} seleccionado(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-[#d4a373]/10 p-2 bg-black/20">
                        {inventory.length === 0 ? (
                          <p className="text-xs font-mono text-white/30 uppercase text-center py-4">
                            Cargando inventario...
                          </p>
                        ) : (
                          inventory
                            .filter((item) => item.current_quantity > 0)
                            .map((item) => {
                              const sel = selectedResources.find(
                                (r) => r.resource_id === item.resource_id,
                              )
                              const isSelected = !!sel
                              return (
                                <div
                                  key={item.resource_id}
                                  className={`flex items-center justify-between p-2 border transition-all ${
                                    isSelected
                                      ? "bg-[#d4a373]/10 border-[#d4a373]/30"
                                      : "bg-black/20 border-white/5"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 cursor-pointer flex-1 bg-transparent border-none text-left p-0 outline-none focus:outline-none"
                                    onClick={() => handleToggleResource(item.resource_id)}
                                  >
                                    <div
                                      className={`h-3 w-3 border flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? "border-[#d4a373] bg-[#d4a373]/20"
                                          : "border-white/20"
                                      }`}
                                    >
                                      {isSelected && <Check className="h-2 w-2 text-[#d4a373]" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(() => {
                                        const CatIcon = getCategoryIcon(item.resource?.category)
                                        return (
                                          <div className="w-6 h-6 bg-black/20 border border-[#d4a373]/10 flex items-center justify-center">
                                            <CatIcon className="w-3 h-3 text-[#d4a373]/60" />
                                          </div>
                                        )
                                      })()}
                                      <div className="flex flex-col">
                                        <span className="text-sm font-mono font-black text-white/80 uppercase">
                                          {item.resource?.name || "Desconocido"}
                                        </span>
                                        <span className="text-xs font-mono text-white/40 uppercase">
                                          {item.resource?.category || "N/A"} {"//"}{" "}
                                          {item.current_quantity} {item.resource?.unit || "U"}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                  {isSelected && (
                                    <input
                                      type="number"
                                      min={1}
                                      max={item.current_quantity}
                                      value={sel.requested_quantity}
                                      onClick={(ev) => ev.stopPropagation()}
                                      onChange={(e) =>
                                        handleResourceQtyChange(
                                          item.resource_id,
                                          Number(e.target.value),
                                        )
                                      }
                                      className="vintage-input w-16 text-sm ml-2"
                                    />
                                  )}
                                </div>
                              )
                            })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Persons section */}
                  {(transferType === "people" || transferType === "both") && (
                    <div>
                      <label className="text-xs font-mono font-black text-[#d4a373] uppercase tracking-widest block mb-2">
                        Personas a Transferir * ({selectedPersons.length} seleccionada(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-[#d4a373]/10 p-2 bg-black/20">
                        {persons.length === 0 ? (
                          <p className="text-xs font-mono text-white/30 uppercase text-center py-4">
                            Cargando personas...
                          </p>
                        ) : (
                          persons
                            .filter(
                              (p) =>
                                p.status === "active" ||
                                p.status === "idle" ||
                                p.status === "resting",
                            )
                            .map((person) => {
                              const isSelected = selectedPersons.some(
                                (p) => p.person_id === person.id,
                              )
                              return (
                                <button
                                  type="button"
                                  key={person.id}
                                  onClick={() => handleTogglePerson(person.id)}
                                  className={`flex items-center gap-2 p-2 border cursor-pointer transition-all text-left w-full bg-transparent outline-none focus:outline-none ${
                                    isSelected
                                      ? "bg-[#d4a373]/10 border-[#d4a373]/30"
                                      : "bg-black/20 border-white/5 hover:border-[#d4a373]/20"
                                  }`}
                                >
                                  <div
                                    className={`h-3 w-3 border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "border-[#d4a373] bg-[#d4a373]/20"
                                        : "border-white/20"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-2 w-2 text-[#d4a373]" />}
                                  </div>
                                  <div className="w-6 h-6 rounded-full bg-black/30 border border-[#d4a373]/10 flex items-center justify-center shrink-0">
                                    <Users className="w-3 h-3 text-[#d4a373]/60" />
                                  </div>
                                  <span className="text-sm font-mono text-white/80 uppercase">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {person.profession && (
                                    <span className="text-xs font-mono text-white/30">
                                      [{person.profession.name}]
                                    </span>
                                  )}
                                </button>
                              )
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="p-6 border-t-2 border-[#d4a373]/20 flex justify-end gap-4 bg-black/40">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false)
                      resetForm()
                    }}
                    className="px-6 py-3 md:px-8 md:py-4 text-base font-mono font-black text-white/80 uppercase border-2 border-white/20 hover:border-white/50 transition-all bg-red-900/20 hover:bg-red-900/50"
                  >
                    [Cancelar]
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-6 py-3 md:px-8 md:py-4 bg-[#c27c2f] text-black text-base font-mono font-black uppercase hover:bg-[#df8120] transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    Solicitar Traslado
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

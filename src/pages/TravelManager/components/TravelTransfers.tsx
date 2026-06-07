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

function getTransferStatusColorClass(rawStatus: string): string {
  const status = String(rawStatus ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_")
  switch (status) {
    case "pending":
      return "text-[#c27c2f]"
    case "approved":
    case "in_transit":
      return "text-accent-approved"
    case "completed":
      return "text-paper-dark"
    case "rejected":
    case "cancelled":
      return "text-accent-critical"
    default:
      return "text-paper-dark/40"
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

  // ── Loading / Error guards ────────────────────────────────────────────────
  // El loader bloqueante ha sido desactivado para que la UI cargue inmediatamente
  // if (isLoading) {
  //   return (
  //     <div className="travelmanager-page-content flex-1 flex items-center justify-center">
  //       <Loader2 className="h-8 w-8 animate-spin text-[#c27c2f]" />
  //       <span className="ml-3 font-mono text-sm uppercase text-paper-dark">
  //         Cargando traslados...
  //       </span>
  //     </div>
  //   )
  // }

  // En caso de error de conexión, el UI sigue cargando vacío para permitir navegación
  // if (error) {
  //   return (
  //     <div className="travelmanager-page-content">
  //       <div className="warning-card p-4 font-mono text-sm text-accent-critical uppercase">
  //         Error al cargar traslados. Verifique la conexión con el servidor.
  //       </div>
  //     </div>
  //   )
  // }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex-1 h-full flex flex-col gap-3 overflow-hidden bg-bunker-bg min-w-0">
      {/* ── Vista Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-industrial-metal py-4 pl-4 pr-8 md:pr-16 border-b border-b-accent-approved/20 shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-accent-approved/10 p-2 border border-accent-approved/20 rounded-sm">
            <ArrowLeftRight className="h-5 w-5 text-accent-approved" />
          </div>
          <div>
            <h2 className="text-xl font-typewriter font-black text-white uppercase tracking-tight leading-none">
              Gestión de Traslados
            </h2>
            <p className="text-[10px] font-mono font-medium text-accent-approved/60 uppercase tracking-wider mt-1">
              Base: {campId}
            </p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-0 w-full md:w-auto">
          <div className="flex flex-wrap gap-2 md:gap-4 border-r border-white/10 pr-4 md:pr-6">
            {[
              { label: "Pendientes", count: stats.pending, color: "text-[#c27c2f]" },
              { label: "En Tránsito", count: stats.inTransit, color: "text-accent-approved" },
              { label: "Enviados", count: stats.sent, color: "text-paper-dark" },
              { label: "Recibidos", count: stats.received, color: "text-paper-dark" },
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
            className="bg-accent-approved text-white px-4 md:px-6 py-2.5 text-xs md:text-sm font-mono font-black uppercase hover:brightness-110 hover:shadow-xl transition-all shadow-lg active:scale-95 flex items-center gap-2 border-b-2 border-r-2 border-black/20 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> NUEVO TRASLADO
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
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              type="text"
              placeholder="Buscar por ID o campamento..."
              className="vintage-input w-full pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-[#c27c2f]/10 px-4 py-2.5">
            <Filter className="h-3 w-3 text-white/20" />
            <span className="text-sm font-mono text-white/30 uppercase font-black">Estado:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase"
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
          <div className="flex items-center gap-2 bg-black/40 border border-[#c27c2f]/10 px-4 py-2.5">
            <span className="text-sm font-mono text-white/30 uppercase font-black">Rol:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase"
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
          <div className="w-[320px] flex flex-col gap-2 shrink-0 overflow-hidden bg-industrial-metal p-3 border-l-2 border-l-accent-approved/40">
            <div className="flex items-center justify-between px-1 mb-1 border-b border-accent-approved/10 pb-2">
              <span className="text-[10px] font-mono font-medium text-accent-approved/70 uppercase tracking-wider">
                Registro de Traslados
              </span>
              <span className="text-[10px] font-mono font-medium text-white/30 uppercase tracking-wider">
                {filteredTransfers.length} reg
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((transfer) => {
                  const isOrigin = transfer.camp_origin_id === campId
                  return (
                    <motion.button
                      key={transfer.id}
                      whileHover={{ x: 2 }}
                      onClick={() => setSelectedId(transfer.id)}
                      className={`w-full text-left p-3 relative transition-all flex flex-col gap-1 border border-accent-approved/10 ${
                        selectedTransfer?.id === transfer.id
                          ? "bg-accent-approved/20 shadow-xl scale-[1.02] z-10 border-accent-approved/50"
                          : "bg-accent-approved/5 hover:bg-accent-approved/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 w-full gap-2">
                        <span
                          className={`text-xs font-mono font-black uppercase px-1.5 py-0.5 shrink-0 ${
                            isOrigin
                              ? "bg-[#c27c2f]/20 text-[#c27c2f]"
                              : "bg-accent-approved/20 text-accent-approved"
                          }`}
                        >
                          {isOrigin ? "↑ ENVIADO" : "↓ RECIBIDO"}
                        </span>
                        <span
                          className={`text-xs font-mono font-black uppercase truncate ${
                            selectedTransfer?.id === transfer.id ? "text-white/90" : "text-white/40"
                          }`}
                        >
                          {getTransferTypeBadge(transfer.type)}
                        </span>
                      </div>

                      <div
                        className={`text-sm font-typewriter font-black uppercase leading-tight mb-1 truncate ${
                          selectedTransfer?.id === transfer.id
                            ? "text-white"
                            : "text-accent-approved"
                        }`}
                      >
                        {isOrigin
                          ? `→ ${transfer.camp_destination_id}`
                          : `← ${transfer.camp_origin_id}`}
                      </div>

                      <p
                        className={`text-xs font-mono uppercase truncate ${
                          selectedTransfer?.id === transfer.id ? "text-white/70" : "text-white/30"
                        }`}
                      >
                        REF: {transfer.id.slice(0, 8).toUpperCase()}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <div
                          className={`h-2 w-2 rounded-full border border-black/10 ${
                            transfer.status === "in_transit" || transfer.status === "approved"
                              ? "bg-accent-approved animate-pulse"
                              : transfer.status === "pending"
                                ? "bg-[#c27c2f]"
                                : transfer.status === "rejected" || transfer.status === "cancelled"
                                  ? "bg-accent-critical"
                                  : "bg-black/20"
                          }`}
                        />
                        <span
                          className={`text-sm font-mono font-black uppercase tracking-widest ${
                            selectedTransfer?.id === transfer.id
                              ? getTransferStatusColorClass(transfer.status)
                              : "text-white/20"
                          }`}
                        >
                          {getTransferStatusLabel(transfer.status)}
                        </span>
                      </div>

                      {selectedTransfer?.id === transfer.id && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-accent-approved shadow-[0_0_10px_#c27c2f]" />
                      )}
                    </motion.button>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-10 w-10 text-accent-approved/10 mb-4" />
                  <p className="text-sm font-mono text-white/30 uppercase leading-relaxed font-black mb-3">
                    Sin traslados para esta consulta
                  </p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="px-4 py-2 border border-accent-approved/30 text-sm font-mono font-bold text-accent-approved hover:bg-accent-approved/10 transition-colors uppercase"
                  >
                    Nuevo traslado
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Transfer detail */}
          <div className="flex-1 flex flex-col overflow-hidden bg-industrial-metal border border-accent-approved/10">
            {selectedTransfer ? (
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Detail header */}
                <div className="p-4 border-b border-accent-approved/10 flex justify-between items-start bg-black/20 shrink-0">
                  <div>
                    <span className="text-[10px] font-mono font-medium text-accent-approved/60 uppercase tracking-widest block mb-2">
                      Orden #{selectedTransfer.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-4 bg-black/40 py-2.5 px-4 border border-accent-approved/20 rounded-sm">
                      <span className="font-typewriter text-white font-black uppercase text-lg leading-none">
                        {selectedTransfer.camp_origin_id}
                      </span>
                      <ArrowLeftRight className="h-5 w-5 text-accent-approved shrink-0" />
                      <span className="font-typewriter text-white font-black uppercase text-lg leading-none">
                        {selectedTransfer.camp_destination_id}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2.5 border inline-flex items-center gap-1.5 ${
                      selectedTransfer.status === "in_transit" ||
                      selectedTransfer.status === "approved"
                        ? "bg-accent-approved/10 border-accent-approved/30 text-accent-approved"
                        : selectedTransfer.status === "pending"
                          ? "bg-[#c27c2f]/10 border-[#c27c2f]/30 text-[#c27c2f]"
                          : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedTransfer.status === "in_transit" ||
                        selectedTransfer.status === "approved"
                          ? "bg-accent-approved animate-pulse"
                          : selectedTransfer.status === "pending"
                            ? "bg-[#c27c2f] animate-pulse"
                            : "bg-white/40"
                      }`}
                    />
                    <span className="text-xs font-mono font-black uppercase tracking-widest">
                      {getTransferStatusLabel(selectedTransfer.status)}
                    </span>
                  </div>
                </div>

                {/* Transfer info grid */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-sm font-mono text-white/30 uppercase tracking-widest mb-1">
                      Tipo de Carga
                    </p>
                    <p className="font-typewriter text-white font-black uppercase">
                      {getTransferTypeBadge(selectedTransfer.type)}
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-sm font-mono text-white/30 uppercase tracking-widest mb-1">
                      Días de Viaje
                    </p>
                    <p className="font-typewriter text-white font-black">
                      {selectedTransfer.travel_days ?? "—"} días
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-sm font-mono text-white/30 uppercase tracking-widest mb-1">
                      Fecha de Solicitud
                    </p>
                    <p className="font-mono text-white text-sm">
                      {new Date(selectedTransfer.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-sm font-mono text-white/30 uppercase tracking-widest mb-1">
                      Última Actualización
                    </p>
                    <p className="font-mono text-white text-sm">
                      {new Date(selectedTransfer.updated_at).toLocaleString()}
                    </p>
                  </div>

                  {selectedTransfer.notes && (
                    <div className="col-span-2 glass-panel p-4 rounded-sm">
                      <p className="text-sm font-mono text-white/30 uppercase tracking-widest mb-1">
                        Notas
                      </p>
                      <p className="font-mono text-white/80 text-sm">{selectedTransfer.notes}</p>
                    </div>
                  )}

                  {/* Approval info */}
                  {selectedTransfer.approvals && selectedTransfer.approvals.length > 0 ? (
                    <div className="col-span-2 glass-panel p-4 rounded-sm border border-accent-approved/20">
                      <p className="text-sm font-mono text-accent-approved uppercase tracking-widest mb-2">
                        Decisiones de Aprobación
                      </p>
                      <div className="flex flex-col gap-2">
                        {selectedTransfer.approvals.map((app, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span
                              className={`text-sm font-mono font-black uppercase px-2 py-0.5 ${
                                app.status === "approved"
                                  ? "bg-accent-approved/20 text-accent-approved"
                                  : "bg-accent-critical/20 text-accent-critical"
                              }`}
                            >
                              {app.status === "approved" ? "APROBADO" : "RECHAZADO"}
                            </span>
                            <span className="font-mono text-white/60 text-sm">
                              {app.user?.username || "Sistema"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 glass-panel p-4 rounded-sm">
                      <p className="text-xs font-mono font-bold text-white/30 uppercase tracking-widest">
                        Esperando Aprobación
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="p-4 border-t border-accent-approved/10 flex gap-3 mt-auto">
                  {selectedTransfer.status === "pending" &&
                    selectedTransfer.camp_origin_id === campId && (
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
                  {selectedTransfer.status === "in_transit" &&
                    selectedTransfer.camp_destination_id === campId && (
                      <button
                        onClick={() => handleConfirmArrival(selectedTransfer.id)}
                        disabled={confirmMutation.isPending}
                        className="flex items-center gap-2 px-8 py-2.5 bg-accent-approved text-white text-sm font-mono font-black uppercase hover:opacity-90 transition-all disabled:opacity-50 shadow-lg tracking-wider"
                      >
                        {confirmMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Confirmar Llegada
                      </button>
                    )}
                  {(selectedTransfer.status === "completed" ||
                    selectedTransfer.status === "rejected" ||
                    selectedTransfer.status === "cancelled") && (
                    <span className="text-xs font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                      <Archive className="h-3.5 w-3.5" />
                      Traslado archivado
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Truck className="h-20 w-20 mb-6 text-accent-approved opacity-20" />
                <p className="font-typewriter text-2xl text-white/20 font-black uppercase mb-3">
                  Seleccione un Traslado
                </p>
                <p className="font-mono text-sm text-white/20 uppercase tracking-widest">
                  o cree uno nuevo para comenzar
                </p>
              </div>
            )}
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
              className="bg-industrial-metal border-4 border-double border-accent-approved/50 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-accent-approved/30 bg-black/50">
                <div className="flex items-center gap-4">
                  <ArrowLeftRight className="h-8 w-8 text-accent-approved animate-pulse" />
                  <h3 className="font-typewriter font-black text-white uppercase text-xl md:text-2xl tracking-widest">
                    Nueva Solicitud de Traslado
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsNewModalOpen(false)
                    resetForm()
                  }}
                  className="text-white/40 hover:text-[#fca311] transition-colors"
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
                    <div className="bg-red-950/40 border border-red-500/50 p-4 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg mb-4">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                  {/* Origin indicator */}
                  <div className="bg-black/60 border-2 border-white/10 px-6 py-4 flex items-center gap-4">
                    <span className="text-sm md:text-base font-mono text-white/50 uppercase font-black tracking-widest">
                      Campamento Origen:
                    </span>
                    <span className="text-lg md:text-xl font-mono font-black text-accent-approved uppercase">
                      {campId}
                    </span>
                    <span className="text-white/30 text-xl">→</span>
                  </div>

                  <div>
                    <label
                      htmlFor="destCampId"
                      className="text-sm md:text-base font-mono font-black text-accent-approved uppercase tracking-widest block mb-2"
                    >
                      Campamento Destino *
                    </label>
                    <select
                      id="destCampId"
                      value={destCampId}
                      onChange={(e) => setDestCampId(e.target.value)}
                      className="vintage-input w-full p-4 text-base md:text-lg"
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
                        className="text-sm md:text-base font-mono font-black text-accent-approved uppercase tracking-widest block mb-2"
                      >
                        Tipo de Traslado *
                      </label>
                      <select
                        id="transferType"
                        value={transferType}
                        onChange={(e) =>
                          setTransferType(e.target.value as "resources" | "people" | "both")
                        }
                        className="vintage-input w-full p-4 text-base md:text-lg"
                      >
                        <option value="resources">RECURSOS</option>
                        <option value="people">PERSONAS</option>
                        <option value="both">MIXTO (AMBOS)</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="travelDays"
                        className="text-sm md:text-base font-mono font-black text-accent-approved uppercase tracking-widest block mb-2"
                      >
                        Días de Viaje
                      </label>
                      <input
                        id="travelDays"
                        type="number"
                        min={1}
                        value={travelDays}
                        onChange={(e) => setTravelDays(Number(e.target.value))}
                        className="vintage-input w-full p-4 text-base md:text-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="text-sm md:text-base font-mono font-black text-accent-approved uppercase tracking-widest block mb-2"
                    >
                      Notas / Motivo
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Razón del traslado, instrucciones especiales..."
                      rows={3}
                      className="vintage-input w-full resize-none p-4 text-base md:text-lg"
                    />
                  </div>

                  {/* Resources section */}
                  {(transferType === "resources" || transferType === "both") && (
                    <div>
                      <label className="text-xs font-mono font-black text-accent-approved uppercase tracking-widest block mb-2">
                        Recursos a Transferir * ({selectedResources.length} seleccionado(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-accent-approved/10 p-2 bg-black/20">
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
                                      ? "bg-accent-approved/10 border-accent-approved/30"
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
                                          ? "border-accent-approved bg-accent-approved/20"
                                          : "border-white/20"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-2 w-2 text-accent-approved" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-black/20 border border-ink/10 flex items-center justify-center">
                                        <Package className="w-3 h-3 text-white/60" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm font-mono font-black text-white/80 uppercase">
                                          {item.resource?.name || "Desconocido"}
                                        </span>
                                        <span className="text-sm font-mono text-white/40 uppercase">
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
                      <label className="text-xs font-mono font-black text-accent-approved uppercase tracking-widest block mb-2">
                        Personas a Transferir * ({selectedPersons.length} seleccionada(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-accent-approved/10 p-2 bg-black/20">
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
                                      ? "bg-accent-approved/10 border-accent-approved/30"
                                      : "bg-black/20 border-white/5 hover:border-accent-approved/20"
                                  }`}
                                >
                                  <div
                                    className={`h-3 w-3 border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? "border-accent-approved bg-accent-approved/20"
                                        : "border-white/20"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-2 w-2 text-accent-approved" />
                                    )}
                                  </div>
                                  <span className="text-sm font-mono text-white/80 uppercase">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {person.profession && (
                                    <span className="text-sm font-mono text-white/30">
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

                  {/* End Persons section */}
                </div>

                {/* Modal footer */}
                <div className="p-6 border-t-2 border-accent-approved/30 flex justify-end gap-4 bg-black/40">
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
                    className="px-6 py-3 md:px-8 md:py-4 bg-accent-approved text-black text-base font-mono font-black uppercase hover:bg-white transition-all disabled:opacity-50 flex items-center gap-3"
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

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
  Truck,
  Archive,
  Package,
  Users,
  Apple,
  Droplets,
  HeartPulse,
  Target,
  Wrench,
  Zap,
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { io } from "socket.io-client"

import type {
  IntercampRequest,
  Person,
  InventoryItem,
  RequestResourceDetail,
  RequestPersonDetail,
} from "@/types/api.types"

import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
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

function getCategoryIcon(category?: string) {
  const cat = String(category || "").toLowerCase()
  if (cat.includes("food") || cat.includes("comida") || cat.includes("alimento")) {
    return <Apple className="w-5 h-5 text-[#df8120]" />
  }
  if (cat.includes("water") || cat.includes("agua")) {
    return <Droplets className="w-5 h-5 text-[#4c6351]" />
  }
  if (cat.includes("medic") || cat.includes("health")) {
    return <HeartPulse className="w-5 h-5 text-[#9c2720]" />
  }
  if (cat.includes("ammo") || cat.includes("weapon") || cat.includes("arm")) {
    return <Target className="w-5 h-5 text-ink-soft" />
  }
  if (cat.includes("tool") || cat.includes("material") || cat.includes("herramienta")) {
    return <Wrench className="w-5 h-5 text-[#a89b82]" />
  }
  if (
    cat.includes("energy") ||
    cat.includes("fuel") ||
    cat.includes("energia") ||
    cat.includes("combustible")
  ) {
    return <Zap className="w-5 h-5 text-[#e8c870]" />
  }
  return <Package className="w-5 h-5 text-[#c27c2f]" />
}

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

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: "warning" | "danger" | "info"
    hideCancel?: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    hideCancel: false,
    onConfirm: () => {},
  })

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

      setConfirmDialog({
        isOpen: true,
        title: "Traslado Creado",
        message: "El traslado ha sido registrado y programado exitosamente en el sistema.",
        type: "info",
        hideCancel: true,
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        },
      })
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message
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

    if (!destCampId) {
      setFormError("Seleccione un campamento de destino.")
      return
    }

    if (String(destCampId) === String(campId)) {
      setFormError("Operación denegada. El destino no puede ser la misma base de origen.")
      return
    }

    if (transferType === "resources" && selectedResources.length === 0) {
      setFormError("Debe incluir al menos un recurso para el traslado.")
      return
    }
    if (transferType === "people" && selectedPersons.length === 0) {
      setFormError("Debe incluir al menos una persona para el traslado.")
      return
    }
    if (
      transferType === "both" &&
      (selectedResources.length === 0 || selectedPersons.length === 0)
    ) {
      setFormError(
        "Operación denegada. El traslado mixto requiere al menos un recurso y una persona.",
      )
      return
    }

    if (transferType !== "people") {
      const invalidQty = selectedResources.some((r) => {
        const item = inventory.find((i) => i.resource_id === r.resource_id)
        if (!item) return true
        return r.requested_quantity <= 0 || r.requested_quantity > item.current_quantity
      })
      if (invalidQty) {
        setFormError(
          "Operación denegada. Cantidad de recursos solicitados excede el inventario físico disponible o es inválida.",
        )
        return
      }
    }

    if (transferType !== "resources") {
      const invalidPerson = selectedPersons.some((sel) => {
        const p = persons.find((per) => per.id === sel.person_id)
        if (!p) return true
        const pCampId = p.camp_id ?? p.userAccount?.camp_id
        return String(pCampId) !== String(campId)
      })
      if (invalidPerson) {
        setFormError(
          "Operación denegada. El personal seleccionado no pertenece a la base de origen actual.",
        )
        return
      }
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
    setConfirmDialog({
      isOpen: true,
      title: "Cancelar Traslado",
      message: "¿Confirmar la cancelación de este traslado? Esta acción no se puede deshacer.",
      type: "danger",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        cancelMutation.mutate(id)
      },
    })
  }

  function handleConfirmArrival(id: string) {
    setConfirmDialog({
      isOpen: true,
      title: "Confirmar Llegada",
      message: "¿Confirmar la llegada exitosa de este traslado a la base de destino?",
      type: "info",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        confirmMutation.mutate(id)
      },
    })
  }

  function handleDiscardDraft() {
    setConfirmDialog({
      isOpen: true,
      title: "Descartar Solicitud",
      message:
        "¿Estás seguro de que deseas descartar esta solicitud de traslado? Se perderán todos los datos ingresados.",
      type: "warning",
      hideCancel: false,
      onConfirm: () => {
        setIsNewModalOpen(false)
        resetForm()
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
      },
    })
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
    const item = inventory.find((i) => i.resource_id === resourceId)
    const maxQty = item ? item.current_quantity : qty
    const validQty = Math.max(1, Math.min(qty, maxQty))

    setSelectedResources(
      selectedResources.map((r) =>
        r.resource_id === resourceId ? { ...r, requested_quantity: validQty } : r,
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
    <div className="tm-container">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        hideCancel={confirmDialog.hideCancel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ── Vista Header ── */}
      <div className="tm-board-header">
        <div className="tm-board-left">
          <div className="tm-online-dot" />
          <div>
            <h2 className="tm-board-title leading-none">Gestión de Traslados</h2>
            <p className="tm-board-sub mt-1">Base: {campId.toUpperCase()}</p>
          </div>
        </div>

        {/* Stats summary */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex gap-2 items-center mr-2">
            {[
              { label: "Pendientes", count: stats.pending, color: "text-[#c27c2f]" },
              { label: "En Tránsito", count: stats.inTransit, color: "text-accent-approved" },
              { label: "Enviados", count: stats.sent, color: "text-white/60" },
              { label: "Recibidos", count: stats.received, color: "text-white/60" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center px-3 border-r border-white/10 last:border-none"
              >
                <span className={`text-sm font-mono font-black ${s.color}`}>{s.count}</span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white/30">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="tm-action-btn tm-action-btn-primary"
            style={{ padding: "8px 16px", borderRadius: "4px" }}
          >
            <span className="tm-action-label">
              <Plus className="h-3.5 w-3.5" /> Nuevo traslado
            </span>
            <span className="tm-action-sub">Enlace logístico</span>
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
        <div className="flex flex-wrap gap-3 shrink-0 items-center bg-[#1c1208] p-3 border border-[#d4a373]/20 rounded-md">
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Buscar por ID o base..."
              className="vintage-input w-full pl-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-[#121110] border border-[#d4a373]/20 px-4 py-2 rounded-md">
            <span className="text-xs font-mono text-white/30 uppercase font-black">Estado:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase cursor-pointer"
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
          <div className="flex items-center gap-2 bg-[#121110] border border-[#d4a373]/20 px-4 py-2 rounded-md">
            <span className="text-xs font-mono text-white/30 uppercase font-black">Rol:</span>
            <select
              className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase cursor-pointer"
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
          {/* LEFT: Registro de Traslados */}
          <div className="w-[290px] flex flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border border-[#d4a373]/20 rounded-md shadow-lg">
            <div className="tm-folder-header-row mb-1">
              <h4 className="tm-folder-title">REGISTRO DE TRASLADOS</h4>
              <span className="text-[10px] font-mono font-medium text-white/30 uppercase tracking-wider">
                {filteredTransfers.length} REG
              </span>
            </div>

            <div className="tm-op-list">
              {filteredTransfers.length > 0 ? (
                filteredTransfers.map((transfer) => {
                  const isOrigin = transfer.camp_origin_id === campId
                  return (
                    <motion.button
                      key={transfer.id}
                      whileHover={{ x: 2 }}
                      onClick={() => setSelectedId(transfer.id)}
                      className={`tm-op-row cursor-pointer transition-all ${
                        transfer.status === "pending"
                          ? "tm-row-pending"
                          : transfer.status === "approved" || transfer.status === "in_transit"
                            ? "tm-row-transit"
                            : "tm-row-sched"
                      } ${selectedTransfer?.id === transfer.id ? "selected" : ""}`}
                    >
                      {/* Header: Direction Indicator + Status */}
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`px-1.5 py-0.5 text-[8px] font-mono font-bold tracking-wider rounded-sm ${
                            isOrigin
                              ? "bg-[#c27c2f]/20 text-[#c27c2f]"
                              : "bg-accent-approved/20 text-accent-approved"
                          }`}
                        >
                          {isOrigin ? "↑ ENVIADO" : "↓ RECIBIDO"}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold uppercase tracking-wider ${getTransferStatusColorClass(
                            transfer.status,
                          )}`}
                        >
                          {getTransferStatusLabel(transfer.status)}
                        </span>
                      </div>

                      {/* Title: Origin/Destination base */}
                      <h5 className="text-[12px] font-mono font-bold uppercase tracking-tight truncate mt-0.5 w-full text-white">
                        {isOrigin
                          ? `➔ BASE ${transfer.camp_destination_id}`
                          : `← BASE ${transfer.camp_origin_id}`}
                      </h5>

                      {/* Meta/Ref */}
                      <p className="text-[10px] font-mono text-[#faf4e6]/80 truncate w-full">
                        REF: {transfer.id.slice(0, 8).toUpperCase()}
                      </p>

                      {/* Type Badge */}
                      <div className="flex justify-between items-center w-full mt-1.5 border-t border-white/5 pt-1.5">
                        <span className="text-[8px] font-mono text-[#c8bfae] uppercase font-bold">
                          CARGA: {getTransferTypeBadge(transfer.type)}
                        </span>
                        <span className="text-[8px] font-mono text-white/30 font-bold uppercase">
                          {transfer.travel_days}d VÍA
                        </span>
                      </div>
                    </motion.button>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-10 w-10 text-white/10 mb-4" />
                  <p className="text-xs font-mono text-white/30 uppercase leading-relaxed font-black mb-3">
                    Sin traslados registrados
                  </p>
                  <button type="button" onClick={() => setIsNewModalOpen(true)} className="tm-btn">
                    <Plus className="h-3.5 w-3.5" /> Nuevo Traslado
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE: Visualizador */}
          <div className="flex-1 flex flex-col bg-[#1c1208] border border-[#d4a373]/20 rounded-md overflow-hidden shadow-lg">
            {selectedTransfer ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header visualizador */}
                <div className="p-4 border-b border-[#d4a373]/15 flex items-center justify-between shrink-0 bg-black/20">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-[#df8120] shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest font-black block mb-0.5">
                        ORDEN DE TRASLADO
                      </span>
                      <h3 className="text-sm font-typewriter font-black text-white uppercase leading-none tracking-wider">
                        REF: {selectedTransfer.id.slice(0, 8).toUpperCase()}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`tm-op-chip ${
                        selectedTransfer.status === "in_transit" ||
                        selectedTransfer.status === "approved"
                          ? "tm-chip-active"
                          : selectedTransfer.status === "pending"
                            ? "tm-chip-transit"
                            : "tm-chip-sched"
                      } text-xs px-3 py-1`}
                    >
                      {getTransferStatusLabel(selectedTransfer.status).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Paper sheet details */}
                <div className="flex-1 p-5 flex flex-col overflow-hidden items-center justify-center relative bg-black/25">
                  <div className="tm-paper tm-paper-texture w-full h-full relative overflow-hidden p-8 flex flex-col shadow-2xl justify-between">
                    {/* Sello MANIFIESTO */}
                    <div className="absolute top-10 right-10 flex flex-col items-center rotate-12 select-none opacity-15 pointer-events-none z-10">
                      <div className="border-4 border-ink p-1 mb-0.5">
                        <span className="text-base font-black font-mono px-2 tracking-widest">
                          MANIFIESTO
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-black italic text-ink">
                        ENLACE ENTRE BASES
                      </span>
                    </div>

                    {/* ── Header: Ruta + Estado ── */}
                    <div className="flex gap-10 px-10 py-8 border-b-2 border-dashed border-ink/20">
                      {/* Icono */}
                      <div className="shrink-0 flex flex-col items-center gap-4">
                        <div className="w-28 h-28 border-2 border-ink/40 bg-ink/4 flex items-center justify-center shadow-md">
                          <Truck className="w-14 h-14 text-ink/60" />
                        </div>
                        <span
                          className={`text-xs font-mono font-black uppercase px-4 py-1.5 border rounded-sm tracking-wider ${
                            selectedTransfer.status === "in_transit" ||
                            selectedTransfer.status === "approved"
                              ? "text-[#4c6351] border-[#4c6351]/40 bg-[#4c6351]/8"
                              : selectedTransfer.status === "pending"
                                ? "text-[#c27c2f] border-[#c27c2f]/40 bg-[#c27c2f]/8"
                                : selectedTransfer.status === "completed"
                                  ? "text-ink-soft border-ink/20 bg-ink/4"
                                  : "text-[#9c2720] border-[#9c2720]/40 bg-[#9c2720]/8"
                          }`}
                        >
                          {getTransferStatusLabel(selectedTransfer.status).toUpperCase()}
                        </span>
                      </div>

                      {/* Datos de ruta */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span className="text-[11px] font-mono text-ink-soft/80 uppercase tracking-[0.2em] font-black block mb-2">
                          ORDEN DE TRASLADO LOGÍSTICO
                        </span>
                        <h2 className="font-typewriter text-3xl font-black text-ink uppercase leading-none mb-4 flex items-center gap-4">
                          BASE {selectedTransfer.camp_origin_id}
                          <ArrowLeftRight className="h-6 w-6 text-ink/60 shrink-0" />
                          BASE {selectedTransfer.camp_destination_id}
                        </h2>
                        <div className="flex items-center gap-3 mb-8">
                          <span className="px-3 py-1 bg-ink/8 border border-ink/15 text-ink text-xs font-mono font-black rounded-sm">
                            {getTransferTypeBadge(selectedTransfer.type)}
                          </span>
                          {String(selectedTransfer.camp_origin_id) === String(campId) ? (
                            <span className="px-3 py-1 bg-[#c27c2f]/10 border border-[#c27c2f]/25 text-[#c27c2f] text-xs font-mono font-black rounded-sm">
                              ↑ ENVIADO
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-[#4c6351]/10 border border-[#4c6351]/25 text-[#4c6351] text-xs font-mono font-black rounded-sm">
                              ↓ RECIBIDO
                            </span>
                          )}
                        </div>

                        {/* Data fields como tarjetas */}
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            {
                              label: "REF. Orden",
                              value: selectedTransfer.id.slice(0, 12).toUpperCase(),
                              color: "text-ink",
                              bg: "bg-[#253240]/10 border-[#253240]/20",
                            },
                            {
                              label: "Días de Viaje",
                              value: `${selectedTransfer.travel_days ?? "—"} DÍAS`,
                              color: "text-[#253240]",
                              bg: "bg-[#253240]/10 border-[#253240]/20",
                            },
                            {
                              label: "Fecha Solicitud",
                              value: new Date(
                                selectedTransfer.request_date ?? selectedTransfer.created_at,
                              ).toLocaleDateString(),
                              color: "text-[#3d5041]",
                              bg: "bg-[#4c6351]/10 border-[#4c6351]/20",
                            },
                            ...(selectedTransfer.departure_date
                              ? [
                                  {
                                    label: "Salida",
                                    value: new Date(
                                      selectedTransfer.departure_date,
                                    ).toLocaleDateString(),
                                    color: "text-[#b35a12]",
                                    bg: "bg-[#df8120]/10 border-[#df8120]/20",
                                  },
                                ]
                              : []),
                            ...(selectedTransfer.arrival_date
                              ? [
                                  {
                                    label: "Llegada Est.",
                                    value: new Date(
                                      selectedTransfer.arrival_date,
                                    ).toLocaleDateString(),
                                    color: "text-[#b35a12]",
                                    bg: "bg-[#df8120]/10 border-[#df8120]/20",
                                  },
                                ]
                              : []),
                            {
                              label: "Actualización",
                              value: new Date(selectedTransfer.updated_at).toLocaleDateString(),
                              color: "text-ink-soft",
                              bg: "bg-ink/5 border-ink/10",
                            },
                          ].map((field) => (
                            <div
                              key={field.label}
                              className={`${field.bg} border rounded-sm px-4 py-3`}
                            >
                              <span className="text-[9px] font-mono text-ink-soft uppercase tracking-widest font-black block mb-1.5 leading-none">
                                {field.label}
                              </span>
                              <span
                                className={`text-sm font-mono font-black ${field.color} leading-tight`}
                              >
                                {field.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Recursos + Personas ── */}
                    <div className="grid grid-cols-2 border-b border-dashed border-ink/15">
                      <div className="px-10 py-8 border-r border-dashed border-ink/15">
                        <h4 className="text-xs font-black text-ink uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                          <Package className="h-4 w-4 shrink-0 text-[#c27c2f]" /> Suministros
                          Solicitados
                        </h4>
                        {selectedTransfer.resourceDetails &&
                        selectedTransfer.resourceDetails.length > 0 ? (
                          <div className="space-y-4">
                            {selectedTransfer.resourceDetails.map((rd: RequestResourceDetail) => (
                              <div
                                key={rd.resource_id}
                                className="flex items-center gap-4 bg-ink/5 border border-ink/10 rounded-sm p-3 relative overflow-hidden shadow-sm"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c27c2f]"></div>
                                <div className="w-10 h-10 shrink-0 bg-black/30 border border-[#c27c2f]/30 flex items-center justify-center rounded-sm">
                                  {getCategoryIcon(rd.resource?.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-mono font-black text-ink uppercase truncate leading-tight">
                                    {rd.resource?.name || `Recurso #${rd.resource_id}`}
                                  </p>
                                  <p className="text-[10px] font-mono text-ink-soft uppercase mt-1 opacity-70 truncate">
                                    Cat: {rd.resource?.category || "N/A"}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-lg font-mono font-black text-[#df8120] leading-none">
                                    {rd.requested_quantity}
                                  </div>
                                  <div className="text-[10px] font-mono text-ink-soft uppercase mt-1">
                                    {rd.resource?.unit || "uds"}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono text-sm text-ink-soft/70 uppercase italic leading-relaxed">
                            Sin suministros registrados en esta orden.
                          </p>
                        )}
                      </div>

                      <div className="px-10 py-8">
                        <h4 className="text-xs font-black text-ink uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                          <Users className="h-4 w-4 shrink-0 text-[#4c6351]" /> Personal Asignado
                        </h4>
                        {selectedTransfer.personDetails &&
                        selectedTransfer.personDetails.length > 0 ? (
                          <div className="space-y-3">
                            {selectedTransfer.personDetails.map((pd: RequestPersonDetail) => (
                              <div
                                key={pd.person_id}
                                className="flex items-center justify-between bg-[#4c6351]/5 border border-[#4c6351]/20 border-l-4 border-l-[#4c6351] rounded-sm px-4 py-3"
                              >
                                <span className="text-sm font-mono font-bold text-ink uppercase truncate flex-1 leading-snug">
                                  {pd.person?.first_name || "Personal"}{" "}
                                  {pd.person?.last_name || `#${pd.person_id}`}
                                </span>
                                {pd.is_leader && (
                                  <span className="text-[10px] font-mono font-black text-white border border-[#3d5041] bg-[#4c6351] px-2 py-0.5 rounded-sm ml-3 shrink-0">
                                    LÍDER
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono text-sm text-ink-soft/70 uppercase italic leading-relaxed">
                            Sin personal asignado a esta orden.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ── Notas + Autorizaciones ── */}
                    <div className="grid grid-cols-2 border-b border-dashed border-ink/15">
                      <div className="px-10 py-8 border-r border-dashed border-ink/15">
                        <h4 className="text-xs font-black text-ink-soft uppercase tracking-[0.15em] mb-4">
                          Notas del Solicitante
                        </h4>
                        <div className="p-5 bg-[#e8c870]/20 border border-[#e8c870]/40 rounded-sm min-h-[80px] shadow-sm relative">
                          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#c27c2f]/40"></div>
                          {selectedTransfer.notes ? (
                            <p className="font-mono text-sm text-[#5a481c] italic leading-[1.8] mt-1 font-bold">
                              {selectedTransfer.notes}
                            </p>
                          ) : (
                            <p className="font-mono text-xs text-ink-soft/70 uppercase italic leading-relaxed mt-1">
                              Sin notas registradas en la orden.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-10 py-8">
                        <h4 className="text-xs font-black text-ink-soft uppercase tracking-[0.15em] mb-4">
                          Firmas de Autorización
                        </h4>
                        {selectedTransfer.approvals && selectedTransfer.approvals.length > 0 ? (
                          <div className="space-y-3">
                            {Object.values(
                              selectedTransfer.approvals.reduce((acc: any, app: any) => {
                                const key = app.user?.username || "Sistema"
                                acc[key] = app
                                return acc
                              }, {}),
                            ).map((app: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-4 bg-ink/4 border border-ink/10 rounded-sm px-4 py-3"
                              >
                                <span
                                  className={`text-xs font-mono font-black uppercase px-3 py-1 rounded-sm shrink-0 ${
                                    app.status === "approved"
                                      ? "bg-[#4c6351]/15 text-[#4c6351] border border-[#4c6351]/20"
                                      : "bg-[#9c2720]/15 text-[#9c2720] border border-[#9c2720]/20"
                                  }`}
                                >
                                  {app.status === "approved" ? "APROBADO" : "RECHAZADO"}
                                </span>
                                <span className="font-mono text-sm text-ink-soft/60 leading-snug">
                                  {app.user?.username || "Sistema"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-5 bg-ink/4 border border-dashed border-ink/12 rounded-sm min-h-[80px] flex items-center justify-center">
                            <p className="font-mono text-xs text-ink-soft/70 uppercase italic text-center leading-relaxed">
                              Pendiente de validación
                              <br />
                              por oficial comandante
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-10 py-5 flex justify-between items-center text-ink-soft/70 font-mono text-[10px] uppercase tracking-[0.15em] mt-auto font-black">
                      <span>ORDEN REF-{selectedTransfer.id.slice(0, 8).toUpperCase()}</span>
                      <span>
                        Emitido: {new Date(selectedTransfer.created_at).toLocaleDateString()}
                      </span>
                      <span className="border border-dashed border-ink/30 px-4 py-1.5 rotate-1">
                        SITUACIÓN LOGÍSTICA · MOVILIDAD
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="p-4 border-t border-[#d4a373]/15 flex gap-3 mt-auto shrink-0 bg-black/40">
                  {selectedTransfer.status === "pending" &&
                    selectedTransfer.camp_origin_id === campId && (
                      <button
                        onClick={() => handleCancelTransfer(selectedTransfer.id)}
                        disabled={cancelMutation.isPending}
                        className="tm-action-btn tm-action-btn-danger"
                        style={{ padding: "8px 16px", borderRadius: "4px" }}
                      >
                        <span className="tm-action-label flex items-center gap-2">
                          {cancelMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Cancelar Traslado
                        </span>
                        <span className="tm-action-sub">Abortar orden</span>
                      </button>
                    )}
                  {selectedTransfer.status === "in_transit" &&
                    selectedTransfer.camp_destination_id === campId && (
                      <button
                        onClick={() => handleConfirmArrival(selectedTransfer.id)}
                        disabled={confirmMutation.isPending}
                        className="tm-action-btn tm-action-btn-primary"
                        style={{ padding: "8px 16px", borderRadius: "4px" }}
                      >
                        <span className="tm-action-label flex items-center gap-2">
                          {confirmMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Confirmar Llegada
                        </span>
                        <span className="tm-action-sub">Registrar recepción</span>
                      </button>
                    )}
                  {(selectedTransfer.status === "completed" ||
                    selectedTransfer.status === "rejected" ||
                    selectedTransfer.status === "cancelled") && (
                    <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest flex items-center gap-1.5 pl-2 font-black">
                      <Archive className="h-3.5 w-3.5 text-white/50" />
                      Traslado archivado en histórico
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/15">
                <Truck className="h-20 w-20 mb-6 text-[#c27c2f] opacity-50" />
                <p className="font-typewriter text-2xl text-white/60 font-black uppercase mb-3">
                  Seleccione un Traslado
                </p>
                <p className="font-mono text-sm text-white/50 uppercase tracking-widest">
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
              className="tm-paper tm-paper-texture w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative p-0 border-4 border-double border-ink/40"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-dashed border-ink/20 bg-black/5">
                <div className="flex items-center gap-4">
                  <ArrowLeftRight className="h-8 w-8 text-[#df8120] animate-pulse" />
                  <h3 className="font-typewriter font-black text-ink uppercase text-xl md:text-2xl tracking-widest leading-none">
                    Nueva Solicitud de Traslado
                  </h3>
                </div>
                <button
                  onClick={handleDiscardDraft}
                  className="text-ink-soft hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <form
                onSubmit={handleCreateTransfer}
                className="flex-1 overflow-y-auto custom-scrollbar"
              >
                <div className="p-8 space-y-6">
                  {formError && (
                    <div className="bg-red-950/40 border border-red-500/50 p-4 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg mb-4">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}
                  {/* Origin indicator */}
                  <div className="bg-[#f5ecd7] border-2 border-dashed border-ink/20 p-4 flex items-center gap-4">
                    <span className="text-xs font-mono text-ink-soft uppercase font-black tracking-widest">
                      Campamento Origen:
                    </span>
                    <span className="text-sm font-mono font-black text-ink uppercase">
                      {campId}
                    </span>
                    <span className="text-ink-soft/40 text-sm">➔</span>
                  </div>

                  <div>
                    <label
                      htmlFor="destCampId"
                      className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                    >
                      Campamento Destino *
                    </label>
                    <select
                      id="destCampId"
                      value={destCampId}
                      onChange={(e) => setDestCampId(e.target.value)}
                      className="vintage-input w-full p-3 text-base"
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
                        className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                      >
                        Tipo de Traslado *
                      </label>
                      <select
                        id="transferType"
                        value={transferType}
                        onChange={(e) =>
                          setTransferType(e.target.value as "resources" | "people" | "both")
                        }
                        className="vintage-input w-full p-3 text-base"
                      >
                        <option value="resources">RECURSOS</option>
                        <option value="people">PERSONAS</option>
                        <option value="both">MIXTO (AMBOS)</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="travelDays"
                        className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                      >
                        Días de Viaje
                      </label>
                      <input
                        id="travelDays"
                        type="number"
                        min={1}
                        value={travelDays}
                        onChange={(e) => setTravelDays(Number(e.target.value))}
                        className="vintage-input w-full p-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2"
                    >
                      Notas / Motivo
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Razón del traslado, instrucciones especiales..."
                      rows={3}
                      className="vintage-input w-full resize-none p-3"
                    />
                  </div>

                  {/* Resources section */}
                  {(transferType === "resources" || transferType === "both") && (
                    <div>
                      <label className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2">
                        Recursos a Transferir * ({selectedResources.length} seleccionado(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-ink/20 p-2 bg-black/5 rounded-sm">
                        {inventory.length === 0 ? (
                          <p className="text-xs font-mono text-ink-soft/40 uppercase text-center py-4">
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
                                  className={`flex items-center justify-between p-2 border transition-all rounded-sm ${
                                    isSelected
                                      ? "bg-ink/5 border-ink/40"
                                      : "bg-transparent border-dashed border-ink/15 hover:border-ink/30"
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 cursor-pointer flex-1 bg-transparent border-none text-left p-0 outline-none focus:outline-none"
                                    onClick={() => handleToggleResource(item.resource_id)}
                                  >
                                    <div
                                      className={`h-3.5 w-3.5 border flex items-center justify-center shrink-0 rounded-sm ${
                                        isSelected ? "border-ink bg-ink/10" : "border-ink/20"
                                      }`}
                                    >
                                      {isSelected && <Check className="h-2.5 w-2.5 text-ink" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded bg-black/5 border border-ink/10 flex items-center justify-center">
                                        <Package className="w-3 h-3 text-ink-soft" />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-mono font-bold text-ink uppercase">
                                          {item.resource?.name || "Desconocido"}
                                        </span>
                                        <span className="text-[10px] font-mono text-ink-soft/60 uppercase leading-none mt-1">
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
                                      className="vintage-input w-16 text-xs ml-2"
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
                      <label className="text-xs font-mono font-black text-ink uppercase tracking-widest block mb-2">
                        Personas a Transferir * ({selectedPersons.length} seleccionada(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-ink/20 p-2 bg-black/5 rounded-sm">
                        {persons.length === 0 ? (
                          <p className="text-xs font-mono text-ink-soft/40 uppercase text-center py-4">
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
                                  className={`flex items-center gap-2 p-2 border cursor-pointer transition-all text-left w-full rounded-sm bg-transparent outline-none focus:outline-none ${
                                    isSelected
                                      ? "bg-ink/5 border-ink/40"
                                      : "bg-transparent border-dashed border-ink/15 hover:border-ink/30"
                                  }`}
                                >
                                  <div
                                    className={`h-3.5 w-3.5 border flex items-center justify-center shrink-0 rounded-sm ${
                                      isSelected ? "border-ink bg-ink/10" : "border-ink/20"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-2.5 w-2.5 text-ink" />}
                                  </div>
                                  <span className="text-xs font-mono text-ink font-bold uppercase">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {person.profession && (
                                    <span className="text-[10px] font-mono text-ink-soft/60">
                                      [{person.profession.name.toUpperCase()}]
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
                <div className="p-6 border-t-2 border-dashed border-ink/20 flex justify-end gap-4 bg-black/5">
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="tm-action-btn tm-action-btn-danger"
                    style={{ padding: "10px 20px" }}
                  >
                    Cancelar
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

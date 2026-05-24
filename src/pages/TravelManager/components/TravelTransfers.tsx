import { useState, useMemo, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
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
  Clock,
  Briefcase,
  Activity,
  UserCheck,
  MapPin,
  ListOrdered,
  Calendar,
  XCircle,
} from 'lucide-react'
import { useAuth } from '@/pages/Admin/context/AuthContext'
import {
  getCampTransfers,
  createTransferRequest,
  cancelTransfer,
  confirmTransferArrival,
} from '@/features/transfers/services/transfers.service'
import { getPersons } from '@/features/persons/services/persons.service'
import { getInventory } from '@/features/inventory/services/inventory.service'
import type { IntercampRequest, Person, InventoryItem } from '@/types/api.types'

// ── Status helpers ──────────────────────────────────────────────────────────

function getTransferStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'approved':
      return 'Aprobado'
    case 'in_transit':
      return 'En Tránsito'
    case 'completed':
      return 'Completado'
    case 'rejected':
      return 'Rechazado'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

function getTransferStatusColorClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-accent-warning'
    case 'approved':
    case 'in_transit':
      return 'text-accent-approved'
    case 'completed':
      return 'text-paper-dark'
    case 'rejected':
    case 'cancelled':
      return 'text-accent-critical'
    default:
      return 'text-paper-dark/40'
  }
}

function getTransferTypeBadge(type: string): string {
  switch (type) {
    case 'resources':
      return 'RECURSOS'
    case 'people':
      return 'PERSONAS'
    case 'both':
      return 'MIXTO'
    default:
      return type.toUpperCase()
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
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const campId = user?.camp_id ?? ''

  // ── Local UI state ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'origin' | 'destination'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  // New transfer form
  const [destCampId, setDestCampId] = useState('')
  const [transferType, setTransferType] = useState<'resources' | 'people' | 'both'>('resources')
  const [notes, setNotes] = useState('')
  const [travelDays, setTravelDays] = useState(1)
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([])
  const [selectedPersons, setSelectedPersons] = useState<SelectedPerson[]>([])

  // ── React Query ──────────────────────────────────────────────────────────
  const {
    data: transfers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transfers', campId],
    queryFn: () => getCampTransfers(campId),
    enabled: !!campId,
  })

  useEffect(() => {
    if (!token) return

    const socket = io('http://localhost:3000', {
      auth: { token }
    })

    socket.on('transfer.requested', () => {
      refetch()
    })

    return () => {
      socket.disconnect()
    }
  }, [token, refetch])

  const { data: personsData } = useQuery({
    queryKey: ['persons', campId],
    queryFn: () => getPersons({ campId }),
    enabled: !!campId && isNewModalOpen,
  })
  const persons: Person[] = personsData?.data ?? []

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ['inventory', campId],
    queryFn: () => getInventory(campId),
    enabled: !!campId && isNewModalOpen,
  })

  const createMutation = useMutation({
    mutationFn: createTransferRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transfers', campId] })
      resetForm()
      setIsNewModalOpen(false)
    },
    onError: () => setFormError('Error al crear el traslado. Intente nuevamente.'),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelTransfer(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['transfers', campId] }),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmTransferArrival(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['transfers', campId] }),
  })

  // ── Derived state ────────────────────────────────────────────────────────
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.camp_origin_id.toLowerCase().includes(search.toLowerCase()) ||
        t.camp_destination_id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesRole =
        roleFilter === 'all' ||
        (roleFilter === 'origin' && t.camp_origin_id === campId) ||
        (roleFilter === 'destination' && t.camp_destination_id === campId)
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
      pending: transfers.filter((t) => t.status === 'pending').length,
      inTransit: transfers.filter((t) => t.status === 'in_transit' || t.status === 'approved')
        .length,
      sent: transfers.filter((t) => t.camp_origin_id === campId).length,
      received: transfers.filter((t) => t.camp_destination_id === campId).length,
    }),
    [transfers, campId]
  )

  // ── Handlers ─────────────────────────────────────────────────────────────
  function resetForm() {
    setDestCampId('')
    setTransferType('resources')
    setNotes('')
    setTravelDays(1)
    setSelectedResources([])
    setSelectedPersons([])
    setFormError('')
  }

  function handleCreateTransfer(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!destCampId.trim()) {
      setFormError('Ingrese el ID del campamento destino.')
      return
    }
    if (destCampId === campId) {
      setFormError('El campamento destino no puede ser el mismo que el origen.')
      return
    }
    if (
      (transferType === 'resources' || transferType === 'both') &&
      selectedResources.length === 0
    ) {
      setFormError('Seleccione al menos un recurso para transferir.')
      return
    }
    if ((transferType === 'people' || transferType === 'both') && selectedPersons.length === 0) {
      setFormError('Seleccione al menos una persona para transferir.')
      return
    }

    createMutation.mutate({
      camp_origin_id: campId,
      camp_destination_id: destCampId,
      type: transferType,
      notes: notes || undefined,
      travel_days: travelDays,
      resource_details:
        transferType !== 'people'
          ? selectedResources.map((r) => ({
            resource_id: r.resource_id,
            requested_quantity: r.requested_quantity,
          }))
          : undefined,
      person_details:
        transferType !== 'resources'
          ? selectedPersons.map((p) => ({ person_id: p.person_id }))
          : undefined,
    })
  }

  function handleCancelTransfer(id: string) {
    if (window.confirm('¿Confirmar la cancelación de este traslado?')) {
      cancelMutation.mutate(id)
    }
  }

  function handleConfirmArrival(id: string) {
    if (window.confirm('¿Confirmar la llegada de este traslado?')) {
      confirmMutation.mutate(id)
    }
  }

  function handleToggleResource(resourceId: string) {
    const exists = selectedResources.find((r) => r.resource_id === resourceId)
    if (exists) {
      setSelectedResources(selectedResources.filter((r) => r.resource_id !== resourceId))
    } else {
      setSelectedResources([...selectedResources, { resource_id: resourceId, requested_quantity: 1 }])
    }
  }

  function handleResourceQtyChange(resourceId: string, qty: number) {
    setSelectedResources(
      selectedResources.map((r) =>
        r.resource_id === resourceId ? { ...r, requested_quantity: Math.max(1, qty) } : r
      )
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
  if (isLoading) {
    return (
      <div className="travelmanager-page-content flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-warning" />
        <span className="ml-3 font-mono text-xs uppercase text-paper-dark">
          Cargando traslados...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="travelmanager-page-content">
        <div className="warning-card p-4 font-mono text-xs text-accent-critical uppercase">
          Error al cargar traslados. Verifique la conexión con el servidor.
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden bg-bunker-bg">
      {/* ── Vista Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-industrial-metal p-4 border-l-4 border-l-accent-approved shrink-0 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-accent-approved/10 p-2 border border-accent-approved/30">
            <ArrowLeftRight className="h-6 w-6 text-accent-approved" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-bg-paper text-ink-soft text-[7px] font-mono font-black uppercase rotate-1 shadow-sm border border-bg-paper-shadow/30">
                Nivel_Acceso_02
              </span>
              <span className="text-[7px] font-mono text-accent-approved/40 uppercase tracking-widest font-black">
                SCTR_TRASLADOS
              </span>
            </div>
            <h2 className="text-xl font-typewriter font-black text-white uppercase tracking-tight leading-none">
              <span className="text-accent-approved/40">/</span> GESTIÓN DE TRASLADOS
            </h2>
          </div>
        </div>

        {/* Stats summary */}
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <div className="flex gap-4 border-r border-white/10 pr-6">
            {[
              { label: 'Pendientes', count: stats.pending, color: 'text-accent-warning' },
              { label: 'En Tránsito', count: stats.inTransit, color: 'text-accent-approved' },
              { label: 'Enviados', count: stats.sent, color: 'text-paper-dark' },
              { label: 'Recibidos', count: stats.received, color: 'text-paper-dark' },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center px-2">
                <span className={`text-lg font-mono font-black ${s.color}`}>{s.count}</span>
                <span className="text-[8px] font-mono font-bold uppercase tracking-tighter text-white/40">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="bg-accent-approved text-white px-6 py-2.5 text-[11px] font-mono font-black uppercase hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center gap-2 border-b-2 border-r-2 border-black/20"
          >
            <Plus className="h-3.5 w-3.5" /> NUEVO TRASLADO
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-hidden px-4 pb-4">
        {/* ── Filtros ── */}
        <div className="flex flex-wrap gap-3 shrink-0 items-center bg-industrial-metal/60 p-2 border border-white/5">
          <div className="relative w-full md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              type="text"
              placeholder="Buscar por ID o campamento..."
              className="vintage-input w-full pl-9 text-[10px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-accent-warning/10 px-3 py-1">
            <Filter className="h-3 w-3 text-white/20" />
            <span className="text-[8px] font-mono text-white/30 uppercase font-black">Estado:</span>
            <select
              className="bg-transparent text-[9px] font-mono text-accent-warning font-black focus:outline-none uppercase"
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
          <div className="flex items-center gap-2 bg-black/40 border border-accent-warning/10 px-3 py-1">
            <span className="text-[8px] font-mono text-white/30 uppercase font-black">Rol:</span>
            <select
              className="bg-transparent text-[9px] font-mono text-accent-warning font-black focus:outline-none uppercase"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'origin' | 'destination')}
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
          <div className="w-[300px] flex flex-col gap-2 shrink-0 overflow-hidden bg-industrial-metal p-3 border-l-2 border-l-accent-approved/40">
            <div className="flex items-center justify-between px-1 mb-1 border-b border-accent-approved/10 pb-2">
              <span className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest">
                Registro de Traslados
              </span>
              <span className="text-[8px] font-mono font-black text-white/20 uppercase">
                {filteredTransfers.length} REG
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
                      className={`w-full text-left p-3 relative transition-all border border-accent-approved/10 ${selectedTransfer?.id === transfer.id
                          ? 'bg-bg-paper shadow-xl scale-[1.02] z-10'
                          : 'bg-accent-approved/5 hover:bg-accent-approved/10 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[7px] font-mono font-black uppercase px-1.5 py-0.5 ${isOrigin
                              ? 'bg-accent-warning/20 text-accent-warning'
                              : 'bg-accent-approved/20 text-accent-approved'
                            }`}
                        >
                          {isOrigin ? '↑ ENVIADO' : '↓ RECIBIDO'}
                        </span>
                        <span
                          className={`text-[7px] font-mono font-black uppercase ${selectedTransfer?.id === transfer.id
                              ? 'text-ink-soft/50'
                              : 'text-white/30'
                            }`}
                        >
                          {getTransferTypeBadge(transfer.type)}
                        </span>
                      </div>

                      <div
                        className={`text-[11px] font-typewriter font-black uppercase leading-tight mb-1 ${selectedTransfer?.id === transfer.id ? 'text-ink' : 'text-accent-approved'
                          }`}
                      >
                        {isOrigin
                          ? `→ ${transfer.camp_destination_id}`
                          : `← ${transfer.camp_origin_id}`}
                      </div>

                      <p
                        className={`text-[8px] font-mono uppercase truncate ${selectedTransfer?.id === transfer.id ? 'text-ink/60' : 'text-white/30'
                          }`}
                      >
                        REF: {transfer.id.slice(0, 8).toUpperCase()}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2">
                        <div
                          className={`h-2 w-2 rounded-full border border-black/10 ${transfer.status === 'in_transit' || transfer.status === 'approved'
                              ? 'bg-accent-approved animate-pulse'
                              : transfer.status === 'pending'
                                ? 'bg-accent-warning'
                                : transfer.status === 'rejected' || transfer.status === 'cancelled'
                                  ? 'bg-accent-critical'
                                  : 'bg-black/20'
                            }`}
                        />
                        <span
                          className={`text-[8px] font-mono font-black uppercase tracking-widest ${selectedTransfer?.id === transfer.id
                              ? getTransferStatusColorClass(transfer.status)
                              : 'text-white/20'
                            }`}
                        >
                          {getTransferStatusLabel(transfer.status)}
                        </span>
                      </div>

                      {selectedTransfer?.id === transfer.id && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-accent-approved" />
                      )}
                    </motion.button>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive className="h-10 w-10 text-accent-approved/10 mb-4" />
                  <p className="text-[10px] font-mono text-white/30 uppercase leading-relaxed font-black mb-3">
                    Sin traslados para esta consulta
                  </p>
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="px-4 py-2 border border-accent-approved/30 text-xs font-mono font-bold text-accent-approved hover:bg-accent-approved/10 transition-colors uppercase"
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
                    <span className="text-[8px] font-mono font-black text-accent-approved uppercase tracking-[0.3em] block mb-0.5">
                      Orden de Traslado #{selectedTransfer.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-typewriter text-white font-black uppercase text-lg">
                        {selectedTransfer.camp_origin_id}
                      </span>
                      <ArrowLeftRight className="h-5 w-5 text-accent-approved" />
                      <span className="font-typewriter text-white font-black uppercase text-lg">
                        {selectedTransfer.camp_destination_id}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 border inline-flex items-center gap-1.5 ${selectedTransfer.status === 'in_transit' ||
                        selectedTransfer.status === 'approved'
                        ? 'bg-accent-approved/10 border-accent-approved/30 text-accent-approved'
                        : selectedTransfer.status === 'pending'
                          ? 'bg-accent-warning/10 border-accent-warning/30 text-accent-warning'
                          : 'bg-white/5 border-white/10 text-white/40'
                      }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${selectedTransfer.status === 'in_transit' ||
                          selectedTransfer.status === 'approved'
                          ? 'bg-accent-approved animate-pulse'
                          : selectedTransfer.status === 'pending'
                            ? 'bg-accent-warning animate-pulse'
                            : 'bg-white/40'
                        }`}
                    />
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest">
                      {getTransferStatusLabel(selectedTransfer.status)}
                    </span>
                  </div>
                </div>

                {/* Transfer info grid */}
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">
                      Tipo de Carga
                    </p>
                    <p className="font-typewriter text-white font-black uppercase">
                      {getTransferTypeBadge(selectedTransfer.type)}
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">
                      Días de Viaje
                    </p>
                    <p className="font-typewriter text-white font-black">
                      {selectedTransfer.travel_days ?? '—'} días
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">
                      Fecha de Solicitud
                    </p>
                    <p className="font-mono text-white text-sm">
                      {new Date(selectedTransfer.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-sm">
                    <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">
                      Última Actualización
                    </p>
                    <p className="font-mono text-white text-sm">
                      {new Date(selectedTransfer.updated_at).toLocaleString()}
                    </p>
                  </div>

                  {selectedTransfer.notes && (
                    <div className="col-span-2 glass-panel p-4 rounded-sm">
                      <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest mb-1">
                        Notas
                      </p>
                      <p className="font-mono text-white/80 text-sm">{selectedTransfer.notes}</p>
                    </div>
                  )}

                  {/* Approval info */}
                  {selectedTransfer.approvals && selectedTransfer.approvals.length > 0 ? (
                    <div className="col-span-2 glass-panel p-4 rounded-sm border border-accent-approved/20">
                      <p className="text-[8px] font-mono text-accent-approved uppercase tracking-widest mb-2">
                        Decisiones de Aprobación
                      </p>
                      <div className="flex flex-col gap-2">
                        {selectedTransfer.approvals.map((app, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span
                              className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 ${app.status === 'approved'
                                  ? 'bg-accent-approved/20 text-accent-approved'
                                  : 'bg-accent-critical/20 text-accent-critical'
                                }`}
                            >
                              {app.status === 'approved' ? 'APROBADO' : 'RECHAZADO'}
                            </span>
                            <span className="font-mono text-white/60 text-[10px]">
                              {app.user?.username || 'Sistema'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 glass-panel p-4 rounded-sm">
                      <p className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">Esperando Aprobación</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="p-4 border-t border-accent-approved/10 flex gap-2 mt-auto">
                  {selectedTransfer.status === 'pending' &&
                    selectedTransfer.camp_origin_id === campId && (
                      <button
                        onClick={() => handleCancelTransfer(selectedTransfer.id)}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-accent-critical/10 border border-accent-critical/30 text-accent-critical text-[9px] font-mono font-black uppercase hover:bg-accent-critical hover:text-white transition-all disabled:opacity-50"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Cancelar Traslado
                      </button>
                    )}
                  {selectedTransfer.status === 'in_transit' &&
                    selectedTransfer.camp_destination_id === campId && (
                      <button
                        onClick={() => handleConfirmArrival(selectedTransfer.id)}
                        disabled={confirmMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-accent-approved text-white text-[9px] font-mono font-black uppercase hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {confirmMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        Confirmar Llegada
                      </button>
                    )}
                  {(selectedTransfer.status === 'completed' ||
                    selectedTransfer.status === 'rejected' ||
                    selectedTransfer.status === 'cancelled') && (
                      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                        <Archive className="h-3 w-3" />
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
                <p className="font-mono text-[10px] text-white/20 uppercase tracking-widest">
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
              className="bg-industrial-metal border border-accent-approved/30 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-accent-approved/20 bg-black/30">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="h-5 w-5 text-accent-approved" />
                  <h3 className="font-typewriter font-black text-white uppercase text-lg">
                    Nueva Solicitud de Traslado
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsNewModalOpen(false)
                    resetForm()
                  }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleCreateTransfer} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-5">
                  {/* Origin indicator */}
                  <div className="bg-black/40 border border-white/5 px-4 py-3 flex items-center gap-3">
                    <span className="text-[8px] font-mono text-white/30 uppercase font-black">
                      Campamento Origen:
                    </span>
                    <span className="font-mono font-black text-accent-approved uppercase">
                      {campId}
                    </span>
                    <span className="text-white/20">→</span>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest block mb-1">
                      ID Campamento Destino *
                    </label>
                    <input
                      type="text"
                      value={destCampId}
                      onChange={(e) => setDestCampId(e.target.value)}
                      placeholder="Ej: camp-002"
                      className="vintage-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest block mb-1">
                        Tipo de Traslado *
                      </label>
                      <select
                        value={transferType}
                        onChange={(e) =>
                          setTransferType(e.target.value as 'resources' | 'people' | 'both')
                        }
                        className="vintage-input w-full"
                      >
                        <option value="resources">RECURSOS</option>
                        <option value="people">PERSONAS</option>
                        <option value="both">MIXTO (AMBOS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest block mb-1">
                        Días de Viaje
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={travelDays}
                        onChange={(e) => setTravelDays(Number(e.target.value))}
                        className="vintage-input w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest block mb-1">
                      Notas / Motivo
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Razón del traslado, instrucciones especiales..."
                      rows={2}
                      className="vintage-input w-full resize-none"
                    />
                  </div>

                  {/* Resources section */}
                  {(transferType === 'resources' || transferType === 'both') && (
                    <div>
                      <label className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest block mb-2">
                        Recursos a Transferir * ({selectedResources.length} seleccionado(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-accent-approved/10 p-2 bg-black/20">
                        {inventory.length === 0 ? (
                          <p className="text-[9px] font-mono text-white/30 uppercase text-center py-4">
                            Cargando inventario...
                          </p>
                        ) : (
                          inventory
                            .filter((item) => item.current_quantity > 0)
                            .map((item) => {
                              const sel = selectedResources.find(
                                (r) => r.resource_id === item.resource_id
                              )
                              const isSelected = !!sel
                              return (
                                <div
                                  key={item.resource_id}
                                  className={`flex items-center justify-between p-2 border transition-all ${isSelected
                                      ? 'bg-accent-approved/10 border-accent-approved/30'
                                      : 'bg-black/20 border-white/5'
                                    }`}
                                >
                                  <div
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                    onClick={() => handleToggleResource(item.resource_id)}
                                  >
                                    <div
                                      className={`h-3 w-3 border flex items-center justify-center shrink-0 ${isSelected
                                          ? 'border-accent-approved bg-accent-approved/20'
                                          : 'border-white/20'
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
                                        <span className="text-[10px] font-mono font-black text-white/80 uppercase">{item.resource!.name}</span>
                                        <span className="text-[8px] font-mono text-white/40 uppercase">{item.resource!.category} // {item.current_quantity} {item.resource!.unit}</span>
                                      </div>
                                    </div>
                                  </div>
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
                                          Number(e.target.value)
                                        )
                                      }
                                      className="vintage-input w-16 text-[10px] ml-2"
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
                  {(transferType === 'people' || transferType === 'both') && (
                    <div>
                      <label className="text-[9px] font-mono font-black text-accent-approved uppercase tracking-widest block mb-2">
                        Personas a Transferir * ({selectedPersons.length} seleccionada(s))
                      </label>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 border border-accent-approved/10 p-2 bg-black/20">
                        {persons.length === 0 ? (
                          <p className="text-[9px] font-mono text-white/30 uppercase text-center py-4">
                            Cargando personas...
                          </p>
                        ) : (
                          persons
                            .filter(
                              (p) =>
                                p.status === 'active' ||
                                p.status === 'idle' ||
                                p.status === 'resting'
                            )
                            .map((person) => {
                              const isSelected = selectedPersons.some(
                                (p) => p.person_id === person.id
                              )
                              return (
                                <div
                                  key={person.id}
                                  onClick={() => handleTogglePerson(person.id)}
                                  className={`flex items-center gap-2 p-2 border cursor-pointer transition-all ${isSelected
                                      ? 'bg-accent-approved/10 border-accent-approved/30'
                                      : 'bg-black/20 border-white/5 hover:border-accent-approved/20'
                                    }`}
                                >
                                  <div
                                    className={`h-3 w-3 border flex items-center justify-center shrink-0 ${isSelected
                                        ? 'border-accent-approved bg-accent-approved/20'
                                        : 'border-white/20'
                                      }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-2 w-2 text-accent-approved" />
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-white/80 uppercase">
                                    {person.first_name} {person.last_name}
                                  </span>
                                  {person.profession && (
                                    <span className="text-[8px] font-mono text-white/30">
                                      [{person.profession.name}]
                                    </span>
                                  )}
                                </div>
                              )
                            })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {formError && (
                    <div className="flex items-center gap-2 text-accent-critical text-[10px] font-mono uppercase bg-accent-critical/10 border border-accent-critical/30 p-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {formError}
                    </div>
                  )}
                </div>

                {/* Modal footer */}
                <div className="p-4 border-t border-accent-approved/20 flex justify-end gap-3 bg-black/20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewModalOpen(false)
                      resetForm()
                    }}
                    className="px-4 py-2 text-[10px] font-mono font-black text-white/50 uppercase border border-white/10 hover:border-white/30 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-6 py-2 bg-accent-approved text-white text-[10px] font-mono font-black uppercase hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
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

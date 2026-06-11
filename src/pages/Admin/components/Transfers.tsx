import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, ArrowRight, Check, Truck, X } from "lucide-react"
import { useMemo, useState } from "react"

import { useCamp } from "../context/CampContext"

import type { ApprovalBody } from "@/features/transfers/services/transfers.service"
import type { IntercampRequest } from "@/types/api.types"

import { TransferRouteMap } from "@/features/map-test/components/TransferRouteMap"
import {
  approveOrRejectTransfer,
  cancelTransfer,
  confirmTransferArrival,
  getCampTransfers,
} from "@/features/transfers/services/transfers.service"
import "./Transfers.css"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type TransferView = {
  id: string
  statusKey: string
  status: string
  origin: string
  dest: string
  type: string
  resources: string[]
  people: string[]
  date: string
  notes: string | null
  raw: IntercampRequest
}

type ModalType = "approve" | "reject" | null

const TYPE_LABELS: Record<string, string> = {
  resources: "RECURSOS",
  people: "PERSONAS",
  both: "RECURSOS + PERSONAS",
}

const STATUS_LABELS: Record<string, string> = {
  ALL: "TODOS",
  pending: "PENDIENTE",
  approved: "APROBADO",
  completed: "COMPLETADO",
  rejected: "RECHAZADO",
  cancelled: "CANCELADO",
  in_transit: "EN TRÁNSITO",
}

const STATUS_BORDER: Record<string, string> = {
  pending: "#c27c2f",
  approved: "#4c6351",
  in_transit: "#4c6351",
  completed: "#5a5040",
  rejected: "#9c2720",
  cancelled: "#555",
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-[#c27c2f] text-black",
  approved: "bg-[#4c6351] text-white",
  in_transit: "bg-[#4c6351] text-white",
  completed: "bg-[#5a5040] text-[#e8dcc8]",
  rejected: "bg-[#9c2720] text-white",
  cancelled: "bg-[#555] text-white",
}

const DEFAULT_COORDS: [number, number] = [9.9281, -84.0907]

const formatDate = (value?: string) => {
  if (!value) return "N/D"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().split("T")[0]
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Transfers() {
  const { activeCampId, camps, isLoading: campsLoading } = useCamp()

  const [filterRole, setFilterRole] = useState<"ALL" | "origin" | "destination">("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [selectedTransfer, setSelectedTransfer] = useState<TransferView | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const campById = useMemo(() => new Map(camps.map((c) => [c.id, c.name])), [camps])

  const {
    data: transfers = [],
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["adminTransfers", activeCampId],
    queryFn: async () => {
      if (!activeCampId) return []
      return await getCampTransfers(activeCampId)
    },
    enabled: !!activeCampId,
    staleTime: 1000 * 60 * 2,
  })

  const isLoading = campsLoading || (queryLoading && transfers.length === 0)

  const queryClient = useQueryClient()
  const reload = () => queryClient.invalidateQueries({ queryKey: ["adminTransfers", activeCampId] })

  // Mapeo de datos crudos → vista
  const mappedTransfers = useMemo<TransferView[]>(
    () =>
      transfers.map((t) => {
        const statusKey = (t.status ?? "").toLowerCase().replace(/\s+/g, "_")
        const resourceLines =
          t.resourceDetails?.map((d) => {
            const name = d.resource?.name ?? `Recurso #${d.resource_id}`
            return `${name} × ${d.requested_quantity}`
          }) ?? []
        const peopleLines =
          t.personDetails?.map((d) => {
            const person = d.person
            const fullName = person
              ? [person.first_name, person.last_name].filter(Boolean).join(" ").trim()
              : ""
            const base = fullName || `Persona #${d.person_id}`
            return d.is_leader ? `${base} (Líder)` : base
          }) ?? []
        return {
          id: t.id,
          statusKey,
          status: STATUS_LABELS[statusKey] ?? t.status,
          origin: campById.get(t.camp_origin_id) ?? t.camp_origin_id,
          dest: campById.get(t.camp_destination_id) ?? t.camp_destination_id,
          type: TYPE_LABELS[t.type?.toLowerCase() ?? ""] ?? t.type?.toUpperCase() ?? "N/D",
          resources: resourceLines,
          people: peopleLines,
          date: formatDate(t.request_date),
          notes: t.notes,
          raw: t,
        }
      }),
    [transfers, campById],
  )

  // Filtros
  const filteredTransfers = useMemo(
    () =>
      mappedTransfers.filter((t) => {
        const isOrigin = t.raw.camp_origin_id === activeCampId
        const isDest = t.raw.camp_destination_id === activeCampId
        const matchRole =
          filterRole === "ALL" ||
          (filterRole === "origin" && isOrigin) ||
          (filterRole === "destination" && isDest)
        const matchStatus = filterStatus === "ALL" || t.statusKey === filterStatus
        return matchRole && matchStatus
      }),
    [mappedTransfers, filterRole, filterStatus, activeCampId],
  )

  // ─── Acciones ──────────────────────────────────────────────────────────────

  const closeModal = () => {
    setActiveModal(null)
    setSelectedTransfer(null)
    setFormError("")
    setFormNotes("")
  }

  const openApprove = (t: TransferView) => {
    setSelectedTransfer(t)
    setFormNotes("")
    setFormError("")
    setActiveModal("approve")
  }

  const openReject = (t: TransferView) => {
    setSelectedTransfer(t)
    setFormNotes("")
    setFormError("")
    setActiveModal("reject")
  }

  const handleApprove = async () => {
    if (!selectedTransfer) return
    setIsSaving(true)
    setFormError("")
    try {
      const body: ApprovalBody = { status: "approved", notes: formNotes.trim() || undefined }
      await approveOrRejectTransfer(selectedTransfer.id, body)
      closeModal()
      reload()
    } catch {
      setFormError("No se pudo aprobar el traslado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReject = async () => {
    if (!selectedTransfer) return
    setIsSaving(true)
    setFormError("")
    try {
      const body: ApprovalBody = { status: "rejected", notes: formNotes.trim() || undefined }
      await approveOrRejectTransfer(selectedTransfer.id, body)
      closeModal()
      reload()
    } catch {
      setFormError("No se pudo rechazar el traslado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = async (t: TransferView) => {
    setIsSaving(true)
    try {
      await cancelTransfer(t.id)
      reload()
    } catch {
      // silently fail — user will see no change and can retry
    } finally {
      setIsSaving(false)
    }
  }

  const handleArrive = async (t: TransferView) => {
    setIsSaving(true)
    try {
      await confirmTransferArrival(t.id)
      reload()
    } catch {
      // silently fail
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#c27c2f] pb-5">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider">
            MANIFIESTOS DE TRANSPORTE
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
            ADMINISTRACIÓN CENTRAL · TODOS LOS CAMPAMENTOS
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4">
        {/* Filtro de rol */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "ALL", label: "TODOS LOS CONVOYES" },
            { key: "origin", label: "ENVIAMOS (ORIGEN)" },
            { key: "destination", label: "RECIBIMOS (DESTINO)" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterRole(opt.key as "ALL" | "origin" | "destination")}
              className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider border-2 cursor-pointer transition-all ${
                filterRole === opt.key
                  ? "bg-[#c27c2f] text-white border-[#c27c2f] shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                  : "bg-transparent border-[#9a8a74]/60 text-[#c8bfae] hover:border-[#c27c2f] hover:text-[#fca311]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filtro de estado */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "pending", "approved", "in_transit", "completed", "rejected", "cancelled"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 font-mono text-xs uppercase border-2 cursor-pointer transition-all ${
                  filterStatus === st
                    ? "bg-[#c27c2f] text-white border-[#c27c2f] shadow-[2px_2px_0_rgba(0,0,0,0.6)] font-bold"
                    : "bg-transparent border-[#9a8a74]/60 text-[#c8bfae] hover:border-[#c27c2f] hover:text-[#fca311]"
                }`}
              >
                {STATUS_LABELS[st] ?? st}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ESTADO DE CARGA / ERROR */}
      {queryError ? (
        <div className="flex items-center gap-2 text-[#9c2720] font-mono text-sm border border-[#9c2720]/40 bg-[#9c2720]/10 px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          No se pudieron cargar los manifiestos.
        </div>
      ) : null}

      {/* LISTA */}
      {isLoading ? (
        <div className="col-span-full text-center py-20 border-2 border-dashed border-[#9a8a74]/30">
          <Truck className="w-12 h-12 text-[#6e5f4d] mx-auto mb-4 animate-pulse" />
          <p className="font-typewriter text-base text-[#9a8a74] uppercase font-bold">
            CALIBRANDO FRECUENCIAS...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTransfers.length === 0 ? (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-[#9a8a74]/30">
              <Truck className="w-12 h-12 text-[#6e5f4d] mx-auto mb-4 animate-pulse" />
              <p className="font-typewriter text-base text-[#9a8a74] uppercase font-bold">
                SIN CONVOYES EN LA COLA
              </p>
              <p className="font-mono text-sm text-[#6e5f4d] mt-2 uppercase">
                AJUSTE LOS FILTROS O CAMBIE EL CAMPAMENTO ACTIVO.
              </p>
            </div>
          ) : (
            filteredTransfers.map((t) => {
              const isOrigin = t.raw.camp_origin_id === activeCampId

              const originCampObj = camps.find((c) => c.id === t.raw.camp_origin_id)
              const destCampObj = camps.find((c) => c.id === t.raw.camp_destination_id)

              const originCoords: [number, number] =
                originCampObj?.latitude != null && originCampObj?.longitude != null
                  ? [Number(originCampObj.latitude), Number(originCampObj.longitude)]
                  : DEFAULT_COORDS
              const destCoords: [number, number] =
                destCampObj?.latitude != null && destCampObj?.longitude != null
                  ? [Number(destCampObj.latitude), Number(destCampObj.longitude)]
                  : DEFAULT_COORDS

              const borderColor = STATUS_BORDER[t.statusKey] ?? "#555"

              return (
                <div
                  key={t.id}
                  className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] flex flex-col"
                  style={{ borderLeft: `6px solid ${borderColor}` }}
                >
                  {/* CABECERA DE CARD */}
                  <div className="flex justify-between items-start p-6 pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-bold text-black/40 uppercase tracking-widest">
                        TRASLADO #{t.id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`font-typewriter text-xs font-bold px-3 py-1.5 uppercase border-2 border-black self-start ${STATUS_BADGE[t.statusKey] ?? "bg-[#555] text-white"}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs text-black/50 uppercase">
                      <div>{t.type}</div>
                      <div className="mt-1 text-[10px]">{t.date}</div>
                    </div>
                  </div>

                  {/* RUTA */}
                  <div className="mx-6 mb-2 flex items-center gap-3 bg-black/10 border border-black/15 px-4 py-3">
                    <span className="font-typewriter text-sm font-bold text-black truncate">
                      {t.origin}
                    </span>
                    <ArrowRight className="w-5 h-5 text-black/50 shrink-0" />
                    <span className="font-typewriter text-sm font-bold text-black truncate text-right">
                      {t.dest}
                    </span>
                  </div>

                  {/* MINI-MAPA */}
                  {}
                  <div
                    className="mx-6 mb-3 wv-transfer-minimap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TransferRouteMap
                      fromCoords={originCoords}
                      toCoords={destCoords}
                      fromName={t.origin}
                      toName={t.dest}
                    />
                  </div>

                  {/* CARGA / PASAJEROS */}
                  <div className="px-6 flex flex-col gap-3 flex-1">
                    {t.resources.length > 0 ? (
                      <div>
                        <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                          CARGA
                        </span>
                        <div className="font-typewriter text-sm font-bold text-black">
                          {t.resources.join(" · ")}
                        </div>
                      </div>
                    ) : null}
                    {t.people.length > 0 ? (
                      <div>
                        <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                          PASAJEROS
                        </span>
                        <div className="font-typewriter text-sm font-bold text-black">
                          {t.people.join(", ")}
                        </div>
                      </div>
                    ) : null}
                    {t.notes ? (
                      <p className="font-mono text-sm text-black/60 italic">* {t.notes}</p>
                    ) : null}
                  </div>

                  {/* ACCIONES */}
                  <div className="border-t-2 border-black/15 p-6 pt-4 mt-4 flex flex-col gap-2">
                    {/* Pendiente + somos destino → APROBAR / RECHAZAR */}
                    {t.statusKey === "pending" && !isOrigin ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => openApprove(t)}
                          className="flex-1 bg-[#4c6351] text-white py-3 px-4 hover:bg-[#3b4d3e] cursor-pointer font-typewriter text-sm font-bold uppercase border-2 border-black flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          APROBAR
                        </button>
                        <button
                          onClick={() => openReject(t)}
                          className="bg-red-800 hover:bg-red-700 text-white py-3 px-4 cursor-pointer border-2 border-black flex items-center gap-2 font-typewriter text-sm font-bold uppercase"
                        >
                          <X className="w-4 h-4" />
                          RECHAZAR
                        </button>
                      </div>
                    ) : null}

                    {/* Pendiente + somos origen → CANCELAR */}
                    {t.statusKey === "pending" && isOrigin ? (
                      <button
                        onClick={() => void handleCancel(t)}
                        disabled={isSaving}
                        className="w-full bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white font-typewriter text-sm py-3 px-4 border-2 border-black cursor-pointer uppercase flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        CANCELAR SOLICITUD
                      </button>
                    ) : null}

                    {/* En tránsito/aprobado + somos destino → CONFIRMAR LLEGADA */}
                    {(t.statusKey === "in_transit" || t.statusKey === "approved") && !isOrigin ? (
                      <button
                        onClick={() => void handleArrive(t)}
                        disabled={isSaving}
                        className="w-full bg-[#c27c2f] hover:bg-[#df8120] disabled:opacity-50 text-black font-typewriter text-sm font-bold py-3 px-4 border-2 border-black cursor-pointer flex items-center justify-center gap-2 uppercase"
                      >
                        <Check className="w-4 h-4 shrink-0" />
                        CONFIRMAR LLEGADA
                      </button>
                    ) : null}

                    {/* En tránsito/aprobado + somos origen */}
                    {(t.statusKey === "in_transit" || t.statusKey === "approved") && isOrigin ? (
                      <div className="text-center py-3 bg-black/10 text-black/60 font-typewriter text-sm uppercase font-bold tracking-wider border-2 border-black/15">
                        CONVOY EN RUTA
                      </div>
                    ) : null}

                    {t.statusKey === "completed" ? (
                      <div className="text-center text-black/50 font-typewriter text-sm uppercase font-bold py-3 border-2 border-black/15">
                        ENTREGADO — ARCHIVADO
                      </div>
                    ) : null}

                    {t.statusKey === "rejected" ? (
                      <div className="text-center bg-[#9c2720]/15 text-[#9c2720] font-typewriter text-sm uppercase font-bold tracking-wider border-2 border-[#9c2720]/30 py-3">
                        TRASLADO RECHAZADO
                      </div>
                    ) : null}

                    {t.statusKey === "cancelled" ? (
                      <div className="text-center text-black/40 font-typewriter text-sm uppercase font-bold tracking-wider py-3">
                        — CONVOY CANCELADO —
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MODALES APROBAR / RECHAZAR */}
      <AnimatePresence>
        {(activeModal === "approve" || activeModal === "reject") && selectedTransfer ? (
          <motion.div
            key="action-modal"
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-zinc-950 border-4 border-[#c27c2f] max-w-md w-full p-6 text-white text-left font-mono shadow-[0_0_24px_rgba(194,124,47,0.25)]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b-2 border-[#c27c2f] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-amber-500 font-bold tracking-widest flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {activeModal === "approve" ? "APROBAR TRASLADO" : "RECHAZAR TRASLADO"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold"
                >
                  [X]
                </button>
              </div>

              <p className="font-mono text-xs text-zinc-400 uppercase mb-4">
                {selectedTransfer.origin} → {selectedTransfer.dest}
              </p>

              {formError ? (
                <div className="bg-red-950/40 border-l-4 border-red-500 p-3 mb-4 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-col gap-1 mb-5">
                <label
                  htmlFor="modal-notes"
                  className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                >
                  {activeModal === "approve"
                    ? "NOTAS DE APROBACIÓN (opcional)"
                    : "MOTIVO DE RECHAZO (opcional)"}
                </label>
                <textarea
                  id="modal-notes"
                  className="w-full bg-[#111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 focus:outline-none focus:border-[#c27c2f] h-20 resize-none"
                  placeholder={
                    activeModal === "approve"
                      ? "Condiciones o comentarios..."
                      : "Razón del rechazo..."
                  }
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 border-t border-zinc-900 pt-4">
                <button
                  onClick={closeModal}
                  className="bg-[#9a9080] hover:bg-[#ab9e8b] text-black text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black cursor-pointer"
                >
                  CANCELAR
                </button>
                {activeModal === "approve" ? (
                  <button
                    onClick={() => void handleApprove()}
                    disabled={isSaving}
                    className="flex-1 bg-[#4c6351] hover:bg-[#3b4d3e] disabled:opacity-50 text-white text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "APROBANDO..." : "CONFIRMAR APROBACIÓN"}
                  </button>
                ) : (
                  <button
                    onClick={() => void handleReject()}
                    disabled={isSaving}
                    className="flex-1 bg-red-800 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black cursor-pointer flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {isSaving ? "RECHAZANDO..." : "CONFIRMAR RECHAZO"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, ArrowRight, Check, Plus, Truck, X } from "lucide-react"
import { useState } from "react"

import type { Camp, Inventory, ResourceItem, Transfer, TransferStatus } from "../types"

interface TransfersViewProps {
  transfers: Transfer[]
  camps: Camp[]
  resources: ResourceItem[]
  inventory: Inventory[]
  myCampId: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateTransferRequest: (data: any) => Promise<void>
  onApproveTransferRequest: (id: number, approved: boolean) => Promise<void>
  onCancelTransferRequest: (id: number) => Promise<void>
  onArriveTransferRequest: (id: number) => Promise<void>
}

const STATUS_LABELS: Record<string, string> = {
  ALL: "VER TODOS",
  pending: "PENDIENTE",
  approved: "APROBADO",
  in_transit: "EN TRÁNSITO",
  completed: "COMPLETADO",
  rejected: "RECHAZADO",
  cancelled: "CANCELADO",
}

export default function TransfersView({
  transfers,
  camps,
  resources,
  inventory,
  myCampId,
  onCreateTransferRequest,
  onApproveTransferRequest,
  onCancelTransferRequest,
  onArriveTransferRequest,
}: TransfersViewProps) {
  const [filterRole, setFilterRole] = useState<"ALL" | "origin" | "destination">("ALL")
  const [filterStatus, setFilterStatus] = useState<TransferStatus | "ALL">("ALL")
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)

  // New Request Form Fields
  const [targetCampId, setTargetCampId] = useState<number>(2)
  const [direction, setDirection] = useState<"import" | "export">("import") // import = destination is us, export = origin is us
  const [selectedResourceId, setSelectedResourceId] = useState<number>(1)
  const [requestQty, setRequestQty] = useState<number>(50)
  const [notes, setNotes] = useState("")

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters logic
  const filteredTransfers = transfers.filter((t) => {
    // Role filter
    const isOrigin = t.origin_camp_id === myCampId
    const isDest = t.destination_camp_id === myCampId
    const matchRole =
      filterRole === "ALL" ||
      (filterRole === "origin" && isOrigin) ||
      (filterRole === "destination" && isDest)

    // Status filter
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus

    return matchRole && matchStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (requestQty <= 0) {
      setFormError("LA CANTIDAD SOLICITADA DEBE SER MAYOR A CERO.")
      return
    }

    // Set origin and destination ids based on direction
    const origin_camp_id = direction === "import" ? targetCampId : myCampId
    const destination_camp_id = direction === "import" ? myCampId : targetCampId

    if (origin_camp_id === destination_camp_id) {
      setFormError("LOS CAMPAMENTOS NO PUEDEN SER IDÉNTICOS.")
      return
    }

    // If exporting, check that our camp (origin) actually has the needed inventory!
    if (direction === "export") {
      const dbInv = inventory.find((i) => i.resource_id === selectedResourceId)
      if (!dbInv || dbInv.current_quantity < requestQty) {
        setFormError(
          `NIVELES DE STOCK INSUFICIENTES PARA AUTORIZAR EL ENVÍO (${dbInv?.current_quantity || 0} DISPONIBLES).`,
        )
        return
      }
    }

    try {
      setIsSubmitting(true)
      await onCreateTransferRequest({
        origin_camp_id,
        destination_camp_id,
        resource_id: selectedResourceId,
        quantity: requestQty,
        notes,
        requested_by_user_id: 77, // Simulated commander ID
      })

      // Clear Form and Close
      setRequestQty(50)
      setNotes("")
      setIsNewModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "FALLO EN EL REGISTRO DE TRASLADO.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 lg:p-10 flex flex-col gap-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#c27c2f] pb-6">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider">
            TRASLADOS INTER-CAMPAMENTOS
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
            CONVOYES DE ABASTECIMIENTO · BASES REHABILITADAS
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null)
            setIsNewModalOpen(true)
          }}
          className="bg-[#c27c2f] text-black font-typewriter text-sm font-bold uppercase py-3 px-6 border-2 border-black shadow-[3px_3px_0_#000] hover:bg-[#df8120] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          SOLICITAR TRASLADO
        </button>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col gap-4">
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
                  ? "bg-[#c27c2f] text-black border-black shadow-[2px_2px_0_#000]"
                  : "bg-transparent border-[#9a8a74]/50 text-[#9a8a74] hover:border-[#c27c2f] hover:text-[#fca311]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {["ALL", "pending", "approved", "in_transit", "completed", "rejected", "cancelled"].map(
            (st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st as TransferStatus | "ALL")}
                className={`px-3 py-1.5 font-mono text-xs uppercase border-2 cursor-pointer transition-all ${
                  filterStatus === st
                    ? "bg-[#e8dcc8] text-black border-black shadow-[2px_2px_0_#000] font-bold"
                    : "bg-transparent border-[#9a8a74]/40 text-[#9a8a74] hover:border-[#9a8a74] hover:text-[#c8bfae]"
                }`}
              >
                {STATUS_LABELS[st] ?? st}
              </button>
            ),
          )}
        </div>
      </div>

      {/* LISTA DE TRASLADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTransfers.length === 0 ? (
          <div className="col-span-full text-center py-20 border-2 border-dashed border-[#9a8a74]/30">
            <Truck className="w-12 h-12 text-[#6e5f4d] mx-auto mb-4 animate-pulse" />
            <p className="font-typewriter text-base text-[#9a8a74] uppercase font-bold">
              SIN CONVOYES EN LA COLA
            </p>
            <p className="font-mono text-sm text-[#6e5f4d] mt-2 uppercase">
              AJUSTE FILTROS O SOLICITE UN NUEVO TRASLADO.
            </p>
          </div>
        ) : (
          filteredTransfers.map((t) => {
            const isOriginUs = t.origin_camp_id === myCampId
            const resItem = resources.find((r) => r.id === t.resource_id)

            const originCampName =
              camps.find((c) => c.id === t.origin_camp_id)?.name || "BASE DESCONOCIDA"
            const destCampName =
              camps.find((c) => c.id === t.destination_camp_id)?.name || "BASE DESCONOCIDA"

            const borderColor =
              t.status === "pending"
                ? "#c27c2f"
                : t.status === "in_transit" || t.status === "approved"
                  ? "#4c6351"
                  : t.status === "completed"
                    ? "#5a5040"
                    : "#9c2720"

            return (
              <div
                key={t.id}
                className="bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] flex flex-col"
                style={{ borderLeft: `6px solid ${borderColor}` }}
              >
                {/* CABECERA */}
                <div className="flex justify-between items-start p-6 pb-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs font-bold text-black/40 uppercase tracking-widest">
                      TRASLADO #{t.id}
                    </span>
                    <span
                      className={`font-typewriter text-xs font-bold px-3 py-1.5 uppercase border-2 border-black self-start ${
                        t.status === "pending"
                          ? "bg-[#c27c2f] text-black"
                          : t.status === "in_transit" || t.status === "approved"
                            ? "bg-[#4c6351] text-white"
                            : t.status === "completed"
                              ? "bg-[#5a5040] text-[#e8dcc8]"
                              : "bg-[#9c2720] text-white"
                      }`}
                    >
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </div>
                  <div className="text-right font-mono text-xs text-black/50 uppercase">
                    {isOriginUs ? "ENVIAMOS" : "RECIBIMOS"}
                  </div>
                </div>

                {/* RUTA */}
                <div className="mx-6 mb-4 flex items-center gap-3 bg-black/10 border border-black/15 px-4 py-3">
                  <span className="font-typewriter text-sm font-bold text-black truncate">
                    {isOriginUs ? "NUESTRO BÚNKER" : originCampName}
                  </span>
                  <ArrowRight className="w-5 h-5 text-black/50 shrink-0" />
                  <span className="font-typewriter text-sm font-bold text-black truncate text-right">
                    {!isOriginUs ? "NUESTRO BÚNKER" : destCampName}
                  </span>
                </div>

                {/* RECURSO */}
                <div className="px-6 flex flex-col gap-3 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                        RECURSO
                      </span>
                      <span className="font-typewriter text-sm font-bold text-black uppercase">
                        {resItem?.name || t.resource?.name || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                        CANTIDAD
                      </span>
                      <span className="font-typewriter text-sm font-bold text-black">
                        {t.quantity} {resItem?.unit || t.resource?.unit || ""}
                      </span>
                    </div>
                  </div>
                  {t.notes && <p className="font-mono text-sm text-black/60 italic">* {t.notes}</p>}
                </div>

                {/* ACCIONES */}
                <div className="border-t-2 border-black/15 p-6 pt-4 mt-4">
                  {t.status === "pending" && !isOriginUs && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => onApproveTransferRequest(t.id, true)}
                        className="flex-1 bg-[#4c6351] text-white py-3 px-4 hover:bg-[#3b4d3e] cursor-pointer font-typewriter text-sm font-bold uppercase border-2 border-black flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        APROBAR
                      </button>
                      <button
                        onClick={() => onApproveTransferRequest(t.id, false)}
                        className="bg-red-800 hover:bg-red-700 text-white py-3 px-4 cursor-pointer border-2 border-black flex items-center gap-2 font-typewriter text-sm font-bold uppercase"
                      >
                        <X className="w-4 h-4" />
                        RECHAZAR
                      </button>
                    </div>
                  )}

                  {t.status === "pending" && isOriginUs && (
                    <button
                      onClick={() => onCancelTransferRequest(t.id)}
                      className="w-full bg-red-800 hover:bg-red-700 text-white font-typewriter text-sm py-3 px-4 border-2 border-black cursor-pointer uppercase flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      CANCELAR SOLICITUD
                    </button>
                  )}

                  {(t.status === "in_transit" || t.status === "approved") && !isOriginUs && (
                    <button
                      onClick={() => onArriveTransferRequest(t.id)}
                      className="w-full bg-[#c27c2f] hover:bg-[#df8120] text-black font-typewriter text-sm font-bold py-3 px-4 border-2 border-black cursor-pointer flex items-center justify-center gap-2 uppercase"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      CONFIRMAR LLEGADA
                    </button>
                  )}

                  {(t.status === "in_transit" || t.status === "approved") && isOriginUs && (
                    <div className="text-center py-3 bg-black/10 text-black/60 font-typewriter text-sm uppercase font-bold tracking-wider border-2 border-black/15">
                      CONVOY EN RUTA
                    </div>
                  )}

                  {t.status === "completed" && (
                    <div className="text-center text-black/50 font-typewriter text-sm uppercase font-bold py-3 border-2 border-black/15">
                      ENTREGADO — ARCHIVADO
                    </div>
                  )}

                  {t.status === "rejected" && (
                    <div className="text-center bg-[#9c2720]/15 text-[#9c2720] font-typewriter text-sm uppercase font-bold tracking-wider border-2 border-[#9c2720]/30 py-3">
                      TRASLADO RECHAZADO
                    </div>
                  )}

                  {t.status === "cancelled" && (
                    <div className="text-center text-black/40 font-typewriter text-sm uppercase font-bold tracking-wider py-3">
                      — CONVOY CANCELADO —
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL: SOLICITAR NUEVA TRANSFERENCIA INTER-CAMPAMENTO */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-4 border-[#c27c2f] max-w-md w-full p-6 text-white text-left font-mono shadow-[0_0_24px_rgba(194,124,47,0.25)] rounded-lg"
            >
              <div className="border-b-2 border-[#c27c2f] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-amber-500 font-bold tracking-widest flex items-center gap-2">
                  <Truck className="w-5 h-5 animate-bounce" />
                  CREAR HOJA DE TRASLADO PENDIENTE
                </h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold"
                >
                  [X]
                </button>
              </div>

              {formError && (
                <div className="bg-red-950/40 border-l-4 border-red-500 p-3 mb-4 text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Target Camp Selector */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="tr-camp"
                    className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                  >
                    CAMPAMENTO DE DESTINO
                  </label>
                  <select
                    id="tr-camp"
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                    value={targetCampId}
                    onChange={(e) => setTargetCampId(Number(e.target.value))}
                  >
                    {camps
                      .filter((c) => c.id !== myCampId)
                      .map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-zinc-950 text-white font-mono uppercase text-xs"
                        >
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Import Direction or Export Selection */}
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] text-[#ab9e8b] uppercase font-bold">
                    TIPO DE OPERACIÓN SOLICITADA
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setDirection("import")}
                      className={`p-2 font-mono text-xs uppercase font-bold border rounded transition-colors ${
                        direction === "import"
                          ? "bg-amber-500 text-black border-black"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-750"
                      }`}
                    >
                      SOLICITAR ENVÍO (IMPORTACIÓN)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("export")}
                      className={`p-2 font-mono text-xs uppercase font-bold border rounded transition-colors ${
                        direction === "export"
                          ? "bg-amber-500 text-black border-black"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-750"
                      }`}
                    >
                      REGISTRAR SUMINISTRO (EXPORTACIÓN)
                    </button>
                  </div>
                  <span className="text-[9px] text-[#ab9e8b]/70 block leading-3 mt-1 font-sans">
                    {direction === "import"
                      ? "* Solicita que el campamento seleccionado nos envíe un convoy."
                      : "* Suministramos desde el Refugio Alfa al campamento destino."}
                  </span>
                </div>

                {/* Resource Item Selector */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="tr-resource"
                      className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                    >
                      RECURSO
                    </label>
                    <select
                      id="tr-resource"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      value={selectedResourceId}
                      onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                    >
                      {resources.map((res) => (
                        <option
                          key={res.id}
                          value={res.id}
                          className="bg-zinc-950 text-white font-mono uppercase text-xs"
                        >
                          {res.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="tr-qty"
                      className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                    >
                      CANTIDAD DISPUESTA
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      min={10}
                      max={1000}
                      step={10}
                      value={requestQty}
                      onChange={(e) => setRequestQty(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Custom warning description helper if exporting */}
                {direction === "export" && (
                  <div className="p-2 bg-yellow-950/25 border border-yellow-500/30 text-[9.5px] text-yellow-400 rounded leading-3.5">
                    RECUERDE QUE LAS UNIDADES SE DESCONTARÁN DE NUESTRO ALMACÉN AL APROBAR O
                    DESPACHAR EL EMBARQUE.
                  </div>
                )}

                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="tr-notes"
                    className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                  >
                    MENSAJE DEL CANAL / NOTAS ADICIONALES
                  </label>
                  <textarea
                    id="tr-notes"
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors h-14 resize-none"
                    placeholder="MOTIVOS DE SUMINISTRO O DESTRUCCIÓN..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-zinc-900 pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#c27c2f] hover:bg-[#d68b38] text-black text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-sm"
                  >
                    {isSubmitting ? "REGISTRANDO OPERACIÓN..." : "MEMORIZAR TRASLADO"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="bg-[#9a9080] hover:bg-[#ab9e8b] text-black text-xs font-bold uppercase py-2.5 px-4 shadow-[2px_2px_0_#000] border border-black hover:translate-x-0.5 hover:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-sm"
                  >
                    RETORNAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

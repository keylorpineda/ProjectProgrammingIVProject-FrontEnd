/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from "react"
import { useEffect, useState } from "react"
import { api } from "../config/api"
import type { IntercampRequest } from "../types/api.types"
import { Truck, ShieldAlert, Plus, Archive, Mail, Send } from "lucide-react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"

interface ManagerLogisticsProps {
  campId: string
  onDataChanged: () => void
  refreshTrigger: number
}

export default function ManagerLogistics({
  campId,
  onDataChanged,
  refreshTrigger,
}: ManagerLogisticsProps) {
  const { data: requests = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ["managerLogistics", campId],
    queryFn: async () => {
      const res = await api.get(`/transfers/requests/camp/${campId}`)
      return res.data as IntercampRequest[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const [errorState, setErrorState] = useState<string | null>(null)
  const error = queryError ? (queryError as any).message || "Error al descargar bitácora de transferencias." : errorState

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  // New Request Modal state
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false)
  const [selectedResource, setSelectedResource] = useState<string>("Raciones de Emergencia (MRE)")
  const [requestAmount, setRequestAmount] = useState<number>(50)
  const [sourceBunker, setSourceBunker] = useState<string>("2")
  const [requestNotes, setRequestNotes] = useState<string>("")
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false)

  // Action Loading state
  const [actionId, setActionId] = useState<string | null>(null)

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (requestAmount <= 0) {
      setErrorState("Especifique una cantidad de carga superior a cero.")
      return
    }

    setSubmittingRequest(true)
    setErrorState(null)
    try {
      await api.post("/transfers/requests", {
        resource_type: selectedResource,
        amount: Number(requestAmount),
        camp_source_id: sourceBunker,
        camp_destination_id: campId,
        notes: requestNotes,
      })
      setShowRequestModal(false)
      setRequestNotes("")
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.message || "Fallo de enlace de solicitud.")
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleApproval = async (id: string, status: "approved" | "denied") => {
    setActionId(id)
    setErrorState(null)
    try {
      await api.patch(`/transfers/requests/${id}/approval`, { status })
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.message || "Fallo de respuesta de satélite.")
    } finally {
      setActionId(null)
    }
  }

  const handleArrive = async (id: string) => {
    setActionId(id)
    setErrorState(null)
    try {
      await api.patch(`/transfers/requests/${id}/arrive`)
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.message || "Error de descarga física del flete.")
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  // Filter requests to show incoming (to us) and outgoing (from us)
  const incomingRequests = requests.filter((r) => r.camp_destination_id === campId)
  const outgoingRequests = requests.filter((r) => r.camp_source_id === campId)

  const resourceTypes = [
    "Raciones de Emergencia (MRE)",
    "Agua Purificada de Filtro",
    "Antitoxinas y Antibióticos",
    "Munición Calibre 5.56mm",
    "Combustible Diésel (Generador)",
    "Acero de Refuerzo Bunker",
  ]

  const bunkerList = [
    { id: "1", name: "Bunker-Alpha" },
    { id: "2", name: "Bunker-Beta" },
    { id: "3", name: "Bunker-Delta" },
    { id: "4", name: "Bunker-Gamma" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* LOGISTICAL ACTION PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#1a1a1a] border-2 border-black p-6 md:p-10 font-mono">
        <div>
          <h3 className="text-lg md:text-xl font-black text-[#c27c2f] uppercase tracking-wider flex items-center gap-3">
            <Truck className="h-6 w-6 text-[#c27c2f]" /> PROTOCOLO_LOGÍSTICA_DE_SUMINISTROS
          </h3>
          <p className="text-base text-zinc-400 mt-3 uppercase leading-relaxed">
            Aprueba reabastecimientos entrantes o despacha transportes blindados solicitando
            refuerzos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRequestModal(true)}
          className="border-2 border-black bg-[#c27c2f] hover:bg-white text-[#161513] font-black uppercase text-sm md:text-base px-6 py-4 hover:text-black transition-all flex items-center gap-2 shrink-0 shadow-lg"
        >
          <Plus className="h-5 w-5" /> PEDIR_REFUERZO
        </button>
      </div>

      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-150 font-mono text-xs p-3.5 flex items-start gap-4">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">ORDEN LOGÍSTICA RECHAZADA:</span> {error}
          </div>
        </div>
      )}

      {/* TWO SECTIONS: INCOMING INBOX & OUTGOING HISTORY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* SECTION A: INCOMING EXPEDITIONS (CARGOS TO US) */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b-2 border-black pb-4 text-[#c27c2f] font-mono mb-4">
            <Mail className="h-5 w-5" />
            <h4 className="font-black text-base md:text-lg uppercase tracking-wider">
              EXPEDICIONES_Y_CARGAS_ENTRANTES ({incomingRequests.length})
            </h4>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="font-mono text-base md:text-lg text-zinc-500 py-20 px-8 text-center uppercase border-2 border-black bg-[#161513] font-black tracking-widest shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              INBOX_SEGURO: No hay tránsitos pendientes de ingreso.
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map((req) => {
                let statusBadge = ""
                let borderTheme = "border-2 border-black bg-[#131211]"

                if (req.status === "pending") {
                  statusBadge = "bg-[#c27c2f]/20 text-[#c27c2f] border border-[#c27c2f]/30"
                  borderTheme = "border-2 border-black bg-[#1e1c19]"
                } else if (req.status === "approved") {
                  statusBadge = "bg-emerald-950/45 text-emerald-400 border border-emerald-500/30"
                  borderTheme = "border-2 border-black bg-[#141b17]"
                } else if (req.status === "denied") {
                  statusBadge = "bg-red-950 text-red-400 border border-red-900/40"
                  borderTheme = "border-2 border-black bg-[#1a1212]"
                } else if (req.status === "arrived") {
                  statusBadge = "bg-zinc-800 text-zinc-400"
                  borderTheme = "border-2 border-black bg-zinc-900/30 opacity-70"
                }

                return (
                  <div
                    key={req.id}
                    className={`p-8 md:p-10 border-2 font-mono transition-shadow ${borderTheme}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <div className="text-sm md:text-base text-zinc-500 uppercase font-black tracking-widest mb-2">
                          REMITENTE: {req.camp_source_id.toUpperCase()}
                        </div>
                        <h5 className="font-black text-xl md:text-2xl text-[#c27c2f] uppercase leading-tight">
                          {req.resource_type.toUpperCase()}
                        </h5>
                      </div>
                      <span
                        className={`px-4 py-2 text-sm md:text-base font-black uppercase tracking-widest rounded-sm ${statusBadge}`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="mt-8 flex justify-between items-end border-t-2 border-black pt-6 text-sm md:text-base">
                      <div>
                        <span className="text-sm md:text-base text-zinc-500 uppercase font-black tracking-widest block mb-2">
                          PESO DE CARGA:
                        </span>
                        <span className="font-black text-xl md:text-2xl text-[#e0d8cc]">
                          {req.amount} uds
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm md:text-base text-zinc-500 uppercase font-black tracking-widest block mb-2">
                          FECHA SATELLITE:
                        </span>
                        <span className="text-base md:text-lg text-zinc-400 font-bold">
                          {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p className="mt-3 text-sm italic text-zinc-450 border-l border-[#c27c2f] pl-2 uppercase">
                        "{req.notes}"
                      </p>
                    )}

                    {/* INTERACTIVE ACTIONS */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-black/40">
                      {req.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, "denied")}
                            className="border-2 border-black bg-[#4a1210]/20 hover:bg-[#9c2720] text-red-400 hover:text-white px-6 py-4 uppercase text-sm md:text-base font-black transition tracking-widest"
                            style={{ backgroundColor: "#1e1c19" }}
                          >
                            [RECHAZAR]
                          </button>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, "approved")}
                            className="border-2 border-black uppercase px-6 py-4 text-sm md:text-base font-black transition tracking-widest"
                            style={{ backgroundColor: "#c27c2f", color: "#161513" }}
                          >
                            [AUTORIZAR]
                          </button>
                        </>
                      )}

                      {req.status === "approved" && (
                        <button
                          type="button"
                          disabled={actionId !== null}
                          onClick={() => handleArrive(req.id)}
                          className="w-full border-2 border-black bg-emerald-600 text-[#161513] hover:bg-white hover:text-black py-4 uppercase text-sm md:text-base font-black tracking-widest transition flex items-center justify-center gap-3"
                        >
                          <Archive className="h-5 w-5" /> REGISTRAR LLEGADA FÍSICA Y TRANSBORDO
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SECTION B: OUTGOING TRANSFERS (CARGOS TO OTHER CAMPS) */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 border-b-2 border-black pb-4 text-[#c27c2f] font-mono mb-4">
            <Send className="h-5 w-5" />
            <h4 className="font-black text-base md:text-lg uppercase tracking-wider">
              HISTORIAL_DESPACHOS_SALIENTES ({outgoingRequests.length})
            </h4>
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="font-mono text-base md:text-lg text-zinc-500 py-20 px-8 text-center uppercase border-2 border-black bg-[#161513] font-black tracking-widest shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              NINGÚN DESPACHO REGISTRADO DESDE LA BODEGA ACTIVA.
            </div>
          ) : (
            <div className="space-y-3">
              {outgoingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-8 md:p-10 border-2 border-black bg-zinc-950/40 font-mono opacity-80"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="text-sm md:text-base text-zinc-500 uppercase font-black tracking-widest mb-2">
                        COOPERATIVO DESTINO: {req.camp_destination_id.toUpperCase()}
                      </div>
                      <h5 className="font-black text-xl md:text-2xl text-[#e0d8cc] uppercase leading-tight">
                        {req.resource_type}
                      </h5>
                    </div>
                    <span className="px-4 py-2 text-sm md:text-base font-black uppercase tracking-widest rounded-sm border border-black bg-zinc-800 text-zinc-400">
                      STATUS: {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-8 flex justify-between items-end border-t-2 border-black pt-6 text-sm md:text-base text-zinc-400">
                    <div>
                      <span className="text-sm md:text-base text-zinc-500 uppercase font-black tracking-widest block mb-2">
                        PESO ENVIADO:
                      </span>
                      <span className="font-black block text-zinc-200 text-xl md:text-2xl">
                        {req.amount} uds
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm md:text-base text-zinc-500 uppercase font-black tracking-widest block mb-2">
                        DESPACHO SOLAR:
                      </span>
                      <span className="block font-black text-base md:text-lg text-zinc-400">
                        {new Date(req.requested_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NEW REQUEST MODAL (POST /transfers/requests) */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-[#161513] border-4 border-double border-[#c27c2f] p-8 md:p-10 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6 text-[#c27c2f]">
              <Truck className="h-8 w-8 animate-pulse text-[#c27c2f]" />
              <h4 className="font-black uppercase tracking-widest text-lg md:text-xl">
                SOLICITUD DE EXPEDICIÓN EXTRAORDINARIA
              </h4>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm text-zinc-500 uppercase font-black block">
                  BÚNKER_DE_SUMINISTRO_ORIGEN:
                </label>
                <select
                  value={sourceBunker}
                  onChange={(e) => setSourceBunker(e.target.value)}
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                >
                  {bunkerList.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#161513] text-[#e0d8cc]">
                      {b.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-500 uppercase font-black block">
                  RECURSO_BODEGA_SOLICITADO:
                </label>
                <select
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                >
                  {resourceTypes.map((r) => (
                    <option key={r} value={r} className="bg-[#161513] text-[#e0d8cc]">
                      {r.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-500 uppercase font-black block">
                  CANTIDAD_CARGA_PEDIDA:
                </label>
                <input
                  type="number"
                  min="1"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-zinc-500 uppercase font-black block">
                  MOTIVACIONES / JUSTIFICANTE LOGÍSTICO:
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={3}
                  placeholder="JUSTIFIQUE EL PROTOCOLO DE TRASLADO MRE..."
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition uppercase placeholder-zinc-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 border-2 border-black uppercase text-sm md:text-base py-3 md:py-4 font-black transition"
                  style={{ backgroundColor: "#9c2720", color: "#ffffff" }}
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 border-2 border-black uppercase text-sm md:text-base py-3 md:py-4 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#c27c2f", color: "#161513" }}
                >
                  {submittingRequest ? "EMITIENDO..." : "FIRMAR ORDEN"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Truck, ShieldAlert, Archive, Mail, Send } from "lucide-react"
import { useEffect, useState } from "react"
import { type FormEvent } from "react"

import { api } from "../config/api"

import type { IntercampRequest } from "../types/api.types"

interface ManagerLogisticsProps {
  campId: string
  onDataChanged: () => void
  refreshTrigger: number
  showModal?: boolean
  onModalClose?: () => void
}

export default function ManagerLogistics({
  campId,
  onDataChanged,
  refreshTrigger,
  showModal = false,
  onModalClose,
}: ManagerLogisticsProps) {
  const {
    data: requests = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["managerLogistics", campId],
    queryFn: async () => {
      const res = await api.get(`/transfers/requests/camp/${campId}`)
      return res.data as IntercampRequest[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const [errorState, setErrorState] = useState<string | null>(null)
  const error = queryError
    ? (queryError as any).message || "Error al descargar bitácora de transferencias."
    : errorState

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  const [selectedResource, setSelectedResource] = useState<string>("")
  const [requestAmount, setRequestAmount] = useState<number>(50)
  const [sourceBunker, setSourceBunker] = useState<string>("")
  const [requestNotes, setRequestNotes] = useState<string>("")
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false)

  // Action Loading state
  const [actionId, setActionId] = useState<string | null>(null)

  const handleCreateRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (requestAmount <= 0) {
      setErrorState("Especifique una cantidad de carga superior a cero.")
      return
    }
    if (!selectedResource) {
      setErrorState("Seleccione un recurso.")
      return
    }

    setSubmittingRequest(true)
    setErrorState(null)
    try {
      await api.post("/transfers/requests", {
        camp_origin_id: Number(sourceBunker),
        camp_destination_id: Number(campId),
        type: "resources",
        notes: requestNotes,
        resource_details: [
          {
            resource_id: Number(selectedResource),
            requested_quantity: Number(requestAmount),
          },
        ],
      })
      onModalClose?.()
      setRequestNotes("")
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.response?.data?.message || err?.message || "Fallo de enlace de solicitud.")
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleApproval = async (id: string, status: "approved" | "rejected") => {
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

  // Fetch resources for the dropdown
  const { data: resourceTypes = [] } = useQuery({
    queryKey: ["allResources"],
    queryFn: async () => {
      const res = await api.get("/resources?limit=100")
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : [])
      return items
    },
    staleTime: 1000 * 60 * 5,
  })

  // Fetch camps for origin dropdown
  const { data: campList = [] } = useQuery({
    queryKey: ["allCamps"],
    queryFn: async () => {
      const res = await api.get("/camps")
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : [])
      return items as { id: string | number; name: string }[]
    },
    staleTime: 1000 * 60 * 10,
  })

  // Auto-select first resource when list loads and nothing is selected
  useEffect(() => {
    if (resourceTypes.length > 0 && !selectedResource) {
      setSelectedResource(String((resourceTypes[0] as any).id))
    }
  }, [resourceTypes, selectedResource])

  // Auto-select first OTHER camp as origin when camps load
  useEffect(() => {
    if (campList.length > 0 && !sourceBunker) {
      const other = campList.find((c) => String(c.id) !== String(campId))
      if (other) setSourceBunker(String(other.id))
    }
  }, [campList, campId, sourceBunker])

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  // Filter requests to show incoming (to us) and outgoing (from us)
  const incomingRequests = requests.filter((r) => r.camp_destination_id === campId)
  const outgoingRequests = requests.filter((r) => r.camp_source_id === campId)

  // Use API camps, filtered to exclude current camp
  const bunkerList = campList
    .filter((c) => String(c.id) !== String(campId))
    .map((c) => ({ id: String(c.id), name: (c.name || `Camp ${c.id}`).toUpperCase() }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
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
              CARGAS ENTRANTES ({incomingRequests.length})
            </h4>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="font-mono text-sm text-zinc-500 py-10 px-6 text-center uppercase border-2 border-black bg-[#161513] font-black tracking-widest">
              Sin tránsitos pendientes de ingreso.
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
                } else if (req.status === "rejected") {
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
                          REMITENTE: BÚNKER {req.camp_origin_id}
                        </div>
                        <h5 className="font-black text-xl md:text-2xl text-[#c27c2f] uppercase leading-tight">
                          {req.resourceDetails && req.resourceDetails.length > 0
                            ? req.resourceDetails[0]?.resource?.name ||
                              `Recurso #${req.resourceDetails[0]?.resource_id}`
                            : req.type}
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
                          {req.resourceDetails && req.resourceDetails.length > 0
                            ? req.resourceDetails[0].requested_quantity
                            : "-"}{" "}
                          uds
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
                        {req.notes}
                      </p>
                    )}

                    {/* INTERACTIVE ACTIONS */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-black/40">
                      {req.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, "rejected")}
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
              DESPACHOS SALIENTES ({outgoingRequests.length})
            </h4>
          </div>

          {outgoingRequests.length === 0 ? (
            <div className="font-mono text-sm text-zinc-500 py-10 px-6 text-center uppercase border-2 border-black bg-[#161513] font-black tracking-widest">
              Ningún despacho registrado desde la bodega.
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
                        COOPERATIVO DESTINO: BÚNKER {req.camp_destination_id}
                      </div>
                      <h5 className="font-black text-xl md:text-2xl text-[#e0d8cc] uppercase leading-tight">
                        {req.resourceDetails && req.resourceDetails.length > 0
                          ? req.resourceDetails[0]?.resource?.name ||
                            `Recurso #${req.resourceDetails[0]?.resource_id}`
                          : req.type}
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
                        {req.resourceDetails && req.resourceDetails.length > 0
                          ? req.resourceDetails[0].requested_quantity
                          : "-"}{" "}
                        uds
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
      {showModal && (
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
                <label
                  htmlFor="field-392"
                  className="text-sm text-zinc-500 uppercase font-black block"
                >
                  BÚNKER ORIGEN:
                </label>
                <select
                  id="field-392"
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
                <label
                  htmlFor="field-409"
                  className="text-sm text-zinc-500 uppercase font-black block"
                >
                  RECURSO SOLICITADO:
                </label>
                <select
                  id="field-409"
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                >
                  {resourceTypes.map((r: any) => (
                    <option key={r.id} value={r.id} className="bg-[#161513] text-[#e0d8cc]">
                      {r.name?.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-zinc-500 uppercase font-black block">CANTIDAD:</div>
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
                <label
                  htmlFor="field-440"
                  className="text-sm text-zinc-500 uppercase font-black block"
                >
                  MOTIVACIONES / JUSTIFICANTE LOGÍSTICO:
                </label>
                <textarea
                  id="field-440"
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
                  onClick={() => onModalClose?.()}
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

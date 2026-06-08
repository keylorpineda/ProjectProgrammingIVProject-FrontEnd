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

const PAPER_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")"

const STATUS_STAMP: Record<string, { label: string; color: string; bg: string; rotation: number }> =
  {
    pending: { label: "PENDIENTE", color: "#b86a1a", bg: "#f0e8d0", rotation: -3 },
    approved: { label: "AUTORIZADO", color: "#2a5a35", bg: "#d4e8d4", rotation: 2 },
    rejected: { label: "RECHAZADO", color: "#9c2720", bg: "#f0d4d0", rotation: -2 },
    arrived: { label: "RECIBIDO", color: "#4a4a6a", bg: "#d8d8e8", rotation: 3 },
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
    staleTime: 1000 * 60 * 2,
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

  const { data: resourceTypes = [] } = useQuery({
    queryKey: ["allResources"],
    queryFn: async () => {
      const res = await api.get("/resources?limit=100")
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : [])
      return items
    },
    staleTime: 1000 * 60 * 5,
  })

  const { data: campList = [] } = useQuery({
    queryKey: ["allCamps"],
    queryFn: async () => {
      const res = await api.get("/camps")
      const items = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : [])
      return items as { id: string | number; name: string }[]
    },
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (resourceTypes.length > 0 && !selectedResource) {
      setSelectedResource(String((resourceTypes[0] as any).id))
    }
  }, [resourceTypes, selectedResource])

  useEffect(() => {
    if (campList.length > 0 && !sourceBunker) {
      const other = campList.find((c) => String(c.id) !== String(campId))
      if (other) setSourceBunker(String(other.id))
    }
  }, [campList, campId, sourceBunker])

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  const incomingRequests = requests.filter((r) => r.camp_destination_id === campId)
  const outgoingRequests = requests.filter((r) => r.camp_source_id === campId)

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* INCOMING EXPEDITIONS */}
        <div className="space-y-4">
          {/* Section label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 12,
              borderBottom: "2px dashed rgba(255,255,255,0.1)",
            }}
          >
            <Mail style={{ width: 18, height: 18, color: "#c27c2f" }} />
            <h4
              style={{
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#e0d8cc",
              }}
            >
              CARGAS ENTRANTES ({incomingRequests.length})
            </h4>
          </div>

          {incomingRequests.length === 0 ? (
            <div
              style={{
                backgroundColor: "#cec8b6",
                backgroundImage: PAPER_TEXTURE,
                border: "1px solid rgba(0,0,0,0.2)",
                padding: "32px 24px",
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#9a8a6a",
                textTransform: "uppercase",
                letterSpacing: "2px",
                boxShadow: "-2px 6px 16px rgba(0,0,0,0.5)",
              }}
            >
              Sin tránsitos pendientes de ingreso.
            </div>
          ) : (
            <div className="space-y-5">
              {incomingRequests.map((req, idx) => {
                const stamp = STATUS_STAMP[req.status] ?? STATUS_STAMP.pending
                const rotation = idx % 2 === 0 ? -0.7 : 0.5

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -12, rotate: rotation - 2 }}
                    animate={{ opacity: 1, x: 0, rotate: rotation }}
                    whileHover={{ rotate: 0, scale: 1.01, zIndex: 5 }}
                    transition={{ type: "spring", stiffness: 120, delay: idx * 0.05 }}
                    style={{
                      backgroundColor: "#d8d2bf",
                      backgroundImage: PAPER_TEXTURE,
                      border: "1px solid rgba(0,0,0,0.18)",
                      borderLeft: "4px solid #6a4a1a",
                      boxShadow: "-3px 8px 20px rgba(0,0,0,0.65)",
                      color: "#1a1208",
                      padding: "20px 24px",
                      position: "relative",
                    }}
                  >
                    {/* Status stamp — rotated in top-right corner */}
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        transform: `rotate(${stamp.rotation}deg)`,
                        backgroundColor: stamp.bg,
                        border: `2px solid ${stamp.color}`,
                        color: stamp.color,
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "0.6rem",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        padding: "3px 10px",
                        opacity: 0.9,
                      }}
                    >
                      {stamp.label}
                    </div>

                    {/* Pin at top */}
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#9c2720",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                        border: "2px solid #6a1a18",
                        zIndex: 2,
                      }}
                    />

                    <div style={{ marginBottom: 14, paddingRight: 90 }}>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.65rem",
                          color: "#7a6a4a",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: 6,
                        }}
                      >
                        REMITENTE: BÚNKER {req.camp_origin_id}
                      </div>
                      <h5
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          textTransform: "uppercase",
                          color: "#0d0a04",
                          lineHeight: 1.2,
                        }}
                      >
                        {req.resourceDetails && req.resourceDetails.length > 0
                          ? req.resourceDetails[0]?.resource?.name ||
                            `Recurso #${req.resourceDetails[0]?.resource_id}`
                          : req.type}
                      </h5>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        borderTop: "1px dashed rgba(0,0,0,0.25)",
                        paddingTop: 12,
                        marginBottom: req.notes ? 10 : 0,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.6rem",
                            color: "#7a6a4a",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: 4,
                          }}
                        >
                          PESO DE CARGA:
                        </div>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 900,
                            fontSize: "1.4rem",
                            color: "#1a1208",
                          }}
                        >
                          {req.resourceDetails && req.resourceDetails.length > 0
                            ? req.resourceDetails[0].requested_quantity
                            : "—"}{" "}
                          <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#7a6a4a" }}>
                            uds
                          </span>
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.6rem",
                            color: "#7a6a4a",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: 4,
                          }}
                        >
                          FECHA SATÉLITE:
                        </div>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#3a2a0a",
                          }}
                        >
                          {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {req.notes && (
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          fontStyle: "italic",
                          color: "#6a5a3a",
                          borderLeft: "2px solid #c27c2f",
                          paddingLeft: 8,
                          textTransform: "uppercase",
                          marginTop: 10,
                        }}
                      >
                        {req.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        flexWrap: "wrap" as const,
                        gap: 8,
                        justifyContent: "flex-end",
                        borderTop: "1px dashed rgba(0,0,0,0.2)",
                        paddingTop: 12,
                      }}
                    >
                      {req.status === "pending" && (
                        <>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, "rejected")}
                            style={{
                              border: "1px solid #9c2720",
                              backgroundColor: "rgba(156,39,32,0.1)",
                              color: "#9c2720",
                              padding: "8px 16px",
                              fontFamily: "monospace",
                              fontSize: "0.72rem",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              cursor: "pointer",
                              letterSpacing: "1px",
                            }}
                          >
                            [RECHAZAR]
                          </button>
                          <button
                            type="button"
                            disabled={actionId !== null}
                            onClick={() => handleApproval(req.id, "approved")}
                            style={{
                              border: "1px solid #2a5a35",
                              backgroundColor: "rgba(42,90,53,0.15)",
                              color: "#2a5a35",
                              padding: "8px 16px",
                              fontFamily: "monospace",
                              fontSize: "0.72rem",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              cursor: "pointer",
                              letterSpacing: "1px",
                            }}
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
                          style={{
                            width: "100%",
                            border: "1px solid #2a5a35",
                            backgroundColor: "#2a5a35",
                            color: "#d8f0d8",
                            padding: "10px 16px",
                            fontFamily: "monospace",
                            fontSize: "0.72rem",
                            fontWeight: 900,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            letterSpacing: "1px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <Archive style={{ width: 14, height: 14 }} /> REGISTRAR LLEGADA FÍSICA Y
                          TRANSBORDO
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* OUTGOING TRANSFERS */}
        <div className="space-y-4">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 12,
              borderBottom: "2px dashed rgba(255,255,255,0.1)",
            }}
          >
            <Send style={{ width: 18, height: 18, color: "#c27c2f" }} />
            <h4
              style={{
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "#e0d8cc",
              }}
            >
              DESPACHOS SALIENTES ({outgoingRequests.length})
            </h4>
          </div>

          {outgoingRequests.length === 0 ? (
            <div
              style={{
                backgroundColor: "#cec8b6",
                backgroundImage: PAPER_TEXTURE,
                border: "1px solid rgba(0,0,0,0.2)",
                padding: "32px 24px",
                textAlign: "center",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#9a8a6a",
                textTransform: "uppercase",
                letterSpacing: "2px",
                boxShadow: "-2px 6px 16px rgba(0,0,0,0.5)",
              }}
            >
              Ningún despacho registrado desde la bodega.
            </div>
          ) : (
            <div className="space-y-5">
              {outgoingRequests.map((req, idx) => {
                const stamp = STATUS_STAMP[req.status] ?? STATUS_STAMP.pending
                const rotation = idx % 2 === 0 ? 0.6 : -0.5

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: 12, rotate: rotation + 2 }}
                    animate={{ opacity: 1, x: 0, rotate: rotation }}
                    whileHover={{ rotate: 0, scale: 1.01, zIndex: 5 }}
                    transition={{ type: "spring", stiffness: 120, delay: idx * 0.05 }}
                    style={{
                      backgroundColor: "#cec8b0",
                      backgroundImage: PAPER_TEXTURE,
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderLeft: "4px solid #8a7a5a",
                      boxShadow: "-2px 6px 16px rgba(0,0,0,0.5)",
                      color: "#1a1208",
                      padding: "20px 24px",
                      position: "relative",
                      opacity: 0.88,
                    }}
                  >
                    {/* Status stamp */}
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        transform: `rotate(${stamp.rotation}deg)`,
                        backgroundColor: stamp.bg,
                        border: `2px solid ${stamp.color}`,
                        color: stamp.color,
                        fontFamily: "monospace",
                        fontWeight: 900,
                        fontSize: "0.55rem",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        padding: "3px 8px",
                        opacity: 0.85,
                      }}
                    >
                      {stamp.label}
                    </div>

                    {/* Blue pin (outgoing = sent) */}
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: "#4a6a8a",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                        border: "2px solid #2a4a6a",
                        zIndex: 2,
                      }}
                    />

                    <div style={{ marginBottom: 12, paddingRight: 80 }}>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.65rem",
                          color: "#7a6a4a",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                          marginBottom: 6,
                        }}
                      >
                        COOPERATIVO DESTINO: BÚNKER {req.camp_destination_id}
                      </div>
                      <h5
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: "1rem",
                          textTransform: "uppercase",
                          color: "#2a2010",
                          lineHeight: 1.2,
                        }}
                      >
                        {req.resourceDetails && req.resourceDetails.length > 0
                          ? req.resourceDetails[0]?.resource?.name ||
                            `Recurso #${req.resourceDetails[0]?.resource_id}`
                          : req.type}
                      </h5>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        borderTop: "1px dashed rgba(0,0,0,0.2)",
                        paddingTop: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.6rem",
                            color: "#7a6a4a",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: 4,
                          }}
                        >
                          PESO ENVIADO:
                        </div>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 900,
                            fontSize: "1.2rem",
                            color: "#2a2010",
                          }}
                        >
                          {req.resourceDetails && req.resourceDetails.length > 0
                            ? req.resourceDetails[0].requested_quantity
                            : "—"}{" "}
                          <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#7a6a4a" }}>
                            uds
                          </span>
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.6rem",
                            color: "#7a6a4a",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: 4,
                          }}
                        >
                          DESPACHO SOLAR:
                        </div>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#4a4030",
                          }}
                        >
                          {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* NEW REQUEST MODAL */}
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
                  htmlFor="targetCamp"
                  className="text-sm text-zinc-500 uppercase font-black block"
                >
                  BÚNKER ORIGEN:
                </label>
                <select
                  id="targetCamp"
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
                  htmlFor="resourceId"
                  className="text-sm text-zinc-500 uppercase font-black block"
                >
                  RECURSO SOLICITADO:
                </label>
                <select
                  id="resourceId"
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
                  id="quantity"
                  type="number"
                  min="1"
                  value={requestAmount}
                  onChange={(e) => {
                    setRequestAmount(Number(e.target.value))
                  }}
                  className="w-full bg-[#2a2824] border-4 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-base font-black font-mono transition shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm text-zinc-500 uppercase font-black block">
                  MOTIVACIONES / JUSTIFICANTE LOGÍSTICO:
                </label>
                <textarea
                  id="notes"
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Sliders,
  ShieldAlert,
  RefreshCw,
  PlusCircle,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeftRight,
} from "lucide-react"
import { useEffect, useState } from "react"
import { type FormEvent } from "react"

import { api } from "../config/api"

import type { InventoryItem } from "../types/api.types"

interface InventoryMovement {
  id: string
  resource_id: string
  camp_id: string
  quantity: number
  type: string
  description: string | null
  date: string
  resource?: { name: string; unit: string }
}

interface ManagerInventoryProps {
  campId: string
  onDataChanged: () => void
  refreshTrigger: number
}

const MOVEMENT_TYPES: { value: string; label: string }[] = [
  { value: "income", label: "ENTRADA DE SUMINISTROS" },
  { value: "transfer_in", label: "TRANSFERENCIA RECIBIDA" },
  { value: "transfer_out", label: "TRANSFERENCIA ENVIADA" },
]

function categoryIcon(category: string): string {
  const c = category.toLowerCase()
  if (
    c.includes("food") ||
    c.includes("comida") ||
    c.includes("aliment") ||
    c.includes("ración") ||
    c.includes("racion")
  )
    return "🌽"
  if (c.includes("water") || c.includes("agua")) return "💧"
  if (
    c.includes("medic") ||
    c.includes("medicina") ||
    c.includes("farmac") ||
    c.includes("antibio")
  )
    return "💊"
  if (
    c.includes("weapon") ||
    c.includes("arma") ||
    c.includes("bala") ||
    c.includes("municion") ||
    c.includes("munición")
  )
    return "⚔️"
  if (
    c.includes("fuel") ||
    c.includes("combustible") ||
    c.includes("gasolina") ||
    c.includes("diesel")
  )
    return "⛽"
  if (c.includes("tool") || c.includes("herramienta")) return "🔧"
  if (c.includes("cloth") || c.includes("ropa")) return "👕"
  return "📦"
}

function movementIcon(type: string) {
  if (type.includes("out") || type.includes("consumption")) return ArrowDownCircle
  if (type.includes("in") || type.includes("income") || type.includes("production"))
    return ArrowUpCircle
  return ArrowLeftRight
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export default function ManagerInventory({
  campId,
  onDataChanged,
  refreshTrigger,
}: ManagerInventoryProps) {
  const {
    data: inventory = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["managerInventory", campId],
    queryFn: async () => {
      const res = await api.get(`/resources/inventory/${campId}`)
      // The api interceptor already maps inventory items to InventoryItem shape
      return (Array.isArray(res.data) ? res.data : []) as InventoryItem[]
    },
    staleTime: 1000 * 60 * 2,
  })

  const { data: movements = [], refetch: refetchMovements } = useQuery({
    queryKey: ["managerMovements", campId],
    queryFn: async () => {
      const res = await api.get(`/resources/movements/${campId}?limit=10`)
      return (Array.isArray(res.data) ? res.data : []) as InventoryMovement[]
    },
    staleTime: 1000 * 60,
  })

  const [errorState, setErrorState] = useState<string | null>(null)
  const error = queryError
    ? (queryError as any).message || "Error al conectar con los sensores de la bodega."
    : errorState

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch()
      refetchMovements()
    }
  }, [refreshTrigger, refetch, refetchMovements])

  // Edit min stock modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [newMinStock, setNewMinStock] = useState<number>(0)
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false)

  // Daily process modal
  const [showConfirmDaily, setShowConfirmDaily] = useState<boolean>(false)
  const [dailyProcessing, setDailyProcessing] = useState<boolean>(false)
  const [dailyResponse, setDailyResponse] = useState<any>(null)

  // New movement modal
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false)
  const [movResourceId, setMovResourceId] = useState<string>("")
  const [movType, setMovType] = useState<string>("income")
  const [movQuantity, setMovQuantity] = useState<number>(0)
  const [movDescription, setMovDescription] = useState<string>("")
  const [submittingMov, setSubmittingMov] = useState<boolean>(false)

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item)
    setNewMinStock(item.minimum_stock_required)
  }

  const handleSaveMinStock = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (newMinStock < 0) {
      setErrorState("El umbral de reserva mínimo no puede ser negativo.")
      return
    }
    setSubmittingEdit(true)
    setErrorState(null)
    try {
      await api.patch(`/resources/inventory/${campId}/${editingItem.resource_id}`, {
        minimum_stock_required: newMinStock,
      })
      setEditingItem(null)
      refetch()
      onDataChanged()
    } catch (err: any) {
      setErrorState(err?.message || "Fallo de escritura en memoria del circuito.")
    } finally {
      setSubmittingEdit(false)
    }
  }

  const handleForceDailyProcess = async () => {
    setDailyProcessing(true)
    setErrorState(null)
    try {
      const res = await api.post(`/resources/daily-process/${campId}`)
      setDailyResponse(res.data)
      refetch()
      refetchMovements()
      onDataChanged()
      setTimeout(() => {
        setShowConfirmDaily(false)
        setDailyResponse(null)
      }, 4000)
    } catch (err: any) {
      setErrorState(err?.message || "Error grave al interrumpir ciclo del generador.")
    } finally {
      setDailyProcessing(false)
    }
  }

  const openMovementModal = () => {
    setMovResourceId(inventory[0]?.id ?? "")
    setMovType("income")
    setMovQuantity(0)
    setMovDescription("")
    setErrorState(null)
    setShowMovementModal(true)
  }

  const handleSubmitMovement = async (e: FormEvent) => {
    e.preventDefault()
    if (!movResourceId || movQuantity <= 0) {
      setErrorState("Selecciona un recurso y una cantidad válida.")
      return
    }
    setSubmittingMov(true)
    setErrorState(null)
    try {
      await api.post("/resources/movements", {
        camp_id: Number(campId),
        resource_id: Number(movResourceId),
        quantity: movQuantity,
        type: movType,
        description: movDescription || undefined,
      })
      setShowMovementModal(false)
      refetch()
      refetchMovements()
      onDataChanged()
    } catch (err: any) {
      setErrorState(
        err?.response?.data?.message || err?.message || "Error al registrar movimiento.",
      )
    } finally {
      setSubmittingMov(false)
    }
  }

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
      style={{ maxWidth: "72rem", margin: "1.5rem auto", padding: "1rem 0" }}
    >
      {/* ACTION BUTTONS */}
      <div
        className="flex flex-wrap gap-3 justify-end"
        style={{ position: "relative", zIndex: 10 }}
      >
        <button
          type="button"
          onClick={openMovementModal}
          className="cursor-pointer flex items-center gap-2 bg-[#c27c2f]/10 hover:bg-[#c27c2f] hover:text-black border-2 border-[#c27c2f] text-[#c27c2f] px-6 py-3 text-sm font-black uppercase transition active:translate-y-0.5 font-mono"
        >
          <PlusCircle className="h-4 w-4" /> REGISTRAR MOVIMIENTO
        </button>
        <button
          type="button"
          onClick={() => setShowConfirmDaily(true)}
          className="cursor-pointer flex items-center gap-2 bg-[#9c2720]/10 hover:bg-[#9c2720] hover:text-white border-2 border-[#9c2720] text-[#9c2720] px-6 py-3 text-sm font-black uppercase transition active:translate-y-0.5 font-mono"
        >
          <RefreshCw className="h-4 w-4" /> CICLO SOLAR
        </button>
      </div>

      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-200 font-mono text-xs p-3.5 flex items-start gap-4">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">FALLO PROTOCOLO:</span> {error}
          </div>
        </div>
      )}

      {/* INVENTORY CARDS — paper pinned to cork board */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "28px",
        }}
      >
        {inventory.map((item, idx) => {
          const isCritical = item.is_below_minimum
          const maxCapacity = Math.max(item.current_stock, item.minimum_stock_required * 3) || 1
          const fillPct = Math.min(100, Math.max(0, (item.current_stock / maxCapacity) * 100))
          const barBg = isCritical ? "#9c2720" : fillPct < 50 ? "#c27c2f" : "#4c6351"
          const rotation = idx % 3 === 0 ? -1.5 : idx % 3 === 1 ? 1.2 : -0.6

          return (
            <motion.div
              key={item.id}
              initial={{ scale: 0.88, opacity: 0, rotate: rotation - 5 }}
              animate={{ scale: 1, opacity: 1, rotate: rotation }}
              whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
              transition={{ type: "spring", stiffness: 130, delay: idx * 0.04 }}
              style={{
                backgroundColor: "#d8d2bf",
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
                padding: "32px 20px 20px",
                position: "relative",
                borderRadius: "1px",
                border: isCritical
                  ? "1px solid rgba(156,39,32,0.45)"
                  : "1px solid rgba(0,0,0,0.18)",
                borderLeft: isCritical ? "4px solid #9c2720" : "1px solid rgba(0,0,0,0.18)",
                boxShadow: isCritical
                  ? "0 2px 4px rgba(0,0,0,0.45), -3px 10px 24px rgba(0,0,0,0.75)"
                  : "0 2px 4px rgba(0,0,0,0.35), -3px 10px 24px rgba(0,0,0,0.65)",
                color: "#1a1208",
                cursor: "default",
              }}
            >
              {/* Pin */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  background: isCritical
                    ? "radial-gradient(circle at 35% 30%, #ff8c8c 0%, #d31a1a 45%, #660000 100%)"
                    : "radial-gradient(circle at 35% 30%, #e8e8e8 0%, #999 45%, #444 100%)",
                  borderRadius: "50%",
                  position: "absolute",
                  top: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  boxShadow:
                    "inset -1px -2px 5px rgba(0,0,0,0.55), inset 1px 2px 3px rgba(255,255,255,0.7), 2px 4px 8px rgba(0,0,0,0.5)",
                  zIndex: 5,
                }}
              />

              {/* Icon + Name */}
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: "2.8rem", lineHeight: 1, marginBottom: 8 }}>
                  {categoryIcon(item.category)}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#0d0a04",
                    lineHeight: 1.3,
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#7a6a4a",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginTop: 3,
                  }}
                >
                  {item.category}
                </div>
              </div>

              {/* Dashed divider */}
              <div style={{ borderBottom: "1px dashed rgba(0,0,0,0.3)", marginBottom: 12 }} />

              {/* Stock number */}
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    color: isCritical ? "#9c2720" : "#1a1208",
                    lineHeight: 1,
                  }}
                >
                  {item.current_stock}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    color: "#8a7a5a",
                    marginLeft: 4,
                  }}
                >
                  {item.unit?.toUpperCase() || ""}
                </span>
                {item.minimum_stock_required > 0 && (
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#9a8a6a",
                      marginTop: 3,
                      fontFamily: "monospace",
                    }}
                  >
                    mín. {item.minimum_stock_required} {item.unit?.toUpperCase() || ""}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: "rgba(0,0,0,0.15)",
                  border: "1px solid rgba(0,0,0,0.2)",
                  overflow: "hidden",
                  marginBottom: 14,
                  position: "relative",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    backgroundColor: barBg,
                    opacity: isCritical ? undefined : 0.85,
                  }}
                  className={isCritical ? "animate-pulse" : ""}
                />
                {item.minimum_stock_required > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      left: `${(item.minimum_stock_required / maxCapacity) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Footer: status + button */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {isCritical ? (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "#9c2720",
                      fontWeight: 900,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                    className="animate-pulse"
                  >
                    ⚠ CRÍTICO
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      color: "#4c6351",
                      fontWeight: 700,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                  >
                    ✓ SEGURO
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleEditClick(item)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(0,0,0,0.4)",
                    color: "#1a1208",
                    fontFamily: "monospace",
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    letterSpacing: "1px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLButtonElement).style.background = "rgba(0,0,0,0.12)")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLButtonElement).style.background = "transparent")
                  }
                >
                  EDITAR
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* MOVEMENT HISTORY — paper logbook */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          backgroundColor: "#cec8b6",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
          border: "1px solid rgba(0,0,0,0.25)",
          borderLeft: "4px solid #9c2720",
          boxShadow: "0 2px 4px rgba(0,0,0,0.4), -3px 10px 28px rgba(0,0,0,0.7)",
          color: "#1a1208",
          position: "relative",
        }}
      >
        {/* Pin */}
        <div
          style={{
            width: 16,
            height: 16,
            background: "radial-gradient(circle at 35% 30%, #ff8c8c 0%, #d31a1a 45%, #660000 100%)",
            borderRadius: "50%",
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow:
              "inset -1px -2px 5px rgba(0,0,0,0.55), inset 1px 2px 3px rgba(255,255,255,0.7), 2px 4px 8px rgba(0,0,0,0.5)",
            zIndex: 5,
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "24px 32px 16px",
            borderBottom: "1px dashed rgba(0,0,0,0.3)",
            marginBottom: 4,
          }}
        >
          <Clock style={{ width: 18, height: 18, color: "#7a3a1a", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              fontWeight: 900,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#2a1a08",
            }}
          >
            REGISTRO DE OPERACIONES RECIENTES
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: "0.65rem",
              color: "#9a8a6a",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Últimos 10
          </span>
        </div>

        {movements.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              fontFamily: "monospace",
              fontSize: "0.75rem",
              color: "#9a8a6a",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            SIN MOVIMIENTOS REGISTRADOS
          </div>
        ) : (
          <div>
            {movements.map((mov, idx) => {
              const Icon = movementIcon(mov.type)
              const isOut = mov.type.includes("out") || mov.type.includes("consumption")
              const resourceName = mov.resource?.name ?? `Recurso #${mov.resource_id}`
              const unit = mov.resource?.unit ?? ""
              const inventoryMatch = inventory.find(
                (i) => String(i.resource_id) === String(mov.resource_id),
              )
              const catIcon = categoryIcon(inventoryMatch?.category ?? "")
              const qtyColor = isOut ? "#9c2720" : "#4c6351"

              return (
                <div
                  key={mov.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "16px 32px",
                    borderBottom:
                      idx < movements.length - 1 ? "1px dashed rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {/* Type icon */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 36,
                      height: 36,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${isOut ? "rgba(156,39,32,0.4)" : "rgba(76,99,81,0.4)"}`,
                      backgroundColor: isOut ? "rgba(156,39,32,0.08)" : "rgba(76,99,81,0.08)",
                    }}
                  >
                    <Icon
                      style={{
                        width: 16,
                        height: 16,
                        color: isOut ? "#9c2720" : "#4c6351",
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{catIcon}</span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.82rem",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: "#1a1208",
                          letterSpacing: "1px",
                        }}
                      >
                        {resourceName}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.6rem",
                          textTransform: "uppercase",
                          color: "#7a6a4a",
                          border: "1px solid rgba(0,0,0,0.25)",
                          padding: "2px 7px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {mov.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {mov.description && (
                      <p
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.7rem",
                          color: "#7a6a4a",
                          marginTop: 4,
                          textTransform: "uppercase",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {mov.description}
                      </p>
                    )}
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.65rem",
                        color: "#9a8a6a",
                        marginTop: 3,
                      }}
                    >
                      {formatDate(mov.date)}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div
                    style={{
                      flexShrink: 0,
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 900,
                      fontSize: "1.4rem",
                      color: qtyColor,
                      lineHeight: 1,
                    }}
                  >
                    {isOut ? "−" : "+"}
                    {mov.quantity}
                    <div
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 400,
                        color: "#9a8a6a",
                        marginTop: 2,
                      }}
                    >
                      {unit}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* MODAL: EDIT MINIMUM STOCK */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-[#161513] border-4 border-double border-[#c27c2f] p-8 md:p-10 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6 text-[#c27c2f]">
              <Sliders className="h-6 w-6" />
              <h4 className="font-black uppercase tracking-widest text-base md:text-lg">
                REDIMENSIONAR RESERVA MÍNIMA
              </h4>
            </div>

            <p className="text-sm text-zinc-400 mb-6 leading-relaxed uppercase">
              Establece el umbral mínimo necesario para el recurso{" "}
              <span className="font-bold text-[#e0d8cc]">{editingItem.name.toUpperCase()}</span>. Si
              el stock cae por debajo de este límite, el sistema central emitirá una alerta de
              defensa pasiva.
            </p>

            <form onSubmit={handleSaveMinStock} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="minStockInput"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  CANTIDAD_RESERVA_EXIGIDA ({editingItem.unit.toUpperCase()}):
                </label>
                <input
                  id="minStockInput"
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#2a2824] border-2 border-black p-4 bg-transparent text-[#e0d8cc] outline-none text-lg font-bold font-mono transition"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-sm py-3 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 border-2 border-black uppercase text-sm py-3 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#c27c2f", color: "#e0d8cc" }}
                >
                  {submittingEdit ? "ACTUALIZANDO..." : "GUARDAR LÍMITES"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: REGISTER MOVEMENT */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-[#161513] border-4 border-double border-[#c27c2f] p-8 md:p-10 font-mono text-[#e0d8cc] shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-black pb-4 mb-6 text-[#c27c2f]">
              <PlusCircle className="h-6 w-6" />
              <h4 className="font-black uppercase tracking-widest text-base md:text-lg">
                REGISTRAR MOVIMIENTO DE BODEGA
              </h4>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="resourceSelect"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  RECURSO:
                </label>
                <select
                  id="resourceSelect"
                  value={movResourceId}
                  onChange={(e) => setMovResourceId(e.target.value)}
                  className="w-full bg-[#2a2824] border-2 border-black p-4 text-[#e0d8cc] outline-none text-lg font-bold font-mono uppercase"
                  required
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name.toUpperCase()} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="operationTypeSelect"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  TIPO DE OPERACIÓN:
                </label>
                <select
                  id="operationTypeSelect"
                  value={movType}
                  onChange={(e) => setMovType(e.target.value)}
                  className="w-full bg-[#2a2824] border-2 border-black p-4 text-[#e0d8cc] outline-none text-lg font-bold font-mono uppercase"
                >
                  {MOVEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="quantityInput"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  CANTIDAD:
                </label>
                <input
                  id="quantityInput"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={movQuantity || ""}
                  onChange={(e) => setMovQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#2a2824] border-2 border-black p-4 text-[#e0d8cc] outline-none text-lg font-bold font-mono"
                  placeholder="0.000"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="descriptionInput"
                  className="text-sm text-zinc-400 uppercase font-black block tracking-wider"
                >
                  DESCRIPCIÓN (OPCIONAL):
                </label>
                <textarea
                  id="descriptionInput"
                  value={movDescription}
                  onChange={(e) => setMovDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                  className="w-full bg-[#2a2824] border-2 border-black p-4 text-[#e0d8cc] outline-none text-base font-mono resize-none"
                  placeholder="Ej: Recepción convoy norte..."
                />
              </div>

              {errorState && (
                <div className="text-sm text-red-400 uppercase border border-[#9c2720]/50 bg-[#9c2720]/10 p-3">
                  {errorState}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMovementModal(false)
                    setErrorState(null)
                  }}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-sm py-3 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingMov}
                  className="flex-1 border-2 border-black uppercase text-sm py-3 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#c27c2f", color: "#e0d8cc" }}
                >
                  {submittingMov ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> PROCESANDO...
                    </>
                  ) : (
                    "CONFIRMAR OPERACIÓN"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: DAILY PROCESS CONFIRMATION */}
      {showConfirmDaily && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#161513] border-4 border-double border-[#9c2720] p-6 font-mono text-[#e0d8cc] shadow-2xl relative"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#9c2720]">
              <ShieldAlert className="h-5.5 w-5.5 animate-bounce" />
              <h4 className="font-bold uppercase tracking-widest text-xs">
                AUTORIZACIÓN CRÍTICA DE CIERRE SOLAR
              </h4>
            </div>

            {dailyResponse ? (
              <div className="space-y-4 py-2">
                <div className="bg-[#9c2720]/20 border-l-4 border-[#9c2720] p-3.5 text-xs text-red-300 space-y-1">
                  <div className="font-bold uppercase tracking-wider">
                    {dailyResponse.message.toUpperCase()}
                  </div>
                  <p className="uppercase">
                    Consumos y producciones calculadas y consolidadas en base de datos.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm bg-[#1a1a1a] border-2 border-black p-3 text-zinc-300">
                  <div>
                    🍔 COMIDA PRODUCIDA:{" "}
                    <span className="font-bold text-emerald-400">
                      +{dailyResponse.metrics.foodProduced}
                    </span>
                  </div>
                  <div>
                    👥 COMIDA CONSUMIDA:{" "}
                    <span className="font-bold text-[#9c2720]">
                      -{dailyResponse.metrics.foodConsumed}
                    </span>
                  </div>
                  <div>
                    💧 AGUA PRODUCIDA:{" "}
                    <span className="font-bold text-emerald-400">
                      +{dailyResponse.metrics.waterProduced}
                    </span>
                  </div>
                  <div>
                    🏃‍♂️ AGUA CONSUMIDA:{" "}
                    <span className="font-bold text-[#9c2720]">
                      -{dailyResponse.metrics.waterConsumed}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 text-center animate-pulse uppercase tracking-widest font-bold">
                  RECONSOLIDANDO STOCK... CERRANDO CONEXIÓN.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 uppercase">
                  ¡ATENCIÓN ADMINISTRADOR! Estás a punto de forzar el{" "}
                  <span className="text-[#9c2720] font-bold">Cierre del Ciclo Solar</span>. Esto
                  ejecutará el consumo biológico diario de toda la fuerza de trabajo habitando el
                  búnker, recolectará las cosechas hidropónicas agrícolas y quemará combustible
                  diésel para los generadores de oxígeno.
                </p>

                <div className="bg-[#1a1a1a] border border-black p-4 mb-4 text-left text-sm space-y-1.5 text-zinc-400">
                  <span className="text-sm text-[#c27c2f] font-bold block uppercase tracking-wider">
                    MÁRGENES OPERACIONALES (CÁLCULO DINÁMICO):
                  </span>
                  <div>
                    • El consumo de alimento y agua es calculado{" "}
                    <span className="text-emerald-400 font-bold">
                      dinámicamente por el Servidor Central
                    </span>{" "}
                    basándose en la cantidad de habitantes y su factor de salud.
                  </div>
                  <div>
                    • El gasto de combustible diésel se calculará según la cantidad de generadores
                    activos.
                  </div>
                  <div>
                    • Las cosechas hidropónicas sumarán recursos dependiendo de los trabajadores
                    asignados al sector agrícola.
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDaily(false)}
                    disabled={dailyProcessing}
                    className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
                  >
                    [ABORTAR SECUENCIA]
                  </button>
                  <button
                    type="button"
                    onClick={() => handleForceDailyProcess()}
                    disabled={dailyProcessing}
                    className="flex-1 border-2 border-black uppercase text-xs py-2 hover:bg-[#801815] transition font-black flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#9c2720", color: "#ffffff" }}
                  >
                    {dailyProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> PROCESANDO...
                      </>
                    ) : (
                      "EJECUTAR CONSUMOS (CIERRE)"
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

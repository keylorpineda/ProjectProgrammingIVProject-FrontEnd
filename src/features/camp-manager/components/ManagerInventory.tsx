/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Sliders, ShieldAlert, RefreshCw, Layers } from "lucide-react"
import { useEffect, useState } from "react"
import { type FormEvent } from "react"

import { api } from "../config/api"

import type { InventoryItem } from "../types/api.types"

interface ManagerInventoryProps {
  campId: string
  onDataChanged: () => void
  refreshTrigger: number
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
      return res.data as InventoryItem[]
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const [errorState, setErrorState] = useState<string | null>(null)
  const error = queryError
    ? (queryError as any).message || "Error al conectar con los sensores de la bodega."
    : errorState

  useEffect(() => {
    if (refreshTrigger > 0) refetch()
  }, [refreshTrigger, refetch])

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [newMinStock, setNewMinStock] = useState<number>(0)
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false)

  // Daily Process Confirmation Modal State
  const [showConfirmDaily, setShowConfirmDaily] = useState<boolean>(false)
  const [dailyProcessing, setDailyProcessing] = useState<boolean>(false)
  const [dailyResponse, setDailyResponse] = useState<any>(null)

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
      await api.patch(`/resources/inventory/${campId}/${editingItem.id}`, {
        minimum_stock_required: newMinStock,
      })
      setEditingItem(null)
      refetch()
      onDataChanged() // Refresh statistics and balance
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
      onDataChanged()
      // Auto close confirmation after showing result briefly
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

  if (loading) {
    return <div className="min-h-[400px]" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* ACTION HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#1a1a1a] border-2 border-black p-6 md:p-10 font-mono">
        <div>
          <h3 className="text-lg md:text-xl font-black text-[#c27c2f] uppercase tracking-wider flex items-center gap-3">
            <Layers className="h-6 w-6 text-[#c27c2f]" /> CONTROL_FÍSICO_DE_LA_BODEGA_CENTRAL
          </h3>
          <p className="text-base text-zinc-400 mt-3 uppercase leading-relaxed">
            Modifica las raciones en reserva y monitorea el estado del almacén.
          </p>
        </div>
      </div>
      {error && (
        <div className="border-2 border-black bg-[#9c2720]/20 text-red-200 font-mono text-xs p-3.5 flex items-start gap-4">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span className="font-bold">FALLO PROTOCOLO:</span> {error}
          </div>
        </div>
      )}

      {/* CONSOLE STYLE TABLE */}
      <div className="overflow-hidden border-2 border-black bg-[#161513]">
        <table className="table-auto w-full border-collapse font-mono text-xs">
          <thead className="bg-[#121110] text-[#c27c2f] border-b border-black text-left uppercase text-sm tracking-wider">
            <tr>
              <th className="p-6 md:p-8 border-r border-black font-black text-sm md:text-base">
                RECURSO / CATEGORÍA
              </th>
              <th className="p-6 md:p-8 border-r border-black font-black text-sm md:text-base">
                INVENTARIO_ACTUAL
              </th>
              <th className="p-6 md:p-8 border-r border-black font-black text-sm md:text-base">
                STOCK_CRÍTICO_MÍNIMO
              </th>
              <th className="p-6 md:p-8 border-r border-black font-black text-center text-sm md:text-base">
                ESTADO_DE_SEGURIDAD
              </th>
              <th className="p-6 md:p-8 text-center font-black text-sm md:text-base">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#e0d8cc] tracking-wide">
            {inventory.map((item) => {
              const warningStyle = item.is_below_minimum
                ? "bg-[#2a1111] text-[#e0d8cc] border-b border-black"
                : "border-b border-black hover:bg-[#2a2824]/40"

              return (
                <tr key={item.id} className={`${warningStyle} transition-colors`}>
                  <td className="p-6 md:p-8 border-r border-black font-black">
                    <div className="text-base md:text-lg">{item.name.toUpperCase()}</div>
                    <div className="text-sm text-zinc-500 font-normal uppercase mt-1">
                      CÓDIGO: {item.category.toUpperCase()}
                    </div>
                  </td>
                  <td className="p-6 md:p-8 border-r border-black font-mono font-black text-base md:text-lg">
                    {item.current_stock}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      {item.unit.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-6 md:p-8 border-r border-black font-mono text-base md:text-lg font-bold">
                    {item.minimum_stock_required}{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      {item.unit.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-6 md:p-8 border-r border-black text-center uppercase font-mono font-bold text-base md:text-lg">
                    {(() => {
                      const maxCapacity =
                        Math.max(item.current_stock, item.minimum_stock_required * 3) || 1
                      const fillPercentage = Math.min(
                        100,
                        Math.max(0, (item.current_stock / maxCapacity) * 100),
                      )
                      const barColor = item.is_below_minimum
                        ? "bg-[#9c2720]"
                        : fillPercentage < 50
                          ? "bg-[#df8120]"
                          : "bg-emerald-500"

                      return (
                        <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[200px] mx-auto">
                          {item.is_below_minimum ? (
                            <span className="text-[#9c2720] font-black tracking-widest animate-pulse">
                              [ALERTA_CRÍTICA]
                            </span>
                          ) : (
                            <span className="text-emerald-500 tracking-wider">SEGURO</span>
                          )}
                          <div className="w-full bg-[#121110] border-2 border-black h-4 overflow-hidden relative shadow-[inset_0_0_5px_rgba(0,0,0,0.8)]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${fillPercentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full ${barColor} ${item.is_below_minimum ? "animate-pulse" : ""}`}
                            />
                            {/* Marker for minimum stock */}
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-white z-10 opacity-70"
                              style={{
                                left: `${(item.minimum_stock_required / maxCapacity) * 100}%`,
                              }}
                              title="Stock Mínimo Crítico"
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="p-6 md:p-8 text-center">
                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      className="cursor-pointer bg-[#c27c2f]/10 hover:bg-[#c27c2f] hover:text-black border-2 border-[#c27c2f] text-[#c27c2f] px-6 py-3 text-sm font-black uppercase transition active:translate-y-0.5"
                    >
                      EDITAR RESERVA
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT MINIMUM_STOCK_REQUIRED */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#161513] border-4 border-double border-[#c27c2f] p-6 font-mono text-[#e0d8cc] relative shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4 text-[#c27c2f]">
              <Sliders className="h-5 w-5" />
              <h4 className="font-bold uppercase tracking-widest text-xs">
                REDIMENSIONAR RESERVA MÍNIMA
              </h4>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed uppercase">
              Establece el umbral mínimo necesario para el recurso{" "}
              <span className="font-bold text-[#e0d8cc]">{editingItem.name.toUpperCase()}</span>. Si
              el stock cae por debajo de este límite, el sistema central emitirá una alerta de
              defensa pasiva.
            </p>

            <form onSubmit={handleSaveMinStock} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 uppercase font-bold block">
                  CANTIDAD_RESERVA_EXIGIDA ({editingItem.unit.toUpperCase()}):
                </label>
                <input
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={(e) => setNewMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#2a2824] border-2 border-black p-2 bg-transparent text-[#e0d8cc] outline-none text-sm font-bold font-mono transition"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border-2 border-black bg-transparent text-zinc-400 hover:text-white uppercase text-xs py-2 font-black transition"
                >
                  [CANCELAR]
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 border-2 border-black uppercase text-xs py-2 hover:bg-[#a96821] transition font-black flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#c27c2f", color: "#161513" }}
                >
                  {submittingEdit ? "ACTUALIZANDO..." : "GUARDAR LÍMITES"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CONFIRMATION DAILY PROCESS MODAL: MANDATORY CONFIRMATION */}
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

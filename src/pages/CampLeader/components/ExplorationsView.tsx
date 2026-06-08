import { motion, AnimatePresence } from "framer-motion"
import {
  Archive,
  CheckSquare,
  Compass,
  MapPin,
  Play,
  Plus,
  Search,
  TriangleAlert,
  XSquare,
} from "lucide-react"
import { type FormEvent, useState } from "react"

import type {
  Camp,
  Exploration,
  ExplorationStatus,
  Inventory,
  Person,
  ResourceItem,
} from "../types"

import { ExplorationZoneMap } from "@/features/map-test/components/ExplorationZoneMap"
import { MapCoordPicker } from "@/features/map-test/components/MapCoordPicker"
import { TransferRouteMap } from "@/features/map-test/components/TransferRouteMap"

interface ExplorationsViewProps {
  explorations: Exploration[]
  activePersons: Person[]
  inventory: Inventory[]
  resources: ResourceItem[]
  camps: Camp[]
  myCampId: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreateExploration: (data: any) => Promise<void>
  onDepartExploration: (id: number) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onReturnExploration: (id: number, data: any) => Promise<void>
  onCancelExploration: (id: number) => Promise<void>
}

function parseDestCoords(desc: string): [number, number] | null {
  const match = desc.match(/\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/)
  if (!match) return null
  return [parseFloat(match[1]), parseFloat(match[2])]
}

function cleanDestDescription(desc: string): string {
  return desc.replace(/\s*\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/, "").trim()
}

export default function ExplorationsView({
  explorations,
  activePersons,
  inventory,
  resources,
  camps,
  myCampId,
  onCreateExploration,
  onDepartExploration,
  onReturnExploration,
  onCancelExploration,
}: ExplorationsViewProps) {
  const [filterStatus, setFilterStatus] = useState<ExplorationStatus | "ALL">("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [selectedExplorationId, setSelectedExplorationId] = useState<number | null>(null)

  // Form Fields - New Expedition
  const [newExpName, setNewExpName] = useState("")
  const [newExpDest, setNewExpDest] = useState("")
  const [newExpESTDays, setNewExpESTDays] = useState(3)
  const [newExpGraceDays, setNewExpGraceDays] = useState(1)
  const [newExpNotes, setNewExpNotes] = useState("")
  const [selectedPeople, setSelectedPeople] = useState<number[]>([])
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)
  const [provisionStocks, setProvisionStocks] = useState<{ [key: number]: number }>({
    1: 10, // Default 10 Comida
    2: 10, // Default 10 Agua
  })

  // Form Fields - Return Expedition
  const [returnNotes, setReturnNotes] = useState("")
  const [salvagedResources, setSalvagedResources] = useState<{ [key: number]: number }>({
    1: 40, // Found Food
    2: 30, // Found Water
    3: 5, // Found Medicine
    4: 2, // Found Parts
    5: 100, // Found Ammo
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter & Search Logic
  const filteredExplorations = explorations.filter((exp) => {
    const matchStatus = filterStatus === "ALL" || exp.status === filterStatus
    const matchSearch =
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.destination_description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  // Handle New Expedition Submission
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!newExpName.trim() || !newExpDest.trim()) {
      setFormError("COMPLETE TODOS LOS CAMPOS RESALTADOS.")
      return
    }

    if (selectedPeople.length === 0) {
      setFormError("DEBE ASIGNAR AL MENOS UN EXCURSIONISTA.")
      return
    }

    // Check inventory stock supplies — only if inventory loaded and resource qty > 0
    let stockOk = true
    if (inventory.length > 0) {
      Object.entries(provisionStocks).forEach(([resId, reqQty]) => {
        if ((reqQty as number) <= 0) return // skip resources not requested
        const dbInv = inventory.find((i) => i.resource_id === Number(resId))
        if (!dbInv || dbInv.current_quantity < (reqQty as number)) {
          setFormError(
            `RECURSOS INSUFICIENTES: se requieren ${reqQty} unidades del recurso #${resId} pero solo hay ${dbInv?.current_quantity ?? 0}.`,
          )
          stockOk = false
        }
      })
    }

    if (!stockOk) return

    try {
      setIsSubmitting(true)
      const resourceConsumptions = Object.entries(provisionStocks).map(([key, value]) => ({
        resource_id: Number(key),
        quantity: value,
      }))

      // Embed coordinates in description if picked on map
      const coordSuffix =
        destLat != null && destLng != null ? ` [${destLat.toFixed(5)}, ${destLng.toFixed(5)}]` : ""

      await onCreateExploration({
        camp_id: myCampId,
        name: newExpName,
        destination_description: newExpDest + coordSuffix,
        departure_date: new Date().toISOString(),
        estimated_days: Number(newExpESTDays),
        grace_days: Number(newExpGraceDays),
        notes: newExpNotes,
        personIds: selectedPeople,
        resourceConsumptions,
      })

      // Clear Form
      setNewExpName("")
      setNewExpDest("")
      setNewExpESTDays(3)
      setNewExpGraceDays(1)
      setNewExpNotes("")
      setSelectedPeople([])
      setDestLat(null)
      setDestLng(null)
      setIsNewModalOpen(false)
    } catch (err: any) {
      const backendMsg = err.response?.data?.message
      const errorMsg = Array.isArray(backendMsg) ? backendMsg[0] : backendMsg
      setFormError(
        errorMsg || (err instanceof Error ? err.message : "FALLO EN REGISTRO DE MISIÓN."),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Safe Return submit
  const handleReturnSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedExplorationId) return

    try {
      setIsSubmitting(true)
      const foundList = Object.entries(salvagedResources).map(([key, value]) => ({
        resource_id: Number(key),
        quantity: value,
      }))

      await onReturnExploration(selectedExplorationId, {
        notes: returnNotes,
        foundResources: foundList,
      })

      setReturnNotes("")
      setIsReturnModalOpen(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "FALLO AL REGISTRAR RETORNO.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePersonSelection = (pId: number) => {
    if (selectedPeople.includes(pId)) {
      setSelectedPeople(selectedPeople.filter((id) => id !== pId))
    } else {
      setSelectedPeople([...selectedPeople, pId])
    }
  }

  const handleProvisionChange = (resId: number, qty: number) => {
    setProvisionStocks({
      ...provisionStocks,
      [resId]: Math.max(0, qty),
    })
  }

  const handleSalvageChange = (resId: number, qty: number) => {
    setSalvagedResources({
      ...salvagedResources,
      [resId]: Math.max(0, qty),
    })
  }

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-[#c27c2f] pb-5">
        <div>
          <h2 className="font-typewriter text-2xl lg:text-3xl font-bold text-[#fca311] uppercase tracking-wider">
            EXPLORACIONES EN LA ZONA MUERTA
          </h2>
          <p className="font-mono text-sm text-[#9a8a74] uppercase tracking-wider mt-1">
            PATRULLAS DE CAMPO · ZONA MUERTA
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
          NUEVA EXPLORACIÓN
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "ALL", label: "VER TODOS" },
              { key: "scheduled", label: "PROGRAMADA" },
              { key: "in_progress", label: "EN CURSO" },
              { key: "completed", label: "COMPLETADA" },
              { key: "cancelled", label: "CANCELADA" },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as ExplorationStatus | "ALL")}
              className={`px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider border-2 cursor-pointer transition-all ${
                filterStatus === key
                  ? "bg-[#c27c2f] text-white border-[#c27c2f] shadow-[2px_2px_0_rgba(0,0,0,0.6)]"
                  : "bg-transparent border-[#9a8a74]/60 text-[#c8bfae] hover:border-[#c27c2f] hover:text-[#fca311]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
          <input
            type="text"
            placeholder="BUSCAR RUTA/ZONA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-72 pl-10 pr-4 py-2.5 bg-[#d4c9b0] border-2 border-black/30 text-black font-mono text-sm uppercase focus:outline-none focus:border-[#c27c2f]"
          />
        </div>
      </div>

      {/* LISTA DE EXPEDICIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredExplorations.length === 0 ? (
          <div className="col-span-2 text-center py-20 border-2 border-dashed border-[#9a8a74]/30">
            <Compass className="w-12 h-12 text-[#6e5f4d] mx-auto mb-4 animate-pulse" />
            <p className="font-typewriter text-base text-[#9a8a74] uppercase font-bold">
              SIN EXPEDICIONES EN LA COLA
            </p>
            <p className="font-mono text-sm text-[#6e5f4d] mt-2 uppercase">
              AJUSTE FILTROS O CREE UNA NUEVA EXPLORACIÓN.
            </p>
          </div>
        ) : (
          filteredExplorations.map((exp) => {
            const isScheduled = exp.status === "scheduled"
            const isInProgress = exp.status === "in_progress"
            const isCompleted = exp.status === "completed"
            const isCancelled = exp.status === "cancelled"

            const leaderName =
              exp.explorationPersons.find((ep) => ep.is_leader)?.person.first_name || "SIN ASIGNAR"
            const membersList = exp.explorationPersons.map((ep) => ep.person.first_name).join(", ")

            const destCoords = parseDestCoords(exp.destination_description)
            const cleanDesc = cleanDestDescription(exp.destination_description)

            const myCamp = camps.find((c) => c.id === myCampId)
            const campCoords: [number, number] | null =
              myCamp?.latitude != null && myCamp?.longitude != null
                ? [Number(myCamp.latitude), Number(myCamp.longitude)]
                : null

            const borderColor = isInProgress
              ? "#4c6351"
              : isCompleted
                ? "#5a5040"
                : isCancelled
                  ? "#9c2720"
                  : "#c27c2f"

            const statusLabel = isScheduled
              ? "PROGRAMADA"
              : isInProgress
                ? "EN CURSO"
                : isCompleted
                  ? "COMPLETADA"
                  : "CANCELADA"

            return (
              <div
                key={exp.id}
                className={`bg-[#e8dcc8] border-2 border-black shadow-[5px_5px_0_#000] flex flex-col ${isCancelled ? "opacity-60" : ""}`}
                style={{ borderLeft: `6px solid ${borderColor}` }}
              >
                {/* CABECERA */}
                <div className="flex justify-between items-start p-6 pb-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                    <span className="font-mono text-xs font-bold text-black/40 uppercase tracking-widest">
                      MISIÓN #{exp.id}
                    </span>
                    <h3 className="font-typewriter text-xl font-bold text-black uppercase leading-tight">
                      {exp.name}
                    </h3>
                  </div>
                  <span
                    className={`font-typewriter text-xs font-bold px-3 py-1.5 uppercase border-2 border-black shrink-0 ${
                      isScheduled
                        ? "bg-[#c27c2f] text-black"
                        : isInProgress
                          ? "bg-[#4c6351] text-white"
                          : isCompleted
                            ? "bg-[#5a5040] text-[#e8dcc8]"
                            : "bg-[#9c2720] text-white"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* MINIMAP: ruta desde campamento hasta zona de exploración */}
                {campCoords && (
                  <div className="mx-4 mb-2">
                    {destCoords ? (
                      <div className="wv-transfer-minimap">
                        <TransferRouteMap
                          fromCoords={campCoords}
                          toCoords={destCoords}
                          fromName="BASE"
                          toName={cleanDesc.slice(0, 20) || "ZONA"}
                        />
                      </div>
                    ) : (
                      <div className="wv-exp-minimap">
                        <ExplorationZoneMap
                          originCoords={campCoords}
                          originName="BASE"
                          destinationLabel={cleanDesc.slice(0, 40) || "ZONA DE EXPLORACIÓN"}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* DETALLES */}
                <div className="px-6 flex flex-col gap-4 flex-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-black/50 shrink-0 mt-0.5" />
                    <span className="font-mono text-sm text-black uppercase leading-5">
                      {cleanDesc || exp.destination_description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-black/10 border border-black/15 p-4">
                    <div>
                      <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                        SALIDA
                      </span>
                      <span className="font-typewriter text-sm font-bold text-black">
                        {exp.departure_date.split("T")[0]}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                        RETORNO EST.
                      </span>
                      <span className="font-typewriter text-sm font-bold text-black">
                        {exp.estimated_days}D (+{exp.grace_days}G)
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                        LÍDER
                      </span>
                      <span className="font-typewriter text-sm font-bold text-black uppercase">
                        {leaderName}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-black/50 uppercase tracking-wider block mb-1">
                        EQUIPO
                      </span>
                      <span className="font-mono text-sm text-black uppercase truncate block">
                        {membersList}
                      </span>
                    </div>
                  </div>

                  {isCompleted && exp.real_return_date && (
                    <div className="bg-[#4c6351]/20 border-l-4 border-[#4c6351] px-4 py-3 font-mono text-sm text-black">
                      <span className="font-bold block">RETORNO REGISTRADO</span>
                      {exp.real_return_date.split("T")[0]}
                      {exp.notes ? ` — ${exp.notes}` : ""}
                    </div>
                  )}

                  {exp.notes && !isCompleted && (
                    <p className="font-mono text-sm text-black/60 italic">* {exp.notes}</p>
                  )}
                </div>

                {/* ACCIONES */}
                <div className="flex gap-3 border-t-2 border-black/15 p-6 pt-4 mt-4">
                  {isScheduled && (
                    <>
                      <button
                        onClick={() => onDepartExploration(exp.id)}
                        className="flex-1 bg-[#c27c2f] text-black font-typewriter text-sm font-bold uppercase py-3 px-4 border-2 border-black hover:bg-[#df8120] cursor-pointer flex items-center justify-center gap-2 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        PARTIR
                      </button>
                      <button
                        onClick={() => onCancelExploration(exp.id)}
                        className="bg-[#9c2720] hover:bg-red-800 text-white py-3 px-4 font-typewriter text-sm font-bold uppercase border-2 border-black flex items-center gap-2 cursor-pointer"
                      >
                        <XSquare className="w-4 h-4" />
                        CANCELAR
                      </button>
                    </>
                  )}
                  {isInProgress && (
                    <button
                      onClick={() => {
                        setSelectedExplorationId(exp.id)
                        setIsReturnModalOpen(true)
                        setReturnNotes("")
                      }}
                      className="w-full bg-[#4c6351] text-white hover:bg-[#3b4d3e] font-typewriter text-sm font-bold py-3 px-4 flex items-center justify-center gap-2 cursor-pointer border-2 border-black"
                    >
                      <CheckSquare className="w-4 h-4" />
                      REGISTRAR RETORNO
                    </button>
                  )}
                  {(isCompleted || isCancelled) && (
                    <div className="w-full text-center py-3 text-black/40 font-mono text-sm uppercase tracking-wider">
                      — SIN ACTIVIDAD ADICIONAL —
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODAL: ORGANIZAR NUEVA EXPLORACIÓN */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-4 border-[#c27c2f] max-w-2xl w-full p-6 text-white text-left font-mono shadow-[0_0_24px_rgba(194,124,47,0.25)] rounded-lg my-8"
            >
              <div className="border-b-2 border-[#c27c2f] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-amber-500 font-bold tracking-widest flex items-center gap-2">
                  <Compass className="w-5 h-5" />
                  CREAR HOJA DE MISIÓN EXCURSIONISTA
                </h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold text-lg"
                >
                  [X]
                </button>
              </div>

              {formError && (
                <div className="bg-red-950/40 border-l-4 border-red-500 p-3 mb-4 text-red-400 text-xs flex items-center gap-2">
                  <TriangleAlert className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="exp-name"
                      className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                    >
                      NOMBRE CLAVE DE LA OPERACIÓN
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      placeholder="EJ. BÚSQUEDA DE ANTÍXIDAS EN VALLE GRIS"
                      value={newExpName}
                      onChange={(e) => setNewExpName(e.target.value)}
                      required
                    />
                  </div>
                  {/* Dest */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="exp-dest"
                      className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                    >
                      DESCRIPCIÓN DEL DESTINO ESTABLECIDO
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      placeholder="EJ. HOSPITAL UNIVERSITARIO, PISOS INFERIORES"
                      value={newExpDest}
                      onChange={(e) => setNewExpDest(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* MAPA: ZONA OBJETIVO */}
                <div>
                  <div className="text-[10px] text-[#ab9e8b] uppercase font-bold block mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    MARCAR ZONA EN EL MAPA (OPCIONAL)
                  </div>
                  <div
                    style={{
                      height: 260,
                      border: "1px solid rgba(194,124,47,0.35)",
                      overflow: "hidden",
                    }}
                  >
                    <MapCoordPicker
                      lat={destLat}
                      lng={destLng}
                      onChange={(lat, lng) => {
                        setDestLat(lat)
                        setDestLng(lng)
                      }}
                    />
                  </div>
                  {destLat != null && destLng != null ? (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-amber-500 font-mono">
                        ◉ COORDENADAS: {destLat.toFixed(5)}, {destLng.toFixed(5)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDestLat(null)
                          setDestLng(null)
                        }}
                        className="text-[9px] text-zinc-500 hover:text-red-400 font-mono cursor-pointer"
                      >
                        [LIMPIAR]
                      </button>
                    </div>
                  ) : (
                    <p className="text-[9px] text-zinc-600 font-mono mt-1">
                      Haz clic en el mapa para marcar la zona de exploración
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Est days */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="exp-days"
                      className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                    >
                      DÍAS ESTIMA DE VIAJE
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      min={1}
                      max={15}
                      value={newExpESTDays}
                      onChange={(e) => setNewExpESTDays(Number(e.target.value))}
                      required
                    />
                  </div>
                  {/* Grace days */}
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="exp-grace-days"
                      className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                    >
                      DÍAS DE GRACIA ADICIONAL
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors"
                      min={0}
                      max={7}
                      value={newExpGraceDays}
                      onChange={(e) => setNewExpGraceDays(Number(e.target.value))}
                      required
                    />
                  </div>
                  {/* Date mockup display info */}
                  <div className="col-span-2 md:col-span-1 flex flex-col gap-1 justify-end">
                    <div className="text-[9px] bg-zinc-900 border border-zinc-800 p-2 text-zinc-400 rounded leading-4 uppercase">
                      PARTIDA: <span className="text-white font-bold">INMEDIATA</span>
                    </div>
                  </div>
                </div>

                {/* SELECTOR PERSONAS INTEGRANTES */}
                <div>
                  <div className="text-[10px] text-[#ab9e8b] uppercase font-bold block mb-2">
                    SELECCIÓN DE CONTINGENTES DISPONIBLES (PRIMERO SERÁ EL LÍDER)
                  </div>
                  {activePersons.length === 0 ? (
                    <div className="p-3 bg-zinc-900 text-zinc-500 text-center text-xs uppercase border border-dashed border-zinc-800 rounded">
                      — NO HAY DISPONIBILIDAD DE TRABAJADORES SANO EN ESTE MOMENTO —
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-black/40 border border-zinc-900 rounded">
                      {activePersons.map((p) => {
                        const canExplore = p.profession?.can_explore ?? false
                        const isSelected = selectedPeople.includes(p.id)
                        return (
                          <div
                            key={p.id}
                            role={canExplore ? "button" : "presentation"}
                            tabIndex={canExplore ? 0 : -1}
                            onClick={() => canExplore && togglePersonSelection(p.id)}
                            onKeyDown={(e) =>
                              canExplore && e.key === "Enter" && togglePersonSelection(p.id)
                            }
                            className={`p-2 rounded border transition-colors flex justify-between items-center ${
                              !canExplore
                                ? "bg-red-950/20 border-red-900/30 text-zinc-600 cursor-not-allowed opacity-60"
                                : isSelected
                                  ? "bg-amber-950/40 border-amber-500 text-white cursor-pointer"
                                  : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                            }`}
                          >
                            <div className="text-left">
                              <span className="font-bold text-xs block uppercase flex items-center gap-1.5">
                                {p.first_name} {p.last_name}
                                {!canExplore && (
                                  <span className="text-[8px] bg-red-900/50 text-red-300 px-1 rounded-sm tracking-tighter">
                                    NO APTO PARA ZONA
                                  </span>
                                )}
                              </span>
                              <span
                                className={`text-[9px] block uppercase font-mono tracking-widest ${!canExplore ? "text-red-900/50" : "text-zinc-400"}`}
                              >
                                {p.profession?.name ?? "Desconocida"} • XP: {p.experience_points} (
                                {p.expeditionsSurvived} EXT)
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!canExplore}
                              readOnly
                              className={`accent-amber-500 pointer-events-none ${!canExplore ? "opacity-20" : ""}`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* EQUIPAMIENTOS REQUERIDOS (PROVISIONES DESDE EL REFUGIO) */}
                <div>
                  <div className="text-[10px] text-[#ab9e8b] uppercase font-bold block mb-2">
                    SUMINISTROS DE EXPEDICIÓN (EXTRAÍDOS DE BODEGA)
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-zinc-900/60 p-3 rounded-md border border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">
                        CANTIDAD COMIDA (RACIONES)
                      </span>
                      <input
                        type="number"
                        min={0}
                        className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors w-full"
                        value={provisionStocks[1] || 0}
                        onChange={(e) => handleProvisionChange(1, Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-1">
                        CANTIDAD AGUA (LITROS)
                      </span>
                      <input
                        type="number"
                        min={0}
                        className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors w-full"
                        value={provisionStocks[2] || 0}
                        onChange={(e) => handleProvisionChange(2, Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Optional description */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="exp-notes"
                    className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                  >
                    COMENTARIO EXTRA / INTELIGENCIA OPERATIVA ADICIONAL
                  </label>
                  <textarea
                    id="exp-notes"
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors h-14 resize-none"
                    placeholder="E.G., NO DETENERSE EN CASO DE NIEBLA SÉPTICA..."
                    value={newExpNotes}
                    onChange={(e) => setNewExpNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-zinc-800 pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 vintage-btn bg-[#3b4d3e] text-white py-2 font-bold cursor-pointer"
                  >
                    {isSubmitting ? "REGISTRANDO HOJA..." : "REGISTRAR PLAN EN CENTRAL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="vintage-btn bg-zinc-800 text-zinc-300 py-2 hover:bg-zinc-700 cursor-pointer"
                  >
                    RETORNAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: REGISTRAR RETORNO DE LA EXPEDICIÓN CON MATERIALES RESCATADOS */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border-4 border-[#4c6351] max-w-lg w-full p-6 text-white font-mono shadow-[0_0_24px_rgba(76,99,81,0.25)] rounded-lg"
            >
              <div className="border-b-2 border-[#4c6351] pb-3 mb-4 flex justify-between items-center">
                <h3 className="font-typewriter text-md text-[#4c6351] font-bold tracking-widest flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  HOJA DE REGISTRO DE RETORNO Y EXCLUSIÓN DE ZONA
                </h3>
                <button
                  onClick={() => setIsReturnModalOpen(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer font-bold"
                >
                  [X]
                </button>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4">
                <p className="text-[11px] text-zinc-400 uppercase leading-4 border-b border-zinc-900 pb-2">
                  INDIQUE TODOS LOS ELEMENTOS LOGÍSTICOS RECUPERADOS EN LA ZONA MUERTA POR EL EQUIPO
                  DE COMBATE. ESTAS CANTIDADES SE AÑADIRÁN DINÁMICAMENTE A LA DESPENSA EN EL BÚNKER
                  ALFA.
                </p>

                {/* Dynamic fields inputs for quantities found */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {resources.map((res) => (
                    <div
                      key={res.id}
                      className="flex justify-between items-center p-1.5 bg-zinc-900/60 border border-zinc-800 rounded"
                    >
                      <div className="text-left pl-1">
                        <span className="text-xs font-bold uppercase block text-white">
                          {res.name}
                        </span>
                        <span className="text-[9px] block text-zinc-500 font-mono">
                          UNIDAD DE MEDIDA: {res.unit}
                        </span>
                      </div>
                      <div className="w-28 flex items-center gap-1.5">
                        <input
                          type="number"
                          className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors text-right w-full"
                          min={0}
                          value={salvagedResources[res.id] || 0}
                          onChange={(e) => handleSalvageChange(res.id, Number(e.target.value))}
                        />
                        <span className="text-[10px] text-zinc-400">{res.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Return comments notes input */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="exp-return-notes"
                    className="text-[10px] text-[#ab9e8b] uppercase font-bold"
                  >
                    INFORME DEL LÍDER DE OPERACIÓN EN RETORNO
                  </label>
                  <textarea
                    id="exp-return-notes"
                    className="w-full bg-[#111111]/90 border border-[#3b4d3e] text-white text-xs font-mono py-2 px-3 rounded uppercase focus:outline-none focus:border-[#c27c2f] focus:ring-1 focus:ring-[#c27c2f] transition-colors h-14 resize-none"
                    placeholder="EJ. EXPEDICIÓN ALTAMENTE RENTABLE. ENCONTRAMOS BOTELLAS SELLADAS EN BASE DAWNTECH..."
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>

                <div className="border-t border-zinc-900 pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-[#4c6351] hover:bg-[#3b4d3e] text-white py-1.5 px-3 font-typewriter font-bold text-[10px] uppercase border border-black rounded shadow-[1px_1px_0_#000]"
                  >
                    {isSubmitting ? "INVENTARIANDO..." : "REGISTRAR INGRESO EN ALMACÉN"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="vintage-btn bg-zinc-800 text-zinc-300 py-2 hover:bg-zinc-700 cursor-pointer"
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

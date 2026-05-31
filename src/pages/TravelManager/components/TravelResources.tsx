import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Droplets,
  Utensils,
  HeartPulse,
  Hammer,
  Filter,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  Crosshair,
  Flame,
  Bed,
  Archive,
  Navigation,
  ClipboardList,
  AlertCircle,
} from "lucide-react"
import { useState, useMemo } from "react"

import { getCamps } from "@/features/camps/services/camps.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { useAuth } from "@/pages/Admin/context/AuthContext"

export interface Resource {
  id: string
  name: string
  category: string
  unit: string
  campId: string
  quantity: number
  status: "sufficient" | "low" | "insufficient" | "critical" | "none"
  minThreshold?: number
  usageNotes?: string
  description?: string
}

type ResourceStatus = Resource["status"] | "all"

export default function TravelResources() {
  const { user } = useAuth()
  const baseCampId = user?.camp_id ?? ""
  const [activeStatus, setActiveStatus] = useState<ResourceStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Consultas asíncronas reales
  const { data: campsData = [], isError: campsError } = useQuery({
    queryKey: ["camps"],
    queryFn: getCamps,
  })

  const { data: inventoryData = [], isError: inventoryError } = useQuery({
    queryKey: ["inventory", baseCampId],
    queryFn: () => getInventory(baseCampId),
    enabled: !!baseCampId,
  })

  const hasError = campsError || inventoryError

  const camps = campsData.map((c: { id: string | number; name: string }) => ({
    id: String(c.id),
    name: c.name,
  }))

  // Mapear los datos reales del backend al formato que espera la plantilla
  const resources: Resource[] = useMemo(() => {
    return inventoryData.map((item) => {
      let status: Resource["status"] = "sufficient"
      if (item.current_quantity === 0) {
        status = "none"
      } else if (item.current_quantity <= (item.minimum_stock_required || 0) * 0.5) {
        status = "critical"
      } else if (item.alert_active) {
        status = "insufficient"
      } else if (item.current_quantity <= (item.minimum_stock_required || 0) * 1.5) {
        status = "low"
      }

      return {
        id: String(item.resource_id),
        name: item.resource?.name || "Recurso Desconocido",
        category: item.resource?.category || "general",
        unit: item.resource?.unit || "UNID",
        campId: String(item.camp_id || baseCampId),
        quantity: item.current_quantity || 0,
        status: status,
        minThreshold: item.minimum_stock_required || 0,
        description: item.resource?.description || "",
        usageNotes: "",
      }
    })
  }, [inventoryData, baseCampId])

  const baseCamp = camps.find((c) => c.id === baseCampId)

  const getCampName = (id: string) => camps.find((c) => c.id === id)?.name || id

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (r.campId !== baseCampId) return false
      if (activeStatus !== "all" && r.status !== activeStatus) return false
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false
      if (searchQuery) {
        return r.name.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    })
  }, [resources, baseCampId, activeStatus, categoryFilter, searchQuery])

  const selectedResource = useMemo(
    () => resources.find((r) => r.id === selectedId) || null,
    [resources, selectedId],
  )

  const stats = useMemo(() => {
    const campRes = resources.filter((r) => r.campId === baseCampId)
    return [
      {
        id: "sufficient",
        label: "Suficientes",
        count: campRes.filter((r) => r.status === "sufficient").length,
        color: "text-accent-approved",
      },
      {
        id: "low",
        label: "Bajos",
        count: campRes.filter((r) => r.status === "low").length,
        color: "text-[#c27c2f]",
      },
      {
        id: "insufficient",
        label: "Insuficientes",
        count: campRes.filter((r) => r.status === "insufficient").length,
        color: "text-accent-critical",
      },
      {
        id: "critical",
        label: "Críticos",
        count: campRes.filter((r) => r.status === "critical").length,
        color: "text-red-800",
      },
    ]
  }, [resources, baseCampId])

  const categories = ["all", ...Array.from(new Set(resources.map((r) => r.category)))]

  const getIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "water":
        return Droplets
      case "food":
        return Utensils
      case "medicine":
        return HeartPulse
      case "tools":
        return Hammer
      case "weaponry":
        return Crosshair
      case "fuel":
        return Flame
      case "rest":
        return Bed
      default:
        return Package
    }
  }

  const getStatusLabel = (status: Resource["status"]) => {
    switch (status) {
      case "sufficient":
        return "Suficiente"
      case "low":
        return "Bajo"
      case "insufficient":
        return "Insuficiente"
      case "critical":
        return "Crítico"
      case "none":
        return "Sin Stock"
      default:
        return status
    }
  }

  const getStatusColor = (status: Resource["status"]) => {
    switch (status) {
      case "sufficient":
        return "text-accent-approved"
      case "low":
        return "text-[#c27c2f]"
      case "insufficient":
        return "text-accent-critical"
      case "critical":
        return "text-red-800"
      default:
        return "text-white/20"
    }
  }

  const getLevelColor = (status: Resource["status"]) => {
    switch (status) {
      case "sufficient":
        return "bg-accent-approved"
      case "low":
        return "bg-[#c27c2f]"
      case "insufficient":
        return "bg-accent-critical"
      case "critical":
        return "bg-red-800"
      default:
        return "bg-white/10"
    }
  }

  // Evaluation for prep panel — memoized to avoid recomputing on unrelated re-renders
  const criticalShortages = useMemo(
    () => filteredResources.filter((r) => r.status === "critical" || r.status === "insufficient"),
    [filteredResources],
  )
  const isTripReady = criticalShortages.length === 0 && filteredResources.length > 0

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden bg-[#0a0a0a] p-4">
      {/* 1. Header de la vista */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#12110f] p-4 rounded-lg border border-[#d4a373]/20 border-t-2 border-t-[#d4a373]/60 shrink-0 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-[#d4a373]/10 p-2 border border-[#d4a373]/30 rounded">
            <Archive className="h-6 w-6 text-[#d4a373]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-bg-paper paper-texture text-ink text-sm font-mono font-black uppercase rotate-1 shadow-sm border border-bg-paper-shadow/30">
                Logística_Refugio
              </span>
              <span className="text-sm font-mono text-[#d4a373]/40 uppercase tracking-widest font-black">
                INV_OPERATIONAL
              </span>
            </div>
            <h2 className="text-lg font-typewriter font-bold text-white uppercase tracking-tight leading-none">
              RECURSOS DE VIAJE
            </h2>
            <p className="font-mono text-xs text-[#d4a373]/80 uppercase tracking-widest mt-1">
              Inventario operativo: {baseCamp?.name.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0 relative z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStatus(s.id as ResourceStatus)}
                aria-pressed={activeStatus === s.id}
                className={`flex flex-col items-center transition-all duration-150 px-3 py-2 rounded border ${
                  activeStatus === s.id
                    ? "bg-[#d4a373]/10 border-[#d4a373]/30"
                    : "border-transparent hover:bg-[#d4a373]/10 hover:border-[#d4a373]/15"
                }`}
              >
                <span className={`text-base font-mono font-bold tabular-nums ${s.color}`}>
                  {s.count}
                </span>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wide mt-0.5">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasError && (
        <div className="bg-red-950/40 border border-red-500/50 p-3 font-mono text-sm text-red-400 uppercase flex items-center gap-2 shadow-lg mb-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      {/* 2. Barra de filtros compacta */}
      <div className="bg-[#12110f] p-2 px-4 rounded-lg flex items-center gap-4 shrink-0 border border-white/5">
        <div className="flex-1 flex items-center gap-3 bg-black/40 px-3 py-2 rounded border border-white/10 focus-within:border-[#d4a373]/40 transition-all">
          <Search className="h-3.5 w-3.5 text-white/20 shrink-0" />
          <input
            type="text"
            placeholder="Buscar recurso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-xs font-mono text-white/70 w-full placeholder:text-white/20"
          />
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-white/40 px-4 border-l border-white/10">
          <span className="text-[#d4a373]/50">Base:</span>
          <span className="text-[#d4a373] font-semibold">
            {baseCamp?.name?.toUpperCase() ?? baseCampId}
          </span>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
          <Filter className="h-3 w-3 text-white/20 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría"
            className="bg-transparent border-none text-[10px] font-mono text-white/40 uppercase focus:outline-none cursor-pointer hover:text-[#fca311] transition-all"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#12110f]">
                {c === "all" ? "TODAS" : c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* PANEL IZQUIERDO: INVENTARIO DE VIAJE */}
        <div
          className="md:w-72 w-full flex flex-col gap-2 md:shrink-0 overflow-hidden bg-[#12110f] p-3 rounded-lg border border-[#d4a373]/15 shadow-2xl relative"
          style={{ maxHeight: selectedId ? undefined : undefined }}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#d4a373]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

          <div className="flex flex-col px-1 mb-1 border-b border-[#d4a373]/10 pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-[#d4a373] uppercase tracking-widest">
                Inventario de Viaje
              </span>
              <span className="text-[10px] font-mono text-white/30 uppercase bg-white/5 px-1.5 py-0.5 rounded tabular-nums">
                {filteredResources.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 relative z-10">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => {
                const Icon = getIcon(resource.category)
                return (
                  <motion.button
                    key={resource.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedId(resource.id)}
                    className={`w-full text-left p-3 relative transition-all border border-[#d4a373]/10 rounded group shadow-md ${
                      selectedId === resource.id
                        ? "bg-bg-paper paper-texture scale-[1.02] z-10"
                        : "bg-[#b69e7e]/5 hover:bg-[#b69e7e]/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 border ${selectedId === resource.id ? "bg-ink/5 border-ink/10" : "bg-black/20 border-white/5"}`}
                      >
                        <Icon
                          className={`h-4 w-4 ${selectedId === resource.id ? "text-ink/60" : "text-[#d4a373]/40"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5
                          className={`text-xs font-typewriter font-bold uppercase truncate ${
                            selectedId === resource.id ? "text-ink" : "text-[#d4a373]"
                          }`}
                        >
                          {resource.name}
                        </h5>
                        <div className="flex justify-between items-center mt-1">
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wide ${selectedId === resource.id ? "text-ink/40" : "text-[#d4a373]/40"}`}
                          >
                            {resource.category}
                          </span>
                          <span
                            className={`text-xs font-mono font-semibold tabular-nums ${selectedId === resource.id ? "text-ink" : "text-white/60"}`}
                          >
                            {resource.quantity} {resource.unit.toUpperCase()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-black/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min((resource.quantity / (resource.minThreshold || 100)) * 100, 100)}%`,
                              }}
                              className={`h-full ${getLevelColor(resource.status)} opacity-80`}
                            />
                          </div>
                          <span
                            className={`text-[10px] font-mono font-semibold uppercase ${getStatusColor(resource.status)}`}
                          >
                            {getStatusLabel(resource.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedId === resource.id && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#d4a373]" />
                    )}
                  </motion.button>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Archive className="h-10 w-10 text-[#d4a373]/10 mb-4" />
                <p className="text-sm font-mono text-white/20 uppercase font-black">
                  Sin recursos registrados
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PANEL CENTRAL: FICHA DEL RECURSO SELECCIONADO */}
        <div
          className={`flex-1 flex flex-col bg-[#12110f] rounded-lg overflow-hidden border border-white/5 shadow-2xl relative ${!selectedId ? "hidden md:flex" : "flex"}`}
        >
          <AnimatePresence mode="wait">
            {selectedResource ? (
              <motion.div
                key={selectedResource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header Manifest */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="md:hidden text-[#d4a373]/60 hover:text-[#d4a373] font-mono text-xs uppercase tracking-wide flex items-center gap-1 mr-3 transition-colors"
                    aria-label="Volver a la lista"
                  >
                    ← Volver
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="bg-[#b69e7e]/10 p-2 rounded border border-[#b69e7e]/20">
                      <ClipboardList className="h-5 w-5 text-[#d4a373]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-typewriter font-bold text-white uppercase tracking-wider">
                        Detalle del Recurso
                      </h3>
                      <p className="text-[10px] font-mono text-[#d4a373]/50 uppercase tracking-wide">
                        Ficha #{selectedResource.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content - Old Paper Manifest */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden bg-[#0c0c0c] items-center justify-center">
                  <div className="w-full h-full max-w-2xl bg-bg-paper paper-texture shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden p-12 border-[8px] border-[#8b7355]/10 flex flex-col">
                    <div className="absolute top-10 right-10 flex flex-col items-center rotate-6 select-none opacity-40">
                      <div className="border-4 border-ink p-1 mb-1">
                        <span className="text-lg font-black font-mono px-2">REGISTRADO</span>
                      </div>
                      <span className="text-sm font-mono font-black italic">
                        Refugio Alfa - Logística
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col relative z-10">
                      <div className="mb-8 pb-5 border-b-4 border-double border-ink/20">
                        <h2
                          className="text-3xl font-typewriter font-bold text-ink uppercase leading-none"
                          style={{ textWrap: "balance" }}
                        >
                          {selectedResource.name}
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Clasificación
                            </span>
                            <p className="text-sm font-typewriter font-bold text-ink uppercase mt-1">
                              {selectedResource.category}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Unidad de Medida
                            </span>
                            <p className="text-sm font-mono font-semibold text-ink uppercase mt-1">
                              {selectedResource.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-mono text-ink/40 uppercase tracking-wider">
                              Asignado a
                            </span>
                            <p className="text-sm font-mono font-semibold text-ink uppercase mt-1">
                              {getCampName(selectedResource.campId)}
                            </p>
                          </div>
                        </div>

                        <div className="bg-ink/5 p-6 rounded-sm border border-ink/10 flex flex-col items-center justify-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-ink/10" />
                          <span className="text-xs font-mono text-ink/40 uppercase tracking-wider mb-4">
                            Stock Vital
                          </span>
                          <div className="text-5xl font-typewriter font-bold text-ink leading-none mb-1 tabular-nums">
                            {selectedResource.quantity}
                          </div>
                          <span className="text-xs font-mono text-ink/60 uppercase tracking-widest">
                            {selectedResource.unit}
                          </span>
                          <div
                            className={`mt-4 px-3 py-1.5 border font-mono font-semibold text-xs uppercase rotate-[-2deg] ${getStatusColor(selectedResource.status).replace("text-", "border-")}`}
                          >
                            {getStatusLabel(selectedResource.status)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-12 space-y-6">
                        <div>
                          <h4 className="text-xs font-mono font-black text-ink/40 border-b border-ink/5 pb-1 mb-3 uppercase">
                            ESTADO DE DISPONIBILIDAD
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-sm font-mono mb-1">
                              <span className="text-ink/60">UMBRAL CRÍTICO MÍNIMO</span>
                              <span className="font-black text-ink">
                                {selectedResource.minThreshold || 0}{" "}
                                {selectedResource.unit.toUpperCase()}
                              </span>
                            </div>
                            <div className="h-6 w-full bg-ink/5 border border-ink/20 relative group overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min((selectedResource.quantity / (selectedResource.minThreshold || 1)) * 50, 100)}%`,
                                }}
                                className={`h-full ${getLevelColor(selectedResource.status).replace("bg-", "bg-")} opacity-60 shadow-inner`}
                              />
                              <div className="absolute inset-0 flex items-center justify-center mix-blend-difference">
                                <span className="text-sm font-mono font-black text-white/40 uppercase tracking-widest">
                                  NIVEL_RECURSO_ACTUAL
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-mono font-black text-ink/40 border-b border-ink/5 pb-1 mb-2 uppercase">
                            RECOMENDACIÓN DE USO
                          </h4>
                          <div className="p-4 bg-white/40 border border-ink/10 rounded-sm italic font-typewriter text-sm text-ink/80 leading-relaxed min-h-[60px]">
                            {selectedResource.usageNotes ||
                              "Sin instrucciones adicionales de uso operativo."}
                          </div>
                          <p className="mt-2 text-sm font-mono text-ink/40 leading-tight">
                            {selectedResource.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 flex justify-between items-center text-[10px] font-mono text-ink/30 uppercase">
                        <span>Actualizado: {new Date().toLocaleDateString("es-CR")}</span>
                        <span className="text-ink/50">Ref. {selectedResource.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <Database className="h-16 w-16 mb-6 text-[#d4a373] opacity-20" />
                <h3 className="text-base font-typewriter font-bold text-white/40 uppercase mb-2">
                  Selecciona un recurso
                </h3>
                <p className="text-xs font-mono text-white/25 max-w-xs leading-relaxed">
                  Elige un item de la lista para ver su ficha completa con stock, umbral y estado.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* PANEL DERECHO: PREPARACIÓN DE VIAJE */}
        <div className="hidden lg:flex w-64 flex-col gap-3 shrink-0 overflow-hidden">
          <div className="bg-[#12110f] p-4 rounded-lg flex flex-col h-full border border-white/5 shadow-2xl overflow-hidden relative">
            <h3 className="text-xs font-mono font-semibold text-[#d4a373] uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0 border-b border-[#d4a373]/10 pb-3">
              <Navigation className="h-3.5 w-3.5" /> Preparación de Viaje
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-5">
              <div className="space-y-4">
                <motion.div
                  animate={isTripReady ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`p-4 rounded-sm border border-dashed relative flex flex-col items-center text-center ${
                    isTripReady
                      ? "bg-accent-approved/10 border-accent-approved/30 shadow-[0_0_20px_rgba(76,99,81,0.2)]"
                      : "bg-red-900/10 border-red-900/20"
                  }`}
                >
                  <span className="text-[10px] font-mono text-white/30 font-semibold uppercase block mb-2 tracking-wider">
                    Estado de Preparación
                  </span>
                  {isTripReady ? (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      >
                        <CheckCircle2 className="h-8 w-8 text-accent-approved mb-2" />
                      </motion.div>
                      <span className="text-sm font-typewriter font-bold uppercase text-accent-approved">
                        LISTO PARA VIAJE
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-accent-critical mb-2" />
                      <span className="text-sm font-typewriter font-bold uppercase text-accent-critical">
                        REQUIERE REVISIÓN
                      </span>
                    </>
                  )}
                </motion.div>

                <div className="bg-black/20 border border-white/5 p-3 rounded-sm space-y-2">
                  <h4 className="text-[10px] font-mono font-semibold text-white/40 uppercase tracking-widest mb-1">
                    SITUACIÓN DE INSUMOS
                  </h4>
                  {[
                    {
                      label: "Agua",
                      status:
                        resources.filter(
                          (r) =>
                            r.campId === baseCampId &&
                            r.category === "water" &&
                            r.status !== "sufficient" &&
                            r.status !== "low",
                        ).length === 0
                          ? "ÓPTIMA"
                          : "BAJA",
                      color:
                        resources.filter(
                          (r) =>
                            r.campId === baseCampId &&
                            r.category === "water" &&
                            r.status !== "sufficient" &&
                            r.status !== "low",
                        ).length === 0
                          ? "text-accent-approved"
                          : "text-accent-critical",
                    },
                    {
                      label: "Víveres",
                      status:
                        resources.filter(
                          (r) =>
                            r.campId === baseCampId &&
                            r.category === "food" &&
                            (r.status === "critical" || r.status === "insufficient"),
                        ).length === 0
                          ? "SUFICIENTE"
                          : "LIMITADA",
                      color:
                        resources.filter(
                          (r) =>
                            r.campId === baseCampId &&
                            r.category === "food" &&
                            (r.status === "critical" || r.status === "insufficient"),
                        ).length === 0
                          ? "text-accent-approved"
                          : "text-[#c27c2f]",
                    },
                    {
                      label: "Medicina",
                      status:
                        resources.filter(
                          (r) =>
                            r.campId === baseCampId &&
                            r.category === "medicine" &&
                            (r.status === "critical" || r.status === "insufficient"),
                        ).length === 0
                          ? "SUFICIENTE"
                          : "CRÍTICA",
                      color:
                        resources.filter(
                          (r) =>
                            r.campId === baseCampId &&
                            r.category === "medicine" &&
                            (r.status === "critical" || r.status === "insufficient"),
                        ).length === 0
                          ? "text-accent-approved"
                          : "text-accent-critical",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-xs font-mono text-white/50 uppercase">
                        {item.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-semibold uppercase tabular-nums ${item.color}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                {!isTripReady && criticalShortages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-black text-red-500 uppercase flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> FALTANTES CRÍTICOS
                    </span>
                    <div className="space-y-1.5">
                      {criticalShortages.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2 bg-red-950/20 border border-red-900/10 rounded-sm"
                        >
                          <span className="text-xs font-mono text-red-100/60 uppercase truncate flex-1">
                            {r.name}
                          </span>
                          <span className="text-sm font-mono font-black text-red-500 ml-2">
                            {r.quantity} {r.unit}
                          </span>
                        </div>
                      ))}
                      {criticalShortages.length > 3 && (
                        <p className="text-sm font-mono text-white/20 text-center uppercase mt-1">
                          + {criticalShortages.length - 3} recursos adicionales insuficientes
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <button
                  disabled={!isTripReady}
                  className={`w-full py-2 font-mono font-semibold text-xs uppercase rounded transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 ${
                    isTripReady
                      ? "bg-accent-approved text-black hover:bg-white shadow-md"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  }`}
                >
                  Preparar Exploración
                </button>
                {!isTripReady && (
                  <button className="w-full py-2 bg-[#c27c2f]/80 text-black font-mono font-semibold text-xs uppercase rounded shadow-md hover:bg-[#fca311] transition-all duration-150 active:scale-95">
                    Solicitar Suministros
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto pt-3 border-t border-white/5 shrink-0">
              <div className="p-3 bg-black/40 rounded-sm border border-[#d4a373]/20">
                <p className="font-typewriter text-[10px] text-[#d4a373]/80 uppercase tracking-wide leading-relaxed">
                  Nota Operativa
                </p>
                <p className="font-mono text-[10px] text-white/40 leading-relaxed mt-1">
                  No autorizar salidas sin al menos 48h de raciones de emergencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  Droplets,
  Utensils,
  HeartPulse,
  Hammer,
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
import { useAuthStore } from "@/store/useAuthStore"

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
  const { user } = useAuthStore()
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

  const criticalShortages = useMemo(
    () => filteredResources.filter((r) => r.status === "critical" || r.status === "insufficient"),
    [filteredResources],
  )
  const isTripReady = criticalShortages.length === 0 && filteredResources.length > 0

  return (
    <div className="tm-container">
      {/* 1. Header de la vista */}
      <div className="tm-board-header">
        <div className="tm-board-left">
          <div className="tm-online-dot" />
          <div>
            <h2 className="tm-board-title leading-none">Recursos de Viaje</h2>
            <p className="tm-board-sub mt-1">Base: {baseCamp?.name.toUpperCase() ?? baseCampId.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="tm-folder-tabs">
            <button
              onClick={() => setActiveStatus("all")}
              className={`tm-tab ${activeStatus === "all" ? "tm-tab-active" : ""}`}
            >
              TODOS ({resources.filter(r => r.campId === baseCampId).length})
            </button>
            {stats.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setActiveStatus(activeStatus === s.id ? "all" : (s.id as ResourceStatus))}
                className={`tm-tab ${activeStatus === s.id ? "tm-tab-active" : ""}`}
              >
                {s.label.toUpperCase()} ({s.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasError && (
        <div className="tm-alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Error de conexión con la central. Modo fuera de línea activo. No se pudieron cargar los
            datos recientes.
          </span>
        </div>
      )}

      {/* 2. Filtros */}
      <div className="flex flex-wrap gap-3 shrink-0 items-center bg-[#1c1208] p-3 border border-[#d4a373]/20 rounded-md">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Buscar recurso..."
            className="vintage-input w-full pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-[#121110] border border-[#d4a373]/20 px-4 py-2 rounded-md">
          <span className="text-xs font-mono text-white/30 uppercase font-black">Categoría:</span>
          <select
            className="bg-transparent text-xs font-mono text-[#c27c2f] font-black focus:outline-none uppercase cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-[#121110] text-[#c27c2f]">
                {c === "all" ? "TODAS" : c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Layout de columnas */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* LEFT: Inventario */}
        <div className="w-[290px] flex flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border border-[#d4a373]/20 rounded-md shadow-lg">
          <div className="tm-folder-header-row mb-1">
            <h4 className="tm-folder-title">INVENTARIO DE VIAJE</h4>
            <span className="text-[10px] font-mono font-medium text-white/30 uppercase tracking-wider">
              {filteredResources.length} REG
            </span>
          </div>

          <div className="tm-op-list">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => {
                const Icon = getIcon(resource.category);
                const rowStatusClass = resource.status === "sufficient" ? "tm-row-active" 
                                     : resource.status === "low" ? "tm-row-transit"
                                     : "tm-row-pending";
                const statusLabelClass = resource.status === "sufficient" ? "text-green-500" 
                                       : resource.status === "low" ? "text-amber-500"
                                       : "text-red-500";
                return (
                  <motion.button
                    key={resource.id}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedId(resource.id)}
                    className={`tm-op-row cursor-pointer transition-all ${rowStatusClass} ${
                      selectedId === resource.id ? "selected" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="px-2 py-0.5 bg-white/10 text-[8px] font-mono text-[#e8dcc8] font-bold tracking-wider rounded-sm">
                        REF-{resource.id.slice(0, 4).toUpperCase()}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${statusLabelClass}`}>
                        {getStatusLabel(resource.status).toUpperCase()}
                      </span>
                    </div>

                    <h5 className={`text-[12px] font-mono font-bold uppercase tracking-tight truncate mt-0.5 w-full flex items-center gap-1.5 ${
                      selectedId === resource.id ? "text-[#df8120]" : "text-white"
                    }`}>
                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      {resource.name}
                    </h5>

                    <div className="flex justify-between items-center w-full mt-1.5">
                      <span className="text-[8px] font-mono text-white/40 uppercase tracking-wide">
                        {resource.category}
                      </span>
                      <span className="text-[10px] font-mono font-black text-white/80">
                        {resource.quantity} {resource.unit.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 w-full flex items-center gap-1.5">
                      <div className="flex-1 h-1 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getLevelColor(resource.status)} opacity-80`}
                          style={{ width: `${Math.min((resource.quantity / (resource.minThreshold || 100)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.button>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Archive className="h-10 w-10 text-[#df8120]/15 mb-4" />
                <p className="text-xs font-mono text-white/30 uppercase leading-relaxed font-black mb-3">
                  Sin recursos registrados
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Visualizador */}
        <div className="flex-1 flex flex-col bg-[#1c1208] border border-[#d4a373]/20 rounded-md overflow-hidden shadow-lg">
          <AnimatePresence mode="wait">
            {selectedResource ? (
              <motion.div
                key={selectedResource.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-[#d4a373]/15 flex items-center justify-between shrink-0 bg-black/20">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-[#df8120] shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-black block mb-0.5">
                        RECURSO SELECCIONADO
                      </span>
                      <h3 className="text-sm font-typewriter font-black text-white uppercase leading-none tracking-wider">
                        {selectedResource.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="tm-op-btn md:hidden"
                      style={{ padding: "6px 12px" }}
                    >
                      Volver
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-5 flex flex-col overflow-hidden items-center justify-center relative bg-black/25">
                  <div className="tm-paper tm-paper-texture w-full h-full max-w-2xl relative overflow-hidden p-8 flex flex-col shadow-2xl">
                    <div className="absolute top-10 right-10 flex flex-col items-center rotate-6 select-none opacity-20">
                      <div className="border-4 border-ink p-1 mb-1">
                        <span className="text-lg font-black font-mono px-2">REGISTRADO</span>
                      </div>
                      <span className="text-xs font-mono font-black italic">
                        Refugio Alfa - Logística
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="border-b-2 border-dashed border-ink/20 pb-3 mb-6">
                        <span className="text-[10px] font-mono text-ink-soft uppercase tracking-widest font-black block mb-1">
                          EXPEDIENTE DE SUMINISTROS
                        </span>
                        <h2 className="font-typewriter text-2xl font-black text-ink uppercase leading-none">
                          {selectedResource.name}
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="space-y-4 font-mono text-xs text-ink/80">
                          <div>
                            <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-bold">
                              Clasificación
                            </span>
                            <span className="text-sm font-bold text-ink uppercase">
                              {selectedResource.category}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-bold">
                              Unidad de Medida
                            </span>
                            <span className="text-sm font-bold text-ink uppercase">
                              {selectedResource.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-bold">
                              Asignado a
                            </span>
                            <span className="text-sm font-bold text-ink uppercase">
                              {getCampName(selectedResource.campId)}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#f5ecd7] p-5 rounded-sm border border-[#d4c4a8]/50 flex flex-col items-center justify-center relative overflow-hidden">
                          <span className="text-[10px] font-mono text-ink-soft uppercase tracking-wider mb-2 font-bold">
                            Stock Vital
                          </span>
                          <div className="text-5xl font-typewriter font-bold text-ink leading-none mb-1 tabular-nums">
                            {selectedResource.quantity}
                          </div>
                          <span className="text-[10px] font-mono text-ink-soft uppercase tracking-widest font-bold">
                            {selectedResource.unit.toUpperCase()}
                          </span>
                          <div
                            className={`mt-4 px-3 py-1 border font-mono font-bold text-xs uppercase ${getStatusColor(selectedResource.status).replace("text-", "border-").replace("text-[#c27c2f]", "border-[#c27c2f]")}`}
                          >
                            {getStatusLabel(selectedResource.status).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="bg-[#faf4e6]/50 p-4 border border-dashed border-ink/20 rounded-sm">
                          <div className="flex justify-between items-center text-xs font-mono mb-2">
                            <span className="text-ink-soft uppercase font-bold">Umbral Crítico Mínimo</span>
                            <span className="font-bold text-ink">
                              {selectedResource.minThreshold || 0} {selectedResource.unit.toUpperCase()}
                            </span>
                          </div>
                          <div className="h-4 w-full bg-ink/5 border border-ink/20 relative rounded-sm overflow-hidden">
                            <div
                              className={`h-full ${getLevelColor(selectedResource.status)} opacity-60 shadow-inner`}
                              style={{ width: `${Math.min((selectedResource.quantity / (selectedResource.minThreshold || 1)) * 50, 100)}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[8px] font-mono font-black text-ink-soft uppercase tracking-widest">
                                NIVEL_RECURSO_ACTUAL
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-ink-soft uppercase tracking-wider block font-bold mb-1.5">
                            Recomendación de Uso y Observaciones
                          </span>
                          <div className="p-4 bg-white/40 border border-ink/10 rounded-sm italic font-typewriter text-xs text-ink/80 leading-relaxed min-h-[60px]">
                            {selectedResource.usageNotes || selectedResource.description ||
                              "Sin instrucciones adicionales de uso operativo registrado para este recurso."}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-ink/15 pt-3 mt-6 flex justify-between items-center text-ink-soft/70 font-mono text-[9px] uppercase tracking-wider">
                        <span>Actualizado: {new Date().toLocaleDateString("es-CR")}</span>
                        <span className="border border-dashed border-ink/30 px-2 py-0.5">Ref. {selectedResource.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-black/15">
                <Database className="h-20 w-20 mb-6 text-[#c27c2f] opacity-20" />
                <h3 className="font-typewriter text-2xl text-white/20 font-black uppercase mb-3">
                  Seleccione un Recurso
                </h3>
                <p className="font-mono text-sm text-white/20 uppercase tracking-widest">
                  Para visualizar sus especificaciones y stock vital.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Preparación de Viaje */}
        <div className="hidden lg:flex w-64 flex-col gap-3 shrink-0 overflow-hidden bg-[#1c1208] p-4 border border-[#d4a373]/20 rounded-md shadow-lg justify-between">
          <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <h3 className="text-xs font-mono font-black text-[#df8120] uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-[#d4a373]/15 pb-2.5">
              <Navigation className="h-4 w-4" /> Preparación de Viaje
            </h3>

            <div className="space-y-4">
              <motion.div
                animate={isTripReady ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`p-4 rounded-sm border border-dashed relative flex flex-col items-center text-center ${
                  isTripReady
                    ? "bg-[#4c6351]/10 border-[#4c6351]/30 shadow-[0_0_20px_rgba(76,99,81,0.2)]"
                    : "bg-[#9c2720]/10 border-[#9c2720]/20"
                }`}
              >
                <span className="text-[9px] font-mono text-white/30 font-bold uppercase block mb-1.5 tracking-wider">
                  Estado de Preparación
                </span>
                {isTripReady ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-[#4c6351] mb-2 animate-bounce" />
                    <span className="text-xs font-typewriter font-bold uppercase text-[#4c6351]">
                      LISTO PARA VIAJE
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-8 w-8 text-[#9c2720] mb-2" />
                    <span className="text-xs font-typewriter font-bold uppercase text-[#9c2720]">
                      REQUIERE REVISIÓN
                    </span>
                  </>
                )}
              </motion.div>

              <div className="bg-black/20 border border-[#d4a373]/10 p-3 rounded-sm space-y-2 font-mono text-[10px]">
                <h4 className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5 border-b border-[#d4a373]/5 pb-1">
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
                        ? "text-green-500"
                        : "text-red-500",
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
                        ? "text-green-500"
                        : "text-amber-500",
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
                        ? "text-green-500"
                        : "text-red-500",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-white/50 uppercase">{item.label}</span>
                    <span className={`font-bold uppercase ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>

              {!isTripReady && criticalShortages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-black text-[#9c2720] uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> FALTANTES CRÍTICOS
                  </span>
                  <div className="space-y-1.5">
                    {criticalShortages.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2 bg-[#9c2720]/10 border border-[#9c2720]/20 rounded-sm font-mono text-[9px]"
                      >
                        <span className="text-white/60 uppercase truncate flex-1">{r.name}</span>
                        <span className="font-black text-[#9c2720] ml-2">
                          {r.quantity} {r.unit}
                        </span>
                      </div>
                    ))}
                    {criticalShortages.length > 3 && (
                      <p className="text-[9px] font-mono text-white/30 text-center uppercase mt-1">
                        + {criticalShortages.length - 3} adicionales
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-black/40 rounded-sm border border-[#d4a373]/15">
              <p className="font-typewriter text-[9px] text-[#df8120] uppercase tracking-wide leading-relaxed font-black">
                Nota Operativa
              </p>
              <p className="font-mono text-[9px] text-white/40 leading-relaxed mt-1">
                No autorizar salidas sin al menos 48h de raciones de emergencia.
              </p>
            </div>

            <div className="space-y-2">
              <button
                disabled={!isTripReady}
                className="tm-action-btn tm-action-btn-primary w-full"
                style={{ padding: "8px 12px", borderRadius: "4px" }}
              >
                <span className="tm-action-label">Preparar Exploración</span>
                <span className="tm-action-sub">Despliegue de patrulla</span>
              </button>
              {!isTripReady && (
                <button
                  type="button"
                  className="tm-btn w-full text-center"
                  style={{ padding: "8px 12px", borderRadius: "4px" }}
                >
                  Solicitar Suministros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

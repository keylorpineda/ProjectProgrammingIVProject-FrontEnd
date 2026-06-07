import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertTriangle,
  Search,
  XCircle,
  Navigation,
  ClipboardList,
  AlertCircle,
  Users,
} from "lucide-react"
import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { getCamps } from "@/features/camps/services/camps.service"
import { getInventory } from "@/features/inventory/services/inventory.service"
import { getPersons } from "@/features/persons/services/persons.service"
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

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  water: { label: "Agua", icon: "💧" },
  agua: { label: "Agua", icon: "💧" },
  food: { label: "Comida", icon: "🌽" },
  comida: { label: "Comida", icon: "🌽" },
  medicine: { label: "Medicina", icon: "💊" },
  medical: { label: "Medicina", icon: "💊" },
  medicina: { label: "Medicina", icon: "💊" },
  tools: { label: "Herramientas", icon: "🔧" },
  herramientas: { label: "Herramientas", icon: "🔧" },
  weaponry: { label: "Armamento", icon: "⚔️" },
  weapons: { label: "Armamento", icon: "⚔️" },
  armas: { label: "Armamento", icon: "⚔️" },
  armamento: { label: "Armamento", icon: "⚔️" },
  fuel: { label: "Combustible", icon: "⛽" },
  combustible: { label: "Combustible", icon: "⛽" },
  rest: { label: "Descanso", icon: "🛏️" },
  descanso: { label: "Descanso", icon: "🛏️" },
  clothing: { label: "Vestimenta", icon: "👕" },
  ropa: { label: "Vestimenta", icon: "👕" },
  vestimenta: { label: "Vestimenta", icon: "👕" },
}

function getCategoryInfo(rawCategory: string | undefined | null) {
  const clean = String(rawCategory ?? "").toLowerCase().trim()
  return CATEGORY_MAP[clean] || { label: rawCategory || "Otros", icon: "📦" }
}

export default function TravelResources() {
  const { user } = useAuthStore()
  const baseCampId = user?.camp_id ?? ""
  const [activeStatus, setActiveStatus] = useState<ResourceStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

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

  const { data: personsResponse } = useQuery({
    queryKey: ["persons", baseCampId],
    queryFn: () => getPersons({ campId: baseCampId, limit: 1000 }),
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

      const normCatLabel = getCategoryInfo(r.category).label
      if (categoryFilter !== "all" && normCatLabel !== categoryFilter) return false

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

  const categories = useMemo(() => {
    const uniqueLabels = new Set<string>()
    resources.forEach((r) => {
      uniqueLabels.add(getCategoryInfo(r.category).label)
    })
    return ["all", ...Array.from(uniqueLabels)]
  }, [resources])

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

  const campResources = useMemo(() => resources.filter((r) => r.campId === baseCampId), [resources, baseCampId])
  const okCount = useMemo(() => campResources.filter((r) => r.status === "sufficient").length, [campResources])
  const warningCount = useMemo(() => campResources.filter((r) => r.status === "low").length, [campResources])
  const insufficientCount = useMemo(() => campResources.filter((r) => r.status === "insufficient").length, [campResources])
  const criticalCount = useMemo(() => campResources.filter((r) => r.status === "critical" || r.status === "none").length, [campResources])
  const totalCount = campResources.length

  const waterItems = useMemo(() => campResources.filter(r => getCategoryInfo(r.category).label === "Agua"), [campResources])
  const waterStatus = useMemo(() => {
    return waterItems.some(r => r.status === "critical" || r.status === "none" || r.status === "insufficient") ? "CRÍTICA"
      : waterItems.some(r => r.status === "low") ? "LIMITADA"
        : waterItems.length > 0 ? "ÓPTIMA" : "SIN STOCK"
  }, [waterItems])

  const foodItems = useMemo(() => campResources.filter(r => getCategoryInfo(r.category).label === "Comida"), [campResources])
  const foodStatus = useMemo(() => {
    return foodItems.some(r => r.status === "critical" || r.status === "none" || r.status === "insufficient") ? "CRÍTICA"
      : foodItems.some(r => r.status === "low") ? "LIMITADA"
        : foodItems.length > 0 ? "ÓPTIMA" : "SIN STOCK"
  }, [foodItems])

  const medicineItems = useMemo(() => campResources.filter(r => getCategoryInfo(r.category).label === "Medicina"), [campResources])
  const medicineStatus = useMemo(() => {
    return medicineItems.some(r => r.status === "critical" || r.status === "none" || r.status === "insufficient") ? "CRÍTICA"
      : medicineItems.some(r => r.status === "low") ? "LIMITADA"
        : medicineItems.length > 0 ? "ÓPTIMA" : "SIN STOCK"
  }, [medicineItems])

  const criticalShortages = useMemo(
    () => campResources.filter((r) => r.status === "critical" || r.status === "insufficient" || r.status === "none"),
    [campResources],
  )
  const isTripReady = useMemo(
    () => criticalShortages.length === 0 && campResources.length > 0,
    [criticalShortages, campResources]
  )

  const persons = useMemo(() => {
    return (personsResponse?.data ?? []).filter((p) => {
      const pCampId = p.camp_id ?? p.userAccount?.camp_id
      return String(pCampId) === String(baseCampId)
    })
  }, [personsResponse, baseCampId])

  const exploringCount = useMemo(() => {
    return persons.filter(p => {
      const st = String(p.status ?? "").toLowerCase()
      return st === "exploring" || st === "explorando" || st === "traveling" || st === "viajando"
    }).length
  }, [persons])

  const sickCount = useMemo(() => {
    return persons.filter(p => {
      const st = String(p.status ?? "").toLowerCase()
      return st === "sick" || st === "injured" || st === "enfermo" || st === "herido"
    }).length
  }, [persons])

  const availableExplorersCount = useMemo(() => {
    return persons.filter(p => {
      const st = String(p.status ?? "").toLowerCase()
      const isAvailableStatus = st === "active" || st === "activo" || st === "idle" || st === "inactivo" || st === "resting" || st === "available" || !p.status
      return isAvailableStatus && p.profession?.can_explore === true
    }).length
  }, [persons])

  const totalCampPersonnel = useMemo(() => {
    return persons.filter(p => {
      const st = String(p.status ?? "").toLowerCase()
      return st !== "deceased" && st !== "fallecido"
    }).length
  }, [persons])

  const viabilityScore = useMemo(() => {
    if (campResources.length === 0) return 0
    let score = 100

    // Penalización por recursos críticos/insuficientes
    score -= (criticalCount * 20)
    score -= (insufficientCount * 10)
    score -= (warningCount * 5)

    // Penalización por falta de exploradores disponibles
    if (availableExplorersCount === 0 && exploringCount === 0) {
      score -= 45
    } else if (availableExplorersCount === 0) {
      score -= 25
    }

    // Penalización por enfermos
    if (totalCampPersonnel > 0) {
      const sickRate = sickCount / totalCampPersonnel
      score -= Math.round(sickRate * 60)
    }

    return Math.max(0, Math.min(100, score))
  }, [campResources, criticalCount, insufficientCount, warningCount, availableExplorersCount, exploringCount, sickCount, totalCampPersonnel])

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
              TODOS ({totalCount})
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

      {/* ── CRITICAL ALERT BANNER ───────────────────────────────── */}
      <AnimatePresence>
        {(criticalCount + insufficientCount) > 0 && (
          <motion.div
            className="flex items-center gap-2 text-[#9c2720] text-xs font-mono uppercase bg-[#9c2720]/15 border border-[#9c2720]/30 p-3.5 rounded-sm shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>⚠ ALERTA — {criticalCount + insufficientCount} RECURSO(S) EN ESTADO CRÍTICO O INSUFICIENTE REQUIEREN ATENCIÓN INMEDIATA</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STAT CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <motion.div
          className="bg-[#1c1208] border border-[#d4a373]/20 rounded-md p-4 flex flex-col gap-1 relative overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 160 }}
        >
          <div className="text-3xl font-mono font-bold leading-none text-[#4c6351]">
            {okCount}
          </div>
          <div className="text-[10px] font-mono font-black text-white/40 tracking-wider uppercase">
            SUFICIENTES
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl opacity-10 font-mono text-[#4c6351]">
            ✓
          </div>
        </motion.div>

        <motion.div
          className="bg-[#1c1208] border border-[#d4a373]/20 rounded-md p-4 flex flex-col gap-1 relative overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 160 }}
        >
          <div className="text-3xl font-mono font-bold leading-none text-[#c27c2f]">
            {warningCount}
          </div>
          <div className="text-[10px] font-mono font-black text-white/40 tracking-wider uppercase">
            BAJOS
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl opacity-10 font-mono text-[#c27c2f]">
            ⚠
          </div>
        </motion.div>

        <motion.div
          className="bg-[#1c1208] border border-[#d4a373]/20 rounded-md p-4 flex flex-col gap-1 relative overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 160 }}
        >
          <motion.div
            className="text-3xl font-mono font-bold leading-none text-[#9c2720]"
            animate={(criticalCount + insufficientCount) > 0 ? { opacity: [1, 0.4, 1] } : {}}
            transition={(criticalCount + insufficientCount) > 0 ? { duration: 1.2, repeat: Infinity } : {}}
          >
            {criticalCount + insufficientCount}
          </motion.div>
          <div className="text-[10px] font-mono font-black text-white/40 tracking-wider uppercase">
            CRÍTICOS / INSUF.
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl opacity-10 font-mono text-[#9c2720]">
            ☠
          </div>
        </motion.div>

        <motion.div
          className="bg-[#1c1208] border border-[#d4a373]/20 rounded-md p-4 flex flex-col gap-1 relative overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 160 }}
        >
          <div className="text-3xl font-mono font-bold leading-none text-[#df8120]">
            {totalCount}
          </div>
          <div className="text-[10px] font-mono font-black text-white/40 tracking-wider uppercase">
            TOTAL ÍTEMS
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl opacity-10 font-mono text-[#df8120]">
            📦
          </div>
        </motion.div>
      </div>

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
        {/* LEFT: Inventario en hoja crema de ancho completo */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="tm-paper tm-paper-texture flex-1 flex flex-col overflow-hidden p-6 relative">
            <div className="tm-section-row flex-shrink-0">
              <h3 className="tm-section-title font-typewriter font-black text-sm text-ink flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-ink-soft" />
                MANIFIESTO DE INVENTARIO CENTRAL
              </h3>
              <span className="tm-section-count font-mono font-black text-ink-soft">
                {filteredResources.length} ÍTEM(S) REGISTRADOS
              </span>
            </div>

            {/* Table layout of stocks */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <table className="w-full border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-ink/20">
                    <th className="text-left font-typewriter font-bold text-ink-soft py-3 px-2 uppercase tracking-wider">REF ID</th>
                    <th className="text-left font-typewriter font-bold text-ink-soft py-3 px-2 uppercase tracking-wider">DESCRIPCIÓN</th>
                    <th className="text-left font-typewriter font-bold text-ink-soft py-3 px-2 uppercase tracking-wider">STOCK ACTUAL / MÍN</th>
                    <th className="text-left font-typewriter font-bold text-ink-soft py-3 px-2 uppercase tracking-wider">ESTADO</th>
                    <th className="text-right font-typewriter font-bold text-ink-soft py-3 px-2 uppercase tracking-wider">DETALLE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResources.length > 0 ? (
                    filteredResources.map((resource) => {
                      const statusLabel = getStatusLabel(resource.status).toUpperCase();
                      const statusColorClass = getStatusColor(resource.status);
                      const levelColorClass = getLevelColor(resource.status);
                      const max = Math.max((resource.minThreshold || 100) * 2, resource.quantity, 1);
                      const pct = Math.min((resource.quantity / max) * 100, 100);
                      const minPct = ((resource.minThreshold || 0) / max) * 100;

                      return (
                        <motion.tr
                          key={resource.id}
                          whileHover={{ backgroundColor: "rgba(26, 15, 5, 0.04)" }}
                          onClick={() => setSelectedId(resource.id)}
                          className="border-b border-dashed border-ink/10 cursor-pointer hover:bg-ink/5 transition-colors"
                        >
                          {/* REF ID */}
                          <td className="py-3.5 px-2 font-mono font-bold text-ink/70">
                            REF-{resource.id.slice(0, 4).toUpperCase()}
                          </td>

                          {/* DESCRIPCIÓN */}
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg flex-shrink-0">
                                {getCategoryInfo(resource.category).icon}
                              </span>
                              <div>
                                <div className="font-mono font-bold text-ink text-sm uppercase leading-tight">
                                  {resource.name}
                                </div>
                                <div className="text-[10px] font-mono text-ink-soft/60 uppercase leading-none mt-1">
                                  {getCategoryInfo(resource.category).label.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* STOCK */}
                          <td className="py-3.5 px-2" style={{ minWidth: "180px" }}>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-baseline gap-1 font-mono font-bold text-ink">
                                <span className={`text-sm ${statusColorClass}`}>
                                  {resource.quantity}
                                </span>
                                <span className="text-[10px] text-ink-soft/70 uppercase font-normal">
                                  {resource.unit.toUpperCase()}
                                </span>
                                <span className="text-[9px] text-ink-soft/40 uppercase ml-2 font-normal">
                                  / mín {resource.minThreshold || 0}
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-ink/5 border border-ink/10 relative rounded-sm overflow-hidden">
                                <div
                                  className="absolute top-0 bottom-0 z-10"
                                  style={{ left: `${minPct}%`, width: "2px", backgroundColor: "rgba(26, 15, 5, 0.25)" }}
                                  title="Stock Mínimo"
                                />
                                <motion.div
                                  className={`h-full ${levelColorClass} opacity-80`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* ESTADO */}
                          <td className="py-3.5 px-2">
                            <span className={`tm-op-chip ${resource.status === "sufficient" ? "tm-chip-active" :
                                resource.status === "low" ? "tm-chip-transit" : "tm-chip-pending"
                              } text-[9px] px-2 py-0.5 font-bold uppercase`}>
                              {statusLabel}
                            </span>
                          </td>

                          {/* ACCIONES */}
                          <td className="py-3.5 px-2 text-right">
                            <button
                              type="button"
                              className="tm-op-btn text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(resource.id);
                              }}
                            >
                              Ver Ficha
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-ink-soft/40 font-mono uppercase tracking-widest italic">
                        Sin recursos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Preparación de Viaje */}
        <div className="hidden lg:flex w-80 flex-col gap-4 shrink-0 overflow-hidden bg-[#121110] p-4 border border-[#d4a373]/20 rounded-md shadow-lg justify-between">
          <div className="flex flex-col gap-5 overflow-y-auto pr-1 custom-scrollbar">
            <h3 className="text-xs font-mono font-black text-[#df8120] uppercase tracking-wider mb-2 flex items-center gap-2 border-b border-[#d4a373]/15 pb-2.5">
              <Navigation className="h-4 w-4" /> Preparación de Viaje
            </h3>

            <div className="space-y-6">
              {/* Deployment Viability Score */}
              <div className="bg-black/30 border border-[#d4a373]/15 p-4 rounded-sm flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-mono text-white/40 tracking-wider uppercase font-bold">
                    Viabilidad de Salida
                  </span>
                  <span className={`text-3xl font-mono font-black ${viabilityScore >= 70 ? 'text-accent-approved' : viabilityScore >= 40 ? 'text-[#c27c2f]' : 'text-accent-critical'}`}>
                    {viabilityScore}%
                  </span>
                </div>
                <div className="h-2.5 w-full bg-black/50 border border-[#d4a373]/10 relative rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${viabilityScore >= 70 ? 'bg-[#4c6351]' : viabilityScore >= 40 ? 'bg-[#c27c2f]' : 'bg-[#9c2720]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${viabilityScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[11px] font-mono text-white/50 leading-relaxed uppercase">
                  {viabilityScore >= 80 ? "✓ CONDICIONES ÓPTIMAS PARA INICIAR VIAJE."
                    : viabilityScore >= 50 ? "⚠ ATENCIÓN — VIABILIDAD REDUCIDA. EVALUAR RIESGOS."
                      : "☠ PELIGRO — RECURSOS CRÍTICOS. SALIDA NO AUTORIZADA."}
                </span>
              </div>

              {/* Personnel Stats */}
              <div className="bg-black/20 border border-[#d4a373]/10 p-4 rounded-sm space-y-4 font-mono">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest border-b border-[#d4a373]/5 pb-1.5 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-white/40" /> PERSONAL EN BASE
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center justify-center p-2.5 bg-black/30 rounded-sm border border-white/5">
                    <span className="text-xl font-black text-white">{availableExplorersCount}</span>
                    <span className="text-[10px] text-white/40 uppercase text-center mt-0.5 leading-none font-bold">Listos</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 bg-black/30 rounded-sm border border-white/5">
                    <span className="text-xl font-black text-[#df8120]">{exploringCount}</span>
                    <span className="text-[10px] text-white/40 uppercase text-center mt-0.5 leading-none font-bold">En Campo</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2.5 bg-[#9c2720]/15 rounded-sm border border-[#9c2720]/20">
                    <span className="text-xl font-black text-accent-critical">{sickCount}</span>
                    <span className="text-[10px] text-white/40 uppercase text-center mt-0.5 leading-none font-bold">Bajas</span>
                  </div>
                </div>

                <div className="text-xs text-white/30 uppercase flex justify-between pt-2 border-t border-white/5">
                  <span>Censo Total:</span>
                  <span className="font-bold text-white/60">{totalCampPersonnel} personas</span>
                </div>
              </div>

              {/* Basic Supplies Checklist */}
              <div className="bg-black/20 border border-[#d4a373]/10 p-4 rounded-sm space-y-3 font-mono text-xs">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest border-b border-[#d4a373]/5 pb-1.5">
                  ESTADO DE INSUMOS VITALES
                </h4>

                {[
                  {
                    label: "Suministro de Agua",
                    status: waterStatus,
                    color: waterStatus === "ÓPTIMA" ? "text-accent-approved bg-accent-approved/5 border-accent-approved/15" : waterStatus === "LIMITADA" ? "text-[#c27c2f] bg-[#c27c2f]/5 border-[#c27c2f]/15" : "text-accent-critical bg-accent-critical/5 border-accent-critical/15",
                    badge: waterStatus === "ÓPTIMA" ? "✓" : "⚠"
                  },
                  {
                    label: "Víveres / Raciones",
                    status: foodStatus,
                    color: foodStatus === "ÓPTIMA" ? "text-accent-approved bg-accent-approved/5 border-accent-approved/15" : foodStatus === "LIMITADA" ? "text-[#c27c2f] bg-[#c27c2f]/5 border-[#c27c2f]/15" : "text-accent-critical bg-accent-critical/5 border-accent-critical/15",
                    badge: foodStatus === "ÓPTIMA" ? "✓" : "⚠"
                  },
                  {
                    label: "Kits de Medicina",
                    status: medicineStatus,
                    color: medicineStatus === "ÓPTIMA" ? "text-accent-approved bg-accent-approved/5 border-accent-approved/15" : medicineStatus === "LIMITADA" ? "text-[#c27c2f] bg-[#c27c2f]/5 border-[#c27c2f]/15" : "text-accent-critical bg-accent-critical/5 border-accent-critical/15",
                    badge: medicineStatus === "ÓPTIMA" ? "✓" : "⚠"
                  },
                ].map((item) => (
                  <div key={item.label} className={`flex justify-between items-center px-2.5 py-2 rounded-sm border ${item.color}`}>
                    <span className="uppercase font-bold flex items-center gap-1.5">
                      <span>{item.badge}</span> {item.label}
                    </span>
                    <span className="font-black uppercase">{item.status}</span>
                  </div>
                ))}
              </div>

              {/* Critical shortages details */}
              {!isTripReady && criticalShortages.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-mono font-black text-accent-critical uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> FALTANTES DE STOCK
                  </span>
                  <div className="space-y-2">
                    {criticalShortages.slice(0, 2).map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2.5 bg-[#9c2720]/10 border border-[#9c2720]/20 rounded-sm font-mono text-xs"
                      >
                        <span className="text-white/60 uppercase truncate flex-1">{r.name}</span>
                        <span className="font-black text-accent-critical ml-2">
                          {r.quantity} {r.unit}
                        </span>
                      </div>
                    ))}
                    {criticalShortages.length > 2 && (
                      <p className="text-[11px] font-mono text-white/30 text-center uppercase mt-1.5">
                        + {criticalShortages.length - 2} recursos adicionales
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/travel-manager/expeditions", { state: { openNewExploration: true } })}
              disabled={availableExplorersCount === 0 || viabilityScore < 35}
              className="tm-action-btn tm-action-btn-primary w-full hover:brightness-110 disabled:opacity-40 disabled:brightness-100 disabled:cursor-not-allowed transition-all cursor-pointer"
              style={{ padding: "10px 12px", borderRadius: "4px" }}
            >
              <span className="tm-action-label">Preparar Exploración</span>
              <span className="tm-action-sub">Despliegue de patrulla</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/travel-manager/transfers", { state: { openNewTransfer: true } })}
              className="tm-btn w-full text-center hover:bg-[#c27c2f]/20 hover:text-white transition-all font-mono font-bold uppercase text-xs tracking-wider cursor-pointer border border-[#d4a373]/30"
              style={{ padding: "10px 12px", borderRadius: "4px" }}
            >
              Solicitar Suministros
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal de Detalle (Ficha de Recurso) ── */}
      <AnimatePresence>
        {selectedResource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="tm-paper tm-paper-texture w-full max-w-lg overflow-hidden shadow-2xl relative p-8 border-4 border-double border-ink/40"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Seal mark */}
              <div className="absolute top-10 right-10 flex flex-col items-center rotate-6 select-none opacity-20 pointer-events-none">
                <div className="border-4 border-ink p-1 mb-1">
                  <span className="text-lg font-black font-mono px-2">REGISTRADO</span>
                </div>
                <span className="text-xs font-mono font-black italic text-ink">
                  Refugio Alfa - Logística
                </span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="absolute top-4 right-4 text-ink-soft hover:text-ink transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>

              <div className="flex-1 flex flex-col justify-between">
                <div className="border-b-2 border-dashed border-ink/20 pb-3 mb-6">
                  <span className="text-[10px] font-mono text-ink-soft uppercase tracking-widest font-black block mb-1">
                    EXPEDIENTE DE SUMINISTROS
                  </span>
                  <h2 className="font-typewriter text-2xl font-black text-ink uppercase leading-none">
                    {selectedResource.name}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4 font-mono text-xs text-ink/80">
                    <div>
                      <span className="text-[10px] text-ink-soft uppercase tracking-wider block font-bold">
                        Clasificación
                      </span>
                      <span className="text-sm font-bold text-ink uppercase">
                        {getCategoryInfo(selectedResource.category).label}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

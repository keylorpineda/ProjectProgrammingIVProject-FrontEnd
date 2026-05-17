import { Package, TrendingDown, TrendingUp, Loader2, BarChart3, History } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/pages/admin/context/AuthContext'
import { useInventory, useInventoryMovements } from '@/features/worker/hooks/useWorkerAPI'
import type { InventoryItem } from '@/types/worker.api.types'

interface WorkerResourcesProps {
  activeTab?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

// Get status color and label
const getResourceStatus = (item: InventoryItem): { status: string; color: string } => {
  if (item.current_quantity === 0) {
    return { status: 'CRÍTICO', color: 'status-alert' }
  }
  if (item.alert_active) {
    return { status: 'CRÍTICO', color: 'status-alert' }
  }
  if (item.current_quantity < item.minimum_stock_required * 1.5) {
    return { status: 'ALERTA', color: 'status-warning' }
  }
  return { status: 'ESTABLE', color: 'status-ok' }
}

// Get trending direction
const getTrendingIcon = (level: number, previous: number) => {
  if (level > previous) return 'up'
  if (level < previous) return 'down'
  return 'stable'
}

// Get movement type label
const getMovementTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    entrada: 'INGRESO',
    salida: 'EGRESO',
    consumo: 'CONSUMO',
    producción: 'PRODUCCIÓN',
  }
  return typeMap[type] || type.toUpperCase()
}

export default function WorkerResources(_props: WorkerResourcesProps) {
  const { user } = useAuth()

  // Fetch data hooks
  const { data: inventory, isLoading: loadingInventory } = useInventory(user?.campId)
  const { data: movements, isLoading: loadingMovements } = useInventoryMovements(user?.campId)

  const isLoading = loadingInventory || loadingMovements

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-accent-orange opacity-60 mb-4" />
        <p className="font-mono text-sm text-paper-base/70 uppercase">Loading resources...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="p-4 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-4xl uppercase mb-2 font-display">GESTIÓN DE RECURSOS</h2>
        <p className="terminal-text opacity-90 tracking-widest text-[10px]">
          Inventario del Campamento // Balance de Producción
        </p>
      </motion.div>

      {/* Two Column Layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Inventory Section */}
        <div className="paper-card p-8">
          <div className="flex justify-between items-center border-b border-ink-black pb-4 mb-6">
            <h3 className="text-xl font-display flex items-center gap-2">
              <Package className="w-5 h-5 text-accent-orange" />
              INVENTARIO ACTUAL
            </h3>
            {user?.role === 'worker' && (
              <button className="text-[10px] font-mono bg-ink-black text-paper-base px-3 py-1 font-bold hover:bg-zinc-800 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5">
                REGISTRAR MOVIMIENTO
              </button>
            )}
          </div>

          <div className="space-y-4">
            {inventory && inventory.length > 0 ? (
              inventory.map((item) => {
                const { status, color } = getResourceStatus(item)
                const trend = getTrendingIcon(item.current_quantity, item.minimum_stock_required * 2)

                return (
                  <motion.div
                    key={item.resource_id}
                    whileHover={{ translateX: 4 }}
                    className="flex items-center justify-between p-4 bg-paper-dark/10 border border-ink-black/10 hover:bg-paper-dark/20 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-[12px] font-mono text-ink-black/80 font-bold uppercase">{item.resource_id}</p>
                      <p className="text-sm font-display">{item.resource_name}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <p className="text-xl font-mono font-bold">{item.current_quantity} {item.unit}</p>
                        {trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-accent-orange" />
                        ) : trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-success-green" />
                        ) : null}
                      </div>
                      <span className={`status-badge text-[9px] px-2 py-0.5 ${color}`}>{status}</span>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <p className="text-center text-ink-black/70 py-4">No inventory items available</p>
            )}
          </div>
        </div>

        {/* RIGHT: Balance & Historial */}
        <div className="space-y-8">
          {/* Balance Section */}
          <motion.div whileHover={{ scale: 1.01 }} className="paper-card p-6 bg-paper-dark/30">
            <h4 className="text-[12px] font-mono text-ink-black/80 mb-6 tracking-widest flex items-center gap-2 font-bold uppercase">
              <BarChart3 className="w-4 h-4" />
              Balance Producción vs Consumo
            </h4>
            <div className="space-y-6">
              {/* Food Production */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono font-bold text-ink-black/85 uppercase">
                  <span>Alimentos</span>
                  <span className="text-success-green">+12.4% Superávit</span>
                </div>
                <div className="status-line bg-ink-black/20 h-2 border border-ink-black/10">
                  <div className="h-full bg-success-green transition-all duration-1000" style={{ width: '85%' }} />
                </div>
              </div>

              {/* Water */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono font-bold text-ink-black/85 uppercase">
                  <span>Agua</span>
                  <span className="text-accent-orange">-8.2% Déficit</span>
                </div>
                <div className="status-line bg-ink-black/20 h-2 border border-ink-black/10">
                  <div className="h-full bg-accent-orange transition-all duration-1000" style={{ width: '42%' }} />
                </div>
              </div>

              {/* Medical Supplies */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono font-bold text-ink-black/85 uppercase">
                  <span>Suministros Médicos</span>
                  <span className="text-success-green">100% Stock</span>
                </div>
                <div className="status-line bg-ink-black/20 h-2 border border-ink-black/10">
                  <div className="h-full bg-success-green transition-all duration-1000" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Historial Section */}
          <motion.div whileHover={{ scale: 1.01 }} className="paper-card p-6">
            <h4 className="text-[12px] font-mono text-ink-black/80 mb-6 flex items-center gap-2 font-bold tracking-widest uppercase">
              <History className="w-4 h-4" />
              Historial de Movimientos
            </h4>
            <div className="space-y-4">
              {movements && movements.length > 0 ? (
                movements.slice(0, 3).map((move, i) => {
                  const movementDate = new Date(move.date)
                  const isIncoming = move.type === 'entrada'

                  return (
                    <motion.div
                      key={i}
                      whileHover={{ x: 4 }}
                      className="text-[12px] font-mono flex justify-between items-center border-b border-ink-black/10 pb-2 hover:bg-paper-dark/10 px-2 py-1 rounded transition-colors"
                    >
                      <div className="space-y-0.5 flex-1">
                        <p className="font-bold text-ink-black/90 uppercase">
                          {movementDate.toLocaleString()}
                        </p>
                        <p className="text-ink-black/85 font-medium">
                          {move.resource_name} ({move.quantity})
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            isIncoming ? 'text-success-green' : 'text-accent-orange'
                          } uppercase`}
                        >
                          {getMovementTypeLabel(move.type)}
                        </p>
                        <p className="text-ink-black/70 italic font-medium">{move.user_name}</p>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <p className="text-center text-ink-black/70 py-4">No movements recorded</p>
              )}
            </div>
            <button className="w-full mt-6 py-2 text-[10px] font-mono text-ink-black/70 hover:text-ink-black underline decoration-1 underline-offset-4 font-bold uppercase transition-all hover:text-accent-orange">
              Ver últimos 50 movimientos
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

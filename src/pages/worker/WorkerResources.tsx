import React from 'react'
import { Package, TrendingDown, TrendingUp, AlertTriangle, Loader2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/pages/admin/context/AuthContext'
import {
  useInventory,
  useInventoryMovements,
  useInventoryStatus,
} from '@/features/worker/hooks/useWorkerAPI'
import type { InventoryItem, InventoryMovement } from '@/types/worker.api.types'

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
    return { status: 'CRITICAL', color: 'status-alert' }
  }
  if (item.alert_active) {
    return { status: 'CRITICAL', color: 'status-alert' }
  }
  if (item.current_quantity < item.minimum_stock_required * 1.5) {
    return { status: 'LOW', color: 'status-warning' }
  }
  return { status: 'OK', color: 'status-ok' }
}

// Get stock percentage
const getStockPercentage = (item: InventoryItem): number => {
  if (item.minimum_stock_required === 0) return 100
  const percentage = (item.current_quantity / (item.minimum_stock_required * 2)) * 100
  return Math.min(Math.round(percentage), 100)
}

// Format movement type
const getMovementTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    entrada: '📥 INCOMING',
    salida: '📤 OUTGOING',
    consumo: '⚙️ CONSUMPTION',
    producción: '🏭 PRODUCTION',
  }
  return typeMap[type] || type.toUpperCase()
}

export default function WorkerResources({ activeTab }: WorkerResourcesProps) {
  const { user } = useAuth()
  const [activeTab2, setActiveTab2] = React.useState<'inventory' | 'history'>('inventory')

  // Fetch data hooks
  const { data: inventory, isLoading: loadingInventory } = useInventory(user?.campId)
  const { data: movements, isLoading: loadingMovements } = useInventoryMovements(user?.campId)
  const { stats: inventoryStats, isLoading: loadingStats } = useInventoryStatus(user?.campId)

  const isLoading = loadingInventory || loadingMovements || loadingStats

  // Calculate statistics
  const inventoryMetrics = React.useMemo(() => {
    if (!inventory) {
      return {
        totalValue: '0',
        criticalItems: 0,
        lowItems: 0,
        okItems: 0,
        avgStockLevel: '0%',
      }
    }

    const criticalItems = inventory.filter((i) => i.alert_active || i.current_quantity === 0).length
    const lowItems = inventory.filter(
      (i) =>
        !i.alert_active &&
        i.current_quantity < i.minimum_stock_required &&
        i.current_quantity > 0
    ).length
    const okItems = inventory.filter(
      (i) => !i.alert_active && i.current_quantity >= i.minimum_stock_required
    ).length

    const avgStockLevel = inventory.length
      ? Math.round(
          (inventory.reduce((sum, i) => sum + getStockPercentage(i), 0) / inventory.length) * 100
        ) / 100
      : 0

    return {
      totalValue: inventory.length,
      criticalItems,
      lowItems,
      okItems,
      avgStockLevel: `${avgStockLevel}%`,
    }
  }, [inventory])

  // Movement statistics
  const movementStats = React.useMemo(() => {
    if (!movements) return { inbound: 0, outbound: 0, recent: 0 }

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    return {
      inbound: movements.filter((m) => m.type === 'entrada').length,
      outbound: movements.filter((m) => m.type === 'salida').length,
      recent: movements.filter((m) => new Date(m.date) > oneHourAgo).length,
    }
  }, [movements])

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
      className="p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="worker-page-header">
        <h2>RESOURCE MANAGEMENT</h2>
        <p className="terminal-text opacity-90">Camp {user?.campId} // Inventory & Movement Log</p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex gap-2 border-b-2 border-ink-black">
        <button
          onClick={() => setActiveTab2('inventory')}
          className={`px-6 py-3 text-sm font-display uppercase transition-all ${
            activeTab2 === 'inventory'
              ? 'border-b-2 border-accent-orange text-accent-orange'
              : 'text-paper-base/70 hover:text-paper-base'
          }`}
        >
          📦 Inventory
        </button>
        <button
          onClick={() => setActiveTab2('history')}
          className={`px-6 py-3 text-sm font-display uppercase transition-all ${
            activeTab2 === 'history'
              ? 'border-b-2 border-accent-orange text-accent-orange'
              : 'text-paper-base/70 hover:text-paper-base'
          }`}
        >
          📋 History
        </button>
      </motion.div>

      {/* Inventory Tab */}
      {activeTab2 === 'inventory' && (
        <motion.div variants={containerVariants} className="space-y-8">
          {/* Metrics Grid */}
          <motion.div variants={itemVariants} className="worker-metrics-grid">
            {[
              {
                label: 'Total Items',
                value: inventoryMetrics.totalValue,
                icon: Package,
                color: 'text-accent-orange',
              },
              {
                label: 'Critical Stock',
                value: inventoryMetrics.criticalItems,
                icon: AlertTriangle,
                color: 'text-accent-orange',
              },
              {
                label: 'Low Stock',
                value: inventoryMetrics.lowItems,
                icon: TrendingDown,
                color: 'text-accent-orange',
              },
              {
                label: 'Avg Stock Level',
                value: inventoryMetrics.avgStockLevel,
                icon: TrendingUp,
                color: 'text-success-green',
              },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="paper-card p-6 flex flex-col items-center gap-4 text-center">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                  <div>
                    <p className="text-[10px] font-mono text-ink-black/40 uppercase mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-display">{stat.value}</p>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Critical Alerts */}
          {inventoryMetrics.criticalItems > 0 && (
            <motion.div
              variants={itemVariants}
              className="bg-accent-orange text-ink-black p-4 border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-display tracking-widest uppercase font-bold">
                    CRITICAL INVENTORY ALERT
                  </p>
                  <p className="font-mono text-[8px] opacity-90 uppercase">
                    {inventoryMetrics.criticalItems} item(s) below minimum stock. Immediate
                    replenishment required.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Inventory Table */}
          <motion.div variants={itemVariants} className="paper-card p-8 overflow-x-auto">
            <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
              CURRENT INVENTORY
            </h3>

            <div className="min-w-full">
              <div className="grid grid-cols-6 gap-4 mb-4 pb-4 border-b border-ink-black/20">
                <p className="text-xs font-mono text-ink-black/70 font-bold uppercase">Resource</p>
                <p className="text-xs font-mono text-ink-black/70 font-bold uppercase">Current</p>
                <p className="text-xs font-mono text-ink-black/70 font-bold uppercase">Minimum</p>
                <p className="text-xs font-mono text-ink-black/70 font-bold uppercase">Level %</p>
                <p className="text-xs font-mono text-ink-black/70 font-bold uppercase">Status</p>
                <p className="text-xs font-mono text-ink-black/70 font-bold uppercase">Updated</p>
              </div>

              <div className="space-y-2">
                {inventory?.map((item) => {
                  const { status, color } = getResourceStatus(item)
                  const percentage = getStockPercentage(item)
                  const lastUpdate = new Date(item.last_update)
                  const timeAgo = Math.round(
                    (Date.now() - lastUpdate.getTime()) / (1000 * 60)
                  )

                  return (
                    <motion.div
                      key={item.resource_id}
                      whileHover={{ x: 4 }}
                      className="grid grid-cols-6 gap-4 p-3 rounded-sm bg-bunker-bg border border-ink-black/10 hover:border-paper-dark/30 transition-colors items-center"
                    >
                      <div>
                        <p className="font-display text-sm font-bold truncate">
                          {item.resource_name}
                        </p>
                        <p className="text-xs font-mono text-ink-black/60">{item.unit}</p>
                      </div>

                      <p className="font-mono text-sm font-bold">{item.current_quantity}</p>

                      <p className="font-mono text-sm text-ink-black/70">
                        {item.minimum_stock_required}
                      </p>

                      <div>
                        <div className="status-line mb-1">
                          <div
                            className={`h-full transition-all ${
                              status === 'OK'
                                ? 'bg-success-green'
                                : status === 'LOW'
                                  ? 'bg-accent-orange/70'
                                  : 'bg-accent-orange'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs font-mono text-ink-black/70">{percentage}%</p>
                      </div>

                      <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${color}`}>
                        {status}
                      </span>

                      <p className="text-xs font-mono text-ink-black/60 text-right">
                        {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.round(timeAgo / 60)}h ago`}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab2 === 'history' && (
        <motion.div variants={containerVariants} className="space-y-8">
          {/* Movement Stats */}
          <motion.div variants={itemVariants} className="worker-metrics-grid">
            {[
              { label: 'Incoming Movements', value: movementStats.inbound, icon: TrendingUp },
              { label: 'Outgoing Movements', value: movementStats.outbound, icon: TrendingDown },
              { label: 'Recent Activity (1h)', value: movementStats.recent, icon: Clock },
              { label: 'Total Movements', value: movements?.length || 0, icon: Package },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="paper-card p-6 flex flex-col items-center gap-4 text-center">
                  <Icon className="w-8 h-8 text-paper-dark" />
                  <div>
                    <p className="text-[10px] font-mono text-ink-black/40 uppercase mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-display">{stat.value}</p>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Movements Log */}
          <motion.div variants={itemVariants} className="paper-card p-8">
            <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
              MOVEMENT HISTORY
            </h3>

            <div className="space-y-3">
              {movements && movements.length > 0 ? (
                movements.slice(0, 20).map((movement) => {
                  const movementDate = new Date(movement.date)
                  const isIncoming = movement.type === 'entrada'

                  return (
                    <motion.div
                      key={movement.id}
                      whileHover={{ x: 4 }}
                      className="border border-ink-black/10 p-4 rounded-sm bg-bunker-bg hover:bg-paper-dark/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-xs font-mono px-2 py-1 rounded font-bold ${
                                movement.type === 'entrada'
                                  ? 'status-ok'
                                  : movement.type === 'salida'
                                    ? 'status-warning'
                                    : 'status-alert'
                              }`}
                            >
                              {getMovementTypeLabel(movement.type)}
                            </span>
                            <p className="text-xs font-mono text-ink-black/60">
                              ID: {movement.id}
                            </p>
                          </div>

                          <p className="font-display text-sm uppercase font-bold mb-2">
                            {movement.resource_name}
                          </p>

                          <p className="text-xs text-ink-black/70 mb-2 italic">
                            {movement.description}
                          </p>

                          <p className="text-xs font-mono text-ink-black/60">
                            <span className="font-bold">{movement.user_name}</span> •{' '}
                            {movementDate.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <p
                            className={`text-2xl font-display font-bold ${
                              isIncoming ? 'text-success-green' : 'text-accent-orange'
                            }`}
                          >
                            {isIncoming ? '+' : '-'}{movement.quantity}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <p className="text-center text-ink-black/60 font-mono text-sm py-8">
                  No movements recorded
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

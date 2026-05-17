import React from 'react'
import { Activity, ShieldCheck, Database, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/pages/admin/context/AuthContext'
import {
  useAssignedResources,
  useProfessions,
  useProfessionMetrics,
  useInventoryStatus,
} from '@/features/worker/hooks/useWorkerAPI'

interface WorkerDashboardProps {
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

export default function WorkerDashboard({ activeTab }: WorkerDashboardProps) {
  const { user } = useAuth()

  // Fetch data hooks
  const { data: assignedResources, isLoading: loadingResources } = useAssignedResources()
  const { metrics, isLoading: loadingMetrics } = useProfessionMetrics()
  const { stats: inventoryStats, isLoading: loadingInventory } = useInventoryStatus(
    user?.campId
  )

  const isLoading = loadingResources || loadingMetrics || loadingInventory

  // Calculate dashboard metrics
  const dashboardMetrics = React.useMemo(() => {
    return [
      {
        icon: Activity,
        label: 'ASSIGNED RESOURCES',
        value: assignedResources?.length || '0',
        color: 'text-success-green',
      },
      {
        icon: ShieldCheck,
        label: 'PROFESSIONS AVAILABLE',
        value: metrics?.length || '0',
        color: 'text-accent-orange',
      },
      {
        icon: Database,
        label: 'INVENTORY STATUS',
        value: `${inventoryStats?.okItems || 0}/${inventoryStats?.total || 0}`,
        color: 'text-paper-dark',
      },
      {
        icon: AlertCircle,
        label: 'CRITICAL ITEMS',
        value: inventoryStats?.criticalItems || '0',
        color:
          inventoryStats?.criticalItems && inventoryStats?.criticalItems > 0
            ? 'text-accent-orange'
            : 'text-success-green',
      },
    ]
  }, [assignedResources, metrics, inventoryStats])

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-accent-orange opacity-60 mb-4" />
        <p className="font-mono text-sm text-paper-base/70 uppercase">Loading dashboard...</p>
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
        <h2>WORKER DASHBOARD</h2>
        <p className="terminal-text opacity-90">Camp: {user?.campId} // Operational Overview</p>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants} className="worker-metrics-grid">
        {dashboardMetrics.map((item, i) => {
          const Icon = item.icon

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, translateY: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="paper-card p-6 flex flex-col items-center gap-4 text-center cursor-pointer"
            >
              <Icon className={`w-8 h-8 ${item.color}`} />
              <div>
                <p className="text-[10px] font-mono text-ink-black/40 uppercase mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-display">{item.value}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Assigned Resources Section */}
      {assignedResources && assignedResources.length > 0 && (
        <motion.div variants={itemVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            ASSIGNED RESOURCES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedResources.map((resource) => (
              <motion.div
                key={resource.id}
                whileHover={{ scale: 1.02 }}
                className="border border-ink-black/20 p-4 rounded-sm bg-bunker-bg hover:bg-paper-dark/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {resource.image_url && (
                    <img
                      src={resource.image_url}
                      alt={resource.name}
                      className="w-12 h-12 object-cover rounded border border-ink-black/20"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm uppercase font-bold truncate">
                      {resource.name}
                    </p>
                    <p className="text-xs font-mono text-paper-base/70 uppercase">
                      {resource.category}
                    </p>
                    <p className="text-xs text-paper-base/60 mt-1 italic line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-ink-black/10">
                      <p className="text-xs font-mono text-ink-black/70">
                        Qty: <span className="font-bold">{resource.current_quantity}</span>{' '}
                        {resource.unit}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Professions Summary */}
      {metrics && metrics.length > 0 && (
        <motion.div variants={itemVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            PROFESSION AVAILABILITY
          </h3>
          <div className="space-y-4">
            {metrics.slice(0, 5).map((prof) => (
              <div key={prof.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm uppercase">{prof.name}</p>
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded ${
                      prof.status === 'OK'
                        ? 'status-ok'
                        : prof.status === 'CRÍTICO'
                          ? 'status-alert'
                          : 'status-warning'
                    }`}
                  >
                    {prof.status}
                  </span>
                </div>
                <div className="status-line">
                  <div
                    className="h-full bg-accent-orange transition-all"
                    style={{ width: `${Math.min(prof.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-ink-black/60">
                  {prof.activePersons} / {prof.minimum} required
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* System Notices */}
      <motion.div variants={itemVariants} className="dashed-accent p-8 bg-paper-base/30">
        <div className="relative z-10">
          <h3 className="text-2xl uppercase font-display text-ink-black mb-4">SYSTEM NOTICES</h3>
          <p className="marker-note text-xl">"Complete your daily tasks."</p>
          <p className="mt-6 text-sm text-ink-black/70 leading-relaxed font-mono italic">
            {inventoryStats?.criticalItems ? (
              <>
                <span className="font-bold text-accent-orange">⚠️ ALERT:</span> {inventoryStats.criticalItems}{' '}
                resource(s) in critical stock. Report to supervisors immediately.
              </>
            ) : (
              'All resources within normal parameters. Continue standard operations.'
            )}
          </p>
        </div>
      </motion.div>

      {/* Additional Sections Placeholder */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h3 className="text-2xl uppercase font-display mb-4 drop-shadow-[1px_1px_0px_rgba(154,144,128,0.2)]">
          DETAILED VIEWS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['MY PROFILE', 'PROFESSIONS', 'INVENTORY'].map((section) => (
            <div key={section} className="worker-section-maintenance">
              <Database className="w-16 h-16 text-accent-orange opacity-40 mb-4" />
              <h2>{section}</h2>
              <p className="text-sm">Navigate via sidebar</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

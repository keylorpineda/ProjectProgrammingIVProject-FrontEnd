import { Activity, ShieldCheck, Database, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const metricsData = [
    { icon: Activity, label: 'PHYSICAL STATE', value: '85%', color: 'text-success-green' },
    { icon: ShieldCheck, label: 'SECURITY LEVEL', value: 'B-SECURE', color: 'text-accent-orange' },
    { icon: Database, label: 'DATA INTEGRITY', value: 'VERIFIED', color: 'text-paper-dark' },
    { icon: Zap, label: 'POWER STATUS', value: 'OPERATIONAL', color: 'text-accent-orange' },
  ]

  return (
    <motion.div
      className="p-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="worker-page-header">
        <h2>PERSONAL OVERVIEW</h2>
        <p className="terminal-text opacity-90">Worker profile // operational data</p>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemVariants} className="worker-metrics-grid">
        {metricsData.map((item, i) => {
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
                <p className="text-[10px] font-mono text-ink-black/40 uppercase mb-1">{item.label}</p>
                <p className="text-2xl font-display">{item.value}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Command Logs Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">LATEST ACTIVITY LOGS</h3>
          <div className="space-y-4 font-mono text-xs">
            <p className="text-ink-black/60">
              <span className="text-ink-black font-bold">[14:32:15]</span> Logged into system - SECTOR 04
            </p>
            <p className="text-ink-black/60">
              <span className="text-ink-black font-bold">[13:45:22]</span> Completed work shift assignment
            </p>
            <p className="text-ink-black/60">
              <span className="text-ink-black font-bold">[12:10:08]</span> Resource inventory updated
            </p>
            <p className="text-accent-orange">
              <span className="font-bold">[11:55:30]</span> ALERT: Scheduled maintenance window approaching
            </p>
          </div>
        </div>

        {/* System Notices */}
        <div className="dashed-accent p-8 bg-paper-base/30 relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10">
            <h3 className="text-2xl uppercase font-display text-ink-black mb-4">SYSTEM NOTICES</h3>
            <p className="marker-note text-xl">"Work safely, always."</p>
            <p className="mt-6 text-sm text-ink-black/70 leading-relaxed font-mono italic">
              Follow all protocol guidelines during your shift. Report any equipment malfunctions immediately to supervisors. 
              Unauthorized resource handling will result in privilege revocation.
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
            <ShieldCheck className="w-64 h-64 text-ink-black" />
          </div>
        </div>
      </motion.div>

      {/* Under Maintenance Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h3 className="text-2xl uppercase font-display mb-4 drop-shadow-[1px_1px_0px_rgba(154,144,128,0.2)]">
          ADDITIONAL SECTIONS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['PROFESSIONS', 'RESOURCES', 'TRANSFERS'].map((section) => (
            <div key={section} className="worker-section-maintenance">
              <Database className="w-16 h-16 text-accent-orange opacity-40 mb-4" />
              <h2>{section}</h2>
              <p>Coming in next stages</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

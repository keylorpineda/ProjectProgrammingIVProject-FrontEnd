import React from 'react'
import {
  CookingPot,
  Shield,
  Hammer,
  HeartPulse,
  Compass,
  Wheat,
  Construction,
  UserCog,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useProfessions, useProfessionMetrics } from '@/features/worker/hooks/useWorkerAPI'

interface WorkerProfessionsProps {
  activeTab?: string
}

// Icon mapping for professions
const getProfessionIcon = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('cocinero')) return CookingPot
  if (n.includes('guardia')) return Shield
  if (n.includes('ingeniero')) return Hammer
  if (n.includes('médico')) return HeartPulse
  if (n.includes('explorador')) return Compass
  if (n.includes('agricultor')) return Wheat
  if (n.includes('constructor')) return Construction
  if (n.includes('aguatero')) return UserCog
  return Users
}

// Metrics for each profession type
const getProfessionMetricsInfo = (professionName: string) => {
  const name = professionName.toLowerCase()

  if (name.includes('recolector'))
    return {
      title: 'COLLECTION STATUS',
      metrics: [
        { label: 'Active Personnel', key: 'activePersons' },
        { label: 'Can Explore', key: 'canExplore' },
      ],
    }
  if (name.includes('aguatero'))
    return {
      title: 'HYDRATION METRICS',
      metrics: [
        { label: 'Workers Active', key: 'activePersons' },
        { label: 'Function', value: 'Water Extraction' },
      ],
    }
  if (name.includes('explorador'))
    return {
      title: 'EXPLORATION LOG',
      metrics: [
        { label: 'Assigned Personnel', key: 'activePersons' },
        { label: 'Authorization', key: 'canExplore' },
      ],
    }
  if (name.includes('guardia'))
    return {
      title: 'ORDER AND SECURITY',
      metrics: [
        { label: 'Active Troops', key: 'activePersons' },
        { label: 'Minimum Required', key: 'minimum' },
      ],
    }
  if (name.includes('médico'))
    return {
      title: 'MEDICAL CENTER',
      metrics: [
        { label: 'Doctors on Duty', key: 'activePersons' },
        { label: 'Priority Level', value: 'High' },
      ],
    }

  return {
    title: 'OPERATIONAL STATUS',
    metrics: [
      { label: 'Total Personnel', key: 'totalPersons' },
      { label: 'Status', value: 'Active' },
    ],
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 },
  },
}

export default function WorkerProfessions({ activeTab }: WorkerProfessionsProps) {
  const { data: professions, isLoading: loadingProfessions } = useProfessions()
  const { metrics, isLoading: loadingMetrics } = useProfessionMetrics()

  const isLoading = loadingProfessions || loadingMetrics

  // Dashboard stats
  const dashboardStats = React.useMemo(() => {
    if (!professions) return []
    return [
      {
        label: 'Total Workforce',
        value: professions.reduce((sum, p) => sum + p.persons.length, 0),
        sub: 'Active Personnel',
        icon: Users,
      },
      {
        label: 'Professions Available',
        value: professions.length,
        sub: 'Total Types',
        icon: TrendingUp,
        positive: true,
      },
      {
        label: 'Critical Professions',
        value: metrics?.filter((m) => m.status === 'CRÍTICO').length || 0,
        sub: 'Below Minimum',
        icon: AlertTriangle,
        positive: false,
      },
      {
        label: 'At Full Capacity',
        value: metrics?.filter((m) => m.status === 'OK').length || 0,
        sub: 'Meeting Requirements',
        icon: Shield,
        positive: true,
      },
    ]
  }, [professions, metrics])

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-accent-orange opacity-60 mb-4" />
        <p className="font-mono text-sm text-paper-base/70 uppercase">Loading professions...</p>
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
      <motion.div variants={cardVariants} className="worker-page-header">
        <h2>OCCUPATIONAL COMMAND</h2>
        <p className="terminal-text opacity-90">Strategic skill assignment // efficiency analysis</p>
      </motion.div>

      {/* Operational Dashboard */}
      <motion.div variants={cardVariants} className="worker-metrics-grid">
        {dashboardStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="paper-card p-4 border-l-4 border-l-ink-black flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono text-ink-black/75 uppercase tracking-widest mb-1 font-bold">
                  {stat.label}
                </p>
                <p className="text-3xl font-display leading-none">{stat.value}</p>
                <p className="text-[9px] font-mono text-ink-black/70 mt-2 uppercase italic font-bold">
                  {stat.sub}
                </p>
              </div>
              <Icon
                className={`w-5 h-5 ${
                  stat.positive === true
                    ? 'text-success-green'
                    : stat.positive === false
                      ? 'text-accent-orange'
                      : 'text-accent-orange'
                }`}
              />
            </div>
          )
        })}
      </motion.div>

      {/* Critical Alerts Banner */}
      {metrics && metrics.some((m) => m.status === 'CRÍTICO') && (
        <motion.div
          variants={cardVariants}
          className="bg-accent-orange text-ink-black p-4 flex items-center justify-between border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-xs font-display tracking-widest uppercase font-bold">
                CRITICAL PERSONNEL ALERT
              </p>
              <p className="font-mono text-[8px] opacity-90 uppercase">
                {metrics.filter((m) => m.status === 'CRÍTICO').length} profession(s) operating below
                minimum survival thresholds.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profession Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {professions?.map((profession, index) => {
          const Icon = getProfessionIcon(profession.name)
          const metric = metrics?.find((m) => m.id === profession.id)
          const metricsInfo = getProfessionMetricsInfo(profession.name)
          const personCount = profession.persons.length
          const required = profession.minimum_active_required
          const status =
            personCount >= required
              ? 'OK'
              : personCount === 0
                ? 'CRÍTICO'
                : 'DÉFICIT'

          return (
            <motion.div
              key={profession.id}
              variants={cardVariants}
              whileHover={{ scale: 1.02 }}
              className="paper-card group flex flex-col h-full bg-paper-dark/10 relative"
            >
              {/* Status Badge */}
              <div className="absolute top-3 right-3 rotate-12 z-10">
                <span
                  className={`status-badge px-2 py-0.5 text-[7px] border-[1px] ${
                    status === 'OK'
                      ? 'status-ok'
                      : status === 'CRÍTICO'
                        ? 'status-alert'
                        : 'status-warning'
                  }`}
                >
                  {status}
                </span>
              </div>

              <div className="p-4 space-y-4 flex-1 flex flex-col">
                {/* Profession Header */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-ink-black flex items-center justify-center border border-paper-dark/30 flex-shrink-0">
                    <Icon className="w-5 h-5 text-paper-base" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base leading-none uppercase font-display border-b border-ink-black/20 pb-0.5 pr-8">
                      {profession.name}
                    </h3>
                    <p className="text-[9px] font-mono text-ink-black/70 mt-1 uppercase font-bold">
                      ID: {profession.id}
                    </p>
                  </div>
                </div>

                {/* Personnel Count */}
                <div className="space-y-2">
                  <p className="text-[9px] font-mono text-ink-black/60 uppercase font-bold">
                    Staffing Level
                  </p>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-3xl font-display leading-none">{personCount}</p>
                      <p className="text-[8px] font-mono text-ink-black/60 mt-1 uppercase">
                        assigned
                      </p>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-sm font-mono text-ink-black/70">
                        min: <span className="font-bold">{required}</span>
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="status-line">
                    <div
                      className={`h-full transition-all ${
                        status === 'OK'
                          ? 'bg-success-green'
                          : status === 'CRÍTICO'
                            ? 'bg-accent-orange'
                            : 'bg-accent-orange/70'
                      }`}
                      style={{
                        width: `${Math.min((personCount / (required * 1.5)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Profession Metrics */}
                <div className="pt-3 border-t border-ink-black/10 flex-1">
                  <p className="text-[8px] font-mono text-ink-black/70 uppercase font-bold mb-2">
                    {metricsInfo.title}
                  </p>
                  <div className="space-y-1.5">
                    {metricsInfo.metrics.map((m, i) => (
                      <div key={i} className="text-[8px] font-mono text-ink-black/60">
                        <p className="uppercase font-bold">{m.label}</p>
                        <p className="text-ink-black/80 font-bold">
                          {m.value || (m.key === 'canExplore' ? (profession.can_explore ? '✓ YES' : '✗ NO') : metric?.[m.key as keyof typeof metric] || 'N/A')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exploration Capability */}
                <div className="pt-3 border-t border-ink-black/10">
                  <p className="text-[8px] font-mono text-ink-black/70 uppercase font-bold mb-1">
                    Expedition Capable
                  </p>
                  <p
                    className={`text-xs font-mono font-bold ${
                      profession.can_explore ? 'text-success-green' : 'text-accent-orange'
                    }`}
                  >
                    {profession.can_explore ? '✓ AUTHORIZED' : '✗ RESTRICTED'}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Personnel Directory Section */}
      {professions && professions.length > 0 && professions[0]?.persons.length > 0 && (
        <motion.div variants={cardVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            PERSONNEL DIRECTORY
          </h3>
          <p className="text-sm text-ink-black/70 mb-4 font-mono italic">
            Sample personnel from first profession - full directory available upon request
          </p>
          <div className="space-y-2">
            {professions[0]?.persons.slice(0, 5).map((person, i) => (
              <div
                key={i}
                className="border border-ink-black/10 p-3 rounded-sm bg-bunker-bg flex items-center justify-between"
              >
                <div>
                  <p className="font-display text-sm uppercase">
                    {person.first_name} {person.last_name}
                  </p>
                  <p className="text-xs font-mono text-paper-base/70 mt-1">
                    ID: {person.id} | Exp Lvl: {person.experience_level}
                  </p>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-1 rounded font-bold ${
                    person.status === 'activo'
                      ? 'status-ok'
                      : person.status === 'enfermo'
                        ? 'status-warning'
                        : 'status-alert'
                  }`}
                >
                  {person.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

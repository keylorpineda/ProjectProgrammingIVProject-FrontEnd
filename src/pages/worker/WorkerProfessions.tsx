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
  Users,
  Database,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/pages/admin/context/AuthContext'
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
  if (n.includes('recolector')) return Hammer
  if (n.includes('almacenista')) return Database
  return UserCog
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

export default function WorkerProfessions(_props: WorkerProfessionsProps) {
  const { user } = useAuth()
  const { data: professions } = useProfessions()
  const { metrics } = useProfessionMetrics()

  // Dashboard stats
  const dashboardStats = React.useMemo(() => {
    if (!professions) return []
    return [
      {
        label: 'Fuerza Laboral Total',
        value: professions.reduce((sum, p) => sum + p.persons.length, 0),
        sub: 'Personal Activo',
        icon: Users,
      },
      {
        label: 'Producción de Comida',
        value: '+12.4%',
        sub: 'vs Consumo',
        icon: TrendingUp,
        positive: true,
      },
      {
        label: 'Tasa de Lesiones',
        value: '6.4%',
        sub: 'Últimos 7 Días',
        icon: AlertTriangle,
        positive: false,
      },
      {
        label: 'Balance de Recursos',
        value: '98%',
        sub: 'Capacidad Sector',
        icon: Shield,
      },
    ]
  }, [professions])

  return (
    <motion.div
      className="p-4 space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={cardVariants}>
        <h2 className="text-2xl uppercase mb-1 drop-shadow-[1px_1px_0px_rgba(154,144,128,0.2)]">
          MANDO OCUPACIONAL
        </h2>
        <p className="terminal-text opacity-90 text-[10px] tracking-widest">
          Asignación estratégica de habilidades // análisis de eficiencia
        </p>
      </motion.div>

      {/* Operational Dashboard */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {dashboardStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="paper-card p-3 border-l-4 border-l-ink-black flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono text-ink-black/75 uppercase tracking-widest mb-1 font-bold">
                  {stat.label}
                </p>
                <p className="text-2xl font-display leading-none">{stat.value}</p>
                <p className="text-[9px] font-mono text-ink-black/70 mt-2 uppercase italic font-bold">
                  {stat.sub}
                </p>
              </div>
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
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
          className="bg-accent-orange text-ink-black p-3 flex items-center justify-between border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-xs font-display tracking-widest uppercase font-bold">
                ALERTA CRÍTICA DE PERSONAL: SECTOR {user?.campId}
              </p>
              <p className="font-mono text-[8px] opacity-90 uppercase">
                {metrics.filter((m) => m.status === 'CRÍTICO').length} Sectores operando bajo mínimos de
                supervivencia.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profession Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {professions?.map((profession) => {
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
              whileHover={{ scale: 1.01 }}
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
                    <h3 className="text-lg leading-none uppercase font-display border-b border-ink-black/20 pb-0.5 pr-8">
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
                      <p className="text-[8px] font-mono text-ink-black/60 mt-1 uppercase">assigned</p>
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

      {/* Manual Notation Placeholder */}
      <div className="relative h-16 flex items-center">
        <div className="w-full h-px bg-paper-dark/20" />
        <div className="absolute left-1/2 -translate-x-1/2 bg-bunker-bg px-4">
          <span className="marker-note text-sm opacity-100 uppercase tracking-widest font-bold">
            "REASIGNACIÓN DE PERSONAL INMINENTE"
          </span>
        </div>
      </div>
    </motion.div>
  )
}

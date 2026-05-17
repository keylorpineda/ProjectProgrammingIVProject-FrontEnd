import React from 'react'
import { User, MapPin, Briefcase, Users, Shield, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/pages/admin/context/AuthContext'
import { useAssignedResources, useProfessions } from '@/features/worker/hooks/useWorkerAPI'

interface WorkerProfileProps {
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

export default function WorkerProfile({ activeTab }: WorkerProfileProps) {
  const { user } = useAuth()
  const { data: assignedResources, isLoading: loadingResources } = useAssignedResources()
  const { data: professions, isLoading: loadingProfessions } = useProfessions()

  const isLoading = loadingResources || loadingProfessions

  // Find user's profession if exists
  const userProfession = React.useMemo(() => {
    if (!professions) return null
    // This would need to come from user data ideally
    return professions[0] || null
  }, [professions])

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-accent-orange opacity-60 mb-4" />
        <p className="font-mono text-sm text-paper-base/70 uppercase">Loading profile...</p>
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
        <h2>MI PERFIL</h2>
        <p className="terminal-text opacity-90">Personal // Worker Assignment Data</p>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div variants={itemVariants} className="paper-card p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-ink-black border-2 border-paper-base rounded-sm flex items-center justify-center">
              <User className="w-12 h-12 text-paper-base" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                Worker ID
              </p>
              <p className="text-3xl font-display uppercase">{user?.id || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-ink-black/20">
              <div>
                <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                  Username
                </p>
                <p className="text-lg font-display capitalize">{user?.username || 'Unknown'}</p>
              </div>

              <div>
                <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                  Role
                </p>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <p className="text-lg font-display uppercase">{user?.role || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                  Camp Assignment
                </p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <p className="text-lg font-display">SECTOR {user?.campId || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-mono text-ink-black/60 uppercase tracking-widest mb-1">
                  Status
                </p>
                <span className="status-badge status-ok">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profession Card */}
      {userProfession && (
        <motion.div variants={itemVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            ASSIGNED PROFESSION
          </h3>

          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-ink-black border border-paper-dark/30 rounded-sm flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-8 h-8 text-paper-base" />
            </div>

            <div className="flex-1">
              <p className="text-2xl font-display uppercase mb-3">{userProfession.name}</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase">Total Personnel</p>
                  <p className="text-2xl font-display mt-1">{userProfession.persons.length}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase">Active Now</p>
                  <p className="text-2xl font-display mt-1">
                    {userProfession.persons.filter((p) => p.status === 'activo').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-ink-black/60 uppercase">Min Required</p>
                  <p className="text-2xl font-display mt-1">{userProfession.minimum_active_required}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-mono text-ink-black/60 uppercase mb-2">Can Explore</p>
                <p className="text-sm font-mono">
                  {userProfession.can_explore ? (
                    <span className="text-success-green font-bold">✓ AUTHORIZED</span>
                  ) : (
                    <span className="text-accent-orange font-bold">✗ RESTRICTED</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Assigned Resources Section */}
      {assignedResources && assignedResources.length > 0 && (
        <motion.div variants={itemVariants} className="paper-card p-8">
          <h3 className="text-xl uppercase font-display border-b border-ink-black pb-2 mb-6">
            RESOURCE ASSIGNMENT
          </h3>

          <div className="space-y-4">
            {assignedResources.map((resource) => (
              <motion.div
                key={resource.id}
                whileHover={{ translateX: 4 }}
                className="border border-ink-black/10 p-4 rounded-sm bg-bunker-bg hover:bg-paper-dark/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {resource.image_url && (
                    <img
                      src={resource.image_url}
                      alt={resource.name}
                      className="w-16 h-16 object-cover rounded border border-ink-black/20 flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-lg uppercase font-bold">{resource.name}</p>
                        <p className="text-xs font-mono text-paper-base/70 uppercase mt-1">
                          {resource.category}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-display font-bold">{resource.current_quantity}</p>
                        <p className="text-xs font-mono text-ink-black/60">{resource.unit}</p>
                      </div>
                    </div>

                    <p className="text-sm text-ink-black/70 mt-3 leading-relaxed italic">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Profile Description */}
      <motion.div
        variants={itemVariants}
        className="dashed-accent p-8 bg-paper-base/30 relative overflow-hidden"
      >
        <div className="relative z-10">
          <h3 className="text-2xl uppercase font-display text-ink-black mb-4">PROFILE SUMMARY</h3>
          <p className="marker-note text-lg">"Duty and Dedication"</p>
          <p className="mt-6 text-sm text-ink-black/75 leading-relaxed font-mono italic">
            This worker profile contains complete assignment data: worker identification, assigned
            role, camp location, professions and related resources. All information is audited and
            verified by central command. Unauthorized modification will be logged and reported.
          </p>

          <div className="mt-6 pt-6 border-t border-ink-black/20">
            <p className="text-xs font-mono text-ink-black/60 uppercase mb-2">Last Updated</p>
            <p className="font-mono text-sm">{new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="absolute -bottom-8 -right-8 opacity-10 rotate-12">
          <Users className="w-64 h-64 text-ink-black" />
        </div>
      </motion.div>

      {/* Status Information */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="paper-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-success-green rounded-sm flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-mono text-ink-black/70 uppercase font-bold">Security Status</p>
            <p className="text-sm font-display mt-1">CLEARANCE GRANTED</p>
          </div>
        </div>

        <div className="paper-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-orange rounded-sm flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-ink-black" />
          </div>
          <div>
            <p className="text-xs font-mono text-ink-black/70 uppercase font-bold">Crew Assignment</p>
            <p className="text-sm font-display mt-1">CREW 07 - ACTIVE</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

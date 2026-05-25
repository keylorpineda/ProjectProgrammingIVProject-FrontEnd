import { motion } from "framer-motion"
import {
  LogOut,
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Compass,
} from "lucide-react"
import { useMyBadges } from "@/features/worker/hooks/useWorkerAPI"

interface WorkerSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  userName?: string | number
  campName?: string
  onLogout?: () => void
}

const NAV_ITEMS = [
  { id: "dashboard",   label: "TABLERO",       icon: LayoutDashboard, desc: "Visión general" },
  { id: "profile",     label: "MI EXPEDIENTE", icon: FileText,         desc: "Identidad & logros" },
  { id: "professions", label: "OCUPACIONES",   icon: Users,            desc: "Roles del sector" },
  { id: "resources",   label: "ALMACÉN",       icon: Package,          desc: "Inventario" },
  { id: "expeditions", label: "EXPEDICIONES",  icon: Compass,          desc: "Misiones del sector" },
]

function getRankLabel(n: number) {
  if (n >= 10) return { label: "LEYENDA", color: "#c8a84b" }
  if (n >= 7)  return { label: "ÉLITE",   color: "#8b5cf6" }
  if (n >= 4)  return { label: "VETERANO",color: "#4c6351" }
  if (n >= 2)  return { label: "SOLDADO", color: "#3b82f6" }
  return           { label: "RECLUTA",  color: "rgba(154,144,128,0.6)" }
}

export default function WorkerSidebar({
  activeTab,
  setActiveTab,
  userName = "WORKER",
  campName,
  onLogout,
}: WorkerSidebarProps) {
  const { data: badges } = useMyBadges()
  const badgeCount = badges?.length ?? 0
  const rank = getRankLabel(badgeCount)

  // XP bar: 0..100 based on badge milestones
  const xpPct = Math.min(Math.round((badgeCount / 10) * 100), 100)

  return (
    <aside
      style={{
        width: 270,
        minWidth: 270,
        height: "100vh",
        background: "#0d0c0a",
        borderRight: "1px solid #1f1d19",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        zIndex: 50,
        userSelect: "none",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* ── Vertical amber accent stripe ─────────────────────── */}
      <div style={{
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: "linear-gradient(to bottom, #b38536 0%, rgba(179,133,54,0.3) 60%, transparent 100%)",
        zIndex: 1,
      }} />

      {/* ── BRAND ──────────────────────────────────────────────── */}
      <div style={{ padding: "22px 20px 18px 22px" }}>
        {/* Logotype row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          {/* Gold square mark */}
          <span style={{
            display: "inline-block",
            width: 9, height: 9,
            background: "#b38536",
            flexShrink: 0,
            boxShadow: "0 0 8px rgba(179,133,54,0.6)",
          }} />
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "1.05rem",
            fontWeight: 900,
            letterSpacing: 2,
            color: "#c8a84b",
            textTransform: "uppercase",
            lineHeight: 1,
          }}>
            GESTIÓN DEL FIN
          </span>
        </div>

        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.53rem",
          letterSpacing: 2.5,
          color: "rgba(179,133,54,0.3)",
          textTransform: "uppercase",
          paddingLeft: 17,
          marginBottom: 14,
        }}>
          SISTEMA DE SUPERVIVENCIA
        </div>

        {/* Camp chip */}
        {campName ? (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(179,133,54,0.22)",
            marginBottom: 14,
          }}>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "#4c6351",
                boxShadow: "0 0 6px #4c6351",
                display: "inline-block", flexShrink: 0,
              }}
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.6rem",
              color: "rgba(200,168,75,0.75)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
              {campName}
            </span>
          </div>
        ) : null}

        {/* Amber separator */}
        <div style={{
          height: 1,
          background: "linear-gradient(to right, rgba(179,133,54,0.55) 0%, transparent 100%)",
        }} />
      </div>

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        padding: "4px 12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
      }}>
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={!active ? { x: 4 } : {}}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                background: active
                  ? "linear-gradient(90deg, rgba(179,133,54,0.18) 0%, rgba(179,133,54,0.04) 100%)"
                  : "transparent",
                borderLeft: active ? "3px solid #b38536" : "3px solid transparent",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                color: active ? "#c8a84b" : "rgba(154,144,128,0.42)",
                fontFamily: "'Special Elite', monospace",
                fontSize: "0.72rem",
                letterSpacing: 2,
                textTransform: "uppercase",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                outline: "none",
                transition: "all 0.12s ease",
                position: "relative",
              }}
            >
              <Icon
                size={14}
                style={{
                  flexShrink: 0,
                  color: active ? "#b38536" : "rgba(179,133,54,0.35)",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>{item.label}</div>
                {active ? (
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.5rem",
                    letterSpacing: 1,
                    color: "rgba(179,133,54,0.45)",
                    marginTop: 1,
                    textTransform: "none",
                  }}>
                    {item.desc}
                  </div>
                ) : null}
              </div>
              {active ? (
                <motion.span
                  layoutId="nav-indicator"
                  style={{
                    width: 6, height: 6,
                    borderRadius: "50%",
                    background: "#b38536",
                    boxShadow: "0 0 8px #b38536",
                    flexShrink: 0,
                  }}
                />
              ) : null}
            </motion.button>
          )
        })}
      </nav>

      {/* ── GAMIFICATION STRIP ────────────────────────────────── */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(179,133,54,0.12)",
          padding: "12px 14px",
          marginBottom: 8,
        }}>
          {/* Rank header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.52rem",
              color: "rgba(154,144,128,0.5)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}>
              RANGO
            </span>
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: "0.65rem",
              color: rank.color,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}>
              {rank.label}
            </span>
          </div>

          {/* XP bar */}
          <div style={{
            height: 4,
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(179,133,54,0.1)",
            marginBottom: 6,
            overflow: "hidden",
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, rgba(179,133,54,0.6), ${rank.color})`,
                boxShadow: `0 0 6px ${rank.color}`,
              }}
            />
          </div>

          {/* XP label + badge count */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.48rem",
              color: "rgba(154,144,128,0.4)",
              letterSpacing: 1,
            }}>
              {xpPct}% PROGRESO
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.48rem",
              color: "rgba(200,168,75,0.5)",
              letterSpacing: 1,
            }}>
              {badgeCount} INSIG.
            </span>
          </div>
        </div>

        {/* Separator */}
        <div style={{
          height: 1,
          background: "rgba(0,0,0,0.6)",
          marginBottom: 10,
        }} />

        {/* Identity card */}
        <div style={{
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(179,133,54,0.15)",
          padding: "10px 13px",
          marginBottom: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <motion.span
              animate={{
                opacity: [1, 0.4, 1],
                boxShadow: ["0 0 4px #4c6351", "0 0 12px #4c6351", "0 0 4px #4c6351"],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#4c6351", display: "inline-block", flexShrink: 0,
              }}
            />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.52rem",
              color: "#4c6351",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontWeight: "bold",
            }}>
              ACTIVO EN SECTOR
            </span>
          </div>

          <div style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: "0.88rem",
            color: "#c8a84b",
            textTransform: "uppercase",
            letterSpacing: 1,
            lineHeight: 1.2,
            wordBreak: "break-all",
          }}>
            {String(userName).toUpperCase()}
          </div>

          <div style={{
            marginTop: 7,
            height: 1,
            background: "linear-gradient(to right, rgba(179,133,54,0.25), transparent)",
          }} />
        </div>

        {/* Logout */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{
            background: "rgba(156,39,32,0.12)",
            borderColor: "rgba(156,39,32,0.7)",
            color: "#c94040",
          }}
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "9px 12px",
            background: "transparent",
            border: "1px solid rgba(156,39,32,0.25)",
            color: "rgba(156,39,32,0.65)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.58rem",
            fontWeight: "bold",
            letterSpacing: 2,
            textTransform: "uppercase",
            cursor: "pointer",
            outline: "none",
            transition: "all 0.15s ease",
          }}
        >
          <LogOut size={11} />
          CERRAR SESIÓN
        </motion.button>
      </div>
    </aside>
  )
}

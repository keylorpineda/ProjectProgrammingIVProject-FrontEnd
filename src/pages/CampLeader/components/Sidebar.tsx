/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Compass, Truck, Boxes, User as UserIcon } from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "dashboard", label: "TABLERO", icon: LayoutDashboard },
    { id: "explorations", label: "EXPLORACIONES", icon: Compass },
    { id: "transfers", label: "TRASLADOS", icon: Truck },
    { id: "inventory", label: "INVENTARIO", icon: Boxes },
    { id: "profile", label: "PERFIL", icon: UserIcon },
  ]

  return (
    <aside
      className="w-full md:w-72 border-b-2 md:border-b-0 md:border-r-2 border-black p-4 flex flex-col justify-between shrink-0 z-20 select-none font-mono"
      style={{ backgroundColor: "#121110" }}
    >
      <div>
        {/* BRAND HEADER */}
        <div className="mb-6 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            <span
              style={{
                color: "#9c2720",
                fontSize: "1.25rem",
                animation: "pulse 2s infinite",
                fontWeight: "bold",
              }}
            >
              ★
            </span>
            <span
              style={{
                fontSize: "1.125rem",
                fontWeight: "900",
                color: "#df8120",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              LÍDER CENTRAL
            </span>
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#71717a",
              letterSpacing: "0.05em",
              fontWeight: "800",
              textTransform: "uppercase",
              marginTop: "0.125rem",
              paddingLeft: "0.125rem",
            }}
          >
            SISTEMA DEL CAMPAMENTO
          </p>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
                aria-pressed={isActive}
                style={{
                  width: "100%",
                  textAlign: "left",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "1rem",
                  borderRadius: "0.75rem",
                  transition: "all 150ms ease",
                  border: "2px solid #000000",
                  cursor: "pointer",
                  flexShrink: 0,
                  minWidth: 0,
                  marginBottom: "16px",
                  backgroundColor: isActive ? "#c27c2f" : "#9a9080",
                  color: "#000000",
                  boxShadow: "3px 3px 0px #000000",
                  padding: "20px 20px",
                  fontFamily: '"Special Elite", monospace',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateX(4px)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0px)"
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "translateY(2px)"
                }}
                onMouseUp={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = "translateX(4px)"
                  }
                }}
              >
                <Icon
                  style={{ width: "1.5rem", height: "1.5rem", flexShrink: 0, color: "#000000" }}
                />
                <span
                  style={{
                    fontFamily: '"Special Elite", monospace',
                    fontSize: "0.875rem",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "#000000",
                    fontWeight: "800",
                    userSelect: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  MapPin,
  Package,
  ArrowLeftRight,
  Trophy,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import DashboardView from "./components/DashboardView"
import ExplorationsView from "./components/ExplorationsView"
import InventoryView from "./components/InventoryView"
import MembersView from "./components/MembersView"
import OccupationsView from "./components/OccupationsView"
import ProfileView from "./components/ProfileView"
import RankingView from "./components/RankingView"
import TransfersView from "./components/TransfersView"
import {
  explorationsService,
  resourcesService,
  transfersService,
  usersService,
} from "./lib/services"

import type {
  Camp,
  CampBalance,
  CampStatistics,
  Exploration,
  Inventory,
  InventoryMovement,
  Person,
  ResourceItem,
  Transfer,
} from "./types"

import RoleShell, { type RoleNavItem } from "@/components/layouts/RoleShell"
import AlertsBanner from "@/components/ui/AlertsBanner"
import InactivityGuard from "@/components/ui/InactivityGuard"
import { useAlertSocket } from "@/hooks/useAlertSocket"
import { use3DStore } from "@/store/use3DStore"
import { useAuthStore, useTokenStore } from "@/store/useAuthStore"

import "./campleader.css"

const NAV_ITEMS: RoleNavItem[] = [
  { key: "dashboard", label: "TABLERO", icon: LayoutDashboard },
  { key: "members", label: "MIEMBROS", icon: Users },
  { key: "occupations", label: "OCUPACIONES", icon: Briefcase },
  { key: "explorations", label: "EXPLORACIONES", icon: MapPin },
  { key: "inventory", label: "INVENTARIO", icon: Package },
  { key: "transfers", label: "TRASLADOS", icon: ArrowLeftRight },
  { key: "ranking", label: "RANKING", icon: Trophy },
]

const TITLES: Record<string, string> = {
  dashboard: "TABLERO DE CONTROL",
  members: "MIEMBROS",
  occupations: "OCUPACIONES",
  explorations: "EXPLORACIONES",
  inventory: "INVENTARIO",
  transfers: "TRASLADOS",
  ranking: "RANKING",
  profile: "MI EXPEDIENTE",
}

// Clic en un edificio 3D → pestaña del líder de campamento.
const BUILDING_TO_TAB: Record<string, string> = {
  hq: "dashboard",
  gate: "members",
  barracks: "members",
  watchtower: "explorations",
  warehouse: "inventory",
  garage: "transfers",
  profile: "profile",
}

export default function CampLeaderLayout() {
  const { user, logout } = useAuthStore()
  const campId = String(user?.camp_id ?? "")
  useAlertSocket(campId)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("camp")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [utcTime, setUtcTime] = useState("")
  useEffect(() => {
    const update = () =>
      setUtcTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC")
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])

  const showWindow = activeTab !== "camp"

  // Core App states
  const [explorations, setExplorations] = useState<Exploration[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [inventory, setInventory] = useState<Inventory[]>([])
  const [balances, setBalances] = useState<CampBalance[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [residents, setResidents] = useState<Person[]>([])
  const [statistics, setStatistics] = useState<CampStatistics>({
    total_persons: 0,
    active_workers: 0,
    injured_or_sick: 0,
    exploring: 0,
    deceased: 0,
    occupancy_rate: 0,
    explorations_completed: 0,
    survival_score: 0,
  })

  // Base config states
  const [camps, setCamps] = useState<Camp[]>([])
  const [resources, setResources] = useState<ResourceItem[]>([])

  // ── Data loading ──────────────────────────────────────────────────────────
  const reloadData = useCallback(async () => {
    if (!user) return
    const campId = Number(user.camp_id ?? 1)
    const token = useTokenStore.getState().getToken() ?? ""

    // Phase 1 — critical data: render UI as soon as this resolves (6 requests, 0 duplicates)
    try {
      const [expList, trList, invList, dashboard, resList, campsRaw] = await Promise.all([
        explorationsService.getExplorations(campId),
        transfersService.getCampTransferRequests(campId),
        resourcesService.getCampInventory(campId),
        usersService.getCampDashboard(campId), // single /dashboard call
        usersService.getCampPersons(campId),
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/camps`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ])

      setExplorations(expList)
      setTransfers(trList)
      setInventory(invList)
      setBalances(dashboard.balances)
      setStatistics(dashboard.statistics)
      setResidents(resList)
      setCamps(Array.isArray(campsRaw) ? campsRaw : (campsRaw?.data ?? []))
    } catch (e) {
      console.error("Error loading camp leader data:", e)
    }

    // Phase 2 — secondary data: movements + resource catalog (loads in background)
    Promise.all([
      resourcesService.getInventoryMovements(campId),
      resourcesService.getAllResources(),
    ])
      .then(([movList, rVal]) => {
        setMovements(movList)
        setResources(rVal)
      })
      .catch(() => {
        /* non-critical, silently skip */
      })
  }, [user])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      await reloadData()
      setLoading(false) // spinner off after Phase 1 only
    }
    run()
  }, [reloadData])

  // ── Exploration handlers ──────────────────────────────────────────────────

  const handleCreateExploration = async (data: any) => {
    setActionLoading(true)
    try {
      await explorationsService.createExploration(data)
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleDepartExploration = async (id: number) => {
    setActionLoading(true)
    try {
      await explorationsService.departExploration(id)
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturnExploration = async (id: number, data: any) => {
    setActionLoading(true)
    try {
      await explorationsService.returnExploration(id, data)
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelExploration = async (id: number) => {
    setActionLoading(true)
    try {
      await explorationsService.cancelExploration(id)
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  // ── Transfer handlers ─────────────────────────────────────────────────────

  const handleCreateTransferRequest = async (data: any) => {
    setActionLoading(true)
    try {
      await transfersService.createTransferRequest(data)
      // Cinemática del camión saliendo del campamento al crear el traslado.
      if (user?.camp_id) use3DStore.getState().startTransferCinematic(user.camp_id)
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveTransferRequest = async (id: number, approved: boolean) => {
    setActionLoading(true)
    try {
      await transfersService.handleTransferApproval(id, approved, Number(user?.id ?? 0))
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelTransferRequest = async (id: number) => {
    setActionLoading(true)
    try {
      await transfersService.cancelTransferRequest(id)
      await reloadData()
    } finally {
      setActionLoading(false)
    }
  }

  // ── Active people filter ──────────────────────────────────────────────────
  const activeHealthyResidents = residents.filter((p) => p.status === "active" && p.can_work)

  const getActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardView
            explorations={explorations}
            transfers={transfers}
            inventory={inventory}
            balances={balances}
            movements={movements}
            statistics={statistics}
            onNavigate={(tag) => setActiveTab(tag)}
          />
        )
      case "explorations":
        return (
          <ExplorationsView
            explorations={explorations}
            activePersons={activeHealthyResidents}
            inventory={inventory}
            resources={resources}
            camps={camps}
            myCampId={Number(user?.camp_id ?? 1)}
            onCreateExploration={handleCreateExploration}
            onDepartExploration={handleDepartExploration}
            onReturnExploration={handleReturnExploration}
            onCancelExploration={handleCancelExploration}
          />
        )
      case "transfers":
        return (
          <TransfersView
            transfers={transfers}
            camps={camps}
            resources={resources}
            inventory={inventory}
            myCampId={Number(user?.camp_id ?? 1)}
            onCreateTransferRequest={handleCreateTransferRequest}
            onApproveTransferRequest={handleApproveTransferRequest}
            onCancelTransferRequest={handleCancelTransferRequest}
          />
        )
      case "inventory":
        return <InventoryView inventory={inventory} />
      case "ranking":
        return <RankingView campId={Number(user?.camp_id ?? 1)} />
      case "members":
        return <MembersView residents={residents} />
      case "occupations":
        return <OccupationsView residents={residents} />
      case "profile":
        return <ProfileView user={user} statistics={statistics} residents={residents} />
      default:
        return null
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <InactivityGuard isAuthenticated={!!user} onLogout={handleLogout}>
      <RoleShell
        brandTitle="LÍDER DE BASE"
        brandSubtitle={`BASE :: ${user?.camp_id || "N/A"}`}
        navItems={NAV_ITEMS}
        activeKey={activeTab}
        onSelect={setActiveTab}
        windowTitle={TITLES[activeTab] ?? "PANEL"}
        showWindow={showWindow}
        onCloseWindow={() => setActiveTab("camp")}
        campId={campId}
        userInitial={user?.username?.[0]?.toUpperCase() || String(user?.id ?? "L")[0]}
        userName={user?.username?.toUpperCase() || String(user?.id ?? "LÍDER")}
        roleLabel="LÍDER DE CAMPAMENTO"
        onLogout={handleLogout}
        onViewProfile={() => setActiveTab("profile")}
        utcTime={utcTime}
        onBuildingSelect={(id) => setActiveTab(BUILDING_TO_TAB[id] ?? "dashboard")}
        extras={
          <>
            <AlertsBanner campId={campId} />
            <AnimatePresence>
              {actionLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100] font-mono text-center"
                >
                  <div className="border border-[#c27c2f] max-w-xs w-full bg-[#161513] p-5 shadow-[4px_4px_0_#000] rounded">
                    <span className="animate-spin inline-block w-8 h-8 rounded-full border-2 border-[#c27c2f] border-t-transparent mb-4" />
                    <p className="font-typewriter text-xs text-white font-bold uppercase tracking-wider">
                      ACTUALIZANDO REGISTRO CENTRAL...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        }
      >
        <div className="campleader-view px-6 pt-4 pb-4" style={{ minHeight: "100%" }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-10 h-64">
              <div className="relative flex h-8 w-8 mb-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fca311] opacity-75" />
                <span className="relative inline-flex rounded-full h-8 w-8 bg-[#c27c2f]" />
              </div>
              <h3 className="font-typewriter text-sm tracking-widest text-[#fca311] animate-pulse">
                CARGANDO DATOS DEL CAMPAMENTO...
              </h3>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
            >
              {getActiveView()}
            </motion.div>
          )}
        </div>
      </RoleShell>
    </InactivityGuard>
  )
}

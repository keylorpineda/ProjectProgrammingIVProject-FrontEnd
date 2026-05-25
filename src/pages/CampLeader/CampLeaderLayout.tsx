import { useState, useEffect } from "react"
import "./campleader.css"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/useAuthStore"
import InactivityGuard from "@/components/ui/InactivityGuard"

import {
  explorationsService,
  transfersService,
  resourcesService,
  usersService,
} from "./lib/services"

import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import Footer from "./components/Footer"

import DashboardView from "./components/DashboardView"
import ExplorationsView from "./components/ExplorationsView"
import TransfersView from "./components/TransfersView"
import InventoryView from "./components/InventoryView"
import ProfileView from "./components/ProfileView"

import type {
  Exploration,
  Transfer,
  Inventory,
  CampBalance,
  InventoryMovement,
  Person,
  CampStatistics,
  Camp,
  ResourceItem,
} from "./types"

export default function CampLeaderLayout() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

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

  // Load all data from the real backend
  const reloadData = async () => {
    if (!user) return
    try {
      const campId = Number(user.camp_id ?? (user as any).campId ?? 1)

      const [expList, trList, invList, balList, movList, resList, statVal, campsData, rVal] =
        await Promise.all([
          explorationsService.getExplorations(campId),
          transfersService.getCampTransferRequests(campId),
          resourcesService.getCampInventory(campId),
          usersService.getCampBalances(campId),
          resourcesService.getInventoryMovements(campId),
          usersService.getCampPersons(campId),
          usersService.getCampStatistics(campId),
          // Load camps list from backend
          fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/camps`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("auth-token") ?? ""}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
          resourcesService.getAllResources(),
        ])

      setExplorations(expList)
      setTransfers(trList)
      setInventory(invList)
      setBalances(balList)
      setMovements(movList)
      setResidents(resList)
      setStatistics(statVal)
      setCamps(Array.isArray(campsData) ? campsData : (campsData?.data ?? []))
      setResources(rVal)
    } catch (e) {
      console.error("Error loading camp leader data:", e)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      await reloadData()
      setLoading(false)
    }
    run()
  }, [user])

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

  const handleArriveTransferRequest = async (id: number) => {
    setActionLoading(true)
    try {
      await transfersService.arriveTransferRequest(id)
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
            myCampId={Number(user?.camp_id ?? (user as any)?.campId ?? 1)}
            onCreateTransferRequest={handleCreateTransferRequest}
            onApproveTransferRequest={handleApproveTransferRequest}
            onCancelTransferRequest={handleCancelTransferRequest}
            onArriveTransferRequest={handleArriveTransferRequest}
          />
        )
      case "inventory":
        return <InventoryView inventory={inventory} />
      case "profile":
        return <ProfileView user={user} statistics={statistics} residents={residents} />
      default:
        return null
    }
  }

  return (
    <InactivityGuard
      isAuthenticated={!!user}
      onLogout={() => { logout(); window.location.href = "/login" }}
    >
    <div className="campleader-view relative min-h-screen bg-[#161513] text-white flex flex-col overflow-x-hidden select-none">
      {/* CRT SCANLINES SCREEN STYLES */}
      <div className="crt-overlay" />

      {/* CORE FRAMEWORK GRID STRUCTURE */}
      <div className="flex flex-1">
        {/* LEFT TAB DIRECTORIES BAR */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* RIGHT MAIN CONTAINER */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto max-h-screen relative bg-[#161513]">
          {/* HEADER SECTOR CHANNELS */}
          <Topbar survivalScore={statistics.survival_score} />

          {/* COMPONENT VIEWS PORTAL */}
          <main className="relative">
            <AnimatePresence mode="wait">
              {loading ? (
                <div
                  key="loading"
                  className="absolute inset-0 flex flex-col items-center justify-center p-10 bg-[#161513]"
                >
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
                  initial={{ opacity: 0, scale: 0.99, y: 3 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.99, y: -3 }}
                  transition={{ type: "spring", stiffness: 220, damping: 25 }}
                >
                  {getActiveView()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION LOADING OVERLAY */}
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
          </main>

          {/* SYSTEM FOOTER */}
          <Footer />
        </div>
      </div>
    </div>
    </InactivityGuard>
  )
}

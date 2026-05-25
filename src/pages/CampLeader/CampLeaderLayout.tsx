// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import './campleader.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  initDb, 
  subscribeToNotifications, 
  startWebsocketSimulation 
} from './lib/db';
import { useAuthStore } from './store/useAuthStore';
import { 
  explorationsService,
  transfersService,
  resourcesService,
  usersService 
} from './lib/services';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Footer from './components/Footer';

import DashboardView from './components/DashboardView';
import ExplorationsView from './components/ExplorationsView';
import TransfersView from './components/TransfersView';
import InventoryView from './components/InventoryView';
import ProfileView from './components/ProfileView';

import { 
  Exploration, 
  Transfer, 
  Inventory, 
  CampBalance, 
  InventoryMovement, 
  Person, 
  CampStatistics,
  Camp,
  ResourceItem
} from './types';
import { Radio, AlertCircle, Sparkles, X, CheckCircle } from 'lucide-react';

interface AlertNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'critical' | 'success';
}

export default function CampLeaderLayout() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Core App states
  const [explorations, setExplorations] = useState<Exploration[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [balances, setBalances] = useState<CampBalance[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [residents, setResidents] = useState<Person[]>([]);
  const [statistics, setStatistics] = useState<CampStatistics>({
    total_persons: 0,
    active_workers: 0,
    injured_or_sick: 0,
    exploring: 0,
    deceased: 0,
    occupancy_rate: 0,
    explorations_completed: 0,
    survival_score: 0
  });

  // Base configurations states
  const [camps, setCamps] = useState<Camp[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Real-time active notification states
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  // Setup databases & seed initial indicators
  useEffect(() => {
    initDb();
    startWebsocketSimulation();
    
    // Subscribe to simulated Socket.IO ws channels
    const unsubscribe = subscribeToNotifications((payload) => {
      const newAlert: AlertNotification = {
        id: Math.random().toString(),
        title: payload.title,
        body: payload.body,
        type: payload.type
      };

      setNotifications((prev) => [newAlert, ...prev].slice(0, 3)); // Keep maximum 3 current warnings in queue

      // Auto dismiss
      setTimeout(() => {
        setNotifications((prev) => prev.filter(x => x.id !== newAlert.id));
      }, 7000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Hydrate states with delayed tickers
  const reloadData = async () => {
    if (!user) return;
    try {
      const campId = user.campId;

      const [
        expList,
        trList,
        invList,
        balList,
        movList,
        resList,
        statVal,
        cVal,
        rVal
      ] = await Promise.all([
        explorationsService.getExplorations(campId),
        transfersService.getCampTransferRequests(campId),
        resourcesService.getCampInventory(campId),
        usersService.getCampBalances(campId),
        resourcesService.getInventoryMovements(campId),
        usersService.getCampPersons(campId),
        usersService.getCampStatistics(campId),
        Promise.resolve(JSON.parse(localStorage.getItem('DOOMSDAY_SYS_CAMPS') || '[]')),
        resourcesService.getAllResources()
      ]);

      setExplorations(expList);
      setTransfers(trList);
      setInventory(invList);
      setBalances(balList);
      setMovements(movList);
      setResidents(resList);
      setStatistics(statVal);
      setCamps(cVal);
      setResources(rVal);
    } catch (e) {
      console.error("FATAL ERROR HYDRATING DATABASE RECORDS: ", e);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await reloadData();
      setLoading(false);
    };
    run();
  }, [user]);

  // MUTATING HANDLERS: EXPLORATIONS
  const handleCreateExploration = async (data: any) => {
    setActionLoading(true);
    try {
      await explorationsService.createExploration(data);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDepartExploration = async (id: number) => {
    setActionLoading(true);
    try {
      await explorationsService.departExploration(id);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnExploration = async (id: number, data: any) => {
    setActionLoading(true);
    try {
      await explorationsService.returnExploration(id, data);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelExploration = async (id: number) => {
    setActionLoading(true);
    try {
      await explorationsService.cancelExploration(id);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  // MUTATING HANDLERS: TRANSFERS/CONVOYS
  const handleCreateTransferRequest = async (data: any) => {
    setActionLoading(true);
    try {
      await transfersService.createTransferRequest(data);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTransferRequest = async (id: number, approved: boolean) => {
    setActionLoading(true);
    try {
      await transfersService.handleTransferApproval(id, approved, user?.id || 1);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTransferRequest = async (id: number) => {
    setActionLoading(true);
    try {
      await transfersService.cancelTransferRequest(id);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleArriveTransferRequest = async (id: number) => {
    setActionLoading(true);
    try {
      await transfersService.arriveTransferRequest(id);
      await reloadData();
    } finally {
      setActionLoading(false);
    }
  };

  // Active People filtering (must be healthy i.e. status active, and can work)
  const activeHealthyResidents = residents.filter(p => p.status === 'active' && p.can_work);

  const getActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            explorations={explorations}
            transfers={transfers}
            inventory={inventory}
            balances={balances}
            movements={movements}
            onNavigate={(tag) => setActiveTab(tag)}
          />
        );
      case 'explorations':
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
        );
      case 'transfers':
        return (
          <TransfersView 
            transfers={transfers}
            camps={camps}
            resources={resources}
            inventory={inventory}
            myCampId={user?.campId || 1}
            onCreateTransferRequest={handleCreateTransferRequest}
            onApproveTransferRequest={handleApproveTransferRequest}
            onCancelTransferRequest={handleCancelTransferRequest}
            onArriveTransferRequest={handleArriveTransferRequest}
          />
        );
      case 'inventory':
        return <InventoryView inventory={inventory} />;
      case 'profile':
        return (
          <ProfileView 
            user={user}
            statistics={statistics}
            residents={residents}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="campleader-view relative min-h-screen bg-[#161513] text-white flex flex-col overflow-hidden select-none">
      
      {/* CRT SCANLINES SCREEN STYLES */}
      <div className="crt-overlay" />

      {/* CORE FRAMEWORK GRID STRUCTURE */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT TAB DIRECTORIES BAR */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* RIGHT MAIN CONTAINER */}
        <div className="flex-1 flex flex-col overflow-y-auto max-h-screen relative bg-[#161513]">
          
          {/* HEADER SECTOR CHANNELS */}
          <Topbar survivalScore={statistics.survival_score} />

          {/* COMPONENT VIEWS PORTAL */}
          <main className="flex-1 relative">
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
                    CARGANDO CONEXIÓN INTER-CAMPAL...
                  </h3>
                  <p className="font-mono text-[10px] text-[#fca311]/60 mt-2 uppercase tracking-wide">
                    INICIALIZANDO HOJAS LOGÍSTICAS DE COMANDANCIA ALFA
                  </p>
                </div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.99, y: 3 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.99, y: -3 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                >
                  {getActiveView()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION MUTATION MASK LOADER */}
            <AnimatePresence>
              {actionLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-100 font-mono text-center"
                >
                  <div className="border border-[#c27c2f] max-w-xs w-full bg-[#161513] p-5 shadow-[4px_4px_0_#000] rounded">
                    <span className="animate-spin inline-block w-8 h-8 rounded-full border-2 border-[#c27c2f] border-t-transparent mb-4" />
                    <p className="font-typewriter text-xs text-white font-bold uppercase tracking-wider">
                      ACTUALIZANDO REGISTRO CENTRAL...
                    </p>
                    <p className="font-mono text-[9px] text-[#ab9e8b] mt-1 uppercase tracking-widest">
                      MUTANDO BASES EN PostgreSQL / NestJS DESPATCHS
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* SYSTEM METRICS STATUSES */}
          <Footer />

        </div>
      </div>

      {/* WEBSOCKET SIMULATION / EVENT TIMELINE PUSH POP SYSTEM */}
      <div id="websocket-alerts-box" className="fixed bottom-12 right-6 space-y-3 max-w-xs w-full z-1000">
        <AnimatePresence>
          {notifications.map((notif) => {
            const isAlarm = notif.type === 'critical' || notif.type === 'warning';
            return (
              <motion.div
                key={notif.id}
                initial={{ transform: 'translateX(100%)', opacity: 0 }}
                animate={{ transform: 'translateX(0)', opacity: 1 }}
                exit={{ transform: 'translateX(100%)', opacity: 0 }}
                transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                className={`p-3.5 rounded border-2 shadow-[4px_4px_0px_#000] text-left flex gap-3 cursor-pointer select-none overflow-hidden relative ${
                  notif.type === 'critical' ? 'bg-red-950/95 border-red-700 text-red-200' :
                  notif.type === 'warning' ? 'bg-amber-950/95 border-[#c27c2f] text-amber-200' :
                  notif.type === 'success' ? 'bg-[#3b4d3e]/95 border-emerald-700 text-emerald-200' :
                  'bg-zinc-900/95 border-zinc-700 text-zinc-300'
                }`}
                onClick={() => setNotifications(prev => prev.filter(x => x.id !== notif.id))}
              >
                {/* Visual Alarm Bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  isAlarm ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                }`} />

                <div className="shrink-0 pt-0.5 pl-1">
                  <Radio className={`w-4 h-4 ${isAlarm ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
                </div>

                <div className="font-mono flex-1 text-[11px]">
                  <div className="flex justify-between items-center mb-1 pr-1">
                    <span className="font-bold uppercase text-[9px] tracking-widest text-[#ab9e8b] block leading-none">
                      RADIO TRANSMISION
                    </span>
                    <X className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                  </div>
                  <h4 className="font-bold uppercase text-white leading-4">
                    {notif.title}
                  </h4>
                  <p className="mt-1 leading-3.5 uppercase text-zinc-300">
                    {notif.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}

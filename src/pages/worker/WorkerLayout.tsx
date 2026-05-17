import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/pages/admin/context/AuthContext'
import WorkerSidebar from '@/components/ui/WorkerSidebar'
import WorkerTopBar from '@/components/ui/WorkerTopBar'
import WorkerDashboard from './WorkerDashboard'
import './worker.css'

export default function WorkerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  const handleLogout = () => {
    void logout().finally(() => navigate('/login'))
  }

  return (
    <div className="worker-layout relative selection:bg-accent-orange selection:text-ink-black uppercase">
      {/* Visual Overlays */}
      <div className="vintage-scanline" />
      
      {/* Sidebar */}
      <WorkerSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userName={user?.id}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="worker-main-content">
        {/* Top Bar */}
        <WorkerTopBar 
          campName={user?.campId}
          userName={user?.id}
        />

        {/* Route Container */}
        <main className="worker-route-container">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="dashboard" element={<WorkerDashboard activeTab={activeTab} />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

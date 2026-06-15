import path from "path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // ES2020 so three.js native optional-chaining etc. isn't polyfilled away.
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          // three.js is ~600 KB and lazy-loaded via Camp3DOverlay — own cache entry.
          "vendor-three": ["three"],
          // Map / geo stack only loaded on map route.
          "vendor-leaflet": ["leaflet", "react-leaflet", "react-leaflet-cluster"],
          // Framer Motion is large; isolate so layout pages don't re-download it.
          "vendor-motion": ["framer-motion"],
          // Data fetching & global state
          "vendor-query": ["@tanstack/react-query"],
          // Socket.io client
          "vendor-socket": ["socket.io-client"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      exclude: [
        "src/components/BadgeLogin.tsx",
        "src/components/BadgeRegister.tsx",
        "src/components/ui/PinnedCard.tsx",
        "src/components/ui/WorkerTopBar.tsx",
        "src/config/api.ts",
        "src/features/camp-manager/components/DashboardManager.tsx",
        "src/features/camp-manager/components/ManagerCatalog.tsx",
        "src/features/camp-manager/components/ManagerInventory.tsx",
        "src/features/camp-manager/components/ManagerLogistics.tsx",
        "src/features/camp-manager/components/ManagerOverview.tsx",
        "src/features/camp-manager/components/ManagerRanking.tsx",
        "src/features/camp-manager/components/ManagerWorkforce.tsx",
        "src/features/inventory/services/inventory.service.ts",
        "src/features/map-test/components/ExplorationZoneMap.tsx",
        "src/features/upload/components/ImageUploader.tsx",
        "src/hooks/useAlertSocket.ts",
        "src/hooks/useSocket.ts",
        "src/pages/Admin/context/AuthContext.tsx",
        "src/pages/AdmissionNew/AdmissionNew.tsx",
        "src/pages/CampLeader/CampLeaderLayout.tsx",
        "src/pages/CampLeader/components/DashboardView.tsx",
        "src/pages/CampLeader/components/ExplorationsView.tsx",
        "src/pages/CampLeader/components/MembersView.tsx",
        "src/pages/CampLeader/components/OccupationsView.tsx",
        "src/pages/CampLeader/components/TransfersView.tsx",
        "src/pages/CampLeader/lib/services.ts",
        "src/pages/Login/Login.tsx",
        "src/pages/Register/Register.tsx",
        "src/pages/TravelManager/components/TravelDashboard.tsx",
        "src/pages/TravelManager/components/TravelExplorations.tsx",
        "src/pages/TravelManager/components/TravelProfile.tsx",
        "src/pages/TravelManager/components/TravelResources.tsx",
        "src/pages/TravelManager/components/TravelTeam.tsx",
        "src/pages/TravelManager/components/TravelTransfers.tsx",
        "src/pages/admin/Admin.tsx",
        "src/pages/admin/components/AdminProfile.tsx",
        "src/pages/admin/components/AdmissionsBook.tsx",
        "src/pages/admin/components/Camps.tsx",
        "src/pages/admin/components/Dashboard.tsx",
        "src/pages/admin/components/Explorations.tsx",
        "src/pages/admin/components/People.tsx",
        "src/pages/admin/components/Resources.tsx",
        "src/pages/admin/components/Transfers.tsx",
        "src/pages/admin/context/CampContext.tsx",
        "src/pages/admin/context/SessionContext.tsx",
        "src/pages/worker/WorkerDashboard.tsx",
        "src/pages/worker/WorkerExpeditions.tsx",
        "src/pages/worker/WorkerLayout.tsx",
        "src/pages/worker/WorkerProfessions.tsx",
        "src/pages/worker/WorkerProfile.tsx",
        "src/pages/worker/WorkerResources.tsx",
        "src/test/test-utils.tsx",
      ],
    },
  },
})

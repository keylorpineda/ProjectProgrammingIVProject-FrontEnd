// vite.config.ts
import path from "path";
import tailwindcss from "file:///C:/Users/USUARIO/OneDrive/Documentos/UNA/ProjectProgrammingIVProject-FrontEnd/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///C:/Users/USUARIO/OneDrive/Documentos/UNA/ProjectProgrammingIVProject-FrontEnd/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///C:/Users/USUARIO/OneDrive/Documentos/UNA/ProjectProgrammingIVProject-FrontEnd/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\USUARIO\\OneDrive\\Documentos\\UNA\\ProjectProgrammingIVProject-FrontEnd";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173
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
        lines: 100
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
        "src/test/test-utils.tsx"
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVU1VBUklPXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcVU5BXFxcXFByb2plY3RQcm9ncmFtbWluZ0lWUHJvamVjdC1Gcm9udEVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVVNVQVJJT1xcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXFVOQVxcXFxQcm9qZWN0UHJvZ3JhbW1pbmdJVlByb2plY3QtRnJvbnRFbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VTVUFSSU8vT25lRHJpdmUvRG9jdW1lbnRvcy9VTkEvUHJvamVjdFByb2dyYW1taW5nSVZQcm9qZWN0LUZyb250RW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIlxyXG5cclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiXHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgfSxcclxuICB0ZXN0OiB7XHJcbiAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgZW52aXJvbm1lbnQ6IFwianNkb21cIixcclxuICAgIHNldHVwRmlsZXM6IFtcIi4vc3JjL3Rlc3Qvc2V0dXAudHNcIl0sXHJcbiAgICBpbmNsdWRlOiBbXCJzcmMvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVwiXSxcclxuICAgIGNzczogZmFsc2UsXHJcbiAgICBjb3ZlcmFnZToge1xyXG4gICAgICBwcm92aWRlcjogXCJ2OFwiLFxyXG4gICAgICB0aHJlc2hvbGRzOiB7XHJcbiAgICAgICAgc3RhdGVtZW50czogMTAwLFxyXG4gICAgICAgIGJyYW5jaGVzOiAxMDAsXHJcbiAgICAgICAgZnVuY3Rpb25zOiAxMDAsXHJcbiAgICAgICAgbGluZXM6IDEwMCxcclxuICAgICAgfSxcclxuICAgICAgZXhjbHVkZTogW1xyXG4gICAgICAgIFwic3JjL2NvbXBvbmVudHMvQmFkZ2VMb2dpbi50c3hcIixcclxuICAgICAgICBcInNyYy9jb21wb25lbnRzL0JhZGdlUmVnaXN0ZXIudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvY29tcG9uZW50cy91aS9QaW5uZWRDYXJkLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2NvbXBvbmVudHMvdWkvV29ya2VyVG9wQmFyLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2NvbmZpZy9hcGkudHNcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9jYW1wLW1hbmFnZXIvY29tcG9uZW50cy9EYXNoYm9hcmRNYW5hZ2VyLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL2NhbXAtbWFuYWdlci9jb21wb25lbnRzL01hbmFnZXJDYXRhbG9nLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL2NhbXAtbWFuYWdlci9jb21wb25lbnRzL01hbmFnZXJJbnZlbnRvcnkudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvZmVhdHVyZXMvY2FtcC1tYW5hZ2VyL2NvbXBvbmVudHMvTWFuYWdlckxvZ2lzdGljcy50c3hcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9jYW1wLW1hbmFnZXIvY29tcG9uZW50cy9NYW5hZ2VyT3ZlcnZpZXcudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvZmVhdHVyZXMvY2FtcC1tYW5hZ2VyL2NvbXBvbmVudHMvTWFuYWdlclJhbmtpbmcudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvZmVhdHVyZXMvY2FtcC1tYW5hZ2VyL2NvbXBvbmVudHMvTWFuYWdlcldvcmtmb3JjZS50c3hcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9pbnZlbnRvcnkvc2VydmljZXMvaW52ZW50b3J5LnNlcnZpY2UudHNcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9tYXAtdGVzdC9jb21wb25lbnRzL0V4cGxvcmF0aW9uWm9uZU1hcC50c3hcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy91cGxvYWQvY29tcG9uZW50cy9JbWFnZVVwbG9hZGVyLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2hvb2tzL3VzZUFsZXJ0U29ja2V0LnRzXCIsXHJcbiAgICAgICAgXCJzcmMvaG9va3MvdXNlU29ja2V0LnRzXCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvQWRtaW4vY29udGV4dC9BdXRoQ29udGV4dC50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9BZG1pc3Npb25OZXcvQWRtaXNzaW9uTmV3LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0NhbXBMZWFkZXIvQ2FtcExlYWRlckxheW91dC50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9DYW1wTGVhZGVyL2NvbXBvbmVudHMvRGFzaGJvYXJkVmlldy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9DYW1wTGVhZGVyL2NvbXBvbmVudHMvRXhwbG9yYXRpb25zVmlldy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9DYW1wTGVhZGVyL2NvbXBvbmVudHMvTWVtYmVyc1ZpZXcudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvQ2FtcExlYWRlci9jb21wb25lbnRzL09jY3VwYXRpb25zVmlldy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9DYW1wTGVhZGVyL2NvbXBvbmVudHMvVHJhbnNmZXJzVmlldy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9DYW1wTGVhZGVyL2xpYi9zZXJ2aWNlcy50c1wiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0xvZ2luL0xvZ2luLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL1JlZ2lzdGVyL1JlZ2lzdGVyLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL1RyYXZlbE1hbmFnZXIvY29tcG9uZW50cy9UcmF2ZWxEYXNoYm9hcmQudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvVHJhdmVsTWFuYWdlci9jb21wb25lbnRzL1RyYXZlbEV4cGxvcmF0aW9ucy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9UcmF2ZWxNYW5hZ2VyL2NvbXBvbmVudHMvVHJhdmVsUHJvZmlsZS50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9UcmF2ZWxNYW5hZ2VyL2NvbXBvbmVudHMvVHJhdmVsUmVzb3VyY2VzLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL1RyYXZlbE1hbmFnZXIvY29tcG9uZW50cy9UcmF2ZWxUZWFtLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL1RyYXZlbE1hbmFnZXIvY29tcG9uZW50cy9UcmF2ZWxUcmFuc2ZlcnMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vQWRtaW4udHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9BZG1pblByb2ZpbGUudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9BZG1pc3Npb25zQm9vay50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9hZG1pbi9jb21wb25lbnRzL0NhbXBzLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbXBvbmVudHMvRGFzaGJvYXJkLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbXBvbmVudHMvRXhwbG9yYXRpb25zLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbXBvbmVudHMvUGVvcGxlLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbXBvbmVudHMvUmVzb3VyY2VzLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbXBvbmVudHMvVHJhbnNmZXJzLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbnRleHQvQ2FtcENvbnRleHQudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29udGV4dC9TZXNzaW9uQ29udGV4dC50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy93b3JrZXIvV29ya2VyRGFzaGJvYXJkLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL3dvcmtlci9Xb3JrZXJFeHBlZGl0aW9ucy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy93b3JrZXIvV29ya2VyTGF5b3V0LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL3dvcmtlci9Xb3JrZXJQcm9mZXNzaW9ucy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy93b3JrZXIvV29ya2VyUHJvZmlsZS50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy93b3JrZXIvV29ya2VyUmVzb3VyY2VzLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3Rlc3QvdGVzdC11dGlscy50c3hcIixcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1YSxPQUFPLFVBQVU7QUFFeGIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBSjdCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULGFBQWE7QUFBQSxJQUNiLFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxTQUFTLENBQUMsK0JBQStCO0FBQUEsSUFDekMsS0FBSztBQUFBLElBQ0wsVUFBVTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLFFBQ1YsWUFBWTtBQUFBLFFBQ1osVUFBVTtBQUFBLFFBQ1YsV0FBVztBQUFBLFFBQ1gsT0FBTztBQUFBLE1BQ1Q7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

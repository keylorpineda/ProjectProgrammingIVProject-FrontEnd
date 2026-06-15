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
          "vendor-socket": ["socket.io-client"]
        }
      }
    }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxVU1VBUklPXFxcXE9uZURyaXZlXFxcXERvY3VtZW50b3NcXFxcVU5BXFxcXFByb2plY3RQcm9ncmFtbWluZ0lWUHJvamVjdC1Gcm9udEVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcVVNVQVJJT1xcXFxPbmVEcml2ZVxcXFxEb2N1bWVudG9zXFxcXFVOQVxcXFxQcm9qZWN0UHJvZ3JhbW1pbmdJVlByb2plY3QtRnJvbnRFbmRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL1VTVUFSSU8vT25lRHJpdmUvRG9jdW1lbnRvcy9VTkEvUHJvamVjdFByb2dyYW1taW5nSVZQcm9qZWN0LUZyb250RW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIlxyXG5cclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiXHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gRVMyMDIwIHNvIHRocmVlLmpzIG5hdGl2ZSBvcHRpb25hbC1jaGFpbmluZyBldGMuIGlzbid0IHBvbHlmaWxsZWQgYXdheS5cclxuICAgIHRhcmdldDogXCJlczIwMjBcIixcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyB0aHJlZS5qcyBpcyB+NjAwIEtCIGFuZCBsYXp5LWxvYWRlZCB2aWEgQ2FtcDNET3ZlcmxheSBcdTIwMTQgb3duIGNhY2hlIGVudHJ5LlxyXG4gICAgICAgICAgXCJ2ZW5kb3ItdGhyZWVcIjogW1widGhyZWVcIl0sXHJcbiAgICAgICAgICAvLyBNYXAgLyBnZW8gc3RhY2sgb25seSBsb2FkZWQgb24gbWFwIHJvdXRlLlxyXG4gICAgICAgICAgXCJ2ZW5kb3ItbGVhZmxldFwiOiBbXCJsZWFmbGV0XCIsIFwicmVhY3QtbGVhZmxldFwiLCBcInJlYWN0LWxlYWZsZXQtY2x1c3RlclwiXSxcclxuICAgICAgICAgIC8vIEZyYW1lciBNb3Rpb24gaXMgbGFyZ2U7IGlzb2xhdGUgc28gbGF5b3V0IHBhZ2VzIGRvbid0IHJlLWRvd25sb2FkIGl0LlxyXG4gICAgICAgICAgXCJ2ZW5kb3ItbW90aW9uXCI6IFtcImZyYW1lci1tb3Rpb25cIl0sXHJcbiAgICAgICAgICAvLyBEYXRhIGZldGNoaW5nICYgZ2xvYmFsIHN0YXRlXHJcbiAgICAgICAgICBcInZlbmRvci1xdWVyeVwiOiBbXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIl0sXHJcbiAgICAgICAgICAvLyBTb2NrZXQuaW8gY2xpZW50XHJcbiAgICAgICAgICBcInZlbmRvci1zb2NrZXRcIjogW1wic29ja2V0LmlvLWNsaWVudFwiXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHRlc3Q6IHtcclxuICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxyXG4gICAgc2V0dXBGaWxlczogW1wiLi9zcmMvdGVzdC9zZXR1cC50c1wiXSxcclxuICAgIGluY2x1ZGU6IFtcInNyYy8qKi8qLnt0ZXN0LHNwZWN9Lnt0cyx0c3h9XCJdLFxyXG4gICAgY3NzOiBmYWxzZSxcclxuICAgIGNvdmVyYWdlOiB7XHJcbiAgICAgIHByb3ZpZGVyOiBcInY4XCIsXHJcbiAgICAgIHRocmVzaG9sZHM6IHtcclxuICAgICAgICBzdGF0ZW1lbnRzOiAxMDAsXHJcbiAgICAgICAgYnJhbmNoZXM6IDEwMCxcclxuICAgICAgICBmdW5jdGlvbnM6IDEwMCxcclxuICAgICAgICBsaW5lczogMTAwLFxyXG4gICAgICB9LFxyXG4gICAgICBleGNsdWRlOiBbXHJcbiAgICAgICAgXCJzcmMvY29tcG9uZW50cy9CYWRnZUxvZ2luLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2NvbXBvbmVudHMvQmFkZ2VSZWdpc3Rlci50c3hcIixcclxuICAgICAgICBcInNyYy9jb21wb25lbnRzL3VpL1Bpbm5lZENhcmQudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvY29tcG9uZW50cy91aS9Xb3JrZXJUb3BCYXIudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvY29uZmlnL2FwaS50c1wiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL2NhbXAtbWFuYWdlci9jb21wb25lbnRzL0Rhc2hib2FyZE1hbmFnZXIudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvZmVhdHVyZXMvY2FtcC1tYW5hZ2VyL2NvbXBvbmVudHMvTWFuYWdlckNhdGFsb2cudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvZmVhdHVyZXMvY2FtcC1tYW5hZ2VyL2NvbXBvbmVudHMvTWFuYWdlckludmVudG9yeS50c3hcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9jYW1wLW1hbmFnZXIvY29tcG9uZW50cy9NYW5hZ2VyTG9naXN0aWNzLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL2NhbXAtbWFuYWdlci9jb21wb25lbnRzL01hbmFnZXJPdmVydmlldy50c3hcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9jYW1wLW1hbmFnZXIvY29tcG9uZW50cy9NYW5hZ2VyUmFua2luZy50c3hcIixcclxuICAgICAgICBcInNyYy9mZWF0dXJlcy9jYW1wLW1hbmFnZXIvY29tcG9uZW50cy9NYW5hZ2VyV29ya2ZvcmNlLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL2ludmVudG9yeS9zZXJ2aWNlcy9pbnZlbnRvcnkuc2VydmljZS50c1wiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL21hcC10ZXN0L2NvbXBvbmVudHMvRXhwbG9yYXRpb25ab25lTWFwLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL2ZlYXR1cmVzL3VwbG9hZC9jb21wb25lbnRzL0ltYWdlVXBsb2FkZXIudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvaG9va3MvdXNlQWxlcnRTb2NrZXQudHNcIixcclxuICAgICAgICBcInNyYy9ob29rcy91c2VTb2NrZXQudHNcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9BZG1pbi9jb250ZXh0L0F1dGhDb250ZXh0LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0FkbWlzc2lvbk5ldy9BZG1pc3Npb25OZXcudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvQ2FtcExlYWRlci9DYW1wTGVhZGVyTGF5b3V0LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0NhbXBMZWFkZXIvY29tcG9uZW50cy9EYXNoYm9hcmRWaWV3LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0NhbXBMZWFkZXIvY29tcG9uZW50cy9FeHBsb3JhdGlvbnNWaWV3LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0NhbXBMZWFkZXIvY29tcG9uZW50cy9NZW1iZXJzVmlldy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9DYW1wTGVhZGVyL2NvbXBvbmVudHMvT2NjdXBhdGlvbnNWaWV3LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0NhbXBMZWFkZXIvY29tcG9uZW50cy9UcmFuc2ZlcnNWaWV3LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL0NhbXBMZWFkZXIvbGliL3NlcnZpY2VzLnRzXCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvTG9naW4vTG9naW4udHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvUmVnaXN0ZXIvUmVnaXN0ZXIudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvVHJhdmVsTWFuYWdlci9jb21wb25lbnRzL1RyYXZlbERhc2hib2FyZC50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9UcmF2ZWxNYW5hZ2VyL2NvbXBvbmVudHMvVHJhdmVsRXhwbG9yYXRpb25zLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL1RyYXZlbE1hbmFnZXIvY29tcG9uZW50cy9UcmF2ZWxQcm9maWxlLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL1RyYXZlbE1hbmFnZXIvY29tcG9uZW50cy9UcmF2ZWxSZXNvdXJjZXMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvVHJhdmVsTWFuYWdlci9jb21wb25lbnRzL1RyYXZlbFRlYW0udHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvVHJhdmVsTWFuYWdlci9jb21wb25lbnRzL1RyYXZlbFRyYW5zZmVycy50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9hZG1pbi9BZG1pbi50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9hZG1pbi9jb21wb25lbnRzL0FkbWluUHJvZmlsZS50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9hZG1pbi9jb21wb25lbnRzL0FkbWlzc2lvbnNCb29rLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL2FkbWluL2NvbXBvbmVudHMvQ2FtcHMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9EYXNoYm9hcmQudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9FeHBsb3JhdGlvbnMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9QZW9wbGUudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9SZXNvdXJjZXMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29tcG9uZW50cy9UcmFuc2ZlcnMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvYWRtaW4vY29udGV4dC9DYW1wQ29udGV4dC50c3hcIixcclxuICAgICAgICBcInNyYy9wYWdlcy9hZG1pbi9jb250ZXh0L1Nlc3Npb25Db250ZXh0LnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL3dvcmtlci9Xb3JrZXJEYXNoYm9hcmQudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvd29ya2VyL1dvcmtlckV4cGVkaXRpb25zLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL3dvcmtlci9Xb3JrZXJMYXlvdXQudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvcGFnZXMvd29ya2VyL1dvcmtlclByb2Zlc3Npb25zLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL3dvcmtlci9Xb3JrZXJQcm9maWxlLnRzeFwiLFxyXG4gICAgICAgIFwic3JjL3BhZ2VzL3dvcmtlci9Xb3JrZXJSZXNvdXJjZXMudHN4XCIsXHJcbiAgICAgICAgXCJzcmMvdGVzdC90ZXN0LXV0aWxzLnRzeFwiLFxyXG4gICAgICBdLFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVhLE9BQU8sVUFBVTtBQUV4YixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFdBQVc7QUFDbEIsU0FBUyxvQkFBb0I7QUFKN0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFBQSxFQUNoQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUE7QUFBQSxVQUVaLGdCQUFnQixDQUFDLE9BQU87QUFBQTtBQUFBLFVBRXhCLGtCQUFrQixDQUFDLFdBQVcsaUJBQWlCLHVCQUF1QjtBQUFBO0FBQUEsVUFFdEUsaUJBQWlCLENBQUMsZUFBZTtBQUFBO0FBQUEsVUFFakMsZ0JBQWdCLENBQUMsdUJBQXVCO0FBQUE7QUFBQSxVQUV4QyxpQkFBaUIsQ0FBQyxrQkFBa0I7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVMsQ0FBQywrQkFBK0I7QUFBQSxJQUN6QyxLQUFLO0FBQUEsSUFDTCxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsUUFDVixZQUFZO0FBQUEsUUFDWixVQUFVO0FBQUEsUUFDVixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsTUFDVDtBQUFBLE1BQ0EsU0FBUztBQUFBLFFBQ1A7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

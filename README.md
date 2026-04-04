<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=Playwright&logoColor=white" alt="Playwright" />
</div>

<h1 align="center">⛺ Doomsday System UI (Gestión del Fin)</h1>

<p align="center">
  <strong>The official frontend application for the Doomsday System.</strong>
  <br />
  A modern, scalable, and fully responsive administrative dashboard built to manage camp resources, human personnel, and inter-camp communications seamlessly.
</p>

---

## 📖 Overview

The **Doomsday System UI** is the client-side architecture for the *Gestión del fin* platform. Designed with a strong focus on high performance and a premium user experience, this React-based Single Page Application (SPA) allows administrators to oversee critical survival camp operations.

It utilizes a robust **Feature-Sliced Design (FSD)** architecture to maintain code scalability and includes built-in Axios interceptors for foolproof JWT authentication handling.

> *Note: Place your UI mockup or screenshot here (e.g., `![Dashboard Preview](./docs/preview.png)`).*

## ✨ Key Features

- **🛡️ Secure Authentication Flow:** Seamless login system with JWT token management and automatic session renewal/interception via Axios.
- **📊 Camp Resource Management:** Real-time visibility into inventory, human resources, and inter-camp logistics.
- **🎨 Premium Modern Design:** Built with custom, highly maintained vanilla CSS utilizing modern design principles (glassmorphism, CSS variables, immersive typography).
- **📱 Fully Responsive:** Carefully optimized to work perfectly across desktop monitors, tablets, and mobile command centers.
- **🧪 E2E Testing:** Fully covered by Playwright to ensure mission-critical features never fail.

## 🛠️ Technology Stack

- **Core Framework:** [React 18](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/) - For ultra-fast HMR and optimized production builds.
- **HTTP Client:** [Axios](https://axios-http.com/) - Configured with auth interceptors.
- **Testing:** [Playwright](https://playwright.dev/) - End-to-end user workflow testing.
- **Code Quality:** ESLint + Prettier

## 🚀 Getting Started

Follow these steps to set up the development environment on your local machine.

### Prerequisites
- Node.js (v18+ recommended)
- The running instance of the [Doomsday System API](link-to-backend-repo-here).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/doomsday-system-web.git
   cd doomsday-system-web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Run E2E Tests (Playwright):**
   ```bash
   npm run test:e2e
   ```

## 📂 Project Architecture (Feature-Sliced Design)

```text
src/
 ├── assets/      # Static media (images, icons, fonts)
 ├── components/  # Shared, reusable UI components (Buttons, Inputs, Modals)
 ├── config/      # Global configurations (Axios clients, constants)
 ├── pages/       # Route-level components (Login, Dashboard)
 ├── services/    # API calls and business logic
 ├── utils/       # Helper functions and hooks
 └── App.tsx      # Root application component
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](https://github.com/your-username/doomsday-system-web/issues) if you want to contribute.

## 📄 License
This project is licensed under the MIT License.

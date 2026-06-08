<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=Playwright&logoColor=white" alt="Playwright" />
</div>

<br />

<div align="center">
  <a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=40&pause=1000&color=61DAFB&background=00000000&center=true&vCenter=true&width=800&height=80&lines=⛺+Doomsday+System+UI;Manage+your+camps+efficiently;Survive+the+Apocalypse" alt="Typing SVG" /></a>
</div>

<p align="center">
  <strong>The official modern frontend application for the Doomsday System.</strong>
  <br />
  A highly scalable, fast, and fully responsive administrative dashboard built to manage camp resources, human personnel, and inter-camp communications seamlessly.
</p>

<div align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2pjaXN5cXN5eDNjeDk4dTBtdmV0emNzd3B6ZXZ1b2hieW5zbXBwNiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oKIPnAiaw4p6H1FQI/giphy.gif" alt="Radar Animation" width="150" style="border-radius: 50%; box-shadow: 0 0 15px rgba(97, 218, 251, 0.5);" />
</div>

---

## 📖 Table of Contents

- [In-Depth Overview](#-in-depth-overview)
- [Comprehensive Features](#-comprehensive-features)
- [Core Technology Stack](#-core-technology-stack)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Project Architecture (FSD)](#-project-architecture-fsd)
- [Testing Strategy](#-testing-strategy)
- [Important Links](#-important-links)

---

## 📖 In-Depth Overview

The **Doomsday System UI** is the client-side architecture for the _Gestión del fin_ platform. In a hypothetical post-apocalyptic world, tracking resources (water, food, medical supplies), managing camp personnel, and ensuring secure communication between outposts is a matter of life and death. This application was built to simulate the complex administrative dashboard that a camp commander would use.

Designed as a **Single Page Application (SPA)** using React, the system avoids full-page reloads, providing a desktop-like experience within the browser. It communicates seamlessly with our NestJS Backend through highly secured RESTful API endpoints.

By leveraging **TypeScript**, we ensure that all data payloads across the frontend and backend share exact structural definitions. This minimizes runtime errors and creates an incredible developer experience via strict intellisense and compile-time validation.

<details>
<summary><b>🖼️ Click to see a Dashboard Preview (Placeholder)</b></summary>
<img src="https://via.placeholder.com/800x400.png?text=Dashboard+Preview" alt="Dashboard Preview" />
</details>

## ✨ Comprehensive Features

Our application goes beyond a simple CRUD interface. Here is a detailed breakdown of what the Doomsday UI provides:

- **🛡️ Secure Authentication Flow & Session Management:**
  The system utilizes JWT (JSON Web Tokens) to secure user sessions. Instead of manually attaching tokens to every request, we have implemented **Axios Interceptors**. This means every outgoing request automatically gets the authorization header, and any 401 Unauthorized response instantly triggers a secure logout mechanism, ensuring malicious actors cannot use expired sessions.

- **📊 Real-Time Camp Resource Orchestration:**
  Administrators have access to a bird's-eye view of their camp's inventory. We implemented rich data tables and metric cards that display the exact amounts of critical resources. The UI immediately reflects changes when resources are consumed, transferred, or found during explorations.

- **🎨 Premium Modern Design Strategy:**
  We stepped away from generic CSS frameworks to implement a custom, highly maintained vanilla CSS architecture. The UI utilizes modern design principles including **glassmorphism**, dynamic CSS custom properties (variables) for easy theming, immersive modern typography, and micro-animations that make the interface feel alive and highly responsive.

- **📱 Fully Responsive Layouts:**
  In a crisis, a commander might access the dashboard from a desktop command center or a mobile field device. The entire grid system and flexbox layouts are carefully optimized with media queries to adapt flawlessly across all viewport sizes without degrading functionality.

- **🧪 Mission-Critical Reliability (E2E Testing):**
  Because failure is not an option in the Doomsday scenario, the frontend is heavily tested using **Playwright**. We simulate real user interactions—clicking buttons, filling forms, intercepting network requests—to guarantee that the UI workflows function perfectly before any code is deployed to production.

## 🛠️ Core Technology Stack

| Technology     | Justification & Usage                                                                                                                           | Link                                          |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **React 18**   | Used as the foundation for our component-based architecture. React's virtual DOM ensures fast updates when resource metrics change frequently.  | [Learn More](https://reactjs.org/)            |
| **TypeScript** | Eliminates entire classes of bugs by strictly typing our component props, API responses, and application state.                                 | [Learn More](https://www.typescriptlang.org/) |
| **Vite**       | Chosen over Create React App (CRA) or Webpack due to its incredibly fast Hot Module Replacement (HMR) and highly optimized ESBuild bundling.    | [Learn More](https://vitejs.dev/)             |
| **Axios**      | Our HTTP client of choice. We use Axios because it allows us to create isolated instances with custom interceptors for authentication handling. | [Learn More](https://axios-http.com/)         |
| **Playwright** | Provides the most modern, reliable, and fast end-to-end testing environment, supporting cross-browser automation directly out of the box.       | [Learn More](https://playwright.dev/)         |

## 🚀 Getting Started & Local Setup

Follow these steps to set up the development environment on your local machine. Ensure that your local backend API is already running or that you are pointing to the production API.

### Prerequisites

- **Node.js (v18 or higher):** Required for compatibility with Vite and Playwright.
- **Backend API:** Ensure the [Doomsday System API](link-to-backend-repo-here) is reachable.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/keylorpineda/ProjectProgrammingIVProject-FrontEnd.git
   cd ProjectProgrammingIVProject-FrontEnd
   ```

2. **Install dependencies:**
   This command installs all the React libraries, build tools, and testing dependencies.

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   We use Vite's specific environment variable methodology (`VITE_` prefix). Create a `.env` file in the root directory based on `.env.example`:

   ```env
   # Ensure this URL points to your running backend (local or production)
   VITE_API_URL=http://localhost:3000/api/v1
   ```

4. **Start the Development Server:**
   This will spin up Vite's incredibly fast dev server. Changes in your code will reflect in the browser instantly without a hard refresh.
   ```bash
   npm run dev
   ```

## 📂 Project Architecture (Feature-Sliced Design)

To ensure long-term maintainability, this codebase moves away from traditional "folder-by-type" structures (where all components are in one folder, all styles in another) and adopts concepts inspired by the **Feature-Sliced Design** methodology.

We group logic logically by its domain, while keeping shared infrastructure separated:

```text
src/
 ├── assets/      # Static media (images, icons, fonts).
 ├── components/  # Shared, reusable "Dumb" UI components (Buttons, Inputs, Modals) that do not contain business logic.
 ├── config/      # Global application configurations, such as the initialized Axios clients and environment constant parsing.
 ├── pages/       # Complex "Smart" components that represent complete routes (e.g., Login, Dashboard). They assemble UI components and fetch data.
 ├── services/    # Pure functions dedicated to making API calls. This separates network logic completely from UI components.
 ├── utils/       # Small helper utilities, formatting functions, and custom React hooks used across the app.
 └── App.tsx      # The root application component containing routing logic.
```

## 🧪 Testing Strategy

Our testing strategy focuses entirely on **End-to-End (E2E) Testing** via **Playwright**. Instead of focusing purely on unit tests for small components, we believe that testing the exact workflows a user will perform provides the highest confidence.

To execute the test suite:

```bash
npm run test:e2e
```

Playwright will launch headless browsers and perform full login sequences, dashboard navigations, and form submissions to verify the system works from end to end.

## 🔗 Important Links

- 🔙 **Backend System Repository:** [Doomsday System API](https://github.com/keylorpineda/ProjectProgrammingIV-BackEnd)
- 🎨 **Figma Design:** [View Designs (Placeholder)](#)
- 📚 **React Documentation:** [React Docs](https://react.dev/)
- ⚡ **Vite Documentation:** [Vite Docs](https://vitejs.dev/guide/)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. To contribute, please fork the repository, create a new branch for your feature, and submit a Pull Request. Check the [issues page](https://github.com/keylorpineda/ProjectProgrammingIVProject-FrontEnd/issues) for an overview of what needs attention.

## 📄 License

This project is licensed under the MIT License.

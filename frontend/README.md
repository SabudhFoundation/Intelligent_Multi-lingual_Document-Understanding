# Intelligent Multilingual Document Understanding - React Frontend

This directory contains the premium React + TypeScript Single Page Application (SPA) frontend for the Multilingual Document Understanding portal.

## Technology Stack

- **Framework**: React 19 (Scaffolded with Vite)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Premium Space Slate Dark Theme, glassmorphism, transitions, responsive layouts, and loading micro-animations)
- **API Connection**: Integrated with the FastAPI PostgreSQL backend using Vite's development proxy.

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended). This project uses `pnpm` as its primary package manager.

### 1. Start the Backend

Make sure your FastAPI server is running on `http://localhost:8000`. Refer to the backend README under `/backend/README.md` for PostgreSQL configuration and activation steps.

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

### 2. Install Frontend Dependencies

From the project root:

```powershell
cd frontend
pnpm install
```

### 3. Run Development Server

Launch the Vite local dev server:

```powershell
pnpm run dev
```

Open `http://localhost:5173` in your browser.

---

## Design System & Features

- **Dashboard**: Check real-time engine health, database counts, and system architecture.
- **CSV Manager**: Drag-and-drop file upload zone (hits `/csv/upload`) and absolute local path import form (hits `/csv/import`).
- **Record Explorer**: A grid displaying database rows with dynamic column headers extracted from CSV payloads. Click on any record to open the detailed inspector drawer.
- **AI Query Assistant**: Conversational console to ask questions over records (RAG workflow). Clicking on referenced records (`#ID`) in assistant answers opens their details immediately.

---

## Production Build

To compile a highly optimized production bundle:

```powershell
pnpm run build
```

This compiles TypeScript and outputs optimized HTML, JS, and CSS static files to the `/dist` directory, ready to be served from any static provider or hosted from the FastAPI static mount.

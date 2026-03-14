# SoftDock Frontend

React frontend for **SoftDock** — AI-driven software issue resolution platform. Built with Vite, TypeScript, Tailwind CSS v4, React Router, and Zustand.

## Project structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, TopBar
│   │   ├── landing/         # Hero, Features, Pricing, CTA, Footer, etc.
│   │   └── ui/              # Button, Input, Card, Badge
│   ├── lib/
│   │   ├── api.ts           # Axios instance, WS URL helper
│   │   └── stores/          # Zustand: authStore, workspaceStore, issueStore
│   ├── pages/
│   │   ├── Landing.tsx      # Marketing landing
│   │   ├── Login.tsx / Register.tsx
│   │   ├── Dashboard.tsx   # Main issue chat UI
│   │   ├── KnowledgeBase.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   ├── App.tsx              # Router + protected routes
│   ├── main.tsx
│   └── index.css            # Tailwind + design tokens + animations
├── public/
├── index.html
├── tailwind.config.js       # Tailwind v3 compat (v4 uses @theme in CSS)
├── .env.example
└── package.json
```

## Scripts

- `npm run dev` — Start dev server (Vite)
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Environment

Copy `.env.example` to `.env.local` and set:

- `VITE_API_URL` — Django REST API base (e.g. `https://softdock.kybernode.com/api`)
- `VITE_WS_URL` — WebSocket base (e.g. `wss://softdock.kybernode.com/ws`)

## Design

- **Theme**: Dark-first, Kybernode palette (primary `#1A6BCC`, background `#0A0A0F`, surface `#13131A`).
- **Fonts**: Geist (UI), Fira Code (code).
- **Auth**: JWT in localStorage; refresh handled by Axios interceptor.

## Backend

Expects Django backend with endpoints per `SoftDock_Project_Document.md` (auth, workspaces, knowledge, issues, WebSocket streaming).

# Original User Request

## Initial Request — 2026-09-02T00:11:22+05:30

Build a complete frontend website and dashboard for the passive H₂S wristband project, integrating with the existing Python FastAPI backend. The platform includes a public-facing informational site and a protected operational dashboard for Shift Managers and Control Room staff.

Working directory: c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1
Integrity mode: development

## Requirements

### R1. Frontend Architecture & Integration
Analyze the ackend branch to understand APIs and data models. Implement a Next.js (App Router) + Tailwind CSS frontend that strictly matches the backend API contracts. Do not invent new backend logic; build a minimal compatible layer where the backend is incomplete.

### R2. Public Website
Build a Home page (hero, project description, platform access, team) and a Pipeline/Working page with four interactive tabs (Flowchart, Images, Chemistry, Comparison). Use provided copy and styling guidelines (Material Design 3 / Google-style).

### R3. Protected Operational Workflows
Implement role-based authentication (Shift Manager, Control Room, Employee). Build the Manager workspace with a scan-first workflow (QR -> photograph patches -> calculate ΔE -> save reading). Build the Control Room workspace with summary metrics, worker tables, and exposure history charts.

### R4. Dashboard Assistant
Implement a floating dashboard assistant drawer. If a live AI model is not configured, implement a  Guided Help fallback with static documented answers.

## Acceptance Criteria

### Verification & Compliance
- [ ] Code passes standard build/type/lint gates without errors (
pm run build).
- [ ] User routes /, /working, /login, /dashboard, /employees, /scan, /incidents, /history are accessible without 404 errors.
- [ ] End-to-end integration with the local FastAPI backend endpoints functions cleanly.

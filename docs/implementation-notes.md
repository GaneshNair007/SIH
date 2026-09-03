# Implementation Notes & Verification Report

## Overview
This document records the exact backend integrations, frontend routing contracts, local setup steps, and demo vs production capabilities implemented in `sih-1` and `sih-backend`.

---

## 1. Routing Contracts & Navigation
- **Home Page (`/`)**: Public landing page with product introduction, hardware/software specifications, and team overview. Contains header links to Home, Pipeline (`/working`), and Login (`/login`).
- **Pipeline Page (`/working`)**: Interactive 4-tab explanation (Flowchart, Images, Chemistry, Comparison). Supported by redirect from `/pipeline`.
- **Login Page (`/login`)**: Role-based authentication supporting standard login and 1-Click Demo login for Shift Manager, Control Room Manager, and Field Employee.
- **Manager Workspace (`/manager`)**: Primary scan-first operations workspace featuring top-left scanner card, quick band resolution, plant metrics, and recent shift logs.
- **Worker Profile Page (`/workers/[workerId]`)**: Detailed worker dossier featuring:
  - Longitudinal discrete H₂S exposure graph (Recharts) with daily/weekly/monthly toggles.
  - Active band status & lifecycle tracker.
  - Complete shift history table.
  - Docked Platform Assistant drawer with context suggestions.
- **Control Room Workspace (`/control-room`)**: Overview monitoring dashboard featuring live SSE telemetry indicators and plant unit breakdowns.
- **Incidents Log (`/incidents`)**: Statutory compliance incident log supporting Form-A PDF downloads from the FastAPI backend.

---

## 2. Real Backend Integrations (FastAPI Port 8000)
- **Auth**: `POST /api/auth/demo-login`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` via session cookie `rakshak_session`.
- **Shift Scanning**: `POST /api/scan/analyze-image` (multipart image upload + vision AI colorimetry), `POST /api/scan/start-shift`, `POST /api/scan/end-shift`.
- **Manager Data**: `GET /api/manager/dashboard`, `GET /api/manager/employees`, `GET /api/manager/employees/{id}`, `GET /api/manager/incidents`, `GET /api/manager/incident-pdf/{scan_id}`.
- **Chatbot & Risk**: `POST /api/chat`, `GET /api/employees/{id}/lung-risk`.

---

## 3. Demo vs Production Status
- **Real (Production Ready)**:
  - Next.js 14 App Router frontend.
  - Full FastAPI Python backend with SQLAlchemy SQLite models.
  - Authentication flow with role-based navigation guards.
  - CIELAB ΔE calculation and dosimetry data structures.
  - ReportLab PDF generation for OISD-105 Form-A compliance.
- **Demo / Synthetic Fallback**:
  - LLM Provider: If no `GROQ_API_KEY` is present in the backend `.env`, `POST /api/chat` responds with structured SOP guidance, and the frontend assistant drawer displays "Guided Help Mode".

---

## 4. Local Execution Instructions
1. **Start FastAPI Backend:**
   ```powershell
   cd sih-backend
   pip install -r requirements.txt
   python run.py
   # Runs on http://localhost:8000
   ```
2. **Start Next.js Frontend:**
   ```powershell
   cd sih-1
   npm run dev
   # Runs on http://localhost:3000
   ```

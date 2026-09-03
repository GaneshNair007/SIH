# Frontend Architecture

## Stack Selection
- **Framework:** Next.js (App Router) with React 18.
- **Language:** TypeScript for strong type safety (matching backend Pydantic models).
- **Styling:** Tailwind CSS (configured for a clean, Material Design 3 / Google-like aesthetic).
- **State Management & Data Fetching:** React Query (`@tanstack/react-query`) to cache and manage asynchronous backend calls, combined with React Context for global Auth state.
- **Form Handling:** React Hook Form + Zod for validation.

## Directory Structure
```
src/
├── app/
│   ├── (auth)/login/page.tsx         # Login view
│   ├── (manager)/dashboard/page.tsx  # Manager Dashboard
│   ├── (manager)/employees/page.tsx  # Employee list
│   ├── (manager)/employees/[id]/page.tsx # Employee detail
│   ├── (manager)/scan/page.tsx       # Live scanning UI
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                           # Reusable pure UI components (Buttons, Cards, Inputs)
│   ├── layout/                       # Navbars, Sidebars, AppShell
│   └── features/                     # Domain-specific components (e.g., ScanStepper, Heatmap)
├── lib/
│   ├── api/                          # Axios/Fetch clients targeting backend endpoints
│   │   ├── client.ts                 # Axios instance (baseURL setup, interceptors)
│   │   ├── auth.ts                   # Auth API calls
│   │   ├── scans.ts                  # Shift scanning API calls
│   │   └── manager.ts                # Dashboard/employee API calls
│   └── utils.ts                      # Helpers (e.g., tailwind merge)
├── hooks/
│   ├── useAuth.ts                    # Auth Context hook
│   └── queries/                      # React Query hooks (e.g., useDashboardQuery)
└── types/
    └── index.ts                      # Shared TS interfaces (Employee, Scan, Incident)
```

## API Client Layer
- **Base URL:** Centralized in an environment variable (e.g., `NEXT_PUBLIC_API_URL=http://localhost:8000`).
- **Authentication:** Since the backend uses cookies (`rakshak_session`), the API client (using `fetch` or `axios`) will need `credentials: 'include'` configured to pass cookies seamlessly.
- **Typed Functions:** Every backend endpoint will have a corresponding typed function in `/lib/api/` (e.g., `api.auth.login(payload)`).

## State and Auth Flow
1. **App Initialization:** AuthContext checks `/api/auth/me` on mount to determine session validity.
2. **Protected Routes:** Next.js layout wrappers or an `AuthGuard` component will redirect unauthenticated users to `/login`.
3. **Role-Based Views:** UI dynamically renders Manager vs. Employee specific views based on the session role.

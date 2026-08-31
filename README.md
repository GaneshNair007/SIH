# H₂S Monitor Platform

A Next.js 14 application for tracking passive cumulative Hydrogen Sulfide (H₂S) exposure across industrial workforces using colorimetric wristbands.

## Features
- **Role-based Dashboards:** Separate workflows and views for Shift Managers and Workers.
- **Worker History:** Continuous tracking of cumulative exposure across multiple shifts and wristbands.
- **Exposure Ranges:** Adheres to scientific accuracy by displaying exposure as ranges (e.g., 4.8–6.2 ppm•h) rather than fake precision single numbers.
- **Confidence Metrics:** Includes scanning measurement confidence levels (HIGH/MEDIUM/LOW/INVALID).
- **Band Lifecycle Tracking:** Enforces the 5-working-day maximum lifecycle for reactive patches.

## Tech Stack
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide React Icons

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages
- `/` - Home Page (Hero, Team, Project Description)
- `/readme` - How it Works & Why We Are Better
- `/login` - Login with Demo Role Selection
- `/manager` - Manager Dashboard (View active workers & register new ones)
- `/worker` - Worker Dashboard (View personal cumulative exposure, band status, and shift history)

*Disclaimer: This is a demo application with simulated data.*

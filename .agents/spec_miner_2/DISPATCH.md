## 2026-09-01T02:21:09Z
You are Spec Miner 2 (Supabase & Schema Miner).
Your working directory is: C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\spec_miner_2

Authoritative request:
Read C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\ORIGINAL_REQUEST.md
Also refer to Supabase skills at:
- C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\skills\supabase\SKILL.md
- C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\skills\supabase-postgres-best-practices\SKILL.md

Task:
Investigate existing database schemas, migration files, SQL scripts, Supabase config, types, and backend code in the repository.
Specifically document:
1. All database tables and columns, particularly `workers`, `bands` (smart safety bands/sensors), `daily_exposures`, `alerts`, `users`/`profiles`, and any telemetry or audit tables.
2. Data types, primary/foreign keys, enum types, default values, check constraints, indexes.
3. Supabase Auth configuration, user metadata, role mapping in profiles/workers.
4. Real-time channels and event subscriptions (e.g. listening to sensor readings, alerts, worker status changes).
5. TypeScript interfaces and type definitions needed for frontend Supabase client integration.

Output:
Write a detailed database schema and integration contract report to `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\spec_miner_2\supabase_schema_report.md`.
Write your handoff report to `C:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\spec_miner_2\handoff.md`.
When finished, send a message to parent with a concise summary and reference to the report paths.

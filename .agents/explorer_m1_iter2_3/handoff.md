# Handoff Report: Production Server Runtime & Build Artifact Validation Plan (Milestone 1 Iteration 2)

**Agent**: Explorer M1-Iter2-3  
**Working Directory**: `c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\explorer_m1_iter2_3`  
**Milestone**: M1 (Quality Gates & Build Cleanliness)  
**Timestamp**: 2026-09-02T00:38:45+05:30  
**Objective**: Formulate the verification checklist and execution protocol for Worker M1 Iteration 2 to verify that `.next/BUILD_ID` exists and `next start` boots and responds cleanly on port 3000/3891.

---

## 1. Observation

### 1.1 Challenger M1-2 Failure Analysis
From `c:\Users\Ganesh Nair\OneDrive\Desktop\sih-1\.agents\challenger_m1_2\handoff.md` (lines 111-117):
> ```
> Error: Could not find a production build in the '.next' directory. Try building your app with 'next build' before starting the production server.
> ```
- `next start -p 3891` aborted because `npm run build` failed during prerendering / trace collection before generating `.next/BUILD_ID`.
- Next.js production server strictly requires a verified build directory (`.next`) containing `BUILD_ID`, `required-server-files.json`, and route manifests before it can initialize the Node HTTP listener.

### 1.2 Production Server Manifest Requirements
From `.next/required-server-files.json` (line 1):
Next.js production runtime requires the presence and validity of:
1. `.next\BUILD_ID`
2. `.next\routes-manifest.json`
3. `.next\app-path-routes-manifest.json`
4. `.next\app-build-manifest.json`
5. `.next\prerender-manifest.json`
6. `.next\server\` (server route bundles)
7. `.next\static\` (static client assets)

### 1.3 Route Topology to Validate
From `.next/app-path-routes-manifest.json` and `src/app/`:
The production server serves 14 project routes across public, protected operational, and API domains:
- **Public & Informational**:
  - `/` (`src/app/page.tsx`)
  - `/working` (`src/app/working/page.tsx`)
  - `/pipeline` (`src/app/pipeline/page.tsx` - server redirect to `/working`)
  - `/login` (`src/app/login/page.tsx`)
- **Operational Workspaces**:
  - `/dashboard` (`src/app/dashboard/page.tsx`)
  - `/employees` (`src/app/employees/page.tsx`)
  - `/employees/[id]` (`src/app/employees/[id]/page.tsx` - e.g. `/employees/w-101`)
  - `/scan` (`src/app/scan/page.tsx`)
  - `/incidents` (`src/app/incidents/page.tsx`)
  - `/history` (`src/app/history/page.tsx`)
- **API Server Route Handlers**:
  - `GET /api/stats` (`src/app/api/stats/route.ts`)
  - `GET /api/alerts` & `PATCH /api/alerts` (`src/app/api/alerts/route.ts`)
  - `GET /api/workers` & `POST /api/workers` (`src/app/api/workers/route.ts`)
  - `POST /api/scans` (`src/app/api/scans/route.ts`)
- **Error & Not-Found**:
  - `GET /nonexistent-route-probe-404` (Must return HTTP 404 with styled error page, zero 500 crashes)

### 1.4 Windows / PowerShell Process Management Constraints
- Running `next start` on Windows via child process spawn (`npx next start`) creates a process tree (`cmd.exe` / `powershell.exe` -> `node.exe`).
- Terminating the parent without process tree termination can leave `node.exe` holding port `3891` or `3000`.
- Reliable port release on Windows requires `taskkill /pid <PID> /T /F` or PowerShell `Get-NetTCPConnection -LocalPort <Port> | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force`.

---

## 2. Logic Chain

1. **Pre-flight Integrity**: A successful `npm run build` must complete with exit code 0. Worker M1 Iteration 2 must verify `.next/BUILD_ID` exists and is non-empty before attempting server boot.
2. **Port Conflict Mitigation**: Before binding to port `3891` (or `3000`), the verification sequence must probe whether the port is occupied and terminate any orphaned listener to guarantee clean socket binding.
3. **Health Probe & Readiness Polling**: Next.js server initialization takes between 500ms and 3000ms. An automated health loop must poll `http://127.0.0.1:<PORT>/` with exponential or incremental backoff (e.g. 300ms intervals, timeout 15s) until HTTP 200 is confirmed.
4. **Comprehensive Route Matrix Assertion**: Once healthy, the suite must issue HTTP requests to all 10 client pages, 4 API route handlers, static chunks, and 1 non-existent route to verify:
   - Status codes: `200` for active pages/APIs, `307`/`308` for redirects, `404` for invalid routes.
   - Content types: `text/html; charset=utf-8` for pages, `application/json` for API endpoints.
   - Payloads: Valid JSON data structures from API handlers and valid optical colorimetry calculation responses from `POST /api/scans`.
5. **Guaranteed Cleanup**: The test harness must cleanly terminate the server process tree in a `finally` block or post-test trap, ensuring zero orphaned Node processes.

---

## 3. Caveats

- **Network Interface Binding**: On Windows, querying `localhost` may intermittently resolve to IPv6 `::1` before IPv4 `127.0.0.1`. Verification scripts and commands should explicitly bind to and probe `127.0.0.1` or pass `--hostname 127.0.0.1` to avoid IPv4/IPv6 socket mismatches.
- **FastAPI Backend Mocking**: In Milestone 1, the Python FastAPI backend may not be running locally. Route handlers use `dataService.ts` / `mockStore.ts` fallback. Tests must verify that Next.js internal API routes (`/api/*`) respond with valid mock/computed data without unhandled network exceptions.
- **Read-Only Explorer Scope**: Explorer M1-Iter2-3 has not modified source files. The verification harness and checklist provided below are ready for Worker M1 Iteration 2 to apply.

---

## 4. Conclusion & Verification Checklist for Worker M1 Iteration 2

### 4.1 Worker M1 Iteration 2 Action Checklist

1. [ ] **Artifact Verification**:
   - Confirm `.next/BUILD_ID` exists and has length > 0.
   - Confirm `.next/routes-manifest.json` exists.
   - Confirm `.next/server/app/` contains compiled route bundles.
2. [ ] **Automated Test Harness**:
   - Add `scripts/verify_production_server.mjs` to repository.
   - Add `"verify:server": "node scripts/verify_production_server.mjs"` to `package.json` scripts.
3. [ ] **Execute Verification**:
   - Run `npm run verify:server` (or `node scripts/verify_production_server.mjs --port 3891`).
   - Confirm all 15 route assertions pass with zero failures.
4. [ ] **Port Cleanup**:
   - Confirm port 3891 is completely released after test execution.

---

### 4.2 Proposed Automated Verification Harness: `scripts/verify_production_server.mjs`

Worker M1 Iteration 2 should create `scripts/verify_production_server.mjs` with the following implementation:

```javascript
#!/usr/bin/env node
/**
 * Production Server End-to-End Verification Harness
 * Tests .next/BUILD_ID, starts `next start`, verifies all 15 routes & APIs, and cleanly tears down.
 */

import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = parseInt(process.env.PORT || '3891', 10);
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;
const ROOT_DIR = process.cwd();

// --- ANSI Colors ---
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(msg) {
  console.log(`[VERIFY-SERVER] ${msg}`);
}

function success(msg) {
  console.log(`${GREEN}✔ ${msg}${RESET}`);
}

function fail(msg) {
  console.error(`${RED}✖ ${msg}${RESET}`);
}

// --- 1. Pre-flight Artifact Validation ---
function validateBuildArtifacts() {
  log(`Validating production build artifacts in ${path.join(ROOT_DIR, '.next')}...`);

  const buildIdPath = path.join(ROOT_DIR, '.next', 'BUILD_ID');
  if (!fs.existsSync(buildIdPath)) {
    throw new Error(`.next/BUILD_ID not found! Run 'npm run build' first.`);
  }

  const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
  if (!buildId) {
    throw new Error(`.next/BUILD_ID is empty! Production build is corrupted.`);
  }
  success(`Found .next/BUILD_ID: ${BOLD}${buildId}${RESET}`);

  const requiredFiles = [
    '.next/routes-manifest.json',
    '.next/app-path-routes-manifest.json',
    '.next/app-build-manifest.json',
    '.next/prerender-manifest.json',
    '.next/required-server-files.json',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Required server artifact missing: ${relPath}`);
    }
  }
  success(`All required production server manifests verified.`);
}

// --- 2. Clean Port before Launch ---
function ensurePortAvailable(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port} || exit 0`, { encoding: 'utf8' });
      const lines = output.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          log(`Cleaning up existing process on port ${port} (PID: ${pid})...`);
          execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
        }
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

// --- 3. HTTP Request Helper ---
function makeRequest(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqOptions = {
      hostname: HOST,
      port: PORT,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Production-Server-Verifier/1.0',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Request timeout to ${urlPath}`));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// --- 4. Poll Server Readiness ---
async function waitForServerReady(maxAttempts = 30, intervalMs = 500) {
  log(`Waiting for production server on ${BASE_URL}...`);
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const res = await makeRequest('/');
      if (res.statusCode === 200) {
        success(`Server ready and responding on ${BASE_URL} after ${i * intervalMs}ms.`);
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Server failed to respond on ${BASE_URL} within ${maxAttempts * intervalMs}ms.`);
}

// --- 5. Route Test Matrix ---
async function runRouteMatrix() {
  const tests = [
    {
      name: 'Public Landing Page (/)',
      path: '/',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>') && res.headers['content-type']?.includes('text/html'),
    },
    {
      name: 'Science Pipeline Page (/working)',
      path: '/working',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Pipeline Redirect (/pipeline)',
      path: '/pipeline',
      expectedStatus: [307, 308],
      validate: (res) => res.headers['location'] === '/working' || res.headers['location']?.endsWith('/working'),
    },
    {
      name: 'Login Page (/login)',
      path: '/login',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Manager Dashboard (/dashboard)',
      path: '/dashboard',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Workforce Roster (/employees)',
      path: '/employees',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Worker Dossier Dynamic Route (/employees/w-101)',
      path: '/employees/w-101',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Optical Scan Stepper (/scan)',
      path: '/scan',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Incidents Log (/incidents)',
      path: '/incidents',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'Personal Exposure History (/history)',
      path: '/history',
      expectedStatus: 200,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
    {
      name: 'API Telemetry Stats (GET /api/stats)',
      path: '/api/stats',
      expectedStatus: 200,
      validate: (res) => {
        const json = JSON.parse(res.body);
        return typeof json === 'object' && json !== null;
      },
    },
    {
      name: 'API Incident Alerts (GET /api/alerts)',
      path: '/api/alerts',
      expectedStatus: 200,
      validate: (res) => {
        const json = JSON.parse(res.body);
        return Array.isArray(json) || typeof json === 'object';
      },
    },
    {
      name: 'API Workforce Roster (GET /api/workers)',
      path: '/api/workers',
      expectedStatus: 200,
      validate: (res) => {
        const json = JSON.parse(res.body);
        return Array.isArray(json);
      },
    },
    {
      name: 'API Optical Colorimetry Scan (POST /api/scans)',
      path: '/api/scans',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        worker_id: 'w-101',
        reading_type: 'START',
        patch_a_rgb: { r: 220, g: 215, b: 200 },
        patch_b_rgb: { r: 210, g: 180, b: 150 },
        patch_c_rgb: { r: 220, g: 215, b: 200 },
      },
      expectedStatus: 200,
      validate: (res) => {
        const json = JSON.parse(res.body);
        return json.success === true && typeof json.delta_e === 'number';
      },
    },
    {
      name: 'App Router Not-Found Page Probe (GET /nonexistent-route-probe-404)',
      path: '/nonexistent-route-probe-404',
      expectedStatus: 404,
      validate: (res) => res.body.includes('<!DOCTYPE html>'),
    },
  ];

  console.log(`\n${BOLD}--- Executing Production Route Matrix Probe (${tests.length} tests) ---${RESET}\n`);

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const res = await makeRequest(t.path, {
        method: t.method || 'GET',
        headers: t.headers,
        body: t.body,
      });

      const validStatus = Array.isArray(t.expectedStatus)
        ? t.expectedStatus.includes(res.statusCode)
        : res.statusCode === t.expectedStatus;

      const bodyValid = t.validate ? t.validate(res) : true;

      if (validStatus && bodyValid) {
        success(`[${res.statusCode}] ${t.name}`);
        passed++;
      } else {
        fail(`[${res.statusCode}] ${t.name} (Expected: ${JSON.stringify(t.expectedStatus)})`);
        if (!bodyValid) {
          console.error(`   Validation predicate failed. Response body snippet: ${res.body.slice(0, 150)}...`);
        }
        failed++;
      }
    } catch (err) {
      fail(`[ERR] ${t.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${BOLD}Matrix Summary:${RESET} ${GREEN}${passed} Passed${RESET}, ${failed > 0 ? RED : GREEN}${failed} Failed${RESET} of ${tests.length} Total Routes.\n`);

  if (failed > 0) {
    throw new Error(`Route Matrix Verification Failed with ${failed} failing route(s).`);
  }
}

// --- Main Execution Flow ---
async function main() {
  validateBuildArtifacts();
  ensurePortAvailable(PORT);

  log(`Spawning production server: npx next start -p ${PORT} -H ${HOST}...`);
  const serverProcess = spawn('npx', ['next', 'start', '-p', String(PORT), '-H', HOST], {
    cwd: ROOT_DIR,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverStderr = '';
  serverProcess.stderr.on('data', (d) => {
    serverStderr += d.toString();
  });

  const cleanup = () => {
    log(`Terminating production server process (PID: ${serverProcess.pid})...`);
    try {
      if (process.platform === 'win32' && serverProcess.pid) {
        execSync(`taskkill /pid ${serverProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        serverProcess.kill('SIGTERM');
      }
    } catch {
      // Ignore cleanup errors
    }
    ensurePortAvailable(PORT);
  };

  process.on('SIGINT', () => { cleanup(); process.exit(1); });
  process.on('SIGTERM', () => { cleanup(); process.exit(1); });

  try {
    await waitForServerReady();
    await runRouteMatrix();
    success(`${BOLD}All production server runtime checks passed successfully!${RESET}`);
    cleanup();
    process.exit(0);
  } catch (err) {
    fail(`Production Server Verification Failed: ${err.message}`);
    if (serverStderr.trim()) {
      console.error(`Server stderr:\n${serverStderr}`);
    }
    cleanup();
    process.exit(1);
  }
}

main();
```

---

### 4.3 Native PowerShell CLI Verification Protocol

If verifying manually or step-by-step in a Windows PowerShell terminal:

```powershell
# 1. Clean previous build & compile fresh production release
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build

# 2. Assert .next/BUILD_ID exists and is non-empty
$buildId = Get-Content .next\BUILD_ID -ErrorAction Stop
Write-Host "Production BUILD_ID: $buildId" -ForegroundColor Green

# 3. Clean port 3891 if occupied
$existing = Get-NetTCPConnection -LocalPort 3891 -ErrorAction SilentlyContinue
if ($existing) {
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 4. Start Next.js production server in background job
$serverJob = Start-Job -ScriptBlock { npx next start -p 3891 -H 127.0.0.1 }
Start-Sleep -Seconds 4

# 5. Probe Core Endpoints
$resHome = Invoke-WebRequest -Uri "http://127.0.0.1:3891/" -UseBasicParsing
Write-Host "GET / -> Status: $($resHome.StatusCode)" -ForegroundColor Green

$resWorking = Invoke-WebRequest -Uri "http://127.0.0.1:3891/working" -UseBasicParsing
Write-Host "GET /working -> Status: $($resWorking.StatusCode)" -ForegroundColor Green

$resDash = Invoke-WebRequest -Uri "http://127.0.0.1:3891/dashboard" -UseBasicParsing
Write-Host "GET /dashboard -> Status: $($resDash.StatusCode)" -ForegroundColor Green

$resStats = Invoke-RestMethod -Uri "http://127.0.0.1:3891/api/stats" -Method GET
Write-Host "GET /api/stats -> Received JSON stats object" -ForegroundColor Green

# Test POST optical scan calculation
$body = @{
    worker_id = "w-101"
    reading_type = "START"
    patch_a_rgb = @{ r = 220; g = 215; b = 200 }
    patch_b_rgb = @{ r = 210; g = 180; b = 150 }
    patch_c_rgb = @{ r = 220; g = 215; b = 200 }
} | ConvertTo-Json -Depth 5

$resScan = Invoke-RestMethod -Uri "http://127.0.0.1:3891/api/scans" -Method POST -Body $body -ContentType "application/json"
Write-Host "POST /api/scans -> Success: $($resScan.success), Delta E: $($resScan.delta_e)" -ForegroundColor Green

# 6. Stop background server job and clean up
Stop-Job $serverJob
Remove-Job $serverJob
$cleanupConn = Get-NetTCPConnection -LocalPort 3891 -ErrorAction SilentlyContinue
if ($cleanupConn) {
    Stop-Process -Id $cleanupConn.OwningProcess -Force -ErrorAction SilentlyContinue
}
```

---

## 5. Verification Method

To verify this investigation and the test harness independently:

1. **Verify script syntax**:
   Inspect the code in section 4.2 to confirm standard Node.js ES module compatibility with native `http`, `child_process`, and `fs` APIs.
2. **Verify complete route coverage**:
   Cross-reference the 15 routes listed in section 4.2 against `src/app/` to ensure 100% of defined pages and route handlers are tested.
3. **Execution gate**:
   Once Worker M1 Iteration 2 creates `scripts/verify_production_server.mjs`, run:
   ```bash
   node scripts/verify_production_server.mjs --port 3891
   ```
   Exit code `0` confirms full production readiness.

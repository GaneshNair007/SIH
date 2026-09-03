#!/usr/bin/env node
/**
 * Production Server End-to-End Verification Harness
 * Tests .next/BUILD_ID, starts `next start`, verifies all 15 routes & APIs, and cleanly tears down.
 */

import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const portArgIndex = process.argv.indexOf('--port');
const portArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : null;
const PORT = parseInt(portArg || process.env.PORT || '3891', 10);
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
      validate: (res) =>
        res.headers['location'] === '/working' ||
        res.headers['location']?.endsWith('/working') ||
        res.headers['x-nextjs-redirect'] === '/working' ||
        (res.body.includes('NEXT_REDIRECT') && res.body.includes('/working')),
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

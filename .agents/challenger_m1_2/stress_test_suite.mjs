import http from 'http';
import { spawn } from 'child_process';
import path from 'path';

const PORT = 3891;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${urlPath}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetchUrl('/');
      if (res.status === 200) return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function runTestSuite() {
  console.log('=== STARTING PRODUCTION SERVER FOR ADVERSARIAL STRESS TESTING ===');
  
  const nextBin = path.resolve('node_modules/next/dist/bin/next');
  const server = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], {
    cwd: path.resolve('.'),
    stdio: 'pipe',
  });

  server.stdout.on('data', d => {
    console.log(`[Next.js]: ${d.toString().trim()}`);
  });
  server.stderr.on('data', d => {
    console.error(`[Next.js error]: ${d.toString().trim()}`);
  });

  const isReady = await waitForServer();
  if (!isReady) {
    console.error('FAILED TO START NEXT.JS PRODUCTION SERVER');
    server.kill();
    process.exit(1);
  }

  console.log(`Server started successfully on port ${PORT}\n`);

  const results = [];

  const testCases = [
    { name: 'Public Landing Page (/)', path: '/', expectStatus: [200], expectBodyIncludes: ['H₂S', 'Rakshak AI'] },
    { name: 'Science Pipeline (/working)', path: '/working', expectStatus: [200], expectBodyIncludes: ['How the wristband works', 'Flowchart'] },
    { name: 'Science Pipeline with Tab (/working?tab=chemistry)', path: '/working?tab=chemistry', expectStatus: [200], expectBodyIncludes: ['SbCl₃', 'Anthocyanin'] },
    { name: 'Pipeline 307 Redirect (/pipeline)', path: '/pipeline', expectStatus: [307, 308], expectHeader: { 'location': '/working' } },
    { name: 'Dual-Mode Login (/login)', path: '/login', expectStatus: [200], expectBodyIncludes: ['Sign In', 'Employee ID'] },
    { name: 'Manager Dashboard (/dashboard)', path: '/dashboard', expectStatus: [200], expectBodyIncludes: ['Rakshak AI'] },
    { name: 'Workforce Roster (/employees)', path: '/employees', expectStatus: [200], expectBodyIncludes: ['Workforce Roster'] },
    { name: 'Worker Dossier (/employees/EMP-1042)', path: '/employees/EMP-1042', expectStatus: [200], expectBodyIncludes: ['Rakshak AI'] },
    { name: 'Dosimeter Scan Stepper (/scan)', path: '/scan', expectStatus: [200], expectBodyIncludes: ['Dosimeter Scan'] },
    { name: 'Critical Incidents Log (/incidents)', path: '/incidents', expectStatus: [200], expectBodyIncludes: ['Incidents Log'] },
    { name: 'Personal Exposure History (/history)', path: '/history', expectStatus: [200], expectBodyIncludes: ['Exposure History'] },
    { name: '404 Handling (/non-existent-adversarial-route-12345)', path: '/non-existent-adversarial-route-12345', expectStatus: [404] },
    { name: 'API Alerts (GET /api/alerts)', path: '/api/alerts', expectStatus: [200], expectJson: true },
    { name: 'API Stats (GET /api/stats)', path: '/api/stats', expectStatus: [200], expectJson: true },
    { name: 'API Workers (GET /api/workers)', path: '/api/workers', expectStatus: [200], expectJson: true },
    { 
      name: 'API Scans Optical Calculation (POST /api/scans)', 
      path: '/api/scans', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worker_id: 'EMP-1042',
        reading_type: 'END',
        patch_a_rgb: { r: 180, g: 170, b: 160 },
        patch_b_rgb: { r: 150, g: 130, b: 110 },
        patch_c_rgb: { r: 180, g: 170, b: 160 }
      }),
      expectStatus: [200],
      expectJson: true,
      validateJson: (data) => data.success === true && typeof data.delta_e === 'number'
    },
    { 
      name: 'API Scans Validation Guard (POST /api/scans with invalid payload)', 
      path: '/api/scans', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: true }),
      expectStatus: [400],
      expectJson: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const res = await fetchUrl(tc.path, {
        method: tc.method || 'GET',
        headers: tc.headers || {},
        body: tc.body
      });

      let testPassed = true;
      const failures = [];

      if (!tc.expectStatus.includes(res.status)) {
        testPassed = false;
        failures.push(`Expected status ${tc.expectStatus.join('/')} but received ${res.status}`);
      }

      if (tc.expectHeader) {
        for (const [k, v] of Object.entries(tc.expectHeader)) {
          if (res.headers[k.toLowerCase()] !== v) {
            testPassed = false;
            failures.push(`Expected header ${k}='${v}' but received '${res.headers[k.toLowerCase()]}'`);
          }
        }
      }

      if (tc.expectBodyIncludes) {
        for (const token of tc.expectBodyIncludes) {
          if (!res.body.includes(token)) {
            testPassed = false;
            failures.push(`Expected response body to include '${token}'`);
          }
        }
      }

      if (tc.expectJson) {
        try {
          const json = JSON.parse(res.body);
          if (tc.validateJson && !tc.validateJson(json)) {
            testPassed = false;
            failures.push(`JSON payload validation predicate failed: ${JSON.stringify(json)}`);
          }
        } catch {
          testPassed = false;
          failures.push(`Expected valid JSON response, failed to parse: ${res.body.slice(0, 100)}`);
        }
      }

      if (testPassed) {
        passed++;
        console.log(`[PASS] ${tc.name} -> HTTP ${res.status}`);
        results.push({ name: tc.name, path: tc.path, status: res.status, pass: true });
      } else {
        failed++;
        console.error(`[FAIL] ${tc.name} -> HTTP ${res.status}: ${failures.join('; ')}`);
        results.push({ name: tc.name, path: tc.path, status: res.status, pass: false, errors: failures });
      }
    } catch (err) {
      failed++;
      console.error(`[ERROR] ${tc.name} -> Request error: ${err.message}`);
      results.push({ name: tc.name, path: tc.path, status: 'ERROR', pass: false, errors: [err.message] });
    }
  }

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (${passed + failed} TOTAL) ===`);

  server.kill();
  
  return { passed, failed, total: passed + failed, results };
}

runTestSuite().then((summary) => {
  if (summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

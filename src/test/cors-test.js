/**
 * FinTrack Shield — Production CORS Verification Test Suite
 *
 * Verifies that:
 * 1. OPTIONS preflight from https://fin-track-shield.vercel.app returns HTTP 204
 *    with Access-Control-Allow-Origin and Access-Control-Allow-Credentials: true.
 * 2. Actual requests return Access-Control-Allow-Origin: https://fin-track-shield.vercel.app.
 * 3. CORS_ORIGIN environment variable is read dynamically and handles quotes,
 *    trailing slashes, and comma-separated lists.
 * 4. Unauthorized origins (e.g. evil.com) do NOT receive Access-Control-Allow-Origin.
 * 5. Access-Control-Allow-Origin is never wildcard '*' with credentials: true.
 * 6. Non-browser requests (health checks, curl) succeed with HTTP 200.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_cors.db';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_for_fintrack_shield';
process.env.CORS_ORIGIN = 'https://fin-track-shield.vercel.app';

const http = require('http');
const path = require('path');
const fs = require('fs');

// Ensure fresh test DB
const testDbPath = path.resolve(__dirname, '..', 'data', 'test_cors.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const { app } = require('../server/server');
const { closeDb } = require('../server/db/database');
const config = require('../server/config');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedTests++;
  }
}

function makeRequest(server, options) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        ...options,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runCorsTests() {
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('   FinTrack Shield — Production CORS Verification Suite       ');
  console.log('═════════════════════════════════════════════════════════════\n');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const vercelOrigin = 'https://fin-track-shield.vercel.app';

    // ─── 1. OPTIONS Preflight from live Vercel frontend ─────────────────────
    console.log('1. Testing OPTIONS Preflight from Vercel Frontend...');
    const preflightRes = await makeRequest(server, {
      path: '/api/transactions',
      method: 'OPTIONS',
      headers: {
        Origin: vercelOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    assert(preflightRes.statusCode === 204, 'OPTIONS preflight returns HTTP 204 No Content');
    assert(
      preflightRes.headers['access-control-allow-origin'] === vercelOrigin,
      `Preflight returns Access-Control-Allow-Origin: ${vercelOrigin}`
    );
    assert(
      preflightRes.headers['access-control-allow-credentials'] === 'true',
      'Preflight returns Access-Control-Allow-Credentials: true'
    );
    assert(
      preflightRes.headers['access-control-allow-methods'] &&
        preflightRes.headers['access-control-allow-methods'].includes('POST'),
      'Preflight returns Access-Control-Allow-Methods containing POST'
    );
    assert(
      preflightRes.headers['access-control-allow-headers'] &&
        preflightRes.headers['access-control-allow-headers'].toLowerCase().includes('authorization'),
      'Preflight returns Access-Control-Allow-Headers containing Authorization'
    );

    // ─── 2. Actual GET Request with Vercel Origin ───────────────────────────
    console.log('\n2. Testing Actual GET Request from Vercel Frontend...');
    const getRes = await makeRequest(server, {
      path: '/api/health',
      method: 'GET',
      headers: {
        Origin: vercelOrigin,
      },
    });

    assert(getRes.statusCode === 200, 'GET /api/health returns HTTP 200');
    assert(
      getRes.headers['access-control-allow-origin'] === vercelOrigin,
      `Actual response returns Access-Control-Allow-Origin: ${vercelOrigin}`
    );
    assert(
      getRes.headers['access-control-allow-credentials'] === 'true',
      'Actual response returns Access-Control-Allow-Credentials: true'
    );
    assert(
      getRes.headers['access-control-allow-origin'] !== '*',
      'Security check: Access-Control-Allow-Origin is NOT wildcard * with credentials'
    );

    // ─── 3. Trailing Slash Resilience ───────────────────────────────────────
    console.log('\n3. Testing Trailing Slash and Quote Normalization in CORS_ORIGIN...');
    process.env.CORS_ORIGIN = '"https://fin-track-shield.vercel.app/"';
    assert(
      config.cors.isOriginAllowed('https://fin-track-shield.vercel.app'),
      'Matches origin even if CORS_ORIGIN has quotes and trailing slash'
    );
    assert(
      config.cors.isOriginAllowed('https://fin-track-shield.vercel.app/'),
      'Matches incoming request origin with trailing slash'
    );

    const preflightSlashRes = await makeRequest(server, {
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        Origin: vercelOrigin,
        'Access-Control-Request-Method': 'POST',
      },
    });
    assert(
      preflightSlashRes.headers['access-control-allow-origin'] === vercelOrigin,
      'Preflight sets Allow-Origin when env var has quotes/slash'
    );

    // ─── 4. Comma-Separated Multiple Origins ────────────────────────────────
    console.log('\n4. Testing Comma-Separated Origins in CORS_ORIGIN...');
    process.env.CORS_ORIGIN = 'https://fin-track-shield.vercel.app, https://preview.vercel.app';
    const previewRes = await makeRequest(server, {
      path: '/api/health',
      method: 'GET',
      headers: {
        Origin: 'https://preview.vercel.app',
      },
    });
    assert(
      previewRes.headers['access-control-allow-origin'] === 'https://preview.vercel.app',
      'Secondary origin in CORS_ORIGIN is allowed with correct Allow-Origin'
    );

    // ─── 5. Disallowed / Malicious Origin Rejection ─────────────────────────
    console.log('\n5. Testing Disallowed Origin (Unauthorized Site)...');
    const evilRes = await makeRequest(server, {
      path: '/api/health',
      method: 'GET',
      headers: {
        Origin: 'https://malicious-tracker.evil.com',
      },
    });
    assert(
      evilRes.headers['access-control-allow-origin'] === undefined,
      'Disallowed origin does NOT receive Access-Control-Allow-Origin header'
    );
    assert(
      evilRes.headers['access-control-allow-credentials'] === undefined,
      'Disallowed origin does NOT receive Access-Control-Allow-Credentials header'
    );

    // ─── 6. Non-Browser Request (No Origin Header) ──────────────────────────
    console.log('\n6. Testing Non-Browser Requests (Health Probes / Curl)...');
    const noOriginRes = await makeRequest(server, {
      path: '/api/health',
      method: 'GET',
    });
    assert(noOriginRes.statusCode === 200, 'Non-browser request returns HTTP 200 without Origin');
    const healthJson = JSON.parse(noOriginRes.body);
    assert(healthJson.status === 'healthy', 'Health check body confirms service is healthy');

    console.log('\n═════════════════════════════════════════════════════════════');
    console.log(`   CORS Tests Completed: ${passedTests} PASSED, ${failedTests} FAILED   `);
    console.log('═════════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
    closeDb();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  }

  if (failedTests > 0) {
    process.exit(1);
  }
}

runCorsTests().catch((err) => {
  console.error('Fatal error running CORS tests:', err);
  process.exit(1);
});

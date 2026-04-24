const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  clearProjectModules,
  projectRoot
} = require('./helpers/appHarness');

function loadBackendService(envOverrides = {}) {
  const originalValues = Object.fromEntries(
    Object.keys(envOverrides).map((key) => [key, process.env[key]])
  );

  Object.entries(envOverrides).forEach(([key, value]) => {
    process.env[key] = value;
  });

  clearProjectModules();
  const service = require(path.join(projectRoot, 'app/services/nctBackendService'));

  Object.entries(originalValues).forEach(([key, value]) => {
    if (typeof value === 'undefined') {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });

  return service;
}

test('requestFrontendRuntime accepts BACKEND_SERVICE_* compatibility env names', async () => {
  const originalFetch = global.fetch;
  const fetchCalls = [];

  global.fetch = async (input, init = {}) => {
    fetchCalls.push({
      headers: init.headers || {},
      method: init.method || 'GET',
      url: String(input)
    });

    return new Response(JSON.stringify({
      formProtectionToken: 'compat-token',
      scope: 'form'
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    });
  };

  try {
    const { requestFrontendRuntime } = loadBackendService({
      BACKEND_SERVICE_TIMEOUT_MS: '12345',
      BACKEND_SERVICE_TOKEN: 'compat-secret',
      BACKEND_SERVICE_URL: 'https://compat.example.com'
    });

    const payload = await requestFrontendRuntime('form');

    assert.deepEqual(payload, {
      formProtectionToken: 'compat-token',
      scope: 'form'
    });
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].method, 'GET');
    assert.equal(fetchCalls[0].url, 'https://compat.example.com/api/no-torsion/frontend-runtime?scope=form');
    assert.equal(fetchCalls[0].headers.Authorization, 'Bearer compat-secret');
  } finally {
    global.fetch = originalFetch;
    clearProjectModules();
  }
});

test('requestFrontendRuntime turns aborted backend calls into timeout errors', async () => {
  const originalFetch = global.fetch;

  global.fetch = (_input, init = {}) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      const error = new Error('The request was aborted.');
      error.name = 'AbortError';
      reject(error);
    });
  });

  try {
    const { NctBackendServiceError, requestFrontendRuntime } = loadBackendService({
      NCT_BACKEND_SERVICE_TIMEOUT_MS: '5',
      NCT_BACKEND_SERVICE_URL: 'https://sub.example.com'
    });

    await assert.rejects(
      () => requestFrontendRuntime('form'),
      (error) => {
        assert.ok(error instanceof NctBackendServiceError);
        assert.equal(error.statusCode, 502);
        assert.equal(error.message, 'NCT backend service timed out.');
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
    clearProjectModules();
  }
});

/**
 * Python FastAPI ML Microservice Proxy
 * Forwards inference, evaluation metrics, backtesting, and CE-2 artifact checks to FastAPI.
 */

function getPythonBaseUrl() {
  return (process.env.PYTHON_ML_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
}

async function fetchFromPython(relativePath, timeoutMs = 6000) {
  const targetUrl = `${getPythonBaseUrl()}${relativePath}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      return { success: true, data: await res.json() };
    }
    return { success: false, status: res.status, data: null };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
}

export async function queryPythonMLService(symbol, { buyThreshold, sellThreshold } = {}) {
  const params = new URLSearchParams();
  if (buyThreshold !== undefined && buyThreshold !== null && buyThreshold !== '') {
    params.set('buy_threshold', String(buyThreshold));
  }
  if (sellThreshold !== undefined && sellThreshold !== null && sellThreshold !== '') {
    params.set('sell_threshold', String(sellThreshold));
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  return fetchFromPython(`/api/predictions/${encodeURIComponent(symbol)}${qs}`, 6000);
}

export async function queryPythonModelMetrics(symbol = null) {
  const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
  return fetchFromPython(`/api/model/metrics${qs}`, 5000);
}

export async function queryPythonBacktesting(symbol = null) {
  const qs = symbol ? `?symbol=${encodeURIComponent(symbol)}` : '';
  return fetchFromPython(`/api/backtesting${qs}`, 5000);
}

export async function queryPythonCE2Status() {
  return fetchFromPython('/api/ce2/status', 4000);
}

export async function pingPythonMLService() {
  const baseUrl = getPythonBaseUrl();
  const started = Date.now();
  for (const endpoint of ['/health', '/api/ce2/status']) {
    const res = await fetchFromPython(endpoint, 2500);
    if (res.success) {
      return {
        online: true,
        latency_ms: Date.now() - started,
        endpoint,
      };
    }
  }
  return {
    online: false,
    latency_ms: null,
    endpoint: baseUrl,
  };
}



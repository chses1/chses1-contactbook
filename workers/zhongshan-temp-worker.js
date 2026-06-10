const DASHBOARD_URL = 'https://tyn-air.tydep.gov.tw/Dashboard/Dashboard.aspx?Id=4';
const DASHBOARD_DATA_URL = 'https://tyn-air.tydep.gov.tw/Controllers/GetDashboard.aspx/QryDashborad';
const CACHE_TTL_SECONDS = 600;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

function parseTemperature(payload) {
  const data = typeof payload?.d?.Data === 'string' ? JSON.parse(payload.d.Data) : payload?.d?.Data;
  const rawValue = String(data?.TempData?.Value ?? '').trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(rawValue)) return null;
  const temperature = Number(rawValue);
  if (!Number.isFinite(temperature) || temperature <= 0 || temperature > 60) return null;
  return {
    temperature: Math.round(temperature * 10) / 10,
    observedAt: data?.TempData?.ObsTime || '',
    status: data?.TempData?.Status ?? null,
    source: 'Clean Air TaoYuan',
    sourceUrl: DASHBOARD_URL
  };
}

async function fetchTemperature() {
  const response = await fetch(DASHBOARD_DATA_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'Referer': DASHBOARD_URL
    },
    body: JSON.stringify({ school_id: '4' })
  });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  const result = parseTemperature(await response.json());
  if (!result) throw new Error('temperature not found');
  return result;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (request.method !== 'GET') return jsonResponse({ error: 'method_not_allowed' }, 405);

    const url = new URL(request.url);
    if (!['/', '/zhongshan-temp'].includes(url.pathname)) {
      return jsonResponse({ error: 'not_found' }, 404);
    }

    const cache = caches.default;
    const cacheKey = new Request(new URL('/zhongshan-temp-cache-v1', request.url), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchTemperature();
      const response = jsonResponse(data, 200, {
        'Cache-Control': `public, max-age=60, s-maxage=${CACHE_TTL_SECONDS}`
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (error) {
      return jsonResponse({
        temperature: null,
        error: 'temperature_unavailable',
        sourceUrl: DASHBOARD_URL
      }, 502, { 'Cache-Control': 'no-store' });
    }
  }
};

// services/api.js
// Minimal, robust fetch helpers + all endpoints you need.
// Set VITE_API_URL (or VITE_API_BASE) in your .env.
// Example: VITE_API_URL=http://localhost:8000

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:8000";

// ---------- small utils ----------
const clean = (o = {}) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

const toQS = (params) => {
  const p = new URLSearchParams(clean(params));
  const s = p.toString();
  return s ? `?${s}` : "";
};

function toWsUrl(httpUrl) {
  try {
    const u = new URL(httpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.toString();
  } catch {
    // naive fallback
    return httpUrl.replace(/^http/, "ws");
  }
}

async function http(path, { method = "GET", data, signal, headers, timeoutMs } = {}) {
  const ctrl = timeoutMs ? new AbortController() : null;
  const timer = timeoutMs
    ? setTimeout(() => ctrl.abort(), timeoutMs)
    : null;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: ctrl ? ctrl.signal : signal,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(headers || {}),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    return res.status === 204 ? null : res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---------- Health (tries /healthz then /health) ----------
export async function getHealth(opts = {}) {
  try {
    return await http("/healthz", opts);
  } catch {
    return http("/health", opts);
  }
}

// ---------- Sites ----------
export const listSites = ({ bbox, signal } = {}) =>
  http(`/sites${bbox ? toQS({ bbox: bbox.join(",") }) : ""}`, { signal });

export const getSite = (siteId, { signal } = {}) =>
  http(`/sites/${encodeURIComponent(siteId)}`, { signal });

export const getSiteAssets = (siteId, { signal } = {}) =>
  http(`/sites/${encodeURIComponent(siteId)}/assets`, { signal });

export const createSite = (payload, { signal } = {}) =>
  http(`/sites`, { method: "POST", data: payload, signal });

export const patchSite = (siteId, patch, { signal } = {}) =>
  http(`/sites/${encodeURIComponent(siteId)}`, { method: "PATCH", data: patch, signal });

export const deleteSite = (siteId, { signal } = {}) =>
  http(`/sites/${encodeURIComponent(siteId)}`, { method: "DELETE", signal });

// ---------- Assets ----------
export const listAssets = ({ site_id, status, type, signal } = {}) =>
  http(`/assets${toQS({ site_id, status, type })}`, { signal });

export const getAsset = (assetId, { signal } = {}) =>
  http(`/assets/${encodeURIComponent(assetId)}`, { signal });

export const createAsset = (payload, { signal } = {}) =>
  http(`/assets`, { method: "POST", data: payload, signal });

export const patchAsset = (assetId, patch, { signal } = {}) =>
  http(`/assets/${encodeURIComponent(assetId)}`, { method: "PATCH", data: patch, signal });

export const deleteAsset = (assetId, { signal } = {}) =>
  http(`/assets/${encodeURIComponent(assetId)}`, { method: "DELETE", signal });

// ---------- Work Orders ----------
export const listWorkOrders = ({ site_id, status, assigned_to, signal } = {}) =>
  http(`/workorders${toQS({ site_id, status, assigned_to })}`, { signal });

export const getWorkOrder = (id, { signal } = {}) =>
  http(`/workorders/${id}`, { signal });

export const createWorkOrder = (payload, { signal } = {}) =>
  http(`/workorders`, { method: "POST", data: payload, signal });

export const patchWorkOrder = (id, patch, { signal } = {}) =>
  http(`/workorders/${id}`, { method: "PATCH", data: patch, signal });

export const deleteWorkOrder = (id, { signal } = {}) =>
  http(`/workorders/${id}`, { method: "DELETE", signal });

// ---------- Notices (crew/site alerts) ----------
export const listNotices = ({ site_id, asset_id, crew_id, kind, since, signal } = {}) =>
  http(`/notices${toQS({ site_id, asset_id, crew_id, kind, since })}`, { signal });

export const createNotice = (payload, { signal } = {}) =>
  http(`/notices`, { method: "POST", data: payload, signal });

// ---------- Crew (map markers + tracks) ----------
export const listCrew = ({ bbox, status, signal } = {}) =>
  http(`/crew${toQS({ bbox: bbox ? bbox.join(",") : undefined, status })}`, { signal });

export const getCrew = (id, { signal } = {}) =>
  http(`/crew/${encodeURIComponent(id)}`, { signal });

export const createCrew = (payload, { signal } = {}) =>
  http(`/crew`, { method: "POST", data: payload, signal }); // upsert

export const postCrewPosition = (payload, { apiKey, signal } = {}) =>
  http(`/crew/position`, {
    method: "POST",
    data: payload,
    signal,
    headers: { "x-api-key": apiKey },
  });

export const getCrewTrack = (id, { minutes = 60, limit = 500, signal } = {}) =>
  http(`/crew/${encodeURIComponent(id)}/track${toQS({ minutes, limit })}`, { signal });

// Optional WebSocket for realtime crew notices (or tracking)
// onMessage receives parsed JSON messages from server.
export function openCrewSocket(crewId, { token, onMessage, onOpen, onError, onClose } = {}) {
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  const wsUrl = toWsUrl(`${BASE_URL}/ws/crew/${encodeURIComponent(crewId)}${q}`);
  const ws = new WebSocket(wsUrl);
  ws.onopen = (ev) => onOpen?.(ev);
  ws.onmessage = (ev) => {
    try { onMessage?.(JSON.parse(ev.data)); }
    catch { onMessage?.(ev.data); }
  };
  ws.onerror = (ev) => onError?.(ev);
  ws.onclose = (ev) => onClose?.(ev);
  return ws;
}

// ---------- SCADA / Telemetry ingest ----------
export const ingestScadaPoint = (point, { signal } = {}) =>
  http(`/ingest/scada`, { method: "POST", data: point, signal });

export const ingestScadaBatch = (items, { signal } = {}) =>
  http(`/ingest/scada`, { method: "POST", data: { items }, signal });

// ---------- export bundle ----------
export const API = {
  BASE_URL,
  // health
  getHealth,
  // sites
  listSites, getSite, getSiteAssets, createSite, patchSite, deleteSite,
  // assets
  listAssets, getAsset, createAsset, patchAsset, deleteAsset,
  // work orders
  listWorkOrders, getWorkOrder, createWorkOrder, patchWorkOrder, deleteWorkOrder,
  // notices
  listNotices, createNotice,
  // crew
  listCrew, getCrew, createCrew, postCrewPosition, getCrewTrack, openCrewSocket,
  // scada
  ingestScadaPoint, ingestScadaBatch,
};

export default API;

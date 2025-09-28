// services/api.js
// Minimal, robust fetch helpers + all endpoints you need.
// Uses Vite env: set VITE_API_URL in your .env (fallback http://localhost:8000).

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const clean = (o = {}) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

const toQS = (params) => {
  const p = new URLSearchParams(clean(params));
  const s = p.toString();
  return s ? `?${s}` : "";
};

async function http(path, { method = "GET", data, signal, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
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
}

// ---- Health
export const getHealth = (opts = {}) => http("/healthz", opts);

// ---- Sites
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

// ---- Assets
export const listAssets = ({ site_id, status, type, signal } = {}) =>
  http(`/assets${toQS({ site_id, status, type })}`, { signal });

export const getAsset = (assetId, { signal } = {}) =>
  http(`/assets/${encodeURIComponent(assetId)}`, { signal });

export const patchAsset = (assetId, patch, { signal } = {}) =>
  http(`/assets/${encodeURIComponent(assetId)}`, { method: "PATCH", data: patch, signal });

export const createAsset = (payload, { signal } = {}) =>
  http(`/assets`, { method: "POST", data: payload, signal });

// ---- Work Orders
export const listWorkOrders = ({ site_id, status, assigned_to, signal } = {}) =>
  http(`/workorders${toQS({ site_id, status, assigned_to })}`, { signal });

export const getWorkOrder = (id, { signal } = {}) =>
  http(`/workorders/${id}`, { signal });

export const createWorkOrder = (payload, { signal } = {}) =>
  http(`/workorders`, { method: "POST", data: payload, signal });

export const patchWorkOrder = (id, patch, { signal } = {}) =>
  http(`/workorders/${id}`, { method: "PATCH", data: patch, signal });

// ---- Notices (optional)
export const listNotices = ({ site_id, asset_id, kind, signal } = {}) =>
  http(`/notices${toQS({ site_id, asset_id, kind })}`, { signal });

export const createNotice = (payload, { signal } = {}) =>
  http(`/notices`, { method: "POST", data: payload, signal });

// ---- Crew (map markers + tracks)
export const listCrew = ({ bbox, status, signal } = {}) =>
  http(`/crew${toQS({ bbox: bbox ? bbox.join(",") : undefined, status })}`, { signal });

export const getCrew = (id, { signal } = {}) =>
  http(`/crew/${encodeURIComponent(id)}`, { signal });

export const getCrewTrack = (id, { minutes = 60, limit = 500, signal } = {}) =>
  http(`/crew/${encodeURIComponent(id)}/track${toQS({ minutes, limit })}`, { signal });

// For testing/demo only (web usually doesn’t create crews)
export const createCrew = (payload, { signal } = {}) =>
  http(`/crew`, { method: "POST", data: payload, signal });

// Mobile app only (posts GPS; requires x-api-key)
// Example: postCrewPosition({ crew_id, lat, lon, speed, heading }, { apiKey })
export const postCrewPosition = (payload, { apiKey, signal } = {}) =>
  http(`/crew/position`, {
    method: "POST",
    data: payload,
    signal,
    headers: { "x-api-key": apiKey },
  });

export const API = {
  BASE_URL,
  getHealth,
  listSites,
  getSite,
  getSiteAssets,
  createSite,
  patchSite,
  listAssets,
  getAsset,
  patchAsset,
  createAsset,
  listWorkOrders,
  getWorkOrder,
  createWorkOrder,
  patchWorkOrder,
  listNotices,
  createNotice,
  listCrew,
  getCrew,
  getCrewTrack,
  createCrew,
  postCrewPosition,
};

export default API;

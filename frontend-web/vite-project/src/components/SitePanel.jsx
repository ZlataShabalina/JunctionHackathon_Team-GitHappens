// src/components/SitePanel.jsx
import React, { useEffect, useState } from "react";
import {
  getSite,
  getSiteAssets,
  listWorkOrders,
  createAsset,
  patchAsset,
  createWorkOrder,
} from "../../services/api";

const ASSET_STATUSES = ["operational","maintenance_due","maintenance","fault","standby"];
const ASSET_TYPES = ["transformer","switchgear","generator","mobile_sub","meter","other"];
const PRIORITIES = ["low","normal","high"];

export default function SitePanel({ siteId, onClose }) {
  const [site, setSite] = useState(null);
  const [assets, setAssets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // forms
  const [newAsset, setNewAsset] = useState({ id: "", name: "", type: "other", status: "operational" });
  const [woForm, setWoForm] = useState({
    asset_id: "",
    title: "",
    description: "",
    priority: "normal",
    scheduled_start: "",
    scheduled_end: "",
    assigned_to: "",
  });

  useEffect(() => {
    if (!siteId) return;
    let abort = new AbortController();
    async function load() {
      try {
        setLoading(true);
        const [s, a, w] = await Promise.all([
          getSite(siteId, { signal: abort.signal }),
          getSiteAssets(siteId, { signal: abort.signal }),
          listWorkOrders({ site_id: siteId, signal: abort.signal }),
        ]);
        setSite(s);
        setAssets(a.items || []);
        setOrders(w.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => abort.abort();
  }, [siteId]);

  async function handleAddAsset(e) {
    e.preventDefault();
    try {
      const payload = { ...newAsset, site_id: siteId };
      await createAsset(payload);
      setNewAsset({ id: "", name: "", type: "other", status: "operational" });
      // refresh
      const a = await getSiteAssets(siteId);
      setAssets(a.items || []);
    } catch (e) {
      alert(`Create asset failed: ${e.message}`);
    }
  }

  async function handleAssetPatch(assetId, patch) {
    try {
      await patchAsset(assetId, patch);
      const a = await getSiteAssets(siteId);
      setAssets(a.items || []);
    } catch (e) {
      alert(`Update asset failed: ${e.message}`);
    }
  }

  async function handleCreateWO(e) {
    e.preventDefault();
    try {
      const toIso = (v) => (v ? new Date(v).toISOString() : undefined);
      const payload = {
        site_id: siteId,
        asset_id: woForm.asset_id || null,
        title: woForm.title,
        description: woForm.description || undefined,
        priority: woForm.priority || "normal",
        scheduled_start: toIso(woForm.scheduled_start),
        scheduled_end: toIso(woForm.scheduled_end),
        assigned_to: woForm.assigned_to || undefined,
      };
      await createWorkOrder(payload);
      setWoForm({ asset_id: "", title: "", description: "", priority: "normal", scheduled_start: "", scheduled_end: "", assigned_to: "" });
      const w = await listWorkOrders({ site_id: siteId });
      setOrders(w.items || []);
    } catch (e) {
      alert(`Create work order failed: ${e.message}`);
    }
  }

  if (!siteId) return null;

  return (
    <div className="site-panel">
      <div className="panel-header">
        <h3>📍 {site?.name || siteId}</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      {loading && <div className="panel-loading">Loading…</div>}

      {!loading && (
        <>
          <div className="section">
            <h4>Site Info</h4>
            <div className="kv">
              <div><strong>ID:</strong> {site?.id}</div>
              <div><strong>Address:</strong> {site?.address || "—"}</div>
              <div><strong>Lat/Lon:</strong> {site?.lat?.toFixed(5)}, {site?.lon?.toFixed(5)}</div>
            </div>
          </div>

          <div className="section">
            <h4>Assets</h4>
            {assets.length === 0 && <div className="empty">No assets yet.</div>}
            {assets.map((a) => (
              <div key={a.id} className="row">
                <div className="grow">
                  <div><strong>{a.name || a.id}</strong> <small>({a.id})</small></div>
                  <div className="sub">Type: {a.type || "—"} · Status: {a.status}</div>
                </div>
                <div className="controls">
                  <select
                    value={a.type || "other"}
                    onChange={(e) => handleAssetPatch(a.id, { type: e.target.value })}
                  >
                    {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select
                    value={a.status || "operational"}
                    onChange={(e) => handleAssetPatch(a.id, { status: e.target.value })}
                  >
                    {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}

            <form className="form-inline" onSubmit={handleAddAsset}>
              <h5>Add Asset</h5>
              <input required placeholder="Asset ID" value={newAsset.id} onChange={(e) => setNewAsset({ ...newAsset, id: e.target.value })} />
              <input placeholder="Name" value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} />
              <select value={newAsset.type} onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={newAsset.status} onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}>
                {ASSET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit">Add</button>
            </form>
          </div>

          <div className="section">
            <h4>Work Orders</h4>
            {orders.length === 0 && <div className="empty">No work orders yet.</div>}
            {orders.map((w) => (
              <div key={w.id} className="row">
                <div className="grow">
                  <div><strong>{w.title}</strong> <small>#{w.id}</small></div>
                  <div className="sub">
                    Status: {w.status} · Priority: {w.priority} · Asset: {w.asset_id || "—"} · Assignee: {w.assigned_to || "—"}
                  </div>
                  {w.scheduled_start && (
                    <div className="sub">Window: {new Date(w.scheduled_start).toLocaleString()} → {w.scheduled_end ? new Date(w.scheduled_end).toLocaleString() : "—"}</div>
                  )}
                </div>
              </div>
            ))}

            <form className="form-wo" onSubmit={handleCreateWO}>
              <h5>Create Work Order</h5>
              <select value={woForm.asset_id} onChange={(e) => setWoForm({ ...woForm, asset_id: e.target.value })}>
                <option value="">(no specific asset)</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
              </select>
              <input required placeholder="Title" value={woForm.title} onChange={(e) => setWoForm({ ...woForm, title: e.target.value })} />
              <input placeholder="Description" value={woForm.description} onChange={(e) => setWoForm({ ...woForm, description: e.target.value })} />
              <select value={woForm.priority} onChange={(e) => setWoForm({ ...woForm, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <label>Start</label>
              <input type="datetime-local" value={woForm.scheduled_start} onChange={(e) => setWoForm({ ...woForm, scheduled_start: e.target.value })} />
              <label>End</label>
              <input type="datetime-local" value={woForm.scheduled_end} onChange={(e) => setWoForm({ ...woForm, scheduled_end: e.target.value })} />
              <input placeholder="Assign to crew id (e.g., alex)" value={woForm.assigned_to} onChange={(e) => setWoForm({ ...woForm, assigned_to: e.target.value })} />
              <button type="submit">Create</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

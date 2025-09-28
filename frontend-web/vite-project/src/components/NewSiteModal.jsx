import React, { useState } from "react";
import { createSite } from "../../services/api";

export default function NewSiteModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ id:"", name:"", lat:"", lon:"", address:"", type:"substation", status:"stable", country:"" });
  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    await createSite({
      id: form.id,
      name: form.name,
      lat: parseFloat(form.lat),
      lon: parseFloat(form.lon),
      address: form.address || null,
      meta: { type: form.type, status: form.status, country: form.country || undefined }
    });
    onClose?.(); onCreated?.();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="panel-header">
          <h3>➕ Add Site</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form className="form-wo" onSubmit={submit}>
          <input required placeholder="ID (unique)" value={form.id} onChange={(e)=>setForm({ ...form, id:e.target.value })}/>
          <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name:e.target.value })}/>
          <input required placeholder="Lat" value={form.lat} onChange={(e)=>setForm({ ...form, lat:e.target.value })}/>
          <input required placeholder="Lon" value={form.lon} onChange={(e)=>setForm({ ...form, lon:e.target.value })}/>
          <input placeholder="Address" value={form.address} onChange={(e)=>setForm({ ...form, address:e.target.value })}/>
          <select value={form.type} onChange={(e)=>setForm({ ...form, type:e.target.value })}>
            <option value="substation">substation</option><option value="tower">tower</option><option value="plant">plant</option>
          </select>
          <select value={form.status} onChange={(e)=>setForm({ ...form, status:e.target.value })}>
            <option value="stable">stable</option><option value="warning">warning</option><option value="critical">critical</option><option value="maintenance">maintenance</option>
          </select>
          <input placeholder="Country" value={form.country} onChange={(e)=>setForm({ ...form, country:e.target.value })}/>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", gridColumn:"1 / -1" }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

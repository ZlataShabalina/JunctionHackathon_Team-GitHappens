// src/components/NewSiteModal.jsx
import React, { useState } from "react";
import { createSite } from "../../services/api";

export default function NewSiteModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ id:"", name:"", lat:"", lon:"", address:"", type:"substation", status:"stable", country:"" });
  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    try {
      await createSite({
        id: form.id,
        name: form.name,
        lat: parseFloat(form.lat),
        lon: parseFloat(form.lon),
        address: form.address || null,
        meta: { type: form.type, status: form.status, country: form.country || undefined }
      });
      onClose?.();
      onCreated?.();
    } catch (e) {
      alert(`Create site failed: ${e.message}`);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="panel-header">
          <h3>➕ Add Site</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <form className="form-wo" onSubmit={submit}>
          <input required placeholder="ID (unique)" value={form.id} onChange={(e)=>setForm({ ...form, id: e.target.value })}/>
          <input required placeholder="Name" value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })}/>
          <input required placeholder="Lat (63.096)" value={form.lat} onChange={(e)=>setForm({ ...form, lat: e.target.value })}/>
          <input required placeholder="Lon (21.6158)" value={form.lon} onChange={(e)=>setForm({ ...form, lon: e.target.value })}/>
          <input placeholder="Address" value={form.address} onChange={(e)=>setForm({ ...form, address: e.target.value })}/>
          <select value={form.type} onChange={(e)=>setForm({ ...form, type: e.target.value })}>
            <option value="substation">substation</option><option value="tower">tower</option><option value="plant">plant</option>
          </select>
          <select value={form.status} onChange={(e)=>setForm({ ...form, status: e.target.value })}>
            <option value="stable">stable</option><option value="warning">warning</option><option value="critical">critical</option><option value="maintenance">maintenance</option>
          </select>
          <input placeholder="Country" value={form.country} onChange={(e)=>setForm({ ...form, country: e.target.value })}/>
          <div className="row end">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

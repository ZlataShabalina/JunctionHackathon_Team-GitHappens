import React, { useState } from "react";
// NOTE: use postCrewPosition (not setCrewPosition)
import { createCrew, postCrewPosition } from "../../services/api";

// Read API key for posting GPS positions (must match backend)
const SIM_API_KEY =
  import.meta.env.VITE_MOBILE_API_KEY ||
  import.meta.env.VITE_SIM_API_KEY ||
  ""; // leave empty only if your backend doesn't require a key

export default function AddCrewModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ id:"", name:"", lat:"", lon:"" });
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCrew({ id: form.id, name: form.name || form.id, status: "on_duty" });

      if (form.lat && form.lon) {
        await postCrewPosition(
          {
            crew_id: form.id,                       // <-- backend expects crew_id
            lat: parseFloat(form.lat),
            lon: parseFloat(form.lon),
            status: "on_duty",
          },
          { apiKey: SIM_API_KEY }                   // <-- sends x-api-key header
        );
      }

      onCreated?.();
      onClose?.();
    } catch (err) {
      console.error("Add crew failed:", err);
      alert(`Add crew failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="panel-header">
          <h3>👷 Add Crew</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form className="form-wo" onSubmit={submit}>
          <input required placeholder="Crew ID" value={form.id}
                 onChange={(e)=>setForm({ ...form, id:e.target.value })}/>
          <input placeholder="Name" value={form.name}
                 onChange={(e)=>setForm({ ...form, name:e.target.value })}/>
          <input placeholder="Start Lat (optional)" value={form.lat}
                 onChange={(e)=>setForm({ ...form, lat:e.target.value })}/>
          <input placeholder="Start Lon (optional)" value={form.lon}
                 onChange={(e)=>setForm({ ...form, lon:e.target.value })}/>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", gridColumn:"1 / -1" }}>
            <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// src/components/MapView.jsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Backend API helpers
import { listSites, listCrew, getCrewTrack } from "../../services/api";

// ---- Leaflet marker assets fix
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// ---- polling helper
function usePoll(asyncFn, deps = [], intervalMs = 5000) {
  const [data, setData] = useState();
  const timerRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    async function tick() {
      try {
        const result = await asyncFn(ctrl.signal);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled && e.name !== "AbortError") console.error(e);
      } finally {
        if (!cancelled) timerRef.current = setTimeout(tick, intervalMs);
      }
    }
    tick();
    return () => {
      cancelled = true;
      ctrl.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return data;
}

// ---- icons
const createTruckIcon = (statusUi) => {
  const colors = { moving: "#00c853", parked: "#ffab00", maintenance: "#ff1744", returning: "#2979ff" };
  return L.divIcon({
    className: "custom-truck-icon",
    html: `<div style="background:${colors[statusUi] || "#666"};width:20px;height:20px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 4px rgba(0,0,0,.3);">🚛</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};
const createSiteIcon = (type, status) => {
  const colors = { stable: "#00aa00", warning: "#ffaa00", critical: "#ff1744", maintenance: "#2979ff" };
  const icons = { substation: "⚡", tower: "🗼", plant: "🏭" };
  return L.divIcon({
    className: "custom-site-icon",
    html: `<div style="background:${colors[status] || "#666"};width:28px;height:28px;border-radius:4px;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.4);">${icons[type] || "⚡"}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};
const getZoneColor = (status) => ({ critical: "#ff1744", warning: "#ffaa00" }[status] || "#00aa00");
const mapCrewStatusToUi = (s) =>
  s === "in_progress" || s === "on_duty" ? "moving" : s === "on_break" || s === "off_duty" ? "parked" : "moving";

// ---- bbox helpers
const boundsToBbox = (b) => (b ? [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] : null);
function ViewportWatcher({ onBbox }) {
  useMapEvents({
    moveend: (e) => onBbox(boundsToBbox(e.target.getBounds())),
    zoomend: (e) => onBbox(boundsToBbox(e.target.getBounds())),
  });
  return null;
}

// ---- main
export default function MapView({ zones = [], onTruckSelect, onSiteSelect, focusSiteId, onFocusHandled }) {
  const [bbox, setBbox] = useState(null);
  const [selectedCrewId, setSelectedCrewId] = useState(null);
  const mapRef = useRef(null);
  //whenCreated={(map) => { mapRef.current = map; setBbox(boundsToBbox(map.getBounds())); }}

  const sites = usePoll((signal) => (bbox ? listSites({ bbox, signal }) : Promise.resolve([])), [JSON.stringify(bbox)], 15000);
  const crew  = usePoll((signal) => (bbox ? listCrew ({ bbox, signal }) : Promise.resolve([])), [JSON.stringify(bbox)], 6000);
  const track = usePoll(
    (signal) => (selectedCrewId ? getCrewTrack(selectedCrewId, { minutes: 60, signal }) : Promise.resolve(null)),
    [selectedCrewId],
    12000
  );

  const siteMarkers = useMemo(() => (sites || []).filter((s) => s.lat != null && s.lon != null), [sites]);
  const crewMarkers = useMemo(() => (crew  || []).filter((c) => c.last_lat != null && c.last_lon != null), [crew]);
  const trackLatLngs = useMemo(() => (track?.points?.length ? track.points.map((p) => [p.lat, p.lon]) : []), [track]);

  useEffect(() => {
    if (!focusSiteId || !mapRef.current || !sites) return;
    const target = (sites || []).find(s => s.id === focusSiteId);
    if (target && target.lat != null && target.lon != null) {
      mapRef.current.flyTo([target.lat, target.lon], 14, { duration: 0.8 });
      onFocusHandled && onFocusHandled();
    }
  }, [focusSiteId, sites, onFocusHandled]);

  const onCrewClick = useCallback(
    (c) => {
      setSelectedCrewId(c.id);
      onTruckSelect?.({
        id: c.id,
        name: c.name || c.id,
        lat: c.last_lat,
        lon: c.last_lon,
        status: mapCrewStatusToUi(c.status),
        crew: 1,
        fuel: 100,
        lastUpdate: c.last_seen_at ? new Date(c.last_seen_at) : undefined,
      });
    },
    [onTruckSelect]
  );

  return (
    <MapContainer
      center={[63.1, 21.62]}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      whenCreated={(map) => setBbox(boundsToBbox(map.getBounds()))}
    >
      <ViewportWatcher onBbox={setBbox} />
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* Zones as circles in METERS */}
      {zones.map((z) => (
        <Circle
          key={z.id}
          center={[z.center[0], z.center[1]]}  // [lat, lon]
          radius={z.radius}                    // meters
          pathOptions={{ color: getZoneColor(z.status), fillColor: getZoneColor(z.status), fillOpacity: 0.2, weight: 2 }}
        />
      ))}

      {/* Sites */}
      {siteMarkers.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lon]}
          icon={createSiteIcon(site.meta?.type || "substation", site.meta?.status || "stable")}
          eventHandlers={{ click: () => onSiteSelect?.(site) }}
        >
          <Popup>
            <div>
              <strong>{site.name}</strong><br />
              ID: {site.id}<br />
              Type: {site.meta?.type || "substation"}<br />
              Status: {site.meta?.status || "stable"}<br />
              Country: {site.meta?.country || "Unknown"}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Selected crew track */}
      {trackLatLngs.length > 0 && (
        <Polyline positions={trackLatLngs} pathOptions={{ color: "#00c853", weight: 3, opacity: 0.85, dashArray: "5,10" }} />
      )}

      {/* Crew markers */}
      {crewMarkers.map((c) => (
        <Marker
          key={c.id}
          position={[c.last_lat, c.last_lon]}
          icon={createTruckIcon(mapCrewStatusToUi(c.status))}
          eventHandlers={{ click: () => onCrewClick(c), dblclick: () => setSelectedCrewId(null) }}
        >
          <Popup>
            <div className="min-w-[220px]">
              <strong>{c.name || c.id}</strong><br />
              Status: {c.status}<br />
              Last seen: {c.last_seen_at ? new Date(c.last_seen_at).toLocaleTimeString() : "—"}<br />
              <small>Lat/Lon: {c.last_lat?.toFixed(5)}, {c.last_lon?.toFixed(5)}</small>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

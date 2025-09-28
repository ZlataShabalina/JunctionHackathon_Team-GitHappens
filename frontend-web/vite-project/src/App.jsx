import React, { useEffect, useState, useCallback } from "react";
import MapView from "./components/MapView";
import StatusHUD from "./components/StatusHUD";
import TruckDetailsPanel from "./components/TruckDetailsPanel";
import AlertsPanel from "./components/AlertsPanel";
import LoginForm from "./components/LoginForm";
import SitePanel from "./components/SitePanel";
import "./App.css";

import { getHealth, listSites, listCrew } from "../services/api";

// ---- derive UI bits for zones/alerts/HUD
function deriveZonesFromSites(sites) {
  return (sites || [])
    .filter((s) => s?.meta?.status === "critical" || s?.meta?.status === "warning")
    .map((s) => ({
      id: `zone-${s.id}`,
      siteId: s.id,
      center: [s.lat, s.lon],                          // [lat, lon]
      radius: s.meta?.status === "critical" ? 600 : 300, // meters
      status: s.meta?.status || "stable",
      priority: s.meta?.status === "critical" ? "high" : "medium",
    }));
}
function deriveAlertsFromSites(sites) {
  return (sites || [])
    .filter(s => s?.meta?.status === "critical" || s?.meta?.status === "warning")
    .map(s => ({
      id: `alert-${s.id}`,
      siteId: s.id,                 // <— add this
      type: s.meta?.status,
      message: `${s.name} requires attention!`,
      timestamp: new Date()
    }));
}

function deriveStatsFromCrew(crew) {
  const list = crew || [];
  const active = list.filter((c) => c.status === "on_duty" || c.status === "assigned").length;
  const parked = list.filter((c) => c.status === "on_break" || c.status === "off_duty").length;
  const maintenance = list.filter((c) => c.status === "in_progress").length;
  return { active, parked, maintenance };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [focusSiteId, setFocusSiteId] = useState(null);

  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ active: 0, parked: 0, maintenance: 0 });

  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      await getHealth().catch(() => {});
      const [sites, crew] = await Promise.all([listSites({}), listCrew({})]);
      setZones(deriveZonesFromSites(sites));
      setAlerts(deriveAlertsFromSites(sites));
      setStats(deriveStatsFromCrew(crew));
      setIsConnected(true);
    } catch (err) {
      console.error("Refresh failed:", err);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => { if (isAuthenticated) refresh(); }, [isAuthenticated, refresh]);
  useEffect(() => { if (!isAuthenticated) return; const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [isAuthenticated, refresh]);

  if (!isAuthenticated) return <LoginForm onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="app">
      <StatusHUD isConnected={isConnected} stats={stats} />
      <AlertsPanel alerts={alerts} onSelect={(a) => setFocusSiteId(a.siteId)} />

      {selectedTruck && <TruckDetailsPanel truck={selectedTruck} onClose={() => setSelectedTruck(null)} />}
      {selectedSiteId && <SitePanel siteId={selectedSiteId} onClose={() => setSelectedSiteId(null)} />}

      <div className="map-container">
        <MapView
  zones={zones}
  onTruckSelect={setSelectedTruck}
  onSiteSelect={(site) => setSelectedSiteId(site.id)}
  focusSiteId={focusSiteId}
  onFocusHandled={() => setFocusSiteId(null)}
/>
      </div>

      {!isConnected && <div className="connection-banner">Connection Lost - Displaying Last Known Positions</div>}
    </div>
  );
}
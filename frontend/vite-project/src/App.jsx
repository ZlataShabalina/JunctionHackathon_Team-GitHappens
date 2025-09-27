import React, { useState, useEffect } from "react";
import MapView from "./components/MapView";
import StatusHUD from "./components/StatusHUD";
import TruckDetailsPanel from "./components/TruckDetailsPanel";
import AlertsPanel from "./components/AlertsPanel";
import LoginForm from "./components/LoginForm";
import "./App.css";

import axios from "axios";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sites, setSites] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [zones, setZones] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ active: 0, parked: 0, maintenance: 0 });

  const BASE_URL = "http://localhost:8000";

  // Fetch sites and assets from backend
  const fetchBackendData = async () => {
    try {
      const [sitesRes, assetsRes] = await Promise.all([
        axios.get(`${BASE_URL}/sites`),
        axios.get(`${BASE_URL}/assets`)
      ]);

      const fetchedSites = sitesRes.data;
      const fetchedAssets = assetsRes.data.items;

      setSites(fetchedSites);
      
      const mappedTrucks = fetchedAssets
        .filter(a => ["mobile_sub", "vehicle"].includes(a.type))
        .map(a => ({
          id: a.id,
          name: a.name || a.id,
          lat: a.meta?.lat || 0,
          lng: a.meta?.lon || 0,
          status: a.status === "fault" ? "maintenance" : "moving",
          crew: a.meta?.crew || 1,
          fuel: a.meta?.fuel || 100,
          route: a.meta?.route || [],
          eta: a.meta?.eta || null,
          targetSite: fetchedSites.find(s => s.id === a.site_id),
          lastUpdate: a.last_seen_at ? new Date(a.last_seen_at) : new Date()
        }));

      setTrucks(mappedTrucks);

      // Create zones for critical/warning sites
      const criticalZones = fetchedSites
        .filter(site => site.meta?.status === 'critical' || site.meta?.status === 'warning')
        .map(site => ({
          id: `zone-${site.id}`,
          siteId: site.id,
          center: [site.lat, site.lon],
          radius: 0.1,
          status: site.meta?.status || 'stable',
          priority: site.meta?.status === 'critical' ? 'high' : 'medium'
        }));

      setZones(criticalZones);

      // Generate alerts for critical/warning sites
      const newAlerts = fetchedSites
        .filter(site => site.meta?.status === 'critical' || site.meta?.status === 'warning')
        .map(site => ({
          id: `alert-${site.id}`,
          type: site.meta?.status,
          message: `${site.name} requires attention!`,
          timestamp: new Date()
        }));
      setAlerts(newAlerts);

      // Update stats
      setStats({
        active: mappedTrucks.filter(t => t.status === "moving").length,
        parked: mappedTrucks.filter(t => t.status === "parked").length,
        maintenance: mappedTrucks.filter(t => t.status === "maintenance").length
      });

    } catch (err) {
      console.error("Error fetching backend data:", err);
      setIsConnected(false);
    }
  };

  // Initialize data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchBackendData();
  }, [isAuthenticated]);

  // Refresh data every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(fetchBackendData, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app">
      <StatusHUD isConnected={isConnected} stats={stats} />

      <AlertsPanel alerts={alerts} />

      {selectedTruck && (
        <TruckDetailsPanel
          truck={selectedTruck}
          onClose={() => setSelectedTruck(null)}
        />
      )}

      <div className="map-container">
        <MapView
          sites={sites}
          trucks={trucks}
          zones={zones}
          onTruckSelect={setSelectedTruck}
        />
      </div>

      {!isConnected && (
        <div className="connection-banner">
          Connection Lost - Displaying Last Known Positions
        </div>
      )}
    </div>
  );
}

export default App;

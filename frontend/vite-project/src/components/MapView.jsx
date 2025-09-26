import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ZONE_COLORS = {
  high: "#ff0000",
  moderate: "#ffa500",
  stable: "#008000",
};

function MapView({  }) {
  const [zones, setZones] = useState([]);
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [timestamp, setTimestamp] = useState(0);

useEffect(() => {
  if (history.length === 0) return;

  const interval = setInterval(() => {
    setTimestamp((prev) => (prev + 1) % history.length);
  }, 1000);

  return () => clearInterval(interval);
}, [history]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const respZones = await fetch("http://localhost:8000/zones");
        const dataZones = await respZones.json();
        console.log("zones:", dataZones);
        setZones(dataZones);
      } catch (e) {
        console.error("Error fetching zones:", e);
      }
      try {
        const respAssets = await fetch("http://localhost:8000/assets");
        const dataAssets = await respAssets.json();
        console.log("assets:", dataAssets);
        setAssets(dataAssets);
      } catch (e) {
        console.error("Error fetching assets:", e);
      }
      try {
        const respHist = await fetch("http://localhost:8000/history/crew-2");
        const dataHist = await respHist.json();
        console.log("history:", dataHist);
        setHistory(dataHist);
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentPosition = history[timestamp];
console.log("Current timestamp:", timestamp);
console.log("Current position:", currentPosition);

  return (
    <MapContainer
      center={[63.0951, 21.6152]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {zones.map((zone, idx) => {
        // Only draw if coords are non-empty array
        if (!zone.coords || zone.coords.length === 0) {
          return null;
        }
        return (
          <Polygon
            key={zone.id ?? idx}
            positions={zone.coords}
            pathOptions={{
              color: ZONE_COLORS[zone.status] ?? "#008000",
              fillOpacity: 0.4,
            }}
          >
            <Popup>
              <div>
                <strong>Zone ID:</strong> {zone.id}
                <br />
                <strong>Status:</strong> {zone.status}
                <br />
                <strong>Risk Score:</strong>{" "}
                {zone.riskScore != null
                  ? zone.riskScore.toFixed(2)
                  : "N/A"}
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {assets.map((asset) => {
        if (asset.lat == null || asset.lng == null) {
          return null;
        }
        return (
          <Marker key={asset.id} position={[asset.lat, asset.lng]}>
            <Popup>
              <div>
                <strong>{asset.name}</strong>
                <br />
                Status: {asset.status}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {currentPosition && (
        <Marker
          position={[currentPosition.lat, currentPosition.lng]}
          icon={L.divIcon({
            className: "custom-icon",
            html: "🚚",
          })}
        >
          <Popup>Team Bravo @ t={timestamp}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default MapView;

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icon paths
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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

// Helper to generate random polygon around a point
const randomPolygon = (lat, lng, size = 0.01) => [
  [lat, lng],
  [lat + size * Math.random(), lng + size * Math.random()],
  [lat + size * Math.random(), lng - size * Math.random()],
  [lat - size * Math.random(), lng - size * Math.random()],
  [lat - size * Math.random(), lng + size * Math.random()],
];

console.log(import.meta.env)
const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY

// Fetch route from ORS
const fetchRoute = async (start, end) => {
  const url = "https://api.openrouteservice.org/v2/directions/driving-car";
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates: [start, end], instructions: false }),
    });
    const data = await resp.json();
    if (!data.routes || data.routes.length === 0) return [];
    const coords = decodePolyline(data.routes[0].geometry);
    return coords.map((c, i) => ({ lat: c[1], lng: c[0] }));
  } catch (err) {
    console.error("ORS route error:", err);
    return [];
  }
};

// Decode polyline (from ORS)
const decodePolyline = (str) => {
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < str.length) {
    let result = 0, shift = 0, b;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0; shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng * 1e-5, lat * 1e-5]);
  }
  return coordinates;
};

function MapView() {
  const [zones, setZones] = useState([]);
  const [assets, setAssets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [timestamp, setTimestamp] = useState(0);

  // Animate vehicles
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize assets, zones, teams
  useEffect(() => {
    const init = async () => {
      const exampleAssets = [
        { id: "fin-asset-1", name: "Finland Substation A", lat: 64.1, lng: 25.0 },
        { id: "fin-asset-2", name: "Finland Tower B", lat: 64.05, lng: 25.05 },
        { id: "nor-asset-1", name: "Norway Substation A", lat: 60.5, lng: 11.0 },
        { id: "nor-asset-2", name: "Norway Tower B", lat: 60.55, lng: 11.05 },
        { id: "swe-asset-1", name: "Sweden Substation A", lat: 59.3, lng: 18.0 },
        { id: "swe-asset-2", name: "Sweden Tower B", lat: 59.35, lng: 18.05 },
      ];
      setAssets(exampleAssets);

      const exampleZones = exampleAssets.map((a, idx) => ({
        id: `zone-${idx}`,
        coords: randomPolygon(a.lat, a.lng, 0.02),
        status: ["stable", "moderate", "high"][Math.floor(Math.random() * 3)],
        riskScore: Math.random(),
      }));
      setZones(exampleZones);

      const exampleTeams = [];
      const countries = [
        { code: "fin", baseLat: 64.0, baseLng: 25.0 },
        { code: "nor", baseLat: 60.5, baseLng: 11.0 },
        { code: "swe", baseLat: 59.3, baseLng: 18.0 },
      ];

      for (const c of countries) {
        for (let i = 1; i <= 5; i++) {
          const moving = Math.random() < 0.6;
          const targetAsset = moving
            ? exampleAssets.filter((a) => a.id.startsWith(c.code))[Math.floor(Math.random() * 2)]
            : null;
          let route = [];
          if (moving && targetAsset) {
            route = await fetchRoute([c.baseLng, c.baseLat], [targetAsset.lng, targetAsset.lat]);
          }

          exampleTeams.push({
            id: `${c.code}-team-${i}`,
            name: `${c.code.toUpperCase()} Team ${i}`,
            lat: c.baseLat,
            lng: c.baseLng,
            status: moving ? "moving" : "parked",
            targetAsset,
            route,
            eta: moving ? `${Math.floor(Math.random() * 30) + 10} min` : null,
          });
        }
      }
      setTeams(exampleTeams);
    };
    init();
  }, []);

  return (
    <MapContainer center={[62, 15]} zoom={5} scrollWheelZoom style={{ height: "100vh", width: "100%" }}>
      <button></button>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

     {zones.map((zone) => (
  <Polygon
    key={zone.id}
    positions={zone.coords}
    pathOptions={{ color: ZONE_COLORS[zone.status] ?? "#008000", fillOpacity: 0.4 }}
  >
    <Popup>
      <div style={{ fontSize: "26px", lineHeight: "1.4em" }}>
        <strong>Zone ID:</strong> {zone.id}
        <br />
        <strong>Status:</strong> {zone.status}
        <br />
        <strong>Risk Score:</strong> {zone.riskScore.toFixed(2)}
      </div>
    </Popup>
  </Polygon>
))}


     {assets.map((asset) => (
  <Marker key={asset.id} position={[asset.lat, asset.lng]}>
    <Popup>
      <div style={{ fontSize: "26px", lineHeight: "1.4em" }}>
        <strong>{asset.name}</strong>
      </div>
    </Popup>
  </Marker>
))}

      {teams.map((team) => {
        const currentPos =
          team.status === "moving" && team.route.length > 0
            ? team.route[timestamp % team.route.length]
            : { lat: team.lat, lng: team.lng };
        return (
          <Marker
            key={team.id}
            position={[currentPos.lat, currentPos.lng]}
            icon={L.divIcon({
              className: "custom-icon",
              html: `<div style="font-size: 32px;">🚚</div>`,
              iconSize: [32, 32], 
              iconAnchor: [16, 16], 
            })}

          >
           <Popup>
              <div style={{ fontSize: "26px", lineHeight: "1.4em" }}>
                <strong>{team.name}</strong>
                <br />
                Status: {team.status}
                <br />
                {team.status === "moving" && team.targetAsset && (
                  <>
                    Target: {team.targetAsset.name}
                    <br />
                    ETA: {team.eta}
                  </>
                )}
              </div>
            </Popup>

          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default MapView;

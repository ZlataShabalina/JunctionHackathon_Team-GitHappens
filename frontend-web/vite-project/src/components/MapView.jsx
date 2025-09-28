import React from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, Polyline } from "react-leaflet";
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

// Custom truck icon for different statuses
const createTruckIcon = (status) => {
  const colors = {
    moving: '#00ff00',
    parked: '#ffaa00',
    maintenance: '#ff0000',
    returning: '#0088ff'
  };
  
  return L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="
      background: ${colors[status] || '#666'};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">🚛</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Site icon based on status
const createSiteIcon = (type, status) => {
  const colors = {
    stable: '#00aa00',
    warning: '#ffaa00',
    critical: '#ff0000',
    maintenance: '#0088ff'
  };
  
  const icons = {
    substation: '⚡',
    tower: '🗼',
    plant: '🏭'
  };
  
  return L.divIcon({
    className: 'custom-site-icon',
    html: `<div style="
      background: ${colors[status] || '#666'};
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${icons[type] || '⚡'}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const getZoneColor = (status) => {
  const colors = {
    critical: '#ff0000',
    warning: '#ffaa00',
    medium: '#ffaa00',
    high: '#ff0000'
  };
  return colors[status] || '#00aa00';
};

const formatETA = (minutes) => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const trucks = [
  {
    id: "crew-1",
    name: "Field Team Alpha",
    lat: 63.095,   // latitude
    lon: 21.610,   // longitude
    status: "moving",
    start: [21.6100, 63.0950], // [lng, lat] for ORS only
    end: [21.6200, 63.0980],   // [lng, lat] for ORS only
    crew: 3,
    fuel: 90
  },
  {
    id: "crew-2",
    name: "Team Bravo",
    lat: 63.100,
    lon: 21.620,
    status: "parked",
    crew: 3,
    fuel: 75
  }
];



function MapView({ sites = [], trucks = [], zones = [], onTruckSelect }) {
  return (
    <MapContainer
      center={[62.5, 15]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Service Zones */}
      {zones.map(zone => {
        const bounds = [
          [zone.center[0] - zone.radius, zone.center[1] - zone.radius],
          [zone.center[0] + zone.radius, zone.center[1] + zone.radius],
          [zone.center[0] + zone.radius, zone.center[1] - zone.radius],
          [zone.center[0] - zone.radius, zone.center[1] - zone.radius]
        ];
        
        return (
          <Polygon
            key={zone.id}
            positions={bounds}
            pathOptions={{
              color: getZoneColor(zone.status),
              fillColor: getZoneColor(zone.status),
              fillOpacity: 0.2,
              weight: 2
            }}
          >
            <Popup>
              <div>
                <strong>Service Zone</strong><br />
                Priority: {zone.priority}<br />
                Status: {zone.status}
              </div>
            </Popup>
          </Polygon>
        );
      })}

      {/* Sites */}
      {sites
  .filter(site => site.lat != null && site.lon != null)
  .map(site => (
    <Marker
      key={site.id}
      position={[site.lat, site.lon]}
      icon={createSiteIcon(site.meta?.type || 'substation', site.meta?.status || 'stable')}
    >
      <Popup>
        <div>
          <strong>{site.name}</strong><br />
          ID: {site.id}<br />
          Type: {site.meta?.type || 'substation'}<br />
          Status: {site.meta?.status || 'stable'}<br />
          Country: {site.meta?.country || 'Unknown'}
        </div>
      </Popup>
    </Marker>
))}


      {/* Truck Routes */}
      {trucks
        .filter(truck => truck.route && truck.route.length > 0 && truck.status === 'moving')
        .map(truck => (
          <Polyline
            key={`route-${truck.id}`}
            positions={truck.route.map(point => [point.lat, point.lon])}
            pathOptions={{
              color: '#00ff00',
              weight: 3,
              opacity: 0.7,
              dashArray: '5, 10'
            }}
          />
        ))}

      {/* Trucks */}
      {trucks
  .filter(truck => truck.lat != null && truck.lon != null)
  .map(truck => (
    <Marker
      key={truck.id}
      position={[truck.lat, truck.lon]}
      icon={createTruckIcon(truck.status)}
      eventHandlers={{
        click: () => onTruckSelect && onTruckSelect(truck)
      }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <strong>{truck.name}</strong><br />
          Status: {truck.status}<br />
          Crew: {truck.crew} members<br />
          {truck.targetSite && (
            <>
              Target: {truck.targetSite.name}<br />
              ETA: {formatETA(truck.eta)}<br />
            </>
          )}
          Fuel: {truck.fuel}%<br />
          <small>Last update: {truck.lastUpdate?.toLocaleTimeString()}</small>
        </div>
      </Popup>
    </Marker>
))}

    </MapContainer>
  );
}

export default MapView;

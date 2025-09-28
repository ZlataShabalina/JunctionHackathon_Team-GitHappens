import React from 'react';

const TruckDetailsPanel = ({ truck, onClose }) => {
  const formatETA = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    const colors = {
      moving: 'status-moving',
      parked: 'status-parked',
      maintenance: 'status-maintenance',
      returning: 'status-returning'
    };
    return colors[status] || 'status-default';
  };

  const getFuelColor = (fuel) => {
    if (fuel < 25) return 'fuel-critical';
    if (fuel < 50) return 'fuel-warning';
    return 'fuel-good';
  };

  return (
    <div className="truck-details-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          🚛 {truck.name}
        </h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="panel-content">
        <div className="detail-item">
          <span>Status:</span>
          <span className={`status-badge ${getStatusColor(truck.status)}`}>
            {truck.status.toUpperCase()}
          </span>
        </div>
        
        <div className="detail-item">
          <span>Crew:</span>
          <span className="detail-value">
            👥 {truck.crew || 1}
          </span>
        </div>
        
        <div className="detail-item">
          <span>Speed:</span>
          <span className="detail-value">
            {truck.status === 'moving' ? `${Math.round(truck.speed || 0)} km/h` : '0 km/h'}
          </span>
        </div>
        
        <div className="detail-item">
          <span>Fuel:</span>
          <span className={`detail-value ${getFuelColor(truck.fuel || 100)}`}>
            {truck.fuel != null ? truck.fuel : 100}%
          </span>
        </div>
        
        {truck.targetSite && (
          <>
            <div className="detail-item">
              <span>Target:</span>
              <span className="detail-value target-site">{truck.targetSite.name}</span>
            </div>
            <div className="detail-item">
              <span>ETA:</span>
              <span className="detail-value">
                ⏱️ {formatETA(truck.eta)}
              </span>
            </div>
          </>
        )}
        
        <div className="last-update">
          Last Update: {truck.lastUpdate ? new Date(truck.lastUpdate).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default TruckDetailsPanel;

import React from 'react';

const StatusHUD = ({ isConnected, stats }) => {
  const safeStats = {
    active: stats.active || 0,
    parked: stats.parked || 0,
    maintenance: stats.maintenance || 0
  };

  return (
    <>
      {/* Header HUD */}
      <div className="status-hud">
        <div className="hud-title">GridRadar</div>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className={isConnected ? 'text-online' : 'text-offline'}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="stats-panel">
        <h3 className="stats-title">
          📊 Fleet Status
        </h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span>Active:</span>
            <span className="stat-value active">{safeStats.active}</span>
          </div>
          <div className="stat-item">
            <span>Parked:</span>
            <span className="stat-value parked">{safeStats.parked}</span>
          </div>
          <div className="stat-item">
            <span>On Site:</span>
            <span className="stat-value maintenance">{safeStats.maintenance}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusHUD;

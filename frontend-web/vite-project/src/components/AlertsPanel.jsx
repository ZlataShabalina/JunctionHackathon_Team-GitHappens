import React from 'react';

const AlertsPanel = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (type) => {
    const icons = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || '⚠️';
  };

  return  (
    <div className="alerts-panel">
      <h3 className="alerts-title">🚨 Active Alerts</h3>
      <div className="alerts-list">
        {alerts.slice(0, 3).map(alert => {
          const t = alert.timestamp ? new Date(alert.timestamp) : new Date();
          return (
            <div key={alert.id}
                 className={`alert-item ${alert.type}`}
                 onClick={() => onSelect && onSelect(alert)}
                 style={{ cursor: "pointer" }}>
              <span className="alert-icon">{alert.type === "critical" ? "🚨" : "⚠️"}</span>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">{t.toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;

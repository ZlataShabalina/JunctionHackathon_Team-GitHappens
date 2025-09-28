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

  return (
    <div className="alerts-panel">
      <h3 className="alerts-title">
        🚨 Active Alerts
      </h3>
      <div className="alerts-list">
        {alerts.slice(0, 3).map(alert => {
          // Ensure timestamp is a Date object
          const alertTime = alert.timestamp ? new Date(alert.timestamp) : new Date();
          return (
            <div key={alert.id} className={`alert-item ${alert.type}`}>
              <span className="alert-icon">{getAlertIcon(alert.type)}</span>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">
                  {alertTime.toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;

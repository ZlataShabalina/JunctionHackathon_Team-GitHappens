import React, { useState, useEffect } from "react";
import MapView from "./components/MapView";
import LoginForm from "./components/LoginForm";
import TimeTravelControls from "./components/TimeTravelControls";
import "./App.css";

function App() {
  const [timestamp, setTimestamp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimestamp((prev) => (prev < 9 ? prev + 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleLogin = (jwtToken) => {
    setToken(jwtToken);
    localStorage.setItem("token", null); // persist across refresh
  };

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="map-section">
        <MapView timestamp={timestamp} token={token} />
      </div>

      <TimeTravelControls
        timestamp={timestamp}
        onChange={setTimestamp}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        isPlaying={isPlaying}
      />
    </div>
  );
}

export default App;

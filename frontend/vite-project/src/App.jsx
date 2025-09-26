import React, { useState, useEffect } from "react";
import MapView from "./components/MapView";
import TimeTravelControls from "./components/TimeTravelControls";
import "./App.css";

function App() {
  const [timestamp, setTimestamp] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimestamp((prev) => (prev < 9 ? prev + 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="app">
      <div className="map-section">
        <MapView timestamp={timestamp} />
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
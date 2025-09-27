import React from "react";

const TimeTravelControls = ({ timestamp, onChange, onPlayPause, isPlaying }) => (
  <div className="time-controls">
    <button onClick={onPlayPause}>{isPlaying ? "⏸ Pause" : "▶️ Play"}</button>
    <input type="range" min="0" max="9" value={timestamp} onChange={(e) => onChange(Number(e.target.value))} />
    <span>{`Time: ${timestamp}`}</span>
  </div>
);

export default TimeTravelControls;
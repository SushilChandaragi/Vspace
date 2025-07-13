import React from 'react';
import './ResourcePopover.css';

const resources = [
  { type: 'school', label: 'School', icon: '🏫', min: 50, max: 3000, step: 50, color: 'deepskyblue' },
  { type: 'water', label: 'Water', icon: '💧', min: 50, max: 3000, step: 50, color: 'limegreen' },
  { type: 'hospital', label: 'Hospital', icon: '🏥', min: 100, max: 5000, step: 100, color: 'red' },
  { type: 'fireStation', label: 'Fire Station', icon: '🚒', min: 100, max: 3000, step: 100, color: 'orange' },
  { type: 'police', label: 'Police', icon: '🚔', min: 200, max: 5000, step: 100, color: 'blue' },
  { type: 'park', label: 'Park', icon: '🌳', min: 100, max: 2000, step: 50, color: 'forestgreen' },
  { type: 'mall', label: 'Mall', icon: '🏬', min: 100, max: 2000, step: 50, color: 'purple' },
  { type: 'busStop', label: 'Bus Stop', icon: '🚌', min: 50, max: 800, step: 25, color: 'yellow' },
  { type: 'restaurant', label: 'Restaurant', icon: '🍽️', min: 50, max: 800, step: 25, color: 'orange' },
  { type: 'gasStation', label: 'Gas Station', icon: '⛽', min: 50, max: 800, step: 25, color: 'gray' },
  { type: 'parking', label: 'Parking', icon: '🅿️', min: 50, max: 800, step: 25, color: 'gray' },
  { type: 'powerPlant', label: 'Power Plant', icon: '⚡', min: 500, max: 5000, step: 100, color: 'yellow' },
  { type: 'recycling', label: 'Recycling', icon: '♻️', min: 100, max: 1000, step: 50, color: 'green' },
  { type: 'tower', label: 'Tower', icon: '📡', min: 1000, max: 8000, step: 200, color: 'silver' },
];

export default function ResourcePopover({ onSelect, onClose, resourceRadii, setResourceRadii }) {
  return (
    <div className="resource-popover-overlay">
      <div className="resource-popover">
        <h3>Select Resource</h3>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="resource-list">
          {resources.map(r => (
            <div key={r.type} className="resource-item">
              <span className="resource-icon" style={{ color: r.color }}>{r.icon}</span>
              <span className="resource-label">{r.label}</span>
              <input
                type="number"
                min={r.min}
                max={r.max}
                step={r.step}
                value={resourceRadii[r.type] || r.min}
                onChange={e => setResourceRadii(rr => ({ ...rr, [r.type]: Number(e.target.value) }))}
                className="radius-input"
              />
              <span className="radius-unit">meters</span>
              <button className="select-btn" onClick={() => onSelect(r.type)}>
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

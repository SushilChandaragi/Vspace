import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function PlanLocationSelect() {
  const [mode, setMode] = useState(null);
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCurrentLocation = () => {
    navigate("/plan", { state: { useCurrentLocation: true } });
  };

  const handlePincodeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${pincode}+India&format=json`);
      const data = await response.json();
      if (data.length > 0) {
        const lat = data[0].lat;
        const lng = data[0].lon;
        navigate("/plan", { state: { coords: { lat: parseFloat(lat), lng: parseFloat(lng) }, pincode } });
      } else {
        setError("Location not found. Try a different pincode.");
      }
    } catch {
      setError("Error fetching location. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="plan-location-select-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Back button at the top */}
      <button
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "rgba(0,255,255,0.12)",
          border: "none",
          borderRadius: 8,
          color: "#0ff",
          fontWeight: 700,
          fontSize: 16,
          padding: "8px 22px",
          cursor: "pointer",
          boxShadow: "0 0 8px #0ff4",
          zIndex: 100,
        }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h2 style={{ color: "#0cc", fontWeight: 800, fontSize: 28, marginBottom: 18, letterSpacing: 1 }}>Select Plan Location</h2>
      {!mode && (
        <div style={{ display: "flex", gap: 24 }}>
          <button className="primary" onClick={handleCurrentLocation}>
            Use My Current Location
          </button>
          <button className="secondary" onClick={() => setMode("pincode")}>
            Enter Pincode
          </button>
        </div>
      )}
      {mode === "pincode" && (
        <form onSubmit={handlePincodeSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, minWidth: 300 }}>
          <input
            placeholder="Pincode"
            value={pincode}
            required
            onChange={e => setPincode(e.target.value)}
          />
          {error && <div style={{ color: "red" }}>{error}</div>}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="primary" disabled={loading}>{loading ? "Locating..." : "Continue"}</button>
            <button type="button" className="secondary" onClick={() => setMode(null)}>Back</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default PlanLocationSelect;
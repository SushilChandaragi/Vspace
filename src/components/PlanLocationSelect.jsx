import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PlanLocationSelect() {
  const [mode, setMode] = useState(null);
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const page = document.querySelector(".plan-location-select-page");
    const card = document.querySelector(".animated-card");

    // Animate the whole page on mount
    page?.animate(
      [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 800, easing: "ease-out", fill: "forwards" }
    );

    // Pulse animation for card
    card?.animate(
      [
        { boxShadow: "0 0 20px #00ffff40" },
        { boxShadow: "0 0 25px #00ffff80" },
        { boxShadow: "0 0 20px #00ffff40" },
      ],
      {
        duration: 3000,
        iterations: Infinity,
      }
    );
  }, []);

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
        navigate("/plan", {
          state: {
            coords: { lat: parseFloat(lat), lng: parseFloat(lng) },
            pincode,
          },
        });
      } else {
        setError("Location not found. Try a different pincode.");
      }
    } catch {
      setError("Error fetching location. Try again.");
    }
    setLoading(false);
  };

  return (
    <div
      className="plan-location-select-page"
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        color: "#00ffff",
        fontFamily: "'Orbitron', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Google Font Import */}
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap');

        .hover-glow:hover {
          box-shadow: 0 0 12px #00ffffaa, 0 0 24px #00ffff55;
          transform: scale(1.03);
          transition: all 0.3s ease;
        }
      `}
      </style>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="hover-glow"
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          background: "#0d1117",
          color: "#00ffff",
          border: "1px solid #00ffff",
          borderRadius: "6px",
          padding: "8px 20px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 0 10px #00ffff60",
        }}
      >
        ← Back
      </button>

      <div
        className="animated-card"
        style={{
          background: "#111822",
          padding: "2rem",
          borderRadius: "16px",
          boxShadow: "0 0 20px #00ffff40",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ marginBottom: "1.5rem", color: "#00ffff" }}>Select Plan Location</h2>

        {!mode && (
          <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
            <button
              onClick={handleCurrentLocation}
              className="hover-glow"
              style={{
                backgroundColor: "#00ffff",
                color: "#0d1117",
                border: "none",
                padding: "12px",
                fontWeight: "bold",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Use My Current Location
            </button>

            <button
              onClick={() => setMode("pincode")}
              className="hover-glow"
              style={{
                backgroundColor: "transparent",
                color: "#00ffff",
                border: "1px solid #00ffff",
                padding: "12px",
                fontWeight: "bold",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Enter Pincode
            </button>
          </div>
        )}

        {mode === "pincode" && (
          <form
            onSubmit={handlePincodeSubmit}
            style={{
              marginTop: 24,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <input
              placeholder="Enter Pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #00ffff",
                outline: "none",
                backgroundColor: "#0a0f1a",
                color: "#00ffff",
              }}
            />
            {error && <div style={{ color: "#ff4c4c" }}>{error}</div>}

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="submit"
                disabled={loading}
                className="hover-glow"
                style={{
                  backgroundColor: "#00ffff",
                  color: "#0d1117",
                  padding: "10px 18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Locating..." : "Continue"}
              </button>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="hover-glow"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #00ffff",
                  color: "#00ffff",
                  padding: "10px 18px",
                  fontWeight: "bold",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PlanLocationSelect;
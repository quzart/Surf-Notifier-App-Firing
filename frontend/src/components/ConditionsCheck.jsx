import { useState } from "react";
import { checkSpot } from "../api";

function ConditionsCheck({ spotId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    try {
      const data = await checkSpot(spotId);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="icon-button" onClick={handleCheck} disabled={loading}>
        {loading ? "Checking..." : "Check Now"}
      </button>
      {error && <p className="error-text">{error}</p>}
      {result && (
        <div className="conditions-grid" style={{ marginTop: "0.75rem" }}>
          <div className="condition-row">
            <span className="condition-label">Wave height</span>
            <span>
              {result.conditions.wave_height_description.feet} ft —{" "}
              {result.conditions.wave_height_description.label}
            </span>
          </div>
          <div className="condition-row">
            <span className="condition-label">Wave period</span>
            <span>{result.conditions.wave_period}s</span>
          </div>
          <div className="condition-row">
            <span className="condition-label">Wind</span>
            <span>
              {result.conditions.wind_speed} kn @ {result.conditions.wind_direction}° —{" "}
              {result.conditions.wind_description}
            </span>
          </div>
          <div className="condition-row">
            <span className="condition-label">Tide</span>
            <span>
              {result.conditions.tide_stage} ({result.tide_source})
            </span>
          </div>

          {result.results.length === 0 ? (
            <p className="empty-state">No preference set for this spot yet.</p>
          ) : (
            result.results.map((r) => (
              <div className="condition-row" key={r.preference_id}>
                <span className="condition-label">Match?</span>
                <span className={`badge ${r.match ? "badge-match" : "badge-nomatch"}`}>
                  {r.match ? "Match" : "No match"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ConditionsCheck;
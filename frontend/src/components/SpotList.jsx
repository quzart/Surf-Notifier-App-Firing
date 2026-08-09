import { useState } from "react";
import { deleteSpot, deletePreference } from "../api";
import PreferenceForm from "./PreferenceForm";
import ConditionsCheck from "./ConditionsCheck";

function SpotList({ spots, onSpotsChanged }) {
  const [expandedId, setExpandedId] = useState(null);

  function toggleExpand(spotId) {
    setExpandedId(expandedId === spotId ? null : spotId);
  }

  async function handleDelete(spotId) {
    await deleteSpot(spotId);
    onSpotsChanged();
  }

  async function handleClearPreference(spotId, preferenceId) {
    await deletePreference(spotId, preferenceId);
    onSpotsChanged();
  }

  if (spots.length === 0) return <p className="empty-state">No spots added yet.</p>;

  return (
    <div>
      {spots.map((spot) => (
        <div className="spot-card" key={spot.id}>
          <div className="spot-card-header" onClick={() => toggleExpand(spot.id)}>
            <div>
              <div className="spot-name">{spot.name}</div>
              <div className="spot-coords">
                {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
              </div>
            </div>
            <span className="hint">{expandedId === spot.id ? "▲" : "▼"}</span>
          </div>

          {expandedId === spot.id && (
            <div className="spot-card-body">
              <button className="icon-button" onClick={() => handleDelete(spot.id)}>
                Delete Spot
              </button>

              {spot.preferences.length > 0 ? (
                <div className="pref-summary">
                  <span>
                    Period: {spot.preferences[0].period_min ?? "-"}–
                    {spot.preferences[0].period_max ?? "-"}s | Wind max:{" "}
                    {spot.preferences[0].wind_speed_max ?? "-"} | Tide:{" "}
                    {spot.preferences[0].tide_stage ?? "any"}
                  </span>
                  <button
                    className="icon-button"
                    onClick={() =>
                      handleClearPreference(spot.id, spot.preferences[0].id)
                    }
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="empty-state">No preference set for this spot yet.</p>
              )}

              <PreferenceForm
                spotId={spot.id}
                facingDirection={spot.facing_direction}
                onPreferenceCreated={onSpotsChanged}
              />

              <ConditionsCheck spotId={spot.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SpotList;
import { useState } from "react";
import { createPreference } from "../api";

const PERIOD_OPTIONS = [
  { label: "Any period", period_min: null },
  { label: "Decent quality (8s+)", period_min: 8 },
  { label: "Groundswell (12s+)", period_min: 12 },
];

const WIND_SPEED_OPTIONS = [
  { label: "Any wind", wind_speed_max: null },
  { label: "Calm (<8 kn)", wind_speed_max: 8 },
  { label: "Light (<13 kn)", wind_speed_max: 13 },
  { label: "Moderate (<18 kn)", wind_speed_max: 18 },
];

const TIDE_OPTIONS = [
  { label: "Any tide", value: "" },
  { label: "Low", value: "low" },
  { label: "Rising", value: "rising" },
  { label: "High", value: "high" },
  { label: "Falling", value: "falling" },
];

function normalizeDegrees(deg) {
  return ((deg % 360) + 360) % 360;
}

function getWindDirectionOptions(facingDirection) {
  if (facingDirection === null || facingDirection === undefined) {
    return [{ label: "Any wind direction", wind_direction_min: null, wind_direction_max: null }];
  }

  const offshoreCenter = normalizeDegrees(facingDirection + 180);

  return [
    { label: "Any wind direction", wind_direction_min: null, wind_direction_max: null },
    {
      label: "Offshore only",
      wind_direction_min: normalizeDegrees(offshoreCenter - 45),
      wind_direction_max: normalizeDegrees(offshoreCenter + 45),
    },
    {
      label: "Offshore to cross-shore",
      wind_direction_min: normalizeDegrees(offshoreCenter - 135),
      wind_direction_max: normalizeDegrees(offshoreCenter + 135),
    },
  ];
}

function PreferenceForm({ spotId, facingDirection, onPreferenceCreated }) {
  const [periodMin, setPeriodMin] = useState(null);
  const [windSpeedMax, setWindSpeedMax] = useState(null);
  const [windDirectionChoice, setWindDirectionChoice] = useState(0);
  const [tideStage, setTideStage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [periodMax, setPeriodMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const windDirectionOptions = getWindDirectionOptions(facingDirection);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const chosen = windDirectionOptions[windDirectionChoice];

    try {
      await createPreference(spotId, {
        period_min: periodMin,
        period_max: periodMax === "" ? null : parseFloat(periodMax),
        wind_speed_max: windSpeedMax,
        wind_direction_min: chosen.wind_direction_min,
        wind_direction_max: chosen.wind_direction_max,
        tide_stage: tideStage === "" ? null : tideStage,
      });
      setPeriodMin(null);
      setWindSpeedMax(null);
      setWindDirectionChoice(0);
      setTideStage("");
      setPeriodMax("");
      onPreferenceCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-heading">Set Preference</div>

      <div className="field">
        <label>Wave quality</label>
        <div className="chip-row">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.label}
              className={`chip ${periodMin === opt.period_min ? "selected" : ""}`}
              onClick={() => setPeriodMin(opt.period_min)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Wind strength</label>
        <div className="chip-row">
          {WIND_SPEED_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.label}
              className={`chip ${windSpeedMax === opt.wind_speed_max ? "selected" : ""}`}
              onClick={() => setWindSpeedMax(opt.wind_speed_max)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Wind direction</label>
        <div className="chip-row">
          {windDirectionOptions.map((opt, index) => (
            <button
              type="button"
              key={opt.label}
              className={`chip ${windDirectionChoice === index ? "selected" : ""}`}
              onClick={() => setWindDirectionChoice(index)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {(facingDirection === null || facingDirection === undefined) && (
          <p className="hint">
            This spot has no facing direction set, so offshore options aren't available.
          </p>
        )}
      </div>

      <div className="field">
        <label>Tide</label>
        <select value={tideStage} onChange={(e) => setTideStage(e.target.value)}>
          {TIDE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="text-button"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "Hide" : "Show"} advanced settings
      </button>
      {showAdvanced && (
        <div className="field" style={{ marginTop: "0.5rem" }}>
          <label>Max wave period (blank = no upper limit)</label>
          <input
            type="number"
            step="any"
            value={periodMax}
            onChange={(e) => setPeriodMax(e.target.value)}
          />
        </div>
      )}

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save Preference"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

export default PreferenceForm;
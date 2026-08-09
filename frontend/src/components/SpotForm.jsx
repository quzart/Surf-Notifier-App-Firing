import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { createSpot, searchPlaces } from "../api";

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function LocationPicker({ mode, onPickLocation, onPickFacing }) {
  useMapEvents({
    click(e) {
      if (mode === "location") {
        onPickLocation(e.latlng.lat, e.latlng.lng);
      } else if (mode === "facing") {
        onPickFacing(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function SpotForm({ onSpotCreated }) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [position, setPosition] = useState(null);
  const [facingPoint, setFacingPoint] = useState(null);
  const [facingDirection, setFacingDirection] = useState(null);
  const [pickMode, setPickMode] = useState("location");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function handleSelectSuggestion(place) {
    setPosition({ lat: place.latitude, lon: place.longitude });
    setQuery(place.name);
    setSuggestions([]);
    setPickMode("facing");
  }

  function handlePickLocation(lat, lon) {
    setPosition({ lat, lon });
    setFacingPoint(null);
    setFacingDirection(null);
  }

  function handlePickFacing(lat, lon) {
    if (!position) return;
    setFacingPoint({ lat, lon });
    const bearing = calculateBearing(position.lat, position.lon, lat, lon);
    setFacingDirection(bearing);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!position) {
      setError("Search for a place or click the map to set a location first.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createSpot({
        name: name || query,
        latitude: position.lat,
        longitude: position.lon,
        facing_direction: facingDirection,
      });
      setName("");
      setQuery("");
      setPosition(null);
      setFacingPoint(null);
      setFacingDirection(null);
      setPickMode("location");
      onSpotCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const mapCenter = position ? [position.lat, position.lon] : [33.0, -117.3];

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: "1rem" }}>Add a Spot</h2>

      <div className="field">
        <label>Spot name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My Secret Spot"
        />
      </div>

      <div className="field" style={{ position: "relative" }}>
        <label>Search for a nearby place</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a beach, town, or landmark..."
        />
        {suggestions.length > 0 && (
          <ul className="search-results">
            {suggestions.map((place) => (
              <li
                key={`${place.latitude}-${place.longitude}`}
                onClick={() => handleSelectSuggestion(place)}
              >
                {place.name}
                {place.admin1 ? `, ${place.admin1}` : ""}
                {place.country ? `, ${place.country}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field">
        {!position && <p className="hint">Click the map to set your spot's location.</p>}
        {position && (
          <>
            <p className="hint">
              {pickMode === "facing"
                ? "Now click out toward the ocean to set which way the break faces."
                : "Location set. Click the map again to move it, or switch to set facing direction."}
            </p>
            <div className="chip-row" style={{ marginBottom: "0.5rem" }}>
              <button
                type="button"
                className={`chip ${pickMode === "location" ? "selected" : ""}`}
                onClick={() => setPickMode("location")}
              >
                Set location
              </button>
              <button
                type="button"
                className={`chip ${pickMode === "facing" ? "selected" : ""}`}
                onClick={() => setPickMode("facing")}
              >
                Point toward the ocean
              </button>
            </div>
          </>
        )}

        <div className="map-wrap">
          <MapContainer
            center={mapCenter}
            zoom={position ? 14 : 8}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <LocationPicker
              mode={pickMode}
              onPickLocation={handlePickLocation}
              onPickFacing={handlePickFacing}
            />
            {position && (
              <Marker position={[position.lat, position.lon]} icon={defaultIcon} />
            )}
            {position && facingPoint && (
              <Polyline
                positions={[
                  [position.lat, position.lon],
                  [facingPoint.lat, facingPoint.lon],
                ]}
                color="#1f7a6c"
              />
            )}
          </MapContainer>
        </div>

        {facingDirection !== null && (
          <p className="hint">Facing direction: {Math.round(facingDirection)}°</p>
        )}
      </div>

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add Spot"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

export default SpotForm;
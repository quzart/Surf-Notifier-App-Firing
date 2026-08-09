const BASE_URL = "http://127.0.0.1:8000";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export async function getSpots() {
  const response = await fetch(`${BASE_URL}/spots/`);
  if (!response.ok) throw new Error("Failed to fetch spots");
  return response.json();
}

export async function getSpot(spotId) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}`);
  if (!response.ok) throw new Error("Failed to fetch spot");
  return response.json();
}

export async function createSpot(spot) {
  const response = await fetch(`${BASE_URL}/spots/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(spot),
  });
  if (!response.ok) throw new Error("Failed to create spot");
  return response.json();
}

export async function deleteSpot(spotId) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete spot");
  return response.json();
}

export async function createPreference(spotId, preference) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}/preferences/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preference),
  });
  if (!response.ok) throw new Error("Failed to create preference");
  return response.json();
}

export async function deletePreference(spotId, preferenceId) {
  const response = await fetch(
    `${BASE_URL}/spots/${spotId}/preferences/${preferenceId}`,
    { method: "DELETE" }
  );
  if (!response.ok) throw new Error("Failed to delete preference");
  return response.json();
}

export async function checkSpot(spotId) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}/check`);
  if (!response.ok) throw new Error("Failed to check spot");
  return response.json();
}

export async function searchPlaces(query) {
  if (!query || query.length < 2) return [];
  const response = await fetch(
    `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=5`
  );
  if (!response.ok) throw new Error("Failed to search places");
  const data = await response.json();
  return data.results || [];
}
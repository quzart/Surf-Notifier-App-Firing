const BASE_URL = "http://127.0.0.1:8000";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(email, password) {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Registration failed");
  }
  return response.json();
}

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Login failed");
  }
  const data = await response.json();
  localStorage.setItem("token", data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

export function isLoggedIn() {
  return !!getToken();
}

export async function getSpots() {
  const response = await fetch(`${BASE_URL}/spots/`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Failed to fetch spots");
  return response.json();
}

export async function getSpot(spotId) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Failed to fetch spot");
  return response.json();
}

export async function createSpot(spot) {
  const response = await fetch(`${BASE_URL}/spots/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(spot),
  });
  if (!response.ok) throw new Error("Failed to create spot");
  return response.json();
}

export async function deleteSpot(spotId) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete spot");
  return response.json();
}

export async function createPreference(spotId, preference) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}/preferences/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(preference),
  });
  if (!response.ok) throw new Error("Failed to create preference");
  return response.json();
}

export async function deletePreference(spotId, preferenceId) {
  const response = await fetch(
    `${BASE_URL}/spots/${spotId}/preferences/${preferenceId}`,
    { method: "DELETE", headers: authHeaders() }
  );
  if (!response.ok) throw new Error("Failed to delete preference");
  return response.json();
}

export async function checkSpot(spotId) {
  const response = await fetch(`${BASE_URL}/spots/${spotId}/check`, {
    headers: authHeaders(),
  });
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
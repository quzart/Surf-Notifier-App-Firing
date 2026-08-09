import { useState, useEffect } from "react";
import { getSpots } from "./api";
import SpotForm from "./components/SpotForm";
import SpotList from "./components/SpotList";
import "./index.css";
import "./App.css";

function WaveDivider() {
  return (
    <svg
      className="wave-divider"
      viewBox="0 0 400 16"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 8 C 25 0, 50 16, 75 8 S 125 0, 150 8 S 200 16, 225 8 S 275 0, 300 8 S 350 16, 375 8 S 400 8, 400 8"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
    </svg>
  );
}

function App() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadSpots();
  }, []);

  async function loadSpots() {
    try {
      setLoading(true);
      const data = await getSpots();
      setSpots(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSpotCreated() {
    setShowAddForm(false);
    loadSpots();
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Surf Notifier</h1>
        <p>Your spots, your conditions, checked on demand.</p>
      </header>

      <WaveDivider />

      <button
        className="toggle-add-button"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        {showAddForm ? "Cancel" : "+ Add a spot"}
      </button>

      {showAddForm && <SpotForm onSpotCreated={handleSpotCreated} />}

      <div className="section-heading">Your Spots</div>
      {loading && <p className="empty-state">Loading spots...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && <SpotList spots={spots} onSpotsChanged={loadSpots} />}
    </div>
  );
}

export default App;
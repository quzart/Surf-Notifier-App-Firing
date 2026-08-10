import { useState, useEffect } from "react";
import { subscribeToPush, unsubscribeFromPush, getPushSubscriptionStatus, isPushSupported } from "../push";

function PushSettings() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supported = isPushSupported();

  useEffect(() => {
    if (supported) {
      getPushSubscriptionStatus().then(setEnabled);
    }
  }, [supported]);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (enabled) {
        await unsubscribeFromPush(token);
        setEnabled(false);
      } else {
        await subscribeToPush(token);
        setEnabled(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <p className="hint">
        Push notifications aren't supported in this browser. On iPhone, add this site to
        your home screen first (Share → Add to Home Screen), then open it from there.
      </p>
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{enabled ? "Notifications enabled" : "Notifications disabled"}</span>
        <button className="icon-button" onClick={handleToggle} disabled={loading}>
          {loading ? "..." : enabled ? "Disable" : "Enable Notifications"}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default PushSettings;
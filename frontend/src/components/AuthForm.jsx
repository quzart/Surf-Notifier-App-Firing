import { useState } from "react";
import { register, login } from "../api";

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "register") {
        await register(email, password);
        await login(email, password);
      } else {
        await login(email, password);
      }
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: "1rem" }}>
        {mode === "login" ? "Log In" : "Create Account"}
      </h2>

      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
      </button>
      {error && <p className="error-text">{error}</p>}

      <p className="hint" style={{ marginTop: "1rem" }}>
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          style={{ display: "inline" }}
        >
          {mode === "login" ? "Create one" : "Log in"}
        </button>
      </p>
    </form>
  );
}

export default AuthForm;
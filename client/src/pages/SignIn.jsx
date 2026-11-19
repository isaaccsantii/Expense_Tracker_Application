import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client.js";

export default function SignIn({ onSignIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const notice = useLocation().state?.notice;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/signin", { username: username.trim(), password });
      onSignIn(res.data.user);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-sm-10 col-md-7 col-lg-5">
        <div className="card auth-card shadow-sm">
          <div className="card-body p-4">
            <h1 className="h4 mb-1">Welcome back</h1>
            <p className="text-muted small mb-4">Sign in to see where your money went this month.</p>
            {notice && <div className="alert alert-success py-2">{notice}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input id="username" className="form-control" autoComplete="username" required autoFocus
                       value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input id="password" type="password" className="form-control" autoComplete="current-password" required
                       value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="btn btn-brand w-100" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
            </form>
            <p className="small text-center mt-3 mb-0">No account yet? <Link to="/signup">Create one</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api/client.js";

export default function SignUp() {
  const [form, setForm] = useState({ full_name: "", username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/signup", { full_name: form.full_name, username: form.username.trim(), password: form.password });
      navigate("/signin", { state: { notice: "Account created! Sign in to start tracking." } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-sm-10 col-md-7 col-lg-5">
        <div className="card auth-card shadow-sm">
          <div className="card-body p-4">
            <h1 className="h4 mb-1">Create your account</h1>
            <p className="text-muted small mb-4">Start logging expenses in under a minute.</p>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="full_name" className="form-label">Full name</label>
                <input id="full_name" name="full_name" className="form-control" required autoComplete="name"
                       value={form.full_name} onChange={update} />
              </div>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input id="username" name="username" className="form-control" required pattern="[A-Za-z0-9_.\-]{3,30}"
                       autoComplete="username" value={form.username} onChange={update} />
                <div className="form-text">3–30 letters, numbers, _ . -</div>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input id="password" name="password" type="password" className="form-control" required minLength={8}
                         autoComplete="new-password" value={form.password} onChange={update} />
                </div>
                <div className="col-sm-6">
                  <label htmlFor="confirm" className="form-label">Confirm password</label>
                  <input id="confirm" name="confirm" type="password" className="form-control" required minLength={8}
                         autoComplete="new-password" value={form.confirm} onChange={update} />
                </div>
                <div className="form-text mt-1">At least 8 characters.</div>
              </div>
              <button className="btn btn-brand w-100" disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
            </form>
            <p className="small text-center mt-3 mb-0">Already have an account? <Link to="/signin">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

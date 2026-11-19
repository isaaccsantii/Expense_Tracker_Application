import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import api from "./api/client.js";
import NavBar from "./components/NavBar.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  // Restore an existing session after a page refresh
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  async function signOut() {
    await api.post("/auth/signout").catch(() => {});
    setUser(null);
    navigate("/signin");
  }

  if (checking) return <div className="text-center py-5 text-muted">Loading…</div>;

  return (
    <>
      <NavBar user={user} onSignOut={signOut} />
      <main className="container py-4">
        <Routes>
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/signin" replace />} />
          <Route path="/signin" element={user ? <Navigate to="/" /> : <SignIn onSignIn={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer text-center py-3 small">
        Pocket Ledger · CS 312 Group Project · Isaac Santiago
      </footer>
    </>
  );
}

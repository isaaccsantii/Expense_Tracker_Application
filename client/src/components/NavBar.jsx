import { Link, NavLink } from "react-router-dom";

export default function NavBar({ user, onSignOut }) {
  return (
    <nav className="navbar site-nav">
      <div className="container flex-wrap gap-2">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span className="brand-mark" aria-hidden="true">$</span> Pocket Ledger
        </Link>
        {user ? (
          <div className="d-flex align-items-center gap-2">
            <span className="small text-white-50 d-none d-sm-inline">
              Hi, <strong className="text-white">{user.full_name.split(" ")[0]}</strong>
            </span>
            <button className="btn btn-sm btn-light" onClick={onSignOut}>Sign out</button>
          </div>
        ) : (
          <div className="d-flex gap-2">
            <NavLink to="/signin" className="btn btn-sm btn-outline-light">Sign in</NavLink>
            <NavLink to="/signup" className="btn btn-sm btn-light">Sign up</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

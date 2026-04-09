import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ReceiptText,
  LogOut,
  Wallet,
  UserCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/axios";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/getme");
        if (res.data.success) {
          setProfile(res.data.data);
        }
        localStorage.setItem("user", JSON.stringify(res.data.data));
      } catch (e) {
        console.error("Failed to fetch profile", e);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (e) {
      console.log(e);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Wallet className="sidebar-logo-icon" size={32} />
          Budget Tracker
        </div>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link
            to="/transactions"
            className={`nav-link ${location.pathname.includes("/transactions") ? "active" : ""}`}
          >
            <ReceiptText size={20} />
            Transactions
          </Link>
        </nav>

        <div
          className="sidebar-bottom"
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {profile && (
            <div className="profile-hover-container">
              <div className="profile-icon-wrapper">
                <UserCircle size={28} className="text-main" />
                <span className="profile-username">
                  {profile.name.split(" ")[0]}
                </span>
              </div>
              <div className="profile-tooltip">
                <p className="profile-name">{profile.name}</p>
                <p className="profile-email">{profile.email}</p>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, TestTube, History, BarChart3, Home, LogOut, Mail, ChevronDown } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import APISelector from "../common/APISelector";
import "./Layout.css";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/tester", label: "API Tester", icon: TestTube },
    { path: "/history", label: "History", icon: History },
    { path: "/analytics", label: "Analytics", icon: BarChart3 }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Activity size={32} className="logo-icon" />
          <h1 className="logo-text">Dynamic API</h1>
        </div>

        <div className="api-selector-wrapper">
          <APISelector />
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {user && (
          <div className="user-profile-section">
            <button
              className="user-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <p className="user-email">{user.email}</p>
                <span className="user-status">Signed In</span>
              </div>
              <ChevronDown size={16} className={`chevron ${showUserMenu ? "open" : ""}`} />
            </button>

            {/* User Menu */}
            {showUserMenu && (
              <div className="user-menu">
                <button className="user-menu-item logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="sidebar-footer">
          <p className="footer-text">v1.0.0</p>
          <p className="footer-text">Multi-Platform API</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

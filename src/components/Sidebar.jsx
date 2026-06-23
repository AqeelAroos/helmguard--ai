import { NavLink } from "react-router-dom";
import { NAV } from "../data/mockData";

export default function Sidebar({ isRecording, user, onLogout }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🛡️</div>
        <div className="logo-text">Helm<span>Guard</span></div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {NAV.filter(n => !n.adminOnly || user.role === "admin").map(n => (
          <NavLink 
            key={n.id} 
            to={n.path} 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <div className="nav-dot" />
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
        <div className="nav-label" style={{ marginTop: 16 }}>Status</div>
        <div style={{ 
          padding: "10px 14px", fontSize: 12, fontWeight: 500,
          color: isRecording ? "var(--hg-primary)" : "var(--hg-muted)",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{ 
            width: 8, height: 8, borderRadius: "50%", 
            background: isRecording ? "var(--hg-primary)" : "var(--hg-subtle)",
            boxShadow: isRecording ? "0 0 8px rgba(0,212,170,0.5)" : "none",
            display: "inline-block"
          }} />
          {isRecording ? "Recording session" : "No active session"}
        </div>
      </div>
      <div className="sidebar-footer">
        <div className="user-pill" onClick={onLogout} title="Click to Logout">
          <div className="avatar">{user.name.substring(0, 2).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-sub" style={{ textTransform: "capitalize" }}>{user.role} Plan · Sign out ↗</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

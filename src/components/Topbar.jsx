import { useLocation } from "react-router-dom";

const titles = { 
  "/": "HelmGuard AI", 
  "/login": "Access Portal",
  "/dashboard": "Dashboard", 
  "/tracking": "Helmet Tracking", 
  "/scan": "AI Scalp Scan", 
  "/journal": "Health Journal",
  "/market": "Marketplace",
  "/community": "Community",
  "/profile": "Profile",
  "/admin": "Admin Console"
};

export default function Topbar({ isRecording, user }) {
  const location = useLocation();
  const title = titles[location.pathname] || "HelmGuard AI";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div>
          <div className="topbar-title">{title}</div>
          {user && user.name !== "Guest" && (
            <div className="topbar-greeting">{getGreeting()}, {user.name}</div>
          )}
        </div>
      </div>
      <div className="topbar-actions">
        {isRecording && (
          <span className="badge" style={{ 
            animation: "glow-pulse 2s infinite",
            boxShadow: "0 0 12px rgba(0,212,170,0.25)"
          }}>
            <span style={{ 
              display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: "var(--hg-primary)", marginRight: 6,
              boxShadow: "0 0 6px rgba(0,212,170,0.6)"
            }} />
            Live Session
          </span>
        )}
        <span className="badge warn">Risk: Medium</span>
        <span className="badge blue">Day 14</span>
      </div>
    </div>
  );
}

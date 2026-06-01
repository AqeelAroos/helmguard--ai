import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, NavLink } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./styles/App.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Tracking from "./pages/Tracking";
import AIScan from "./pages/AIScan";
import Journal from "./pages/Journal";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Marketplace from "./pages/Marketplace";
import Community from "./pages/Community";
import Pricing from "./pages/Pricing";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NAV } from "./data/mockData";
import { requestNotificationPermission, initDefaultReminders, startReminderChecker } from "./services/notifications";

function AppContent() {
  const [user, setUser] = useState({ name: "Guest", role: "user", loading: true });
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData?.username || firebaseUser.email.split("@")[0],
          role: userData?.role || "user",
          loading: false,
        });

        // Initialize notifications when user logs in
        const granted = await requestNotificationPermission();
        if (granted) {
          initDefaultReminders();
          startReminderChecker();
        }
      } else {
        setUser({ name: "Guest", role: "user", loading: false });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => setUser({ ...userData, loading: false });
  const handleLogout = async () => { await auth.signOut(); navigate("/"); };

  const isAuthPage = location.pathname === "/" || location.pathname === "/login";
  const sharedProps = { isRecording, setIsRecording, elapsed, setElapsed, user };

  if (user.loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--hg-bg)", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800 }}>
          <span style={{ background: "var(--hg-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HelmGuard</span>
        </div>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: "var(--hg-gradient)", animation: "loading 1.5s infinite" }} />
      </div>
    );
  }

  return (
    <div className="app">
      <Toaster position="top-right" toastOptions={{
        style: { background: "var(--hg-card-solid)", color: "var(--hg-text)", border: "1px solid var(--hg-border)", fontSize: 13, backdropFilter: "blur(12px)" },
        success: { iconTheme: { primary: "#00d4aa", secondary: "#0a0f1a" } },
      }} />

      {!isAuthPage && <Sidebar isRecording={isRecording} user={user} onLogout={handleLogout} />}

      <div className={isAuthPage ? "main-full" : "main"}>
        {!isAuthPage && <Topbar isRecording={isRecording} user={user} />}

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/dashboard" element={<Dashboard {...sharedProps} />} />
          <Route path="/tracking" element={<Tracking {...sharedProps} />} />
          <Route path="/scan" element={<AIScan user={user} />} />
          <Route path="/journal" element={<Journal user={user} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile user={user} />} />
          <Route path="/market" element={<Marketplace />} />
          <Route path="/community" element={<Community />} />
          <Route path="/pricing" element={<Pricing user={user} />} />
        </Routes>

        {!isAuthPage && (
          <div className="mobile-nav">
            {NAV.filter(n => !n.adminOnly || user.role === "admin").slice(0, 5).map(n => (
              <NavLink key={n.id} to={n.path} className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
                <span className="mobile-nav-icon">{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <Router><AppContent /></Router>;
}

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, signupUser } from "../firebase/auth";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignup, setIsSignup] = useState(location.state?.mode === "signup");

  useEffect(() => {
    if (location.state?.mode === "signup") {
      setIsSignup(true);
    } else if (location.state?.mode === "login") {
      setIsSignup(false);
    }
  }, [location.state]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let userData;
      if (isSignup) {
        userData = await signupUser(email, password, username);
      } else {
        userData = await loginUser(email, password);
      }
      
      onLogin(userData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated gradient orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />
      <div className="login-overlay" />
      
      <div className="login-card fade-up">
        <div className="login-logo">
          <div className="logo-icon" style={{ width: 46, height: 46, fontSize: 22 }}>🛡️</div>
          <div className="logo-text" style={{ fontSize: 24 }}>Helm<span>Guard</span></div>
        </div>

        <h2 style={{ 
          textAlign: "center", marginBottom: 8, fontFamily: "var(--font-display)", 
          fontWeight: 800, fontSize: 24
        }}>
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p style={{ textAlign: "center", color: "var(--hg-muted)", fontSize: 13.5, marginBottom: 28 }}>
          {isSignup ? "Join the rider community today" : "Login to manage your scalp health"}
        </p>

        {error && (
          <div style={{ 
            background: "var(--hg-red-dim)", color: "var(--hg-red)", 
            padding: "12px 16px", borderRadius: "12px", fontSize: "12.5px", 
            marginBottom: "22px", textAlign: "center", border: "1px solid rgba(239,68,68,0.15)",
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        {!isSignup && (
          <div className="login-tabs">
            <button 
              className={`login-tab ${!isAdmin ? "active" : ""}`} 
              onClick={() => setIsAdmin(false)}
            >
              User Access
            </button>
            <button 
              className={`login-tab ${isAdmin ? "active" : ""}`} 
              onClick={() => setIsAdmin(true)}
            >
              Admin Portal
            </button>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {isSignup && (
            <div className="login-input-group">
              <input 
                type="text" 
                className="login-input" 
                placeholder="Preferred Username" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          <div className="login-input-group">
            <input 
              type="email" 
              className="login-input" 
              placeholder={isSignup ? "Email Address" : (isAdmin ? "Admin Email" : "Email Address")} 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-input-group">
            <input 
              type="password" 
              className="login-input" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ 
                  width: 16, height: 16, border: "2px solid rgba(10,15,26,0.3)", 
                  borderTopColor: "#0a0f1a", borderRadius: "50%", 
                  display: "inline-block", animation: "spin 0.6s linear infinite" 
                }} />
                Processing...
              </span>
            ) : (
              isSignup ? "Create Account" : `Sign in as ${isAdmin ? "Administrator" : "User"}`
            )}
          </button>
        </form>

        <div className="login-footer">
          {isSignup ? (
            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(false); }}>Sign In</a></p>
          ) : (
            <>
              {!isAdmin && <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(true); }}>Create Account</a></p>}
              {isAdmin && <p>Admin credential issues? <a href="#">Contact Support</a></p>}
            </>
          )}
          <p style={{ marginTop: 14 }}>
            <a href="#" style={{ fontSize: 12, opacity: 0.6 }}>Forgot your password?</a>
          </p>
        </div>
      </div>
    </div>
  );
}

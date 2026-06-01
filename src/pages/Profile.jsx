import { useState, useEffect } from "react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useHelmetSessions } from "../hooks/useHelmetSessions";
import { useScalpScans } from "../hooks/useScalpScans";
import { useSubscription } from "../hooks/useSubscription";
import { recordHelmetClean } from "../services/firestoreService";
import { requestNotificationPermission, getNotificationStatus, getAllReminders, toggleReminder, sendNotification } from "../services/notifications";
import toast from "react-hot-toast";

function NotificationSettings() {
  const [status, setStatus] = useState(getNotificationStatus());
  const [reminders, setReminders] = useState({});

  useEffect(() => {
    setReminders(getAllReminders());
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setStatus(granted ? "granted" : "denied");
    if (granted) {
      sendNotification("HelmGuard AI", "Notifications enabled! You'll receive scalp health reminders.");
      toast.success("Notifications enabled!");
    } else {
      toast.error("Permission denied. Enable in browser settings.");
    }
  };

  const handleToggle = (id, enabled) => {
    toggleReminder(id, enabled);
    setReminders(getAllReminders());
  };

  const handleTest = () => {
    sendNotification("🪖 HelmGuard Test", "This is a test notification! Your reminders are working.");
    toast.success("Test notification sent!");
  };

  const LABELS = {
    helmet_clean: { icon: "🪣", name: "Helmet Cleaning", freq: "Every 7 days" },
    scalp_scan: { icon: "🧠", name: "Weekly Scan Reminder", freq: "Every 7 days" },
    journal_log: { icon: "📓", name: "Daily Journal Log", freq: "Every day" },
    hydration: { icon: "💧", name: "Scalp Hydration", freq: "Every 2 days" },
    break_reminder: { icon: "🌬️", name: "Ventilation Break", freq: "Every 3 hours" },
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-header">
        <span className="card-title">Push Notifications</span>
        <span className={`badge ${status === "granted" ? "teal" : status === "denied" ? "danger" : ""}`}>
          {status === "granted" ? "Enabled" : status === "denied" ? "Blocked" : "Not Set"}
        </span>
      </div>

      {status !== "granted" ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
          <p style={{ color: "var(--hg-muted)", fontSize: 13, marginBottom: 16, maxWidth: 340, margin: "0 auto 16px" }}>
            Enable notifications to get reminders for helmet cleaning, scalp scans, journal logs, and hydration.
          </p>
          <button className="btn btn-primary" onClick={handleEnable}>
            Enable Push Notifications
          </button>
          {status === "denied" && (
            <p style={{ fontSize: 11, color: "var(--hg-red)", marginTop: 8 }}>
              Notifications are blocked. Go to browser settings to enable them.
            </p>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(reminders).map(([id, r]) => {
              const label = LABELS[id] || { icon: "🔔", name: id, freq: `${r.intervalHours}h` };
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--hg-border)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>{label.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hg-text)" }}>{label.name}</div>
                      <div style={{ fontSize: 11, color: "var(--hg-muted)" }}>{label.freq}</div>
                    </div>
                  </div>
                  <div
                    onClick={() => handleToggle(id, !r.enabled)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                      background: r.enabled ? "rgba(0,212,170,0.25)" : "rgba(255,255,255,0.06)",
                      border: r.enabled ? "1px solid rgba(0,212,170,0.4)" : "1px solid var(--hg-border)",
                      position: "relative", transition: "all 0.2s",
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", position: "absolute", top: 2,
                      left: r.enabled ? 23 : 2, transition: "all 0.2s",
                      background: r.enabled ? "var(--hg-primary)" : "var(--hg-muted)",
                      boxShadow: r.enabled ? "0 0 6px var(--hg-primary)" : "none",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", marginTop: 14, fontSize: 12 }} onClick={handleTest}>
            🔔 Send Test Notification
          </button>
        </div>
      )}
    </div>
  );
}

export default function Profile({ user }) {
  const { profile, saving, save, daysSinceClean } = useUserProfile(user?.uid);
  const { sessions } = useHelmetSessions(user?.uid);
  const { scans } = useScalpScans(user?.uid);
  const [local, setLocal] = useState(null);

  const current = local ?? profile;
  const set = (k, v) => setLocal(p => ({ ...(p ?? profile), [k]: v }));

  const handleSave = async () => {
    if (!local) return;
    await save(local);
    setLocal(null);
    toast.success("Profile saved!");
  };

  const handleClean = async () => {
    await recordHelmetClean(user.uid);
    await save({ lastHelmetClean: new Date().toISOString() });
    toast.success("Helmet cleaning recorded!");
  };

  const totalH = (sessions.reduce((s, e) => s + (e.durationMinutes || 0), 0) / 60).toFixed(1);

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Account Profile</h2>
        <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Manage your riding specs, health data, and account settings.</p>
      </div>

      {/* Header card with stats */}
      <div className="card accent" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--hg-gradient)", padding: 3, boxShadow: "var(--shadow-glow)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--hg-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800 }}>
              {(user?.name || "U").substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)" }}>{user?.name || "Rider"}</h3>
            <p style={{ color: "var(--hg-muted)", fontSize: 12.5, marginTop: 2 }}>{user?.role === "admin" ? "Administrator" : "Member"} · {user?.email || ""}</p>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[[totalH + "h", "Helmet Time"], [sessions.length.toString(), "Sessions"], [scans.length.toString(), "AI Scans"]].map(([v, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, background: "var(--hg-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--hg-muted)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Personal Information</span>
            {local && <button className="btn btn-primary" style={{ padding: "4px 14px", fontSize: 12 }} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>}
          </div>
          <div className="grid-2" style={{ gap: "16px 20px" }}>
            {[
              { label: "Age", key: "age" },
              { label: "Gender", key: "gender", options: ["Male", "Female", "Non-binary", "Prefer not to say"] },
              { label: "Helmet Type", key: "helmetType", options: ["Full Face", "Modular", "Open Face", "Off-Road"] },
              { label: "Riding Frequency", key: "ridingFreq", options: ["Daily", "Touring", "Weekend", "Occasional"] },
            ].map(f => (
              <div key={f.key} className="login-input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12, color: "var(--hg-muted)", display: "block", marginBottom: 8, fontWeight: 650 }}>{f.label}</label>
                {f.options ? (
                  <select className="login-input" value={current[f.key] || ""} onChange={e => set(f.key, e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--hg-border)" }}>
                    {f.options.map(o => <option key={o} value={o} style={{ background: "var(--hg-surface)", color: "var(--hg-text)" }}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" className="login-input" value={current[f.key] || ""} onChange={e => set(f.key, e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--hg-border)" }} placeholder="e.g. 28" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Scalp Health Profile</span></div>
          <div className="grid-2" style={{ gap: "16px 20px" }}>
            {[
              { label: "Hair Type", key: "hairType", options: ["Straight", "Wavy", "Curly", "Coily"] },
              { label: "Scalp Type", key: "scalpType", options: ["Dry", "Normal", "Oily", "Sensitive", "Combination"] },
              { label: "Goal", key: "goal", options: ["Prevent Hair Loss", "Treat Irritation", "Hygiene Focus", "Maintenance"] },
            ].map(f => (
              <div key={f.key} className="login-input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: 12, color: "var(--hg-muted)", display: "block", marginBottom: 8, fontWeight: 650 }}>{f.label}</label>
                <select className="login-input" value={current[f.key] || ""} onChange={e => set(f.key, e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--hg-border)" }}>
                  {f.options.map(o => <option key={o} value={o} style={{ background: "var(--hg-surface)", color: "var(--hg-text)" }}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="login-input-group" style={{ gridColumn: "span 2", marginBottom: 0 }}>
              <label style={{ fontSize: 12, color: "var(--hg-muted)", display: "block", marginBottom: 8, fontWeight: 650 }}>Medical Notes</label>
              <textarea className="login-input" value={current.medicalNotes || ""} onChange={e => set("medicalNotes", e.target.value)}
                placeholder="Allergies, conditions, medications…" style={{ minHeight: 70, paddingTop: 10, resize: "none", background: "rgba(255,255,255,0.03)", border: "1px solid var(--hg-border)" }} />
            </div>
          </div>
          {local && <button className="btn btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>}
        </div>
      </div>

      {/* Notifications Settings */}
      <NotificationSettings />

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Helmet Hygiene</span></div>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 52, fontWeight: 800, color: daysSinceClean !== null && daysSinceClean > 14 ? "var(--hg-red)" : "var(--hg-primary)" }}>
              {daysSinceClean ?? "—"}
            </div>
            <div style={{ fontSize: 13, color: "var(--hg-muted)", marginBottom: 20 }}>Days since last cleaning</div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleClean}>✓ Record Cleaning</button>
          </div>
        </div>

        <div className="card" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,212,170,0.15))", border: "1px solid rgba(139,92,246,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "100%", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, background: "linear-gradient(90deg, #a78bfa, #00d4aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4, fontSize: 20 }}>
                HelmGuard AI Pro
              </h3>
              <p style={{ fontSize: 13, color: "var(--hg-text)", opacity: 0.95, lineHeight: 1.4 }}>Advanced follicle analysis, PDF exports, and continuous tracking sync.</p>
            </div>
            <button className="btn btn-primary" style={{ background: "var(--hg-gradient)", color: "#0a0f1a", fontWeight: 700 }}>Manage Billing</button>
          </div>
        </div>
      </div>
    </div>
  );
}

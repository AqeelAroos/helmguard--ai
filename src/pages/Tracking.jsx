import HelmetTimer from "../components/HelmetTimer";
import { useHelmetSessions } from "../hooks/useHelmetSessions";
import { formatDuration, formatTime } from "../services/sessionService";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Tracking({ isRecording, setIsRecording, elapsed, setElapsed, user }) {
  const { sessions, weekData, weekHours, refresh } = useHelmetSessions(user?.uid);

  const monthMins = sessions.slice(0, 30).reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const monthH = (monthMins / 60).toFixed(1);
  const avgH = sessions.length > 0 ? (monthMins / 60 / sessions.length).toFixed(1) : "0.0";
  const longestH = (sessions.reduce((m, s) => Math.max(m, s.durationMinutes || 0), 0) / 60).toFixed(1);
  const totalPauses = sessions.reduce((s, e) => s + (e.pauseCount || 0), 0);

  const rows = sessions.slice(0, 20).map(s => {
    const secs = s.durationSeconds || (s.durationMinutes || 0) * 60;
    const dur = formatDuration(secs);
    const startT = s.startTime?.toDate ? formatTime(s.startTime.toDate().toISOString()) : formatTime(s.startTime);
    const endT = s.endTime?.toDate ? formatTime(s.endTime.toDate().toISOString()) : formatTime(s.endTime);
    const date = s.createdAt?.toDate?.()?.toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" }) ?? "—";
    const risk = s.riskLevel || (s.durationMinutes > 180 ? "High" : s.durationMinutes > 90 ? "Moderate" : "Low");
    const riskColor = risk.includes("High") || risk.includes("Critical") ? "var(--hg-red)" : risk.includes("Mod") || risk.includes("Elev") ? "var(--hg-amber)" : "var(--hg-primary)";
    return { dur, startT, endT, date, risk, riskColor, pauses: s.pauseCount || 0, heat: s.heatIndex || 0 };
  });

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Helmet Tracking</h2>
          <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Every session auto-saves with full timing, risk, and heat data.</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <HelmetTimer isRecording={isRecording} setIsRecording={setIsRecording} elapsed={elapsed} setElapsed={setElapsed} uid={user?.uid} onSaved={refresh} weekHours={weekHours} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Monthly Summary</span></div>
            <div className="mobile-grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                ["Total", `${monthH}h`, "var(--hg-primary)", "⏱️"],
                ["Avg/Ride", `${avgH}h`, "var(--hg-blue)", "📈"],
                ["Longest", `${longestH}h`, "var(--hg-amber)", "⚡"],
                ["Pauses", `${totalPauses}`, "var(--hg-violet)", "⏸️"],
              ].map(([l, v, c, icon]) => (
                <div key={l} style={{ textAlign: "center", padding: "14px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-sm)", border: "1px solid var(--hg-border)" }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: "var(--hg-muted)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">This Week</span></div>
            {weekData.every(d => d.hours === 0) ? (
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--hg-muted)", fontSize: 13 }}>No sessions yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={weekData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12, color: "#f1f5f9" }} formatter={v => [`${v}h`, "Hours"]} />
                  <Bar dataKey="hours" radius={[4,4,0,0]}>
                    {weekData.map((d, i) => <Cell key={i} fill={d.hours === Math.max(...weekData.map(x => x.hours)) ? "#00d4aa" : "rgba(0,212,170,0.2)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Session History */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Session History</span>
          <span className="badge">{sessions.length} sessions</span>
        </div>

        {rows.length === 0 ? (
          <div style={{ color: "var(--hg-muted)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            No sessions yet. Press "Start Ride" to begin tracking.
          </div>
        ) : (
          <div className="mobile-scroll-table" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "100px 80px 80px 90px 70px 60px 1fr", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--hg-border)" }}>
              {["Date", "Start", "End", "Duration", "Risk", "Pauses", "Heat"].map(h => (
                <span key={h} style={{ fontSize: 10, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{h}</span>
              ))}
            </div>

            {rows.map((s, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "100px 80px 80px 90px 70px 60px 1fr",
                gap: 8, padding: "12px 12px", borderRadius: 8, alignItems: "center",
                transition: "background 0.15s",
                borderBottom: "1px solid var(--hg-border)",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hg-text)" }}>{s.date}</span>
                <span style={{ fontSize: 12, color: "var(--hg-muted)", fontFamily: "var(--font-display)" }}>{s.startT}</span>
                <span style={{ fontSize: 12, color: "var(--hg-muted)", fontFamily: "var(--font-display)" }}>{s.endT}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--hg-text)", fontFamily: "var(--font-display)" }}>{s.dur}</span>
                <span className="badge" style={{
                  background: s.risk.includes("High") || s.risk.includes("Critical") ? "var(--hg-red-dim)" : s.risk.includes("Mod") || s.risk.includes("Elev") ? "var(--hg-amber-dim)" : "var(--hg-primary-dim)",
                  color: s.riskColor, fontSize: 10, padding: "2px 8px",
                }}>{s.risk}</span>
                <span style={{ fontSize: 12, color: "var(--hg-muted)", textAlign: "center" }}>{s.pauses}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${s.heat}%`, height: "100%", borderRadius: 2, background: s.heat > 70 ? "var(--hg-red)" : s.heat > 45 ? "var(--hg-amber)" : "var(--hg-primary)" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--hg-muted)", minWidth: 24 }}>{s.heat}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

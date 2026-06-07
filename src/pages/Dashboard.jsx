import HelmetTimer from "../components/HelmetTimer";
import { useHelmetSessions } from "../hooks/useHelmetSessions";
import { useJournalLogs } from "../hooks/useJournalLogs";
import { useScalpScans } from "../hooks/useScalpScans";
import { useUserProfile } from "../hooks/useUserProfile";
import { buildRecommendations, computeRiskScore } from "../services/recommendations";
import { recordHelmetClean } from "../services/firestoreService";
import { formatDuration, formatTime, calculateRisk } from "../services/sessionService";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard({ isRecording, setIsRecording, elapsed, setElapsed, user }) {
  const { sessions, weekData, weekHours, refresh: refreshSessions } = useHelmetSessions(user?.uid);
  const { entries } = useJournalLogs(user?.uid);
  const { latestScan, daysSinceLastScan } = useScalpScans(user?.uid);
  const { daysSinceClean, save: saveProfile } = useUserProfile(user?.uid);

  const riskScore = computeRiskScore(sessions, entries, latestScan, daysSinceClean);
  const recs = buildRecommendations(sessions, entries, latestScan, daysSinceClean);
  const hairFallAvg = entries.length ? Math.round(entries.slice(0, 7).reduce((s, e) => s + (e.hairfall || 0), 0) / Math.min(entries.length, 7) * 10) / 10 : 0;
  const latestResult = latestScan?.analysisResult;

  // Live session info for stat cards
  const liveRisk = isRecording ? calculateRisk(elapsed) : null;
  const liveHours = isRecording ? Math.round((elapsed / 3600) * 10) / 10 : 0;
  const displayWeekHours = Math.round((weekHours + liveHours) * 10) / 10;

  const handleClean = async () => {
    if (!user?.uid) return;
    await recordHelmetClean(user.uid);
    await saveProfile({ lastHelmetClean: new Date().toISOString() });
    toast.success("Helmet cleaning recorded!");
  };

  const recentSessions = sessions.slice(0, 5).map(s => {
    const secs = s.durationSeconds || (s.durationMinutes || 0) * 60;
    const dur = formatDuration(secs);
    const startT = s.startTime?.toDate ? formatTime(s.startTime.toDate().toISOString()) : formatTime(s.startTime);
    const endT = s.endTime?.toDate ? formatTime(s.endTime.toDate().toISOString()) : formatTime(s.endTime);
    const date = s.createdAt?.toDate?.()?.toLocaleDateString("en", { month: "short", day: "numeric" }) ?? "—";
    const risk = s.riskLevel || (s.durationMinutes > 180 ? "High" : s.durationMinutes > 90 ? "Med" : "Low");
    const riskColor = risk.includes("High") || risk.includes("Critical") ? "var(--hg-red)" : risk.includes("Mod") || risk.includes("Elev") ? "var(--hg-amber)" : "var(--hg-primary)";
    return { dur, startT, endT, date, risk, riskColor, pauses: s.pauseCount || 0 };
  });

  return (
    <div className="page page-enter">
      {/* ── Stat Cards (live-updating when recording) ── */}
      <div className="stat-grid">
        {[
          {
            label: "Helmet Hours This Week",
            value: displayWeekHours.toString(), unit: "h",
            sub: isRecording ? `⏱ +${liveHours}h live now` : `${sessions.length} sessions total`,
            color: "teal"
          },
          {
            label: isRecording ? "Live Risk Level" : "Scalp Risk Score",
            value: isRecording ? liveRisk.level : riskScore.toString(),
            unit: isRecording ? "" : "/10",
            sub: isRecording ? `${formatDuration(elapsed)} into session` : riskScore > 6 ? "⚠ High — take action" : riskScore > 3 ? "⚠ Moderate" : "✓ Looking good",
            color: isRecording ? (liveRisk.level === "Low" ? "teal" : liveRisk.level.includes("Mod") || liveRisk.level.includes("Elev") ? "amber" : "red") : "amber"
          },
          {
            label: "Days Since Cleaned", value: daysSinceClean?.toString() ?? "—", unit: "",
            sub: daysSinceClean === null ? "Not recorded yet" : daysSinceClean > 14 ? "🧹 Clean now!" : "✓ Within schedule",
            color: "blue"
          },
          {
            label: "Hair Fall (7-day avg)", value: hairFallAvg.toString(), unit: "/5",
            sub: entries.length === 0 ? "Log entries to track" : hairFallAvg > 3 ? "↑ Worsening" : "Stable",
            color: "red"
          },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-val ${s.color}`}>{s.value}<span style={{ fontSize: 16, fontWeight: 500, opacity: 0.7 }}>{s.unit}</span></div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Timer + Weekly Chart ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <HelmetTimer isRecording={isRecording} setIsRecording={setIsRecording} elapsed={elapsed} setElapsed={setElapsed} uid={user?.uid} onSaved={refreshSessions} weekHours={weekHours} />
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Usage</span>
            <span className="badge">{displayWeekHours}h total</span>
          </div>
          {weekData.every(d => d.hours === 0) && !isRecording ? (
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--hg-muted)", fontSize: 13 }}>No sessions this week. Start tracking!</div>
          ) : (
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={weekData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12, color: "#f1f5f9" }} formatter={v => [`${v}h`, "Hours"]} />
                <Bar dataKey="hours" radius={[6,6,0,0]}>
                  {weekData.map((d, i) => <Cell key={i} fill={d.hours === Math.max(...weekData.map(x => x.hours)) ? "url(#barGrad)" : "rgba(0,212,170,0.2)"} />)}
                </Bar>
                <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d4aa" /><stop offset="100%" stopColor="#00b4d8" /></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Sessions + Alerts ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Sessions</span>
            <span className="badge">{sessions.length}</span>
          </div>
          {recentSessions.length === 0 ? (
            <div style={{ color: "var(--hg-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No sessions yet. Press Start Ride to begin.</div>
          ) : recentSessions.map((s, i) => (
            <div key={i} className="session-row">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 3, height: 36, borderRadius: 2, background: s.riskColor }} />
                <div>
                  <div className="session-dur">{s.dur}</div>
                  <div className="session-date">
                    {s.date} · {s.startT} → {s.endT}
                    {s.pauses > 0 && <span style={{ color: "var(--hg-violet)", marginLeft: 6 }}>⏸ {s.pauses}</span>}
                  </div>
                </div>
              </div>
              <span className="session-cond badge" style={{
                background: s.risk.includes("High") || s.risk.includes("Critical") ? "var(--hg-red-dim)" : s.risk.includes("Mod") || s.risk.includes("Elev") ? "var(--hg-amber-dim)" : "var(--hg-primary-dim)",
                color: s.riskColor,
              }}>{s.risk}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Alerts</span></div>

          {/* Live session alert */}
          {isRecording && (
            <div className="notif" style={{ background: "var(--hg-primary-dim)", border: "1px solid rgba(0,212,170,0.2)" }}>
              <div className="notif-icon">🏍️</div>
              <div>
                <div className="notif-text">Ride in progress — {formatDuration(elapsed)} elapsed, {liveRisk?.level} risk.</div>
                <div className="notif-time">Live now</div>
              </div>
            </div>
          )}

          {daysSinceClean !== null && daysSinceClean > 14 && (
            <div className="notif danger">
              <div className="notif-icon">⚠️</div>
              <div>
                <div className="notif-text">Helmet hasn't been cleaned in {daysSinceClean} days. Fungal risk is elevated.</div>
                <button onClick={handleClean} style={{ fontSize: 11, color: "var(--hg-red)", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 4 }}>Mark as Cleaned →</button>
              </div>
            </div>
          )}
          {daysSinceLastScan !== null && daysSinceLastScan > 7 && (
            <div className="notif info"><div className="notif-icon">📸</div><div><div className="notif-text">{daysSinceLastScan} days since your last AI scan. Time for a check-up.</div></div></div>
          )}
          {daysSinceLastScan === null && (
            <div className="notif info"><div className="notif-icon">🧠</div><div><div className="notif-text">Run your first AI scalp scan to get personalized insights and baseline.</div></div></div>
          )}
          {riskScore > 7 && !isRecording && (
            <div className="notif danger"><div className="notif-icon">🚨</div><div><div className="notif-text">Risk score is {riskScore}/10. Follow recommendations below.</div></div></div>
          )}
          {sessions.length === 0 && entries.length === 0 && !latestScan && !isRecording && (
            <div style={{ color: "var(--hg-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Alerts appear as you log data.</div>
          )}
        </div>
      </div>

      {/* ── AI Scan Summary ── */}
      {latestResult && (
        <div className="card accent" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">Latest AI Scan Summary</span><span className="badge teal">{latestScan?.createdAt?.toDate?.()?.toLocaleDateString("en", { month: "short", day: "numeric" }) ?? "Recent"}</span></div>
          <div className="mobile-grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {[
              { l: "Redness", v: latestResult.redness_score, c: "var(--hg-red)" },
              { l: "Dryness", v: latestResult.dryness_score, c: "var(--hg-amber)" },
              { l: "Oiliness", v: latestResult.oiliness_score, c: "var(--hg-blue)" },
              { l: "Dandruff", v: latestResult.dandruff_score, c: "var(--hg-violet)" },
              { l: "Inflammation", v: latestResult.inflammation_score, c: "var(--hg-red)" },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--hg-muted)", marginBottom: 4 }}>{l.toUpperCase()}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: c }}>{v}%</div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ width: `${v}%`, height: "100%", background: c, borderRadius: 2, transition: "width 1s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendations ── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Smart Recommendations</span><span className="badge">{recs.length} insights</span></div>
        <div className="grid-2">
          {recs.map((r, i) => (
            <div key={i} className="rec-card" style={{ borderColor: r.border }}>
              <div className="rec-icon-wrap" style={{ background: r.color }}>{r.icon}</div>
              <div><div className="rec-title">{r.title}</div><div className="rec-desc">{r.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

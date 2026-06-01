import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  getActiveSession, startSession, pauseSession, resumeSession,
  stopAndSaveSession, discardSession, getElapsedSeconds,
  calculateRisk, getHeatIndex, formatDuration, formatTime, formatDate,
  syncToFirestore, saveActiveSession,
} from "../services/sessionService";

export default function HelmetTimer({ isRecording, setIsRecording, elapsed, setElapsed, uid, onSaved, weekHours }) {
  const tickRef = useRef(null);
  const syncRef = useRef(null);
  const [session, setSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ── Restore session from localStorage on mount ──
  useEffect(() => {
    const saved = getActiveSession();
    if (saved) {
      setSession(saved);
      setIsRecording(true);
      setIsPaused(saved.status === "paused");
      setElapsed(getElapsedSeconds(saved));
    }
  }, []);

  // ── Tick every second when recording ──
  useEffect(() => {
    if (isRecording && !isPaused && session) {
      tickRef.current = setInterval(() => {
        setElapsed(getElapsedSeconds(session));
      }, 1000);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [isRecording, isPaused, session]);

  // ── Auto-sync to Firestore every 30 seconds ──
  useEffect(() => {
    if (isRecording && uid && session) {
      syncRef.current = setInterval(() => {
        syncToFirestore(uid, session);
      }, 30000);
      // Initial sync
      syncToFirestore(uid, session);
    } else {
      clearInterval(syncRef.current);
    }
    return () => clearInterval(syncRef.current);
  }, [isRecording, uid, session]);

  // ── Auto-save on browser close / tab switch ──
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && isRecording) {
        saveActiveSession(session); // ensure localStorage is fresh
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden && session && isRecording && uid) {
        syncToFirestore(uid, session);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session, isRecording, uid]);

  // ── Actions ──
  const handleStart = () => {
    const newSession = startSession();
    setSession(newSession);
    setIsRecording(true);
    setIsPaused(false);
    setElapsed(0);
    toast.success("Ride started! Timer is live.", { icon: "🏍️" });
  };

  const handlePause = () => {
    const updated = pauseSession();
    setSession(updated);
    setIsPaused(true);
    toast("Session paused", { icon: "⏸️" });
  };

  const handleResume = () => {
    const updated = resumeSession();
    setSession(updated);
    setIsPaused(false);
    toast("Resumed!", { icon: "▶️" });
  };

  const handleStop = async () => {
    setSaving(true);
    try {
      const record = await stopAndSaveSession(uid);
      if (record && record.durationSeconds > 10) {
        toast.success(
          `Session saved!\n${formatDuration(record.durationSeconds)} · ${record.riskLevel} risk`,
          { duration: 4000, icon: "✅" }
        );
        onSaved?.();
      }
    } catch {
      toast.error("Failed to save session.");
    } finally {
      setSaving(false);
      setSession(null);
      setIsRecording(false);
      setIsPaused(false);
      setElapsed(0);
    }
  };

  const handleDiscard = async () => {
    await discardSession(uid);
    setSession(null);
    setIsRecording(false);
    setIsPaused(false);
    setElapsed(0);
    toast("Session discarded", { icon: "🗑️" });
  };

  // ── Derived values ──
  const risk = calculateRisk(elapsed);
  const heatIdx = getHeatIndex(elapsed);
  const maxSec = 4 * 3600;
  const progress = Math.min(elapsed / maxSec, 1);
  const r = 68, circ = 2 * Math.PI * r;

  return (
    <div className={`timer-block ${isRecording ? "recording" : ""}`} style={{ marginBottom: 0 }}>

      {/* Status header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isRecording && (
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: isPaused ? "var(--hg-amber)" : "var(--hg-primary)",
            boxShadow: isPaused ? "0 0 8px var(--hg-amber)" : "0 0 8px var(--hg-primary)",
            animation: isPaused ? "none" : "glow-pulse 1.5s infinite",
          }} />
        )}
        <span style={{ fontSize: 11, color: "var(--hg-muted)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
          {!isRecording ? "Ready to Ride" : isPaused ? "⏸ Paused" : "● Live Session"}
        </span>
      </div>

      {/* Timer ring */}
      <div className="timer-ring">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isPaused ? "#f59e0b" : risk.level === "High" || risk.level === "Critical" ? "#ef4444" : "#00d4aa"} />
              <stop offset="100%" stopColor={isPaused ? "#f59e0b" : risk.level === "Elevated" ? "#f59e0b" : "#00b4d8"} />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r={r} fill="none" stroke="url(#timerGrad)" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }} />
          {isRecording && !isPaused && (
            <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,212,170,0.15)" strokeWidth="14"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s", filter: "blur(6px)" }} />
          )}
        </svg>
        <div style={{ textAlign: "center", zIndex: 1, position: "relative" }}>
          <div className="timer-display" style={{ fontSize: 28 }}>{formatDuration(elapsed)}</div>
          <div className="timer-status" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isRecording ? risk.color : "var(--hg-muted)", boxShadow: isRecording ? `0 0 6px ${risk.color}` : "none" }} />
            {isRecording ? risk.level : "Idle"}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        {!isRecording ? (
          <button className="btn btn-primary" onClick={handleStart} disabled={saving}>
            ▶ Start Ride
          </button>
        ) : (
          <>
            {isPaused ? (
              <button className="btn btn-primary" onClick={handleResume} disabled={saving}>▶ Resume</button>
            ) : (
              <button className="btn" onClick={handlePause} disabled={saving}
                style={{ background: "var(--hg-amber-dim)", color: "var(--hg-amber)", border: "1px solid rgba(245,158,11,0.2)" }}>
                ⏸ Pause
              </button>
            )}
            <button className="btn btn-danger" onClick={handleStop} disabled={saving}>
              {saving ? "Saving..." : "■ Stop & Save"}
            </button>
            <button className="btn btn-ghost" onClick={handleDiscard} disabled={saving} style={{ fontSize: 12 }}>
              Discard
            </button>
          </>
        )}
      </div>

      {/* ── Live Session Details (only when recording) ── */}
      {isRecording && session && (
        <div style={{
          width: "100%", marginTop: 4, padding: "16px 20px",
          background: "rgba(255,255,255,0.02)", borderRadius: 12,
          border: "1px solid var(--hg-border)",
        }}>
          {/* Row 1: Start time + Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Started</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hg-text)", fontFamily: "var(--font-display)" }}>
                {formatTime(session.startTime)}
              </div>
              <div style={{ fontSize: 10, color: "var(--hg-muted)" }}>{formatDate(session.startTime)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Active Time</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hg-primary)", fontFamily: "var(--font-display)" }}>
                {formatDuration(elapsed)}
              </div>
              <div style={{ fontSize: 10, color: "var(--hg-muted)" }}>excl. pauses</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Pauses</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--hg-text)", fontFamily: "var(--font-display)" }}>
                {session.pauseCount || 0}
              </div>
              <div style={{ fontSize: 10, color: "var(--hg-muted)" }}>
                {Math.round((session.totalPausedMs || 0) / 60000)}m total
              </div>
            </div>
          </div>

          {/* Row 2: Risk + Heat Index bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>Risk Level</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: risk.color }}>{risk.level}</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${(risk.score / 10) * 100}%`, height: "100%", background: risk.color, borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.8 }}>Heat Index</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: heatIdx > 70 ? "var(--hg-red)" : heatIdx > 45 ? "var(--hg-amber)" : "var(--hg-primary)" }}>{heatIdx}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${heatIdx}%`, height: "100%", background: heatIdx > 70 ? "var(--hg-red)" : heatIdx > 45 ? "var(--hg-amber)" : "var(--hg-primary)", borderRadius: 2, transition: "width 1s ease" }} />
              </div>
            </div>
          </div>

          {/* Tip based on risk */}
          {elapsed > 3600 && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: `${risk.color}15`, border: `1px solid ${risk.color}30`, fontSize: 11, color: "var(--hg-text)", lineHeight: 1.5 }}>
              {elapsed > 10800
                ? "⚠️ High exposure! Remove helmet for a 10-min break immediately."
                : elapsed > 7200
                ? "🌡️ Elevated heat. Take a 5-min ventilation break within the next 30 minutes."
                : "💡 Good practice: take a short helmet-off break every 90 minutes."}
            </div>
          )}
        </div>
      )}

      {/* ── Compact stats (when NOT recording) ── */}
      {!isRecording && (
        <div style={{ display: "flex", gap: 28, marginTop: 4 }}>
          {[
            ["This Week", weekHours != null ? `${weekHours}h` : "—", "var(--hg-text)"],
            ["Sessions", "—", "var(--hg-text)"],
            ["Status", "Ready", "var(--hg-primary)"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--hg-muted)", fontWeight: 500, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)", color: c }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

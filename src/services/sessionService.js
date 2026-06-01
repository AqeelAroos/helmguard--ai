// Industry-level Live Session Service
// Persists active session to localStorage + Firestore in real-time

import { doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { saveSession } from "./firestoreService";

const STORAGE_KEY = "helmguard_active_session";

// ── Local Storage (survives page refresh) ──

export function getActiveSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveActiveSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearActiveSession() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── Start a new ride session ──
export function startSession() {
  const session = {
    startTime: new Date().toISOString(),
    startTimestamp: Date.now(),
    status: "recording", // recording | paused
    pausedAt: null,
    totalPausedMs: 0,
    pauseCount: 0,
  };
  saveActiveSession(session);
  return session;
}

// ── Pause / Resume ──
export function pauseSession() {
  const session = getActiveSession();
  if (!session || session.status !== "recording") return session;
  session.status = "paused";
  session.pausedAt = Date.now();
  session.pauseCount = (session.pauseCount || 0) + 1;
  saveActiveSession(session);
  return session;
}

export function resumeSession() {
  const session = getActiveSession();
  if (!session || session.status !== "paused") return session;
  const pauseDuration = Date.now() - session.pausedAt;
  session.totalPausedMs = (session.totalPausedMs || 0) + pauseDuration;
  session.status = "recording";
  session.pausedAt = null;
  saveActiveSession(session);
  return session;
}

// ── Calculate live elapsed seconds (excluding pauses) ──
export function getElapsedSeconds(session) {
  if (!session) return 0;
  const now = Date.now();
  let elapsed = now - session.startTimestamp - (session.totalPausedMs || 0);
  if (session.status === "paused" && session.pausedAt) {
    elapsed -= (now - session.pausedAt); // don't count current pause
  }
  return Math.max(0, Math.floor(elapsed / 1000));
}

// ── Get total wall clock time ──
export function getTotalWallSeconds(session) {
  if (!session) return 0;
  return Math.floor((Date.now() - session.startTimestamp) / 1000);
}

// ── Risk calculation based on continuous wear time ──
export function calculateRisk(elapsedSeconds) {
  if (elapsedSeconds > 14400) return { level: "Critical", color: "var(--hg-red)", score: 9 };
  if (elapsedSeconds > 10800) return { level: "High", color: "var(--hg-red)", score: 7 };
  if (elapsedSeconds > 7200) return { level: "Elevated", color: "var(--hg-amber)", score: 5 };
  if (elapsedSeconds > 3600) return { level: "Moderate", color: "var(--hg-amber)", score: 4 };
  return { level: "Low", color: "var(--hg-primary)", score: 2 };
}

// ── Estimated scalp heat index (arbitrary formula for UX) ──
export function getHeatIndex(elapsedSeconds) {
  const mins = elapsedSeconds / 60;
  return Math.min(100, Math.round(12 + mins * 0.6 + Math.pow(mins / 30, 1.5)));
}

// ── Format helpers ──
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

// ── Sync active session to Firestore (live tracking) ──
export async function syncToFirestore(uid, session) {
  if (!uid || !session) return;
  try {
    const elapsed = getElapsedSeconds(session);
    await setDoc(doc(db, "active_sessions", uid), {
      uid,
      startTime: session.startTime,
      status: session.status,
      elapsedSeconds: elapsed,
      durationMinutes: Math.round(elapsed / 60),
      riskLevel: calculateRisk(elapsed).level,
      heatIndex: getHeatIndex(elapsed),
      pauseCount: session.pauseCount || 0,
      lastSyncAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("[Session] Firestore sync failed:", e.message);
  }
}

// ── Stop session & save final record ──
export async function stopAndSaveSession(uid) {
  const session = getActiveSession();
  if (!session) return null;

  const endTime = new Date().toISOString();
  const elapsedSeconds = getElapsedSeconds(session);
  const risk = calculateRisk(elapsedSeconds);

  const record = {
    durationSeconds: elapsedSeconds,
    startTime: session.startTime,
    endTime,
    notes: "",
    riskLevel: risk.level,
    riskScore: risk.score,
    heatIndex: getHeatIndex(elapsedSeconds),
    pauseCount: session.pauseCount || 0,
    totalPausedSeconds: Math.round((session.totalPausedMs || 0) / 1000),
    wallClockSeconds: getTotalWallSeconds(session),
  };

  // Save to Firestore sessions collection
  if (uid && elapsedSeconds > 10) {
    await saveSession(uid, record);
  }

  // Clean up active session from Firestore and localStorage
  clearActiveSession();
  if (uid) {
    try { await deleteDoc(doc(db, "active_sessions", uid)); } catch {}
  }

  return record;
}

// ── Discard without saving ──
export async function discardSession(uid) {
  clearActiveSession();
  if (uid) {
    try { await deleteDoc(doc(db, "active_sessions", uid)); } catch {}
  }
}

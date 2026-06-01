import {
  collection, doc, addDoc, getDocs, getDoc, setDoc, query,
  where, orderBy, limit, serverTimestamp, Timestamp
} from "firebase/firestore";
import { db } from "../firebase/firebase";

// ── Helmet Sessions ──
export async function saveSession(uid, data) {
  await addDoc(collection(db, "helmet_sessions"), {
    uid,
    durationSeconds: data.durationSeconds,
    durationMinutes: Math.round(data.durationSeconds / 60),
    startTime: Timestamp.fromDate(new Date(data.startTime)),
    endTime: Timestamp.fromDate(new Date(data.endTime)),
    notes: data.notes || "",
    riskLevel: data.riskLevel || "Low",
    riskScore: data.riskScore || 0,
    heatIndex: data.heatIndex || 0,
    pauseCount: data.pauseCount || 0,
    totalPausedSeconds: data.totalPausedSeconds || 0,
    wallClockSeconds: data.wallClockSeconds || data.durationSeconds,
    createdAt: serverTimestamp(),
  });
}

export async function getSessions(uid, count = 50) {
  const q = query(
    collection(db, "helmet_sessions"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Scalp Journal ──
export async function saveJournalEntry(uid, entry) {
  await addDoc(collection(db, "scalp_logs"), {
    uid,
    ...entry,
    createdAt: serverTimestamp(),
    date: new Date().toISOString().split("T")[0],
  });
}

export async function getJournalEntries(uid, count = 30) {
  const q = query(
    collection(db, "scalp_logs"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── AI Scans ──
export async function saveScan(uid, { imageDataUrl, analysisResult }) {
  const docRef = await addDoc(collection(db, "scalp_scans"), {
    uid,
    imageUrl: null, // We skip image storage to avoid setup complexity
    analysisResult,
    riskScore: analysisResult.overall_risk_score,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id };
}

export async function getScans(uid, count = 20) {
  const q = query(
    collection(db, "scalp_scans"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getLatestScan(uid) {
  const q = query(
    collection(db, "scalp_scans"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ── User Profile ──
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "user_profiles", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(uid, data) {
  await setDoc(doc(db, "user_profiles", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function recordHelmetClean(uid) {
  await setDoc(doc(db, "user_profiles", uid), { lastHelmetClean: serverTimestamp() }, { merge: true });
}

export async function getDaysSinceClean(uid) {
  const profile = await getUserProfile(uid);
  if (!profile?.lastHelmetClean) return null;
  const last = profile.lastHelmetClean.toDate();
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
}

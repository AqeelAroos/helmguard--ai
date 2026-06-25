// Premium Subscription Service for HelmGuard AI
// Stores plan data inside the user's own "users" document to avoid Firestore rule issues

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const PLANS = {
  free: {
    id: "free",
    name: "Free Plan",
    price: 0,
    features: [
      "Helmet session tracking",
      "Daily scalp journal",
      "Smart recommendations",
      "Weekly usage analytics",
      "Helmet cleaning reminders",
      "Push notifications",
      "Community forum access",
    ],
    limits: {
      aiScans: 0,
      exportPDF: false,
    },
  },
  premium: {
    id: "premium",
    name: "Pro Plan",
    price: 2990,
    priceLabel: "Rs. 2,990/mo",
    features: [
      "Everything in Free, plus:",
      "Unlimited AI scalp scans",
      "Clinical report exports (PDF)",
      "Scan history & trend analysis",
      "Priority AI model access",
      "Dermatologist report format",
      "Advanced hair density tracking",
      "Early access to new features",
    ],
    limits: {
      aiScans: -1,
      exportPDF: true,
    },
  },
};

export async function getUserPlan(uid) {
  if (!uid) return "free";
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return "free";
    const data = snap.data();
    if (data.plan === "premium" && data.planExpiresAt) {
      const expires = data.planExpiresAt.toDate?.() || new Date(data.planExpiresAt);
      if (expires < new Date()) return "free";
    }
    return data.plan || "free";
  } catch {
    return "free";
  }
}

export async function upgradeToPremium(uid) {
  if (!uid) throw new Error("Not logged in");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await setDoc(doc(db, "users", uid), {
    plan: "premium",
    planActivatedAt: serverTimestamp(),
    planExpiresAt: expiresAt,
    planMethod: "demo",
  }, { merge: true });

  return "premium";
}

export async function downgradeToFree(uid) {
  if (!uid) return;
  await setDoc(doc(db, "users", uid), {
    plan: "free",
    planCancelledAt: serverTimestamp(),
  }, { merge: true });
}

export function canAccess(plan, feature) {
  const planData = PLANS[plan] || PLANS.free;
  if (feature === "aiScan") return planData.limits.aiScans !== 0;
  if (feature === "exportPDF") return planData.limits.exportPDF;
  return true;
}

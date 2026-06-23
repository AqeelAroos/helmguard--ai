// Premium Subscription Service for HelmGuard AI
// Manages user plan (free/premium) in Firestore

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
      aiScans: 0, // No AI scans on free
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
      aiScans: -1, // unlimited
      exportPDF: true,
    },
  },
};

// Get user's current subscription plan
export async function getUserPlan(uid) {
  if (!uid) return "free";
  try {
    const snap = await getDoc(doc(db, "subscriptions", uid));
    if (!snap.exists()) return "free";
    const data = snap.data();
    // Check if premium is still active
    if (data.plan === "premium" && data.expiresAt) {
      const expires = data.expiresAt.toDate?.() || new Date(data.expiresAt);
      if (expires < new Date()) return "free"; // expired
    }
    return data.plan || "free";
  } catch {
    return "free";
  }
}

// Upgrade user to premium (in production, this would go through Stripe/payment)
export async function upgradeToPremium(uid) {
  if (!uid) throw new Error("Not logged in");

  // For demo: set premium for 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await setDoc(doc(db, "subscriptions", uid), {
    plan: "premium",
    activatedAt: serverTimestamp(),
    expiresAt: expiresAt,
    method: "demo", // In production: "stripe", "razorpay", etc.
  });

  return "premium";
}

// Downgrade to free
export async function downgradeToFree(uid) {
  if (!uid) return;
  await setDoc(doc(db, "subscriptions", uid), {
    plan: "free",
    cancelledAt: serverTimestamp(),
  });
}

// Check if a feature is available for the user's plan
export function canAccess(plan, feature) {
  const planData = PLANS[plan] || PLANS.free;
  if (feature === "aiScan") return planData.limits.aiScans !== 0;
  if (feature === "exportPDF") return planData.limits.exportPDF;
  return true; // all other features are free
}

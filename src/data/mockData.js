export const weekData = [
  { day: "Mon", hours: 2.5 }, { day: "Tue", hours: 4.1 }, { day: "Wed", hours: 1.8 },
  { day: "Thu", hours: 5.3 }, { day: "Fri", hours: 3.7 }, { day: "Sat", hours: 6.2 }, { day: "Sun", hours: 2.1 },
];

export const sessions = [
  { date: "May 22", duration: "2h 14m", condition: "Sunny", score: "Low" },
  { date: "May 21", duration: "5h 30m", condition: "Humid", score: "Med" },
  { date: "May 20", duration: "1h 52m", condition: "Windy", score: "Low" },
  { date: "May 19", duration: "4h 10m", condition: "Rainy", score: "High" },
  { date: "May 18", duration: "3h 20m", condition: "Sunny", score: "Low" },
];

export const recs = [
  { icon: "🧴", title: "Apply anti-fungal shampoo", desc: "Your usage hours this week are high. Use Ketoconazole shampoo 2x per week.", color: "rgba(0,212,180,0.12)", border: "rgba(0,212,180,0.25)" },
  { icon: "🪣", title: "Clean your helmet liner", desc: "Last cleaned 14 days ago. Bacteria buildup increases scalp irritation risk.", color: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
  { icon: "💧", title: "Hydrate your scalp", desc: "Dryness detected in recent scan. Apply scalp oil before rides longer than 2 hours.", color: "rgba(59,158,255,0.12)", border: "rgba(59,158,255,0.25)" },
  { icon: "🌬️", title: "Increase ventilation breaks", desc: "Take a 5-min helmet-off break every 90 minutes to reduce sweat accumulation.", color: "rgba(255,94,94,0.12)", border: "rgba(255,94,94,0.25)" },
];

export const aiResults = [
  { label: "Redness", pct: 18, color: "#ff5e5e" },
  { label: "Dryness", pct: 42, color: "#f5a623" },
  { label: "Oiliness", pct: 55, color: "#3b9eff" },
  { label: "Thinning Risk", pct: 22, color: "#c084fc" },
  { label: "Irritation", pct: 31, color: "#ff5e5e" },
];

export const NAV = [
  { id: "dashboard", label: "Home", icon: "🏠", path: "/dashboard" },
  { id: "tracking", label: "Tracking", icon: "⏱️", path: "/tracking" },
  { id: "scan", label: "AI Scan", icon: "🧠", path: "/scan", premium: true },
  { id: "journal", label: "Journal", icon: "📓", path: "/journal" },
  { id: "marketplace", label: "Market", icon: "🛒", path: "/market" },
  { id: "community", label: "Forum", icon: "👥", path: "/community" },
  { id: "pricing", label: "Upgrade", icon: "👑", path: "/pricing" },
  { id: "profile", label: "Profile", icon: "👤", path: "/profile" },
  { id: "admin", label: "Admin Portal", icon: "🛡️", path: "/admin", adminOnly: true },
];

export function buildRecommendations(sessions, journalEntries, latestScan, daysSinceClean) {
  const recs = [];

  // Cleaning check
  if (daysSinceClean === null || daysSinceClean > 14) {
    recs.push({
      icon: "🪣", title: "Clean Your Helmet Now",
      desc: daysSinceClean === null ? "No cleaning recorded yet. Start tracking hygiene to lower fungal risk." : `${daysSinceClean} days since last clean. Bacterial buildup is significantly elevated.`,
      color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", severity: "high",
    });
  } else if (daysSinceClean > 7) {
    recs.push({
      icon: "🪣", title: "Helmet Cleaning Due Soon",
      desc: `${daysSinceClean} days since last clean. Aim for every 7 days during heavy riding.`,
      color: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", severity: "medium",
    });
  }

  // Weekly hours
  const weekMs = Date.now() - 7 * 86400000;
  const weekMins = sessions
    .filter(s => (s.createdAt?.toDate?.()?.getTime?.() ?? 0) > weekMs)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const weekH = weekMins / 60;

  if (weekH > 25) {
    recs.push({
      icon: "🌬️", title: "Take Ventilation Breaks",
      desc: `${weekH.toFixed(1)}h logged this week — take a 5-min helmet-off break every 90 min to reduce moisture buildup.`,
      color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", severity: "high",
    });
  }

  // Journal trends
  const recent = journalEntries.slice(0, 7);
  if (recent.length > 0) {
    const avg = (k) => recent.reduce((s, e) => s + (e[k] || 0), 0) / recent.length;
    if (avg("itch") > 3) recs.push({ icon: "🧴", title: "Anti-Itch Scalp Treatment", desc: `7-day itch average is ${avg("itch").toFixed(1)}/5. Apply salicylic acid scalp serum before rides.`, color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", severity: "high" });
    if (avg("dandruff") > 2.5) recs.push({ icon: "❄️", title: "Dandruff Control Protocol", desc: `Dandruff score ${avg("dandruff").toFixed(1)}/5. Use Ketoconazole or Zinc Pyrithione shampoo 2x/week.`, color: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", severity: "medium" });
    if (avg("hairfall") > 3) recs.push({ icon: "💊", title: "Consult a Dermatologist", desc: `Hair fall averaging ${avg("hairfall").toFixed(1)}/5 — professional evaluation recommended.`, color: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.3)", severity: "high" });
  }

  // AI Scan results
  if (latestScan?.analysisResult) {
    const r = latestScan.analysisResult;
    if (r.oiliness_score > 65) recs.push({ icon: "🚿", title: "Deep Cleanse Required", desc: `Oiliness at ${r.oiliness_score}%. Wash with a clarifying shampoo within 24 hours.`, color: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", severity: "medium" });
    if (r.dryness_score > 60) recs.push({ icon: "💧", title: "Scalp Hydration Needed", desc: `Dryness at ${r.dryness_score}%. Apply hydrating scalp oil before long rides.`, color: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", severity: "medium" });
    if (r.redness_score > 50) recs.push({ icon: "🧊", title: "Reduce Scalp Inflammation", desc: `Redness at ${r.redness_score}%. Apply a cool compress and anti-inflammatory spray.`, color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", severity: "high" });
    if (r.urgent_attention_needed) recs.push({ icon: "🏥", title: "Seek Medical Attention", desc: "AI scan flagged a condition requiring professional dermatologist evaluation.", color: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", severity: "urgent" });
  }

  if (recs.length === 0) {
    recs.push({ icon: "✅", title: "Scalp Health Looks Good", desc: "No major concerns detected. Keep up your current routine and scan weekly.", color: "rgba(0,212,170,0.12)", border: "rgba(0,212,170,0.25)", severity: "low" });
  }

  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 6);
}

export function computeRiskScore(sessions, journalEntries, latestScan, daysSinceClean) {
  let score = 3.0;
  if (latestScan?.riskScore) {
    score = latestScan.riskScore;
  } else {
    const recent = journalEntries.slice(0, 7);
    if (recent.length > 0) {
      const avg = (k) => recent.reduce((s, e) => s + (e[k] || 0), 0) / recent.length;
      score = Math.min(9.5, 1 + ((avg("itch") + avg("dandruff") + avg("hairfall") + avg("sweat")) / 4) * 1.6);
    }
    if (daysSinceClean !== null && daysSinceClean > 14) score = Math.min(9.5, score + 1.5);
  }
  return Math.round(score * 10) / 10;
}

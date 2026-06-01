import { useState, useEffect } from "react";
import { getSessions } from "../services/firestoreService";

export function useHelmetSessions(uid) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!uid) { setLoading(false); return; }
    try { setSessions(await getSessions(uid)); }
    catch (e) { console.error("useHelmetSessions:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [uid]);

  // Compute week data for chart (last 7 days)
  const weekData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en", { weekday: "short" });
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
      const mins = sessions
        .filter(s => { const t = s.createdAt?.toDate?.()?.getTime?.() ?? 0; return t >= dayStart.getTime() && t <= dayEnd.getTime(); })
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      days.push({ day: label, hours: Math.round(mins / 6) / 10 });
    }
    return days;
  })();

  const weekHours = weekData.reduce((s, d) => s + d.hours, 0);

  return { sessions, loading, refresh, weekData, weekHours: Math.round(weekHours * 10) / 10 };
}

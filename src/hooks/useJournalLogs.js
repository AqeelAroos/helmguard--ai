import { useState, useEffect } from "react";
import { getJournalEntries } from "../services/firestoreService";

export function useJournalLogs(uid) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!uid) { setLoading(false); return; }
    try { setEntries(await getJournalEntries(uid)); }
    catch (e) { console.error("useJournalLogs:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [uid]);

  const recent7 = entries.slice(0, 7);
  const avg = (key) => recent7.length ? Math.round((recent7.reduce((s, e) => s + (e[key] || 0), 0) / recent7.length) * 10) / 10 : 0;
  const trends = { itch: avg("itch"), sweat: avg("sweat"), dandruff: avg("dandruff"), hairfall: avg("hairfall") };
  const trendBars = (key) => Array.from({ length: 7 }, (_, i) => (entries[6 - i]?.[key] ?? 0));

  return { entries, loading, refresh, trends, trendBars };
}

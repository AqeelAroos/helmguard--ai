import { useState, useEffect } from "react";
import { getScans, getLatestScan } from "../services/firestoreService";

export function useScalpScans(uid) {
  const [scans, setScans] = useState([]);
  const [latestScan, setLatestScan] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!uid) { setLoading(false); return; }
    try {
      const [all, latest] = await Promise.all([getScans(uid), getLatestScan(uid)]);
      setScans(all); setLatestScan(latest);
    } catch (e) { console.error("useScalpScans:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [uid]);

  const daysSinceLastScan = (() => {
    if (!latestScan?.createdAt) return null;
    const t = latestScan.createdAt.toDate?.()?.getTime?.() ?? 0;
    return Math.floor((Date.now() - t) / 86400000);
  })();

  return { scans, latestScan, loading, refresh, daysSinceLastScan };
}

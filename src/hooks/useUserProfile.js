import { useState, useEffect } from "react";
import { getUserProfile, saveUserProfile } from "../services/firestoreService";

export function useUserProfile(uid) {
  const [profile, setProfile] = useState({
    helmetType: "Full Face", ridingFreq: "Daily", hairType: "Normal",
    scalpType: "Normal", age: "", gender: "Prefer not to say",
    medicalNotes: "", goal: "Maintenance", lastHelmetClean: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    getUserProfile(uid)
      .then(data => { if (data) setProfile(p => ({ ...p, ...data })); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const save = async (updates) => {
    setSaving(true);
    const next = { ...profile, ...updates };
    setProfile(next);
    await saveUserProfile(uid, next).finally(() => setSaving(false));
  };

  const daysSinceClean = (() => {
    if (!profile.lastHelmetClean) return null;
    const t = profile.lastHelmetClean?.toDate?.()?.getTime?.() ?? new Date(profile.lastHelmetClean).getTime();
    return Math.floor((Date.now() - t) / 86400000);
  })();

  return { profile, loading, saving, save, daysSinceClean };
}

import { useState, useEffect } from "react";
import { getUserPlan, upgradeToPremium, downgradeToFree, canAccess } from "../services/subscription";

export function useSubscription(uid) {
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!uid) { setLoading(false); return; }
    try { setPlan(await getUserPlan(uid)); }
    catch { setPlan("free"); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [uid]);

  const upgrade = async () => {
    try {
      const newPlan = await upgradeToPremium(uid);
      setPlan(newPlan);
      return newPlan;
    } catch (err) {
      console.error("Upgrade failed:", err);
      throw err;
    }
  };

  const downgrade = async () => {
    try {
      await downgradeToFree(uid);
      setPlan("free");
    } catch (err) {
      console.error("Downgrade failed:", err);
      throw err;
    }
  };

  const isPremium = plan === "premium";
  const can = (feature) => canAccess(plan, feature);

  return { plan, isPremium, loading, upgrade, downgrade, can, refresh };
}

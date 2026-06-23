import { useState } from "react";
import { useJournalLogs } from "../hooks/useJournalLogs";
import { saveJournalEntry } from "../services/firestoreService";
import toast from "react-hot-toast";

const METRICS = [
  { key: "itch", label: "Itchiness Level", color: "var(--hg-red)", desc: "Scalp irritation or scratch urge" },
  { key: "sweat", label: "Sweating Level", color: "var(--hg-blue)", desc: "Ride heat or humidity buildup" },
  { key: "dandruff", label: "Flaking & Dandruff", color: "var(--hg-amber)", desc: "Dry skin particles or build-up" },
  { key: "hairfall", label: "Hair Fall Notice", color: "var(--hg-violet)", desc: "Follicle shedding count today" },
];

export default function Journal({ user }) {
  const [form, setForm] = useState({ itch: 2, sweat: 3, dandruff: 1, hairfall: 2, notes: "" });
  const [saving, setSaving] = useState(false);
  const { entries, trends, trendBars, refresh } = useJournalLogs(user?.uid);

  const today = new Date().toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" });

  const handleSave = async () => {
    if (!user?.uid) { toast.error("Please log in first."); return; }
    setSaving(true);
    try {
      await saveJournalEntry(user.uid, form);
      toast.success("Journal entry saved!");
      setForm({ itch: 2, sweat: 3, dandruff: 1, hairfall: 2, notes: "" });
      refresh();
    } catch { toast.error("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Scalp Health Journal</h2>
        <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Daily logs help the AI refine your risk score and spot health patterns.</p>
      </div>

      <div className="grid-2">
        <div className="card accent" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="card-header" style={{ marginBottom: 24 }}>
              <span className="card-title">Today's Log</span>
              <span className="badge blue">{today}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
              {METRICS.map(({ key, label, color, desc }) => (
                <div key={key} className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <span className="form-label" style={{ fontWeight: 650, color: "var(--hg-text)", fontSize: 13.5 }}>{label}</span>
                      <div style={{ fontSize: 11, color: "var(--hg-muted)", marginTop: 2 }}>{desc}</div>
                    </div>
                    <span className="range-val" style={{ color, fontSize: 14, fontWeight: 700 }}>{form[key]}/5</span>
                  </div>
                  <input type="range" min={0} max={5} step={1} value={form[key]} className="form-range" style={{ accentColor: color, marginTop: 8 }}
                    onChange={e => setForm(f => ({ ...f, [key]: +e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <span className="form-label" style={{ fontWeight: 650, color: "var(--hg-text)", fontSize: 13.5 }}>Notes</span>
              <textarea className="form-textarea" rows={3} placeholder="Any observations — products used, weather, stress levels…"
                value={form.notes} style={{ marginTop: 8, fontSize: 13 }}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 14 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Daily Log"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="card-header" style={{ marginBottom: 20 }}>
              <span className="card-title">7-Day Averages</span>
              {entries.length === 0 && <span style={{ fontSize: 11, color: "var(--hg-muted)" }}>Log entries to see trends</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                { label: "Itchiness Avg", key: "itch", color: "var(--hg-red)", grad: "linear-gradient(180deg, var(--hg-red), rgba(239,68,68,0.3))" },
                { label: "Hair Fall Avg", key: "hairfall", color: "var(--hg-violet)", grad: "linear-gradient(180deg, var(--hg-violet), rgba(139,92,246,0.3))" },
                { label: "Sweating Avg", key: "sweat", color: "var(--hg-blue)", grad: "linear-gradient(180deg, var(--hg-blue), rgba(59,130,246,0.3))" },
              ].map(({ label, key, color, grad }) => (
                <div key={key} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--hg-border)", padding: "14px 16px", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--hg-muted)", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{trends[key]} / 5.0</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, height: 32, alignItems: "flex-end" }}>
                    {trendBars(key).map((v, i) => (
                      <div key={i} style={{ flex: 1, height: `${(v / 5) * 100}%`, background: grad, borderRadius: 3, minHeight: v > 0 ? 3 : 0, transition: "height 0.4s ease" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Recent Entries</span></div>
              {entries.slice(0, 4).map((e, i) => {
                const d = e.createdAt?.toDate?.()?.toLocaleDateString("en", { month: "short", day: "numeric" }) ?? e.date ?? "—";
                const avg = Math.round(((e.itch + e.sweat + e.dandruff + e.hairfall) / 4) * 10) / 10;
                const c = avg > 3.5 ? "var(--hg-red)" : avg > 2 ? "var(--hg-amber)" : "var(--hg-primary)";
                return (
                  <div key={i} className="session-row">
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{d}</div>
                      <div style={{ fontSize: 11, color: "var(--hg-muted)" }}>Itch {e.itch} · Hair {e.hairfall} · Sweat {e.sweat} · Dandruff {e.dandruff}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{avg}/5</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

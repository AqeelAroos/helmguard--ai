import { useSubscription } from "../hooks/useSubscription";
import { PLANS } from "../services/subscription";
import toast from "react-hot-toast";

export default function Pricing({ user }) {
  const { plan, isPremium, upgrade, downgrade } = useSubscription(user?.uid);

  const handleUpgrade = async () => {
    try {
      await upgrade();
      toast.success("Welcome to HelmGuard Pro! AI Scan is now unlocked.");
    } catch {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const handleDowngrade = async () => {
    if (!confirm("Are you sure? You'll lose access to AI Scans and PDF exports.")) return;
    await downgrade();
    toast.success("Downgraded to Free plan.");
  };

  return (
    <div className="page page-enter">
      <div style={{ textAlign: "center", marginBottom: 40, paddingTop: 10 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, letterSpacing: -1, marginBottom: 8 }}>
          Choose Your Plan
        </h2>
        <p style={{ color: "var(--hg-muted)", fontSize: 15, maxWidth: 440, margin: "0 auto" }}>
          Free plan includes full tracking & journaling. Upgrade to Pro for AI-powered scalp analysis.
        </p>
      </div>

      <div className="mobile-grid-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 800, margin: "0 auto" }}>
        {/* FREE PLAN */}
        <div className="card" style={{
          padding: 32,
          border: plan === "free" ? "2px solid var(--hg-primary)" : "1px solid var(--hg-border)",
          position: "relative",
        }}>
          {plan === "free" && (
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--hg-primary)", color: "#0a0f1a", padding: "4px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              CURRENT PLAN
            </div>
          )}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>🛡️</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{PLANS.free.name}</h3>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "var(--hg-primary)" }}>
              Free
            </div>
            <p style={{ fontSize: 12, color: "var(--hg-muted)", marginTop: 4 }}>Forever, no credit card</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {PLANS.free.features.map(f => (
              <div key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--hg-text)" }}>
                <span style={{ color: "var(--hg-primary)", flexShrink: 0 }}>✓</span> {f}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--hg-muted)", opacity: 0.5 }}>
              <span style={{ flexShrink: 0 }}>✗</span> AI Scalp Scans
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--hg-muted)", opacity: 0.5 }}>
              <span style={{ flexShrink: 0 }}>✗</span> PDF Report Exports
            </div>
          </div>

          {plan === "free" ? (
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", cursor: "default" }} disabled>
              Current Plan
            </button>
          ) : (
            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={handleDowngrade}>
              Downgrade
            </button>
          )}
        </div>

        {/* PRO PLAN */}
        <div className="card" style={{
          padding: 32,
          border: isPremium ? "2px solid var(--hg-violet)" : "1px solid rgba(139,92,246,0.3)",
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,212,170,0.05))",
          position: "relative",
        }}>
          {isPremium && (
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--hg-violet)", color: "#fff", padding: "4px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              ACTIVE
            </div>
          )}
          {!isPremium && (
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--hg-gradient)", color: "#0a0f1a", padding: "4px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              RECOMMENDED
            </div>
          )}

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>👑</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{PLANS.premium.name}</h3>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800 }}>
              <span style={{ background: "linear-gradient(90deg, #a78bfa, #00d4aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {PLANS.premium.priceLabel}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--hg-muted)", marginTop: 4 }}>Billed monthly in LKR, cancel anytime</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {PLANS.premium.features.map((f, i) => (
              <div key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: i === 0 ? "var(--hg-muted)" : "var(--hg-text)", fontWeight: i === 0 ? 600 : 400 }}>
                {i > 0 && <span style={{ color: "var(--hg-violet)", flexShrink: 0 }}>✓</span>}
                {i === 0 && <span style={{ flexShrink: 0 }}> </span>}
                {f}
              </div>
            ))}
          </div>

          {isPremium ? (
            <button className="btn" style={{ width: "100%", justifyContent: "center", background: "var(--hg-violet)", color: "#fff", cursor: "default" }} disabled>
              ✓ Active Pro Member
            </button>
          ) : (
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #8b5cf6, #00d4aa)", boxShadow: "0 4px 20px rgba(139,92,246,0.35)" }} onClick={handleUpgrade}>
              Upgrade to Pro →
            </button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 600, margin: "48px auto 0", textAlign: "center" }}>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, marginBottom: 20 }}>Common Questions</h4>
        {[
          ["Can I try Pro for free?", "Yes! Click Upgrade and you get 30 days of Pro access to try all AI features."],
          ["What happens when Pro expires?", "You keep all your data. You just lose access to AI scans and PDF exports until you renew."],
          ["Is my data safe?", "All data is encrypted and stored securely in Firebase. We never share your health data."],
        ].map(([q, a]) => (
          <div key={q} style={{ textAlign: "left", marginBottom: 16, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px solid var(--hg-border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--hg-text)" }}>{q}</div>
            <div style={{ fontSize: 12.5, color: "var(--hg-muted)", lineHeight: 1.6 }}>{a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

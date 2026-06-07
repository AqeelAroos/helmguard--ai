import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { analyzeScalp, compressImageToBase64, captureFrameAsBase64, getAnalysisMethod, validateImageQuality } from "../services/scalpAnalyzer";
import { saveScan } from "../services/firestoreService";
import { useScalpScans } from "../hooks/useScalpScans";
import { useSubscription } from "../hooks/useSubscription";

const STEPS = ["Preprocessing image", "Detecting scalp features", "Mapping follicle patterns", "Scoring risk metrics", "Generating report"];

function RiskGauge({ score }) {
  const pct = Math.min(100, (score / 10) * 100);
  const color = score <= 3 ? "var(--hg-primary)" : score <= 6 ? "var(--hg-amber)" : "var(--hg-red)";
  const r = 38, circ = 2 * Math.PI * r;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "var(--hg-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>Overall Risk</div>
      <div style={{ position: "relative", width: 90, height: 90, margin: "0 auto" }}>
        <svg viewBox="0 0 90 90" width="90" height="90" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color }}>{score.toFixed(1)}</div>
          <div style={{ fontSize: 9, color: "var(--hg-muted)" }}>/10</div>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 4 }}>
        {score <= 3 ? "Low" : score <= 6 ? "Moderate" : score <= 8 ? "High" : "Critical"}
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "var(--hg-muted)" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

// ── Premium Paywall Component ──
function PremiumPaywall({ onUpgrade }) {
  const navigate = useNavigate();
  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>AI Scalp Scan</h2>
        <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Powered by Groq Vision AI — real clinical-grade scalp analysis.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
        {/* Main paywall card */}
        <div className="card" style={{
          minHeight: 520, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(0,212,170,0.04))",
          border: "1px solid rgba(139,92,246,0.2)",
        }}>
          {/* Decorative orbs */}
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-15%", left: "-10%", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,0.06), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, padding: 40 }}>
            {/* Lock icon */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 24px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,212,170,0.1))",
              border: "2px solid rgba(139,92,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
            }}>
              🔒
            </div>

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              <span style={{ background: "linear-gradient(90deg, #a78bfa, #00d4aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Pro Feature
              </span>
            </h3>

            <p style={{ color: "var(--hg-muted)", fontSize: 14, lineHeight: 1.7, maxWidth: 380, marginBottom: 32 }}>
              AI Scalp Scanning uses advanced Groq Vision AI to analyze your scalp with clinical precision.
              Upgrade to Pro to unlock unlimited scans, reports, and trend tracking.
            </p>

            {/* Feature preview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32, textAlign: "left" }}>
              {[
                ["🧬", "Follicle Mapping", "Detect thinning patterns"],
                ["🔴", "Redness Detection", "Inflammation scoring"],
                ["📊", "Clinical Reports", "Shareable with doctors"],
                ["📈", "Trend Tracking", "Monitor changes over time"],
              ].map(([icon, title, desc]) => (
                <div key={title} style={{ display: "flex", gap: 10, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--hg-border)" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{title}</div>
                    <div style={{ fontSize: 11, color: "var(--hg-muted)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{
                padding: "14px 40px", fontSize: 15,
                background: "linear-gradient(135deg, #8b5cf6, #00d4aa)",
                boxShadow: "0 4px 24px rgba(139,92,246,0.35)",
              }}
              onClick={() => navigate("/pricing")}
            >
              👑 Upgrade to Pro — Rs. 2,990/mo
            </button>

            <p style={{ fontSize: 11, color: "var(--hg-muted)", marginTop: 12 }}>
              30-day free trial included. Cancel anytime.
            </p>
          </div>
        </div>

        {/* Right sidebar — still visible to show what they'd get */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">What Pro Includes</span></div>
            {[
              "Unlimited AI scalp scans",
              "Redness & inflammation scoring",
              "Hair density estimation",
              "Thinning risk assessment",
              "Clinical PDF exports",
              "Scan history & comparisons",
              "Priority AI processing",
            ].map(f => (
              <div key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--hg-text)", marginBottom: 10 }}>
                <span style={{ color: "var(--hg-violet)", flexShrink: 0 }}>✓</span> {f}
              </div>
            ))}
          </div>

          <div className="card" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hg-violet)", marginBottom: 8 }}>FREE PLAN INCLUDES</div>
            <p style={{ fontSize: 12, color: "var(--hg-text)", lineHeight: 1.6, opacity: 0.85 }}>
              Helmet tracking, daily scalp journal, smart recommendations, push notifications, weekly analytics, and community access — all free forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function AIScan({ user }) {
  const { isPremium, loading: subLoading } = useSubscription(user?.uid);
  const [phase, setPhase] = useState("idle");
  const [preview, setPreview] = useState(null);
  const [capturedBase64, setCapturedBase64] = useState(null);
  const [stream, setStream] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const { scans, refresh } = useScalpScans(user?.uid);

  useEffect(() => {
    if (phase === "camera" && stream && videoRef.current) videoRef.current.srcObject = stream;
  }, [phase, stream]);

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, []);

  // Show paywall for free users
  if (!subLoading && !isPremium) {
    return <PremiumPaywall />;
  }

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(ms);
      setPhase("camera");
    } catch {
      toast.error("Camera access denied.");
    }
  };

  const stopStream = () => { stream?.getTracks().forEach(t => t.stop()); setStream(null); };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const { base64, dataUrl } = captureFrameAsBase64(videoRef.current);
    setPreview(dataUrl);
    setCapturedBase64(base64);
    stopStream();
    runAnalysis(base64, "image/jpeg");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    try {
      const b64 = await compressImageToBase64(file);
      setCapturedBase64(b64);
      runAnalysis(b64, file.type || "image/jpeg");
    } catch { toast.error("Failed to process image."); }
  };

  const runAnalysis = async (base64, mimeType) => {
    setPhase("scanning");
    setScanStep(0);
    const stepTimer = setInterval(() => {
      setScanStep(s => { if (s >= STEPS.length - 1) { clearInterval(stepTimer); return s; } return s + 1; });
    }, 800);

    try {
      // Image quality validation
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = `data:${mimeType};base64,${base64}`;
      });
      const quality = validateImageQuality(img);
      if (!quality.isValid) {
        clearInterval(stepTimer);
        setErrorMsg(`Image quality issue:\n\n${quality.issues.join("\n")}\n\nPlease retake the photo with better conditions.`);
        setPhase("error");
        return;
      }

      // Run hybrid analysis (local ML → Groq fallback)
      const analysisResult = await analyzeScalp(base64, mimeType);
      clearInterval(stepTimer);
      setScanStep(STEPS.length - 1);
      setResult(analysisResult);

      // Show which method was used
      const method = analysisResult._method === "local_ml" ? "On-Device AI" : "Groq Vision AI";
      toast.success(`Analysis complete (${method})`, { icon: "🧬" });

      if (user?.uid) {
        try { await saveScan(user.uid, { imageDataUrl: `data:${mimeType};base64,${base64}`, analysisResult }); refresh(); } catch {}
      }
      setTimeout(() => setPhase("result"), 400);
    } catch (err) {
      clearInterval(stepTimer);
      setErrorMsg(err.message || "Analysis failed.");
      setPhase("error");
    }
  };

  const reset = () => {
    stopStream(); setPhase("idle"); setPreview(null); setCapturedBase64(null);
    setResult(null); setErrorMsg(""); setScanStep(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>AI Scalp Scan</h2>
          <span className="badge violet">PRO</span>
        </div>
        <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Powered by Groq Vision AI — real clinical-grade scalp analysis in seconds.</p>
      </div>

      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

      <div className="grid-2" style={{ gridTemplateColumns: "1fr 380px", alignItems: "start" }}>
        <div className="card" style={{ minHeight: 520, padding: 0, overflow: "hidden", position: "relative", display: "flex" }}>

          {phase === "idle" && (
            <div className="upload-zone" style={{ margin: 24, flex: 1, minHeight: 460 }}>
              <div className="upload-icon" style={{ animation: "float 6s ease-in-out infinite" }}>🔬</div>
              <div className="upload-text">AI Scalp Analysis</div>
              <p className="upload-sub" style={{ maxWidth: 300, textAlign: "center", lineHeight: 1.6 }}>
                Take a live photo or upload an image for clinical-grade analysis.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-primary" onClick={startCamera}>📸 Open Camera</button>
                <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()}>🖼️ Upload Photo</button>
              </div>
            </div>
          )}

          {phase === "camera" && (
            <div style={{ flex: 1, position: "relative", background: "#000", minHeight: 520 }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 240, height: 240, border: "2px dashed var(--hg-primary)", borderRadius: "50%", boxShadow: "0 0 0 2000px rgba(10,15,26,0.55)" }}>
                  <div style={{ position: "absolute", bottom: -32, width: "100%", textAlign: "center", fontSize: 11, color: "var(--hg-primary)", fontWeight: 700, letterSpacing: 1.5 }}>CENTER SCALP IN CIRCLE</div>
                </div>
              </div>
              <div style={{ position: "absolute", bottom: 32, left: 0, right: 0, display: "flex", gap: 16, justifyContent: "center", zIndex: 10 }}>
                <button onClick={reset} className="btn btn-ghost" style={{ background: "rgba(10,15,26,0.8)" }}>Cancel</button>
                <button onClick={capturePhoto} style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid #fff", background: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 26 }}>📷</button>
              </div>
            </div>
          )}

          {phase === "scanning" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, position: "relative" }}>
              {preview && <img src={preview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.12 }} />}
              <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid var(--hg-primary-dim)", borderTopColor: "var(--hg-primary)", margin: "0 auto 28px", animation: "spin 1s linear infinite" }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--hg-primary)", letterSpacing: 2, marginBottom: 24, fontFamily: "var(--font-display)" }}>ANALYZING SCALP</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 260, margin: "0 auto" }}>
                  {STEPS.map((step, i) => (
                    <div key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: i < scanStep ? "var(--hg-primary)" : i === scanStep ? "var(--hg-blue)" : "rgba(255,255,255,0.06)", transition: "all 0.4s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff" }}>
                        {i < scanStep && "✓"}{i === scanStep && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "glow-pulse 1s infinite" }} />}
                      </div>
                      <span style={{ fontSize: 12.5, color: i <= scanStep ? "var(--hg-text)" : "var(--hg-muted)" }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h3 style={{ color: "var(--hg-red)", marginBottom: 12 }}>Analysis Failed</h3>
              <p style={{ color: "var(--hg-muted)", fontSize: 13, maxWidth: 380, lineHeight: 1.7, marginBottom: 24, whiteSpace: "pre-line" }}>{errorMsg}</p>
              <button className="btn btn-primary" onClick={reset}>Try Again</button>
            </div>
          )}

          {phase === "result" && result && (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {preview && (
                <div style={{ width: 180, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                  <img src={preview} alt="scan" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 12px 12px", background: "linear-gradient(transparent, rgba(0,0,0,0.85))" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>CONFIDENCE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{result.confidence_percent}%</div>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--hg-border)" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Clinical Report</h3>
                    <p style={{ fontSize: 11, color: "var(--hg-muted)" }}>{new Date().toLocaleString()}</p>
                  </div>
                  <span className={`badge ${result.urgent_attention_needed ? "danger" : result.overall_risk_score > 6 ? "warn" : "teal"}`}>
                    {result.urgent_attention_needed ? "⚠ Urgent" : result.overall_risk_score > 6 ? "High Risk" : "Monitored"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                  <RiskGauge score={result.overall_risk_score} />
                  <div style={{ textAlign: "center", padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--hg-border)" }}>
                    <div style={{ fontSize: 10, color: "var(--hg-muted)", marginBottom: 4, textTransform: "uppercase" }}>Thinning</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: result.thinning_risk === "high" ? "var(--hg-red)" : result.thinning_risk === "moderate" ? "var(--hg-amber)" : "var(--hg-primary)" }}>{result.thinning_risk?.toUpperCase()}</div>
                  </div>
                  <div style={{ textAlign: "center", padding: 10, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid var(--hg-border)" }}>
                    <div style={{ fontSize: 10, color: "var(--hg-muted)", marginBottom: 4, textTransform: "uppercase" }}>Density</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--hg-blue)" }}>~{result.estimated_hair_density_per_cm2}/cm²</div>
                  </div>
                </div>
                <MetricBar label="Redness" value={result.redness_score} color="var(--hg-red)" />
                <MetricBar label="Dryness" value={result.dryness_score} color="var(--hg-amber)" />
                <MetricBar label="Oiliness" value={result.oiliness_score} color="var(--hg-blue)" />
                <MetricBar label="Dandruff" value={result.dandruff_score} color="var(--hg-violet)" />
                <MetricBar label="Inflammation" value={result.inflammation_score} color="var(--hg-red)" />
                {result.scalp_condition_summary && (
                  <div style={{ background: "rgba(0,212,170,0.05)", borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 16, borderLeft: "3px solid var(--hg-primary)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hg-primary)", marginBottom: 6 }}>AI ASSESSMENT</div>
                    <p style={{ fontSize: 13, color: "var(--hg-text)", lineHeight: 1.7 }}>{result.scalp_condition_summary}</p>
                  </div>
                )}
                {result.recommendations?.map((rec, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, fontSize: 12.5, lineHeight: 1.6, marginBottom: 6, border: "1px solid var(--hg-border)" }}>
                    <span style={{ color: "var(--hg-amber)" }}>•</span>{rec}
                  </div>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => window.print()}>🖨️ Export</button>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={reset}>New Scan</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Scanner Guidelines</span></div>
            {[
              { icon: "💡", t: "Good Lighting", d: "Bright, indirect natural light." },
              { icon: "📏", t: "3–5 cm Distance", d: "Hold steady close to scalp." },
              { icon: "🎯", t: "Tap to Focus", d: "Focus on the scalp, not hair." },
              { icon: "🌿", t: "Part Your Hair", d: "Expose scalp surface directly." },
            ].map(g => (
              <div key={g.t} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 16 }}>{g.icon}</span>
                <div><div style={{ fontSize: 12, fontWeight: 700 }}>{g.t}</div><div style={{ fontSize: 11, color: "var(--hg-muted)" }}>{g.d}</div></div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Scan History</span><span className="badge">{scans.length}</span></div>
            {scans.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--hg-muted)", fontSize: 12, padding: "12px 0" }}>No scans yet.</div>
            ) : scans.slice(0, 5).map(s => {
              const d = s.createdAt?.toDate?.()?.toLocaleDateString("en", { month: "short", day: "numeric" }) ?? "—";
              const score = s.riskScore ?? 0;
              const c = score <= 3 ? "var(--hg-primary)" : score <= 6 ? "var(--hg-amber)" : "var(--hg-red)";
              return (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid var(--hg-border)" }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600 }}>{d}</div><div style={{ fontSize: 11, color: "var(--hg-muted)" }}>Risk: <b style={{ color: c }}>{score.toFixed(1)}</b></div></div>
                  <div style={{ fontSize: 11, color: c, fontWeight: 700 }}>{s.analysisResult?.thinning_risk?.toUpperCase() || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

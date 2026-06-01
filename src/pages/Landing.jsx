import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const sectionsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    sectionsRef.current.forEach((el) => {
      if (el) {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el);
  };

  return (
    <div className="landing">
      {/* Navbar */}
      <nav style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        padding: "24px 48px", position: "fixed", top: 0, width: "100%", zIndex: 100,
        background: "rgba(10,15,26,0.6)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)"
      }}>
        <div className="logo-text" style={{ fontSize: 22 }}>🛡️ Helm<span>Guard</span></div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <button className="btn btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate("/login", { state: { mode: "signup" } })}>Join Now</button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero" style={{ paddingTop: 160, paddingBottom: 80 }}>
        {/* Extra floating orb */}
        <div style={{
          position: "absolute", bottom: "10%", left: "30%", width: 180, height: 180,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(0,180,216,0.06) 0%, transparent 70%)",
          animation: "float 12s ease-in-out infinite 4s", pointerEvents: "none"
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="hero-eyebrow">✦ The Future of Rider Safety & Health</div>
          <h1 className="hero-h1">Ride Hard.<br /><em>Protect Your Scalp.</em></h1>
          <p className="hero-sub" style={{ fontSize: 18, maxWidth: 580 }}>
            The world's first AI-powered platform designed specifically for motorcyclists. 
            Track usage, monitor hair health, and get dermatologist-grade insights—all in one app.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-xl" onClick={() => navigate("/login", { state: { mode: "signup" } })}>
              Get Started for Free →
            </button>
            <button className="btn btn-ghost btn-xl">Watch Demo</button>
          </div>
          {/* Trust bar */}
          <div style={{ 
            display: "flex", gap: 32, justifyContent: "center", marginTop: 48,
            color: "var(--hg-muted)", fontSize: 13, fontWeight: 500
          }}>
            {["1,200+ Riders", "98.4% AI Accuracy", "4.9★ Rating"].map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--hg-primary)", display: "inline-block" }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div ref={addRef} id="benefits" style={{ padding: "100px 40px", textAlign: "center" }}>
        <div className="section-title">Why HelmGuard?</div>
        <div className="section-sub">More than just a timer—it's a complete health ecosystem.</div>
        <div className="grid-3" style={{ marginTop: 48, maxWidth: 1100, margin: "48px auto 0" }}>
          {[
            { icon: "🛡️", title: "Early Detection", desc: "Our AI catches hair thinning and scalp irritation weeks before you'd notice in a mirror.", grad: "linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,180,216,0.06))" },
            { icon: "🧼", title: "Hygiene Protocol", desc: "Scientific cleaning schedules based on your actual ride time and local humidity levels.", grad: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))" },
            { icon: "📈", title: "Data-Driven Care", desc: "Stop guessing. Use real clinical data to choose the right products for your scalp type.", grad: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.06))" }
          ].map((b, i) => (
            <div key={i} className="card" style={{ padding: 40, textAlign: "left", background: b.grad, backdropFilter: "blur(8px)" }}>
              <div style={{ 
                fontSize: 28, marginBottom: 20, width: 56, height: 56, borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.06)"
              }}>{b.icon}</div>
              <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 12, fontSize: 20, fontWeight: 700 }}>{b.title}</h3>
              <p style={{ color: "var(--hg-muted)", fontSize: 14, lineHeight: 1.7 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div ref={addRef} id="features" style={{ padding: "40px 40px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-title">Everything You Need</div>
          <div className="section-sub">A suite of tools built for the modern rider.</div>
        </div>
        <div className="features-grid" style={{ padding: "0", maxWidth: 1100, margin: "0 auto" }}>
          {[
            { icon: "⏱️", title: "Session Tracking", desc: "Precision logging for every ride. We calculate cumulative heat and moisture exposure." },
            { icon: "🧠", title: "AI Vision Scan", desc: "Upload photos to monitor redness, oiliness, and thinning risk with computer vision." },
            { icon: "📊", title: "Health Journal", desc: "Log itchiness and sweating to identify patterns and environmental triggers." },
            { icon: "💡", title: "Expert Routines", desc: "Personalized hair care routines developed with professional dermatologists." },
            { icon: "🔔", title: "Smart Alerts", desc: "Automated reminders when your helmet reaches high bacterial risk thresholds." },
            { icon: "🌪️", title: "Weather Intel", desc: "Real-time humidity and heat data integration to predict scalp stress." },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div ref={addRef} style={{ padding: "0 40px 100px" }}>
        <div style={{ 
          background: "linear-gradient(135deg, rgba(17,24,39,0.8), rgba(0,212,170,0.05))",
          backdropFilter: "blur(12px)",
          padding: "100px 48px", borderRadius: 32, 
          border: "1px solid rgba(0,212,170,0.1)",
          maxWidth: 1100, margin: "0 auto",
          position: "relative", overflow: "hidden"
        }}>
          {/* Background glow */}
          <div style={{ 
            position: "absolute", top: "-20%", right: "-10%", width: 400, height: 400,
            borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <h2 className="section-title" style={{ fontSize: 40, marginBottom: 16 }}>Ready to ride smarter?</h2>
            <p className="section-sub" style={{ fontSize: 17, marginBottom: 48 }}>Joining HelmGuard takes less than 60 seconds. Protect your scalp today.</p>
            
            <div className="grid-3" style={{ marginBottom: 52, textAlign: "left" }}>
              {[
                { step: "1", title: "Create Profile", desc: "Sign up and tell us about your riding habits and helmet type." },
                { step: "2", title: "Initial Scan", desc: "Take your first baseline scalp photo for our AI to analyze." },
                { step: "3", title: "Ride & Track", desc: "Start tracking sessions and receive personalized care alerts." }
              ].map((s, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: "50%", 
                    background: "var(--hg-gradient)", 
                    color: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, marginBottom: 16, fontSize: 16,
                    fontFamily: "var(--font-display)",
                    boxShadow: "0 4px 16px rgba(0,212,170,0.3)"
                  }}>{s.step}</div>
                  <h4 style={{ marginBottom: 8, fontSize: 16, fontFamily: "var(--font-display)", fontWeight: 700 }}>{s.title}</h4>
                  <p style={{ color: "var(--hg-muted)", fontSize: 13.5, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-xl" style={{ minWidth: 260 }} onClick={() => navigate("/login")}>
              Join the Community Now
            </button>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div ref={addRef} className="testimonials" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="section-title">The Rider Community</div>
          <div className="section-sub">Join thousands of riders who have improved their scalp health.</div>
        </div>
        <div className="testi-grid">
          {[
            ["The AI scan is scarily accurate. It noticed my forehead redness before I even felt the itch.", "Sarah M.", "Urban Commuter"],
            ["As a professional courier, I wear a helmet 8 hours a day. HelmGuard is essential equipment.", "James L.", "Delivery Specialist"],
            ["No more 'helmet hair' or irritation. The routine suggestions actually work.", "Priya K.", "Weekend Rider"],
          ].map(([text, name, role], i) => (
            <div key={i} className="testi-card">
              <div className="testi-stars">★★★★★</div>
              <div className="testi-text">"{text}"</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: "50%", 
                  background: "var(--hg-gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#0a0f1a"
                }}>{name.substring(0, 2)}</div>
                <div>
                  <div className="testi-author">{name}</div>
                  <div style={{ fontSize: 11, color: "var(--hg-muted)" }}>{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ 
        padding: "60px 40px 40px", borderTop: "1px solid var(--hg-border)", 
        textAlign: "center" 
      }}>
        <div className="logo-text" style={{ fontSize: 22, marginBottom: 16 }}>🛡️ Helm<span>Guard</span></div>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 20 }}>
          {["Privacy", "Terms", "Support", "Blog"].map(l => (
            <a key={l} href="#" style={{ color: "var(--hg-muted)", fontSize: 13, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "var(--hg-primary)"}
              onMouseLeave={e => e.target.style.color = "var(--hg-muted)"}
            >{l}</a>
          ))}
        </div>
        <p style={{ color: "var(--hg-subtle)", fontSize: 12 }}>© 2026 HelmGuard AI. All rights reserved. Built for riders, by riders.</p>
      </footer>
    </div>
  );
}

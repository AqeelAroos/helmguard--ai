import { useState } from "react";

const THREADS = [
  { id: 1, title: "Best scalp shampoo for daily commuters?", author: "Rider88", replies: 24, category: "Grooming", time: "2h ago" },
  { id: 2, title: "How often do you wash your modular helmet liners?", author: "SprintKing", replies: 42, category: "Maintenance", time: "5h ago" },
  { id: 3, title: "Scalp constantly itchy after long weekend tours. Help!", author: "AdventureGal", replies: 15, category: "Health", time: "1d ago" },
  { id: 4, title: "New carbon helmet recommendations for ventilation?", author: "MotoVlogJP", replies: 8, category: "Gear", time: "2d ago" },
];

const categoryColors = {
  Grooming: "violet",
  Maintenance: "blue",
  Health: "danger",
  Gear: "warn"
};

export default function Community() {
  const [threads, setThreads] = useState(THREADS);

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Riders Community</h2>
          <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Discuss gear maintenance, dermatological routines, and tips with other riders.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("Post composer coming soon!")}>
          ✍️ Create Thread
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        
        {/* Discussion List */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: "20px 24px", borderBottom: "1px solid var(--hg-border)" }}>
            <span className="card-title">Recent Discussions</span>
            <span className="badge teal">{threads.length} Active Threads</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            {threads.map((t, i) => (
              <div 
                key={t.id} 
                className="session-row" 
                style={{ 
                  padding: "20px 24px", 
                  borderBottom: i === threads.length - 1 ? "none" : "1px solid var(--hg-border)",
                  cursor: "pointer",
                  transition: "all 0.25s ease-in-out"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                  e.currentTarget.style.paddingLeft = "28px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.paddingLeft = "24px";
                }}
                onClick={() => alert(`Opening thread: "${t.title}"`)}
              >
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span className={`badge ${categoryColors[t.category] || "teal"}`} style={{ fontSize: 9.5, fontWeight: 700, padding: "2px 8px" }}>
                      {t.category}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 6, color: "var(--hg-text)", lineHeight: 1.4 }}>{t.title}</h4>
                  <div style={{ fontSize: 12, color: "var(--hg-muted)" }}>
                    Started by <span style={{ color: "var(--hg-text)", fontWeight: 500 }}>{t.author}</span> · {t.time}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 64 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--hg-primary)" }}>{t.replies}</div>
                  <div style={{ fontSize: 9.5, color: "var(--hg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>Replies</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="card">
             <div className="card-header" style={{ marginBottom: 16 }}><span className="card-title">Top Contributors</span></div>
             <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
               {[
                 { name: "SuperRider", pts: 4202, rank: 1, icon: "🥇" },
                 { name: "DermExpert", pts: 3850, rank: 2, icon: "🥈" },
                 { name: "BikeLife", pts: 2100, rank: 3, icon: "🥉" }
               ].map(c => (
                 <div key={c.name} style={{ 
                   display: "flex", 
                   justifyContent: "space-between", 
                   alignItems: "center", 
                   padding: "10px 8px", 
                   borderBottom: "1px solid var(--hg-border)",
                   background: "rgba(255,255,255,0.01)",
                   borderRadius: 8
                 }}>
                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                     <span style={{ fontSize: 14 }}>{c.icon}</span>
                     <span style={{ fontSize: 13, fontWeight: 600, color: "var(--hg-text)" }}>{c.name}</span>
                   </div>
                   <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hg-primary)" }}>{c.pts} XP</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="card accent" style={{ 
            background: "rgba(245,158,11,0.05)", 
            borderColor: "rgba(245,158,11,0.2)"
          }}>
             <div style={{ fontSize: 13.5, color: "var(--hg-amber)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
               ⚠️ Community Guidelines
             </div>
             <p style={{ fontSize: 12, marginTop: 8, color: "var(--hg-text)", opacity: 0.9, lineHeight: 1.5 }}>
               Be respectful. No medical advertisements or diagnosis claims. Verified dermatologists carry special badges.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}

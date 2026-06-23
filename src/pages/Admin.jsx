import { useState, useEffect } from "react";

const allUsersData = [
  { id: 1, name: "Kasun Perera", email: "kasun@gmail.com", risk: "Med", hours: 25.7, scans: 12, hairfall: 3 },
  { id: 2, name: "Sarah Mendis", email: "sarah@outlook.com", risk: "Low", hours: 12.4, scans: 8, hairfall: 1 },
  { id: 3, name: "James Liyanage", email: "james@rider.com", risk: "High", hours: 44.2, scans: 15, hairfall: 5 },
  { id: 4, name: "Priya Kulasinghe", email: "priya@bike.com", risk: "Low", hours: 5.1, scans: 3, hairfall: 1 },
  { id: 5, name: "Dinesh Rajapaksa", email: "dinesh@courier.lk", risk: "Med", hours: 38.9, scans: 22, hairfall: 2 },
];

export default function Admin() {
  const [search, setSearch] = useState("");
  
  const filteredUsers = allUsersData.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Admin Console</h2>
          <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Global overview of all platform users, scan activity, and system health status.</p>
        </div>
        <div className="badge blue" style={{ padding: "6px 14px" }}>Root Access Granted</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { l: "Total Users", v: "1,284", c: "teal" },
          { l: "Active Sessions", v: "42", c: "blue" },
          { l: "Critical Risks", v: "8", c: "red" },
          { l: "AI Scans (MTD)", v: "3,102", c: "amber" }
        ].map(({ l, v, c }) => (
          <div key={l} className={`stat-card ${c}`}>
            <div className="stat-label">{l}</div>
            <div className={`stat-val ${c}`} style={{ fontSize: 28 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <div className="card-header" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          <span className="card-title">User Management</span>
          <div style={{ display: "flex", gap: 12 }}>
             <input 
               type="text" 
               placeholder="Search users..." 
               className="login-input" 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               style={{ width: 220, padding: "8px 12px", fontSize: 13, background: "rgba(255,255,255,0.03)", border: "1px solid var(--hg-border)" }} 
             />
             <button className="btn btn-ghost" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => alert("CSV Export Triggered!")}>Export CSV</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead style={{ background: "rgba(255,255,255,0.02)", color: "var(--hg-muted)", textAlign: "left", borderBottom: "1px solid var(--hg-border)" }}>
              <tr>
                {["User", "Risk Score", "Hours Logged", "AI Scans", "Daily Hairfall", "Actions"].map(h => (
                  <th key={h} style={{ padding: "14px 24px", fontWeight: 650, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                const initials = u.name.split(" ").map(n => n[0]).join("").toUpperCase();
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--hg-border)", transition: "background 0.2s" }} 
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.01)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                    <td style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: idx % 2 === 0 ? "var(--hg-primary-dim)" : "var(--hg-blue-dim)",
                        border: `1px solid ${idx % 2 === 0 ? "rgba(0,212,170,0.2)" : "rgba(59,130,246,0.2)"}`,
                        color: idx % 2 === 0 ? "var(--hg-primary)" : "var(--hg-blue)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--hg-text)" }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--hg-muted)", marginTop: 2 }}>{u.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <span className={`badge ${
                        u.risk === "High" ? "danger" : u.risk === "Med" ? "warn" : "teal"
                      }`}>{u.risk} Risk</span>
                    </td>
                    <td style={{ padding: "16px 24px", fontWeight: 500 }}>{u.hours}h</td>
                    <td style={{ padding: "16px 24px" }}>{u.scans} scans</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ 
                        color: u.hairfall >= 4 ? "var(--hg-red)" : u.hairfall >= 3 ? "var(--hg-amber)" : "var(--hg-muted)",
                        fontWeight: 600 
                      }}>{u.hairfall} / 5</span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => alert(`Managing profile for ${u.name}`)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header" style={{ marginBottom: 18 }}>
            <span className="card-title">System Architecture</span>
            <span className="badge teal">Live Diagnostics</span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { l: "Authentication Server", s: "Operational", c: "var(--hg-primary)" },
              { l: "Scalp Scan Model API", s: "Operational", c: "var(--hg-primary)" },
              { l: "Cloud Database (Firebase)", s: "Operational", c: "var(--hg-primary)" },
              { l: "Edge Asset CDN", s: "Degraded Performance", c: "var(--hg-amber)" }
            ].map(s => (
              <div key={s.l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--hg-text)" }}>{s.l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: s.c, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ 
                    display: "inline-block", 
                    width: 6, 
                    height: 6, 
                    borderRadius: "50%", 
                    background: s.c,
                    boxShadow: `0 0 6px ${s.c}`,
                    animation: s.s === "Operational" ? "none" : "glow-pulse 1.5s infinite"
                  }} />
                  {s.s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ marginBottom: 18 }}>
            <span className="card-title">Recent System Logs</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--hg-muted)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--hg-primary)" }}>[INFO]</span> <span>Admin session established from 104.22.4.92 (2m ago)</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--hg-blue)" }}>[SYNC]</span> <span>User #148 finished follicle scan upload (14m ago)</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--hg-primary)" }}>[BACK]</span> <span>Automated state backup snapshot generated (4h ago)</span></div>
            <div style={{ display: "flex", gap: 8 }}><span style={{ color: "var(--hg-amber)" }}>[WARN]</span> <span>High latency reported on EU endpoint region (6h ago)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

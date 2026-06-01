import { useState } from "react";

const PRODUCTS = [
  { id: 1, name: "Nano-Silver Helmet Liner", price: "9,500", tag: "Anti-Bacterial", img: "🛡️", desc: "Infused with silver nanoparticles to prevent sweat odor & bacterial colonies.", color: "rgba(0,212,170,0.1)" },
  { id: 2, name: "Scalp Cooling Mist", price: "4,200", tag: "Instant Relief", img: "❄️", desc: "Menthol-based fast-acting spray to reduce ride irritation and heat rash.", color: "rgba(59,130,246,0.1)" },
  { id: 3, name: "Bio-Clean Helmet Spray", price: "3,500", tag: "Fungal Control", img: "🧼", desc: "Eco-friendly disinfectant targeting Malassezia globosa (dandruff fungus).", color: "rgba(245,158,11,0.1)" },
  { id: 4, name: "DHT Blocking Shampoo", price: "7,800", tag: "Hair Protection", img: "🧴", desc: "Caffeine & Biotin formula designed to counteract traction alopecia.", color: "rgba(139,92,246,0.1)" },
  { id: 5, name: "Moisture-Wick Balaclava", price: "5,200", tag: "Gear", img: "🥷", desc: "Ultra-breathable microfibers that divert scalp sweat away from helmet liners.", color: "rgba(0,212,170,0.1)" },
  { id: 6, name: "UV Protective Buff", price: "2,800", tag: "Summer Gear", img: "🧣", desc: "UPF 50+ neck & crown shield for long-distance summer motorcycle touring.", color: "rgba(59,130,246,0.1)" },
];

export default function Marketplace() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <div className="page page-enter">
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 }}>Clinical Marketplace</h2>
          <p style={{ color: "var(--hg-muted)", fontSize: 13.5 }}>Curated products approved by our dermatologists to maintain gear hygiene and scalp health.</p>
        </div>
        <div>
          <button className="btn btn-ghost" style={{ position: "relative", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }} onClick={() => alert("Cart summary coming soon!")}>
            <span>🛒</span>
            <span style={{ fontWeight: 600 }}>My Cart</span>
            {cartCount > 0 && (
              <span style={{ 
                background: "var(--hg-primary)", 
                color: "#0a0f1a", 
                minWidth: 20, 
                height: 20, 
                borderRadius: 10, 
                fontSize: 10.5, 
                fontWeight: 800, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: "0 6px",
                boxShadow: "0 0 8px var(--hg-primary)"
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid-3">
        {PRODUCTS.map(p => (
          <div key={p.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "var(--shadow-md)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "var(--hg-border)";
            }}
          >
             <div style={{ 
               height: 150, 
               background: `radial-gradient(circle at center, ${p.color} 0%, rgba(10,15,26,0.3) 70%)`, 
               borderBottom: "1px solid var(--hg-border)",
               display: "flex", 
               alignItems: "center", 
               justifyContent: "center", 
               fontSize: 54,
               position: "relative"
             }}>
                <span style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.1))" }}>{p.img}</span>
             </div>
             
             <div style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                     <span className="badge teal" style={{ fontSize: 10, fontWeight: 700 }}>{p.tag}</span>
                     <span style={{ fontWeight: 800, color: "var(--hg-primary)", fontSize: 14.5 }}>Rs. {p.price}</span>
                  </div>
                  <h3 style={{ fontSize: 16.5, marginBottom: 8, fontWeight: 700, color: "var(--hg-text)", fontFamily: "var(--font-display)" }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: "var(--hg-muted)", lineHeight: 1.5, marginBottom: 20 }}>{p.desc}</p>
                </div>
                
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", fontSize: 13, justifyContent: "center" }}
                  onClick={() => setCartCount(c => c + 1)}
                >
                  Add to Cart
                </button>
             </div>
          </div>
        ))}
      </div>

      <div className="card accent" style={{ 
        marginTop: 28, 
        background: "linear-gradient(90deg, rgba(17,24,39,0.8), rgba(0,212,170,0.04))",
        borderColor: "var(--hg-border-accent)"
      }}>
         <div className="grid-2" style={{ alignItems: "center", gap: 20 }}>
            <div>
               <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, fontFamily: "var(--font-display)" }}>HelmGuard Marketplace</h3>
               <p style={{ color: "var(--hg-muted)", fontSize: 13.5, lineHeight: 1.5 }}>
                 Want to feature your scalp care products or specialized inner helmet liner designs? Apply as an approved partner.
               </p>
            </div>
            <div style={{ textAlign: "right" }}>
               <button className="btn btn-ghost" onClick={() => alert("Vendor registration portal coming soon!")}>Apply as Vendor</button>
            </div>
         </div>
      </div>
    </div>
  );
}

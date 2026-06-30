export function MetroBackground() {
  return (
    <div className="metro-bg" aria-hidden>
      <svg viewBox="0 0 1200 800" preserveAspectRatio="none">
        <path d="M-50 120 Q 300 60 600 200 T 1250 180" style={{ color: "#26ABE3", stroke: "#26ABE3" }} />
        <path d="M-50 320 Q 250 420 600 340 T 1250 380" style={{ color: "#F16DA9", stroke: "#F16DA9" }} />
        <path d="M-50 520 Q 350 460 700 580 T 1250 540" style={{ color: "#813E9A", stroke: "#813E9A" }} />
        <path d="M-50 680 Q 250 620 600 700 T 1250 660" style={{ color: "#0C9448", stroke: "#0C9448" }} />
        <path d="M150 -50 Q 300 250 200 500 T 280 850" style={{ color: "#E63946", stroke: "#E63946" }} />
        <path d="M900 -50 Q 800 250 950 500 T 880 850" style={{ color: "#FEE111", stroke: "#FEE111" }} />
      </svg>
    </div>
  );
}

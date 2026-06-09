// src/game/components/overlays/WinScreen.jsx
export default function WinScreen({ gameOver, onLeave }) {
  if (!gameOver) return null;
  return (
    <div className="win-overlay">
      <div className="win-box">
        <span className="win-ico">
          {gameOver.winner === "king" ? "👑"
            : gameOver.winner === "rebel" ? "⚔️"
            : gameOver.winner === "traitor" ? "🗡️" : "🏆"}
        </span>
        <div className="win-title">เกมจบแล้ว!</div>
        <div className="win-sub">ผู้ชนะ: {gameOver.players?.map(p => p.name).join(", ")}</div>
        <div className="win-reason">{gameOver.reason}</div>
        <button className="tb-btn primary" style={{ width: "100%", padding: "12px" }}
          onClick={() => onLeave ? onLeave() : window.location.reload()}>
          🏠 กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
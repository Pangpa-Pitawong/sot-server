// src/game/components/TopBar.jsx
export default function TopBar({ phase, phaseStep, currentPlayer, isMyTurn, onEndTurn, onCenter, onToggleRules, onLeave }) {
  return (
    <div className="top-bar">
      <span className="tb-title">♛ บัลลังก์เงา</span>
      <div className="tb-divider" />
      {/* Phase track */}
      <div className="phase-track">
        {[1,2,3,4,5,6].map(n => (
          <span key={n}>
            <div className={`phase-dot ${phase > n ? "done" : phase === n ? "current" : ""}`}>{n}</div>
            {n < 6 && <div className={`phase-line ${phase > n ? "done" : ""}`} />}
          </span>
        ))}
      </div>
      <div className="tb-divider" />
      <span className="tb-turn">เทิร์น {phaseStep + 1}</span>
      <div className="tb-current">{currentPlayer?.ico} {currentPlayer?.name} {isMyTurn ? "(คุณ)" : ""}</div>
      <div className="tb-spacer" />
      <button className="tb-btn" onClick={onCenter}>⊕ กลาง</button>
      <button className="tb-btn" onClick={onToggleRules}>📖 กฎ</button>
      {isMyTurn && <button className="tb-btn primary" onClick={onEndTurn}>⏭ จบเทิร์น</button>}
      {onLeave && <button className="tb-btn danger" onClick={onLeave}>✕ ออก</button>}
    </div>
  );
}
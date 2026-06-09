// src/game/components/BottomBar.jsx
import HandCard from "./HandCard.jsx";

export default function BottomBar({
  me, isMyTurn, currentPlayer, phase,
  actionsDone, actionMode, selectedCard,
  onMove, onAttack, onUseCard, onEndTurn,
  onSelectCard, setTooltip
}) {
  return (
    <div className="bottom-bar">
      <div className="action-row">
        <button className={`act-btn ${actionsDone.moved ? "done" : actionMode === "move" ? "active-mode" : ""}`}
          disabled={!isMyTurn || actionsDone.moved} onClick={onMove}>
          <span className="act-ico">🚶</span>
          <span>เดิน</span>
          <span className="act-label">{actionsDone.moved ? "✓" : `ระยะ ${me?.move || 3}`}</span>
        </button>
        <button className={`act-btn ${actionsDone.attacked ? "done" : actionMode === "attack" ? "active-mode" : ""}`}
          disabled={!isMyTurn || actionsDone.attacked} onClick={onAttack}>
          <span className="act-ico">⚔️</span>
          <span>โจมตี</span>
          <span className="act-label">{actionsDone.attacked ? "✓" : `ATK ${me?.atk || 0}`}</span>
        </button>
        <button className={`act-btn ${actionsDone.usedItem ? "done" : actionMode === "card" ? "active-mode" : ""}`}
          disabled={!isMyTurn || actionsDone.usedItem || !selectedCard} onClick={onUseCard}>
          <span className="act-ico">🃏</span>
          <span>ใช้การ์ด</span>
          <span className="act-label">{actionsDone.usedItem ? "✓" : selectedCard ? `"${selectedCard.name}"` : "เลือกก่อน"}</span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"0 12px",borderLeft:"1px solid rgba(201,168,76,.1)" }}>
          <span style={{ fontSize:"9px",color:"var(--txt-m)" }}>เฟส</span>
          <span style={{ fontFamily:"'Cinzel',serif",color:"var(--gold)",fontSize:"16px" }}>{phase}/6</span>
        </div>
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"0 12px",borderLeft:"1px solid rgba(201,168,76,.1)" }}>
          <span style={{ fontSize:"9px",color:"var(--txt-m)" }}>ทอง</span>
          <span style={{ color:"var(--gold-l)",fontSize:"16px" }}>💰 {me?.gold || 0}</span>
        </div>
        {isMyTurn
          ? <button className="tb-btn primary" style={{ margin:"4px 8px",alignSelf:"center" }} onClick={onEndTurn}>⏭ จบเทิร์น</button>
          : <div style={{ padding:"0 12px",fontSize:"11px",color:"var(--txt-m)" }}>รอ {currentPlayer?.name}...</div>
        }
      </div>
      {/* Hand cards */}
      <div className="hand-area">
        {me?.hand?.map((card, ci) => (
          <HandCard
            key={card.uid || ci}
            card={card}
            isSelected={selectedCard?.uid === card.uid}
            isMyTurn={isMyTurn}
            onSelect={onSelectCard}
            onHover={e => setTooltip({ x: e.clientX + 10, y: e.clientY - 80, title: card.name, desc: card.desc || "" })}
            onLeave={() => setTooltip(null)}
          />
        ))}
        {(!me?.hand || me.hand.length === 0) && (
          <div style={{ color:"var(--txt-d)",fontSize:"11px",padding:"0 12px" }}>ไม่มีการ์ดในมือ</div>
        )}
      </div>
    </div>
  );
}
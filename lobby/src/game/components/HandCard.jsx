// src/game/components/HandCard.jsx
import { WEAPON_CARDS, MAGIC_CARDS, TRAP_CARDS } from "../constants/cards.js";

export default function HandCard({ card, isSelected, isMyTurn, onSelect, onHover, onLeave }) {
  const isWeapon = WEAPON_CARDS.some(w => w.id === card.id);
  const isMagic  = MAGIC_CARDS.some(m => m.id === card.id);
  const rarity   = card.rarity || "common";

  return (
    <div
      className={`hand-card ${isSelected ? "selected" : ""}`}
      onClick={() => isMyTurn && onSelect(isSelected ? null : card)}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <span className={`card-rarity rarity-${rarity}`}>
        {rarity === "divine" ? "✦" : rarity === "rare" ? "◆" : rarity === "secret" ? "★" : "·"}
      </span>
      <span className="card-ico">{card.ico}</span>
      <div className="card-nm">{card.name}</div>
      <div className="card-desc">{card.desc}</div>
      <div style={{ fontSize: "8px", marginTop: "3px", color: "var(--txt-d)" }}>
        {isWeapon ? "🗡️ อาวุธ" : isMagic ? "🔮 เวทย์" : "🪤 กับดัก"}
      </div>
    </div>
  );
}
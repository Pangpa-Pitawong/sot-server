// src/game/components/PlayerCard.jsx
import { CLASSES } from "../constants/classes.js";
import { ROLES }   from "../constants/roles.js";

export default function PlayerCard({ player, isCurrentTurn, isMe, onHover, onLeave }) {
  const cls  = CLASSES[player.classId];
  const role = ROLES[player.role];
  return (
    <div
      className={`pcard ${isCurrentTurn ? "active" : ""} ${!player.alive ? "dead" : ""} ${isMe ? "me" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {isCurrentTurn && <div className="turn-indicator" />}
      <div className="p-head">
        <div className="p-ico" style={{ background: cls?.color + "33", border: `1px solid ${cls?.color}60` }}>
          {player.alive ? cls?.ico : "💀"}
        </div>
        <div>
          <div className="p-name">{player.name}{isMe ? " (คุณ)" : ""}</div>
          <span className={`p-role tag tag-${player.role}`}>{role?.ico} {role?.name}</span>
        </div>
      </div>
      {/* HP/MP bars */}
      <div className="p-bars">
        <div className="bar-row">
          <span>❤</span>
          <div className="bar-track">
            <div className="bar-fill bar-hp" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
          </div>
          <span>{player.hp}/{player.maxHp}</span>
        </div>
        <div className="bar-row">
          <span>💧</span>
          <div className="bar-track">
            <div className="bar-fill bar-mp" style={{ width: `${(player.mana / player.maxMana) * 100}%` }} />
          </div>
          <span>{player.mana}/{player.maxMana}</span>
        </div>
      </div>
      {/* Stats grid */}
      <div className="p-stats">
        <div className="p-stat"><span>ATK</span><span>{player.atk}</span></div>
        <div className="p-stat"><span>DEF</span><span>{player.def}</span></div>
        <div className="p-stat"><span>SPD</span><span>{player.move}</span></div>
        <div className="p-stat"><span>💰</span><span>{player.gold}</span></div>
      </div>
      {/* Status effects */}
      {player.statusEffects?.length > 0 && (
        <div className="status-row">
          {player.statusEffects.map((s, si) => (
            <span key={si} className={`status-tag status-${s.type}`}>{s.type} {s.duration}t</span>
          ))}
        </div>
      )}
    </div>
  );
}
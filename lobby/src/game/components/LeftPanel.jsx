// src/game/components/LeftPanel.jsx
import PlayerCard from "./PlayerCard.jsx";
import { ROLES } from "../constants/roles.js";

export default function LeftPanel({ players, currentTurn, myIdx, me, setTooltip }) {
  return (
    <div className="left-panel">
      <div className="sec">
        <div className="sec-hdr">👥 ผู้เล่น</div>
        {players.map((p, i) => (
          <PlayerCard
            key={i}
            player={p}
            isCurrentTurn={currentTurn === i}
            isMe={i === myIdx}
            onHover={e => setTooltip({ x: e.clientX + 10, y: e.clientY + 10,
              title: p.name, desc: `${ROLES[p.role]?.name} — ${ROLES[p.role]?.win}` })}
            onLeave={() => setTooltip(null)}
          />
        ))}
      </div>
      <div className="sec">
        <div className="sec-hdr">🎯 เป้าหมาย</div>
        <div className="info-box">
          {me && (
            <div className="objectives">
              <div className="obj-row obj-active">
                <span>{ROLES[me.role]?.ico}</span>
                <span>{ROLES[me.role]?.win}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
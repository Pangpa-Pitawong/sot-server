// src/game/components/RightPanel.jsx
export default function RightPanel({ log }) {
  return (
    <div className="right-panel">
      <div className="sec">
        <div className="sec-hdr">📜 บันทึกเหตุการณ์</div>
      </div>
      <div className="log-area">
        {log.map((entry, i) => (
          <div key={i} className={`log-entry ${entry.type}`}>{entry.msg}</div>
        ))}
      </div>
    </div>
  );
}
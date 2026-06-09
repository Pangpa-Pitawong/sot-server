// src/game/components/overlays/Tooltip.jsx
export default function Tooltip({ tooltip }) {
  if (!tooltip) return null;
  return (
    <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      <div className="tooltip-title">{tooltip.title}</div>
      <div className="tooltip-desc">{tooltip.desc}</div>
    </div>
  );
}
// src/game/components/overlays/DiceAnimation.jsx
export default function DiceAnimation({ roll }) {
  if (roll === null) return null;
  const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
  return <div className="dice-anim">{faces[roll - 1] || "🎲"}</div>;
}
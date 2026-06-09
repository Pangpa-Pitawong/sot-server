// src/game/components/overlays/EventBanner.jsx
export default function EventBanner({ event }) {
  if (!event) return null;
  return (
    <div className="event-banner">
      <span className="ev-ico">{event.ico}</span>
      <div className="ev-name">{event.name}</div>
      <div className="ev-desc">{event.desc}</div>
    </div>
  );
}
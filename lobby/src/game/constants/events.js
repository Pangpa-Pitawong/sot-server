// src/game/constants/events.js
export const PHASE_EVENTS = [
  { id: "harvest",  name: "วันเก็บเกี่ยว",  ico: "🌾", desc: "ทุกคนได้ทอง +2",              fx: "gold_all" },
  { id: "holy_day", name: "วันศักดิ์สิทธิ์", ico: "🌟", desc: "ทุกคนฟื้น HP +3",             fx: "heal_all" },
  { id: "ghost",    name: "ขบวนทัพผี",       ico: "👻", desc: "ทุกคนเสีย HP -2",             fx: "dmg_all" },
  { id: "storm",    name: "พายุฝน",          ico: "⛈️", desc: "ทุกคนทิ้งอาวุธ 1 ใบ",        fx: "discard_weapon" },
  { id: "war_drum", name: "กลองศึก",         ico: "🥁", desc: "ทุกคน +1 ATK รอบนี้",         fx: "atk_all" },
  { id: "dragon",   name: "มังกรบุก",        ico: "🐉", desc: "ทุกคนเสียอาวุธ ATK<3",        fx: "discard_weak" },
  { id: "assassin", name: "นักฆ่าลึกลับ",   ico: "🗡️", desc: "ผู้เล่น HP มากสุดเสีย HP-3", fx: "dmg_highest" },
];
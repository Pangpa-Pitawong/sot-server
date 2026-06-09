import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════
// CONSTANTS & DATA
// ══════════════════════════════════════════════

const ROLES = {
  king: { id: "king", ico: "👑", name: "พระราชา", color: "#c9a84c", hp: 16, desc: "รักษาบัลลังก์และปกป้องอาณาจักร", win: "ครองราชย์ครบ 6 เฟส หรือปราบกบฏทั้งหมด" },
  rebel: { id: "rebel", ico: "⚔️", name: "กบฏ", color: "#c94040", hp: 13, desc: "โค่นบัลลังก์ด้วยการรวมกำลัง", win: "ราชา HP=0 หรือยึดศาลบัลลังก์ 2 เฟส" },
  traitor: { id: "traitor", ico: "🗡️", name: "คนทรยศ", color: "#8c4cc9", hp: 10, desc: "ซ่อนตัวสะสมสมบัติลับ", win: "สมบัติ 5 ชิ้น หรือรอดคนสุดท้าย" },
  commoner: { id: "commoner", ico: "🧑", name: "ราษฎร", color: "#4cc94c", hp: 11, desc: "สะสมทรัพย์สินเอาตัวรอด", win: "ทอง 10 เหรียญ หรือ Lv.5" },
};

const CLASSES = {
  warrior: { id: "warrior", ico: "⚔️", name: "นักรบ", color: "#e05050", hp: 12, mana: 4, move: 3, atk: 3, def: 1 },
  knight: { id: "knight", ico: "🛡️", name: "อัศวิน", color: "#5080e0", hp: 14, mana: 5, move: 2, atk: 2, def: 3 },
  mage: { id: "mage", ico: "🔮", name: "นักเวทย์", color: "#9050e0", hp: 7, mana: 14, move: 2, atk: 5, def: 0 },
  archer: { id: "archer", ico: "🏹", name: "นักธนู", color: "#50c050", hp: 9, mana: 6, move: 4, atk: 4, def: 1 },
  rogue: { id: "rogue", ico: "🗡️", name: "โจร", color: "#c0a030", hp: 9, mana: 7, move: 5, atk: 3, def: 1 },
  cleric: { id: "cleric", ico: "✨", name: "นักบวช", color: "#e0c040", hp: 10, mana: 10, move: 2, atk: 1, def: 2 },
};

// Terrain types
const TERRAIN = {
  plains: { id: "plains", name: "ที่ราบ", ico: "🌿", color: "#2d5a27", dark: "#1a3a18", moveCost: 1 },
  forest: { id: "forest", name: "ป่า", ico: "🌲", color: "#1a4a1a", dark: "#0d2e0d", moveCost: 2 },
  mountain: { id: "mountain", name: "ภูเขา", ico: "⛰️", color: "#4a4040", dark: "#2e2828", moveCost: 3 },
  water: { id: "water", name: "แม่น้ำ", ico: "🌊", color: "#1a3a5a", dark: "#0d2438", moveCost: 99 },
  desert: { id: "desert", name: "ทะเลทราย", ico: "🏜️", color: "#6a5a30", dark: "#4a3e20", moveCost: 2 },
  swamp: { id: "swamp", name: "หนองน้ำ", ico: "🌿", color: "#2a4a30", dark: "#182e1e", moveCost: 3 },
};

// Special zones
const SPECIAL_ZONES = {
  palace: { name: "พระราชวัง", ico: "🏰", effect: "king_buff", desc: "ราชา HP+3 ทุกเฟส" },
  throne: { name: "ศาลบัลลังก์", ico: "⚖️", effect: "throne", desc: "ราชา HP+3 / กบฏ HP-2" },
  village: { name: "หมู่บ้าน", ico: "🏘️", effect: "heal", desc: "ฟื้น HP+2 เมื่อยืน" },
  market: { name: "ตลาดกลาง", ico: "🏪", effect: "trade", desc: "ซื้อขายการ์ดได้" },
  rebel_camp: { name: "ค่ายกบฏ", ico: "⛺", effect: "rebel_buff", desc: "กบฏ ATK+2 HP+2" },
  dark_forest: { name: "ป่าดำ", ico: "🌑", effect: "trap", desc: "สามารถซ่อนตัวได้" },
  dungeon: { name: "คุก", ico: "🗝️", effect: "loot", desc: "หาสมบัติ แต่เสี่ยงอันตราย" },
  tower: { name: "หอเวทย์", ico: "🗼", effect: "magic", desc: "จั่วเวทย์ฟรี 1 ใบ" },
  shrine: { name: "ศาลเจ้า", ico: "⛩️", effect: "full_heal", desc: "ฟื้น HP เต็ม 1 ครั้ง/เกม" },
  cave: { name: "ถ้ำมังกร", ico: "🐉", effect: "treasure", desc: "ทอง+3 แต่เสี่ยง HP-3" },
};

// Cards data
const WEAPON_CARDS = [
  { id: "sword_king", name: "ดาบแห่งกษัตริย์", ico: "⚔️", rarity: "divine", atk: 2, desc: "ATK+2 (ราชา ATK+4)", effect: "king_only" },
  { id: "fire_spear", name: "หอกปลายเพลิง", ico: "🔱", rarity: "divine", atk: 3, desc: "ทะลุเกราะ + เผา 1 เทิร์น", effect: "burn" },
  { id: "ice_bow", name: "ธนูคริสตัลน้ำแข็ง", ico: "🏹", rarity: "divine", atk: 2, desc: "แช่แข็งเป้า 1 เทิร์น", effect: "freeze" },
  { id: "dagger", name: "มีดลอบสังหาร", ico: "🗡️", rarity: "common", atk: 1, desc: "โจมตีหลัง ATK+3", effect: "backstab" },
  { id: "battle_axe", name: "ขวานสองคม", ico: "🪓", rarity: "common", atk: 3, desc: "ATK+3 เสีย HP1", effect: "self_dmg" },
  { id: "dragon_armor", name: "เกราะเงินมังกร", ico: "🛡️", rarity: "divine", def: 2, desc: "ลด DMG -2 ทุกครั้ง", effect: "def" },
  { id: "oak_shield", name: "โล่ไม้โอ๊ค", ico: "🛡️", rarity: "common", def: 1, desc: "ป้องกัน ฟื้น HP+1", effect: "def_heal" },
  { id: "thorn_armor", name: "เกราะหนามเหล็ก", ico: "🔰", rarity: "common", def: 0, desc: "ผู้โจมตีเสีย HP1", effect: "reflect" },
  { id: "war_hammer", name: "ค้อนราชันย์", ico: "🔨", rarity: "secret", atk: 5, desc: "ATK+5 สั่นสะเทือนรอบข้าง", effect: "aoe" },
  { id: "blood_sword", name: "ดาบเลือดสาบาน", ico: "💀", rarity: "secret", atk: 6, desc: "เสีย HP2 → ATK+6", effect: "blood" },
];

const MAGIC_CARDS = [
  { id: "hellfire", name: "ไฟนรก", ico: "🔥", rarity: "rare", dmg: 6, desc: "DMG 6 เป้าเดี่ยว", cost: 3 },
  { id: "ice_storm", name: "พายุน้ำแข็ง", ico: "❄️", rarity: "rare", dmg: 3, desc: "แช่แข็ง 1 เทิร์น", cost: 2 },
  { id: "lightning", name: "สายฟ้า", ico: "⚡", rarity: "divine", dmg: 3, desc: "DMG 3 ทุกศัตรู", cost: 5 },
  { id: "holy_heal", name: "แสงศักดิ์สิทธิ์", ico: "✨", rarity: "rare", heal: 5, desc: "ฟื้น HP+5", cost: 3 },
  { id: "dark_curse", name: "คำสาปเงา", ico: "🌑", rarity: "rare", dmg: 0, desc: "ATK ศัตรู -2 เป็น 2 เทิร์น", cost: 2 },
  { id: "time_stop", name: "หยุดเวลา", ico: "⏳", rarity: "divine", dmg: 0, desc: "ศัตรูพลาดเทิร์นถัดไป", cost: 0, once: true },
  { id: "warp", name: "วาร์ปหลบ", ico: "🌀", rarity: "rare", dmg: 0, desc: "เทเลพอร์ตไปพื้นที่ใดก็ได้", cost: 3 },
  { id: "amrita", name: "น้ำอมฤต", ico: "💧", rarity: "divine", heal: 99, desc: "ฟื้น HP เต็ม 1 ครั้ง/เกม", cost: 0, once: true },
];

const TRAP_CARDS = [
  { id: "iron_pit", name: "หลุมหนาม", ico: "🕳️", dmg: 3, desc: "DMG -3 ทันที" },
  { id: "poison", name: "พิษจากรากเถาวัลย์", ico: "☠️", dmg: 1, desc: "ติดพิษ -1HP/เทิร์น 3 เทิร์น", poison: 3 },
  { id: "net", name: "ตาข่าย", ico: "🕸️", dmg: 0, desc: "ล็อค 1 เทิร์น", lock: 1 },
  { id: "bomb", name: "ระเบิดควัน", ico: "💨", dmg: 0, desc: "ตาบอด 2 เทิร์น", blind: 2 },
  { id: "spikes", name: "กงเล็บเหล็ก", ico: "⚙️", dmg: 2, desc: "ทำลายเกราะ + DMG -2", destroy_armor: true },
];

// Phase events
const PHASE_EVENTS = [
  { id: "harvest", name: "วันเก็บเกี่ยว", ico: "🌾", desc: "ทุกคนได้ทอง +2", fx: "gold_all" },
  { id: "holy_day", name: "วันศักดิ์สิทธิ์", ico: "🌟", desc: "ทุกคนฟื้น HP +3", fx: "heal_all" },
  { id: "ghost", name: "ขบวนทัพผี", ico: "👻", desc: "ทุกคนเสีย HP -2", fx: "dmg_all" },
  { id: "storm", name: "พายุฝน", ico: "⛈️", desc: "ทุกคนทิ้งอาวุธ 1 ใบ", fx: "discard_weapon" },
  { id: "war_drum", name: "กลองศึก", ico: "🥁", desc: "ทุกคน +1 ATK รอบนี้", fx: "atk_all" },
  { id: "dragon", name: "มังกรบุก", ico: "🐉", desc: "ทุกคนเสียอาวุธ ATK<3", fx: "discard_weak" },
  { id: "assassin", name: "นักฆ่าลึกลับ", ico: "🗡️", desc: "ผู้เล่น HP มากสุดเสีย HP-3", fx: "dmg_highest" },
];

// ══════════════════════════════════════════════
// MAP GENERATION
// ══════════════════════════════════════════════

function generateHexMap(cols = 9, rows = 7) {
  const terrainPool = ["plains", "plains", "plains", "plains", "forest", "forest", "mountain", "water", "desert", "swamp"];
  const cells = [];

  // Special zones to place
  const specialPlaces = [
    { zone: "palace", fixed: { col: 4, row: 0 } },
    { zone: "throne", fixed: { col: 4, row: 1 } },
    { zone: "village", fixed: null },
    { zone: "market", fixed: { col: 4, row: 3 } },
    { zone: "rebel_camp", fixed: null },
    { zone: "dark_forest", fixed: null },
    { zone: "tower", fixed: null },
    { zone: "shrine", fixed: null },
    { zone: "cave", fixed: null },
    { zone: "dungeon", fixed: null },
  ];

  // Fixed positions
  const fixedMap = {};
  specialPlaces.forEach(sp => {
    if (sp.fixed) fixedMap[`${sp.fixed.col},${sp.fixed.row}`] = sp.zone;
  });

  // Random special positions (not overlapping fixed)
  const randomSpecials = specialPlaces.filter(sp => !sp.fixed);
  const usedPositions = new Set(Object.keys(fixedMap));

  randomSpecials.forEach(sp => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const c = Math.floor(Math.random() * cols);
      const r = Math.floor(Math.random() * rows);
      const key = `${c},${r}`;
      if (!usedPositions.has(key) && !(c === 4 && r <= 1)) {
        fixedMap[key] = sp.zone;
        usedPositions.add(key);
        placed = true;
      }
      attempts++;
    }
  });

  // Generate cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = `${col},${row}`;
      const specialZone = fixedMap[key] || null;

      let terrain;
      if (specialZone === "palace" || specialZone === "throne") terrain = "plains";
      else if (specialZone === "dark_forest" || specialZone === "rebel_camp") terrain = "forest";
      else if (specialZone === "cave") terrain = "mountain";
      else if (specialZone === "shrine") terrain = "plains";
      else terrain = terrainPool[Math.floor(Math.random() * terrainPool.length)];

      // Water borders
      if ((col === 0 || col === cols - 1) && Math.random() < 0.3) terrain = "water";
      if ((row === 0 || row === rows - 1) && Math.random() < 0.2) terrain = "water";

      // Palace always plains
      if (specialZone === "palace") terrain = "plains";

      cells.push({ col, row, key, terrain, specialZone, players: [], trap: null, item: null });
    }
  }
  return cells;
}

// Hex pixel position (flat-top)
function hexToPixel(col, row, size = 52) {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = col * (w * 0.75) + 60;
  const y = row * h + (col % 2 === 1 ? h / 2 : 0) + 50;
  return { x, y };
}

// Hex distance
function hexDistance(a, b) {
  const ac = a.col - (a.row - (a.row & 1)) / 2;
  const ar = a.row;
  const bc = b.col - (b.row - (b.row & 1)) / 2;
  const br = b.row;
  const dx = bc - ac, dy = br - ar;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx - dy));
}

// Get neighbors
function getNeighbors(col, row, cells, cols = 9, rows = 7) {
  const isOdd = col % 2 === 1;
  const dirs = isOdd
    ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
    : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  return dirs
    .map(([dc, dr]) => cells.find(c => c.col === col + dc && c.row === row + dr))
    .filter(Boolean)
    .filter(c => c.terrain !== "water");
}

// BFS reachable cells
function getReachable(startCell, steps, cells) {
  if (steps <= 0) return [];
  const visited = new Map([[startCell.key, 0]]);
  const queue = [{ cell: startCell, steps: 0 }];
  const reachable = [];
  while (queue.length) {
    const { cell, steps: s } = queue.shift();
    if (s >= steps) continue;
    const neighbors = getNeighbors(cell.col, cell.row, cells);
    for (const n of neighbors) {
      const moveCost = TERRAIN[n.terrain]?.moveCost || 1;
      const newSteps = s + moveCost;
      if (!visited.has(n.key) || visited.get(n.key) > newSteps) {
        visited.set(n.key, newSteps);
        if (newSteps <= steps) {
          reachable.push(n);
          queue.push({ cell: n, steps: newSteps });
        }
      }
    }
  }
  return [...new Set(reachable)];
}

// ══════════════════════════════════════════════
// GAME STATE
// ══════════════════════════════════════════════

function createPlayers(playerData) {
  return playerData.map((p, i) => {
    const cls = CLASSES[p.classId] || CLASSES.warrior;
    const role = ROLES[p.role] || ROLES.commoner;
    return {
      id: i,
      name: p.name,
      role: p.role,
      classId: p.classId,
      color: cls.color,
      ico: cls.ico,
      hp: cls.hp,
      maxHp: cls.hp,
      mana: cls.mana,
      maxMana: cls.mana,
      atk: cls.atk,
      def: cls.def,
      move: cls.move,
      gold: 4,
      level: 1,
      exp: 0,
      hand: [],
      alive: true,
      statusEffects: [],
      col: 0,
      row: 0,
      revealed: false,
    };
  });
}

function dealStartingCards() {
  const allCards = [...WEAPON_CARDS, ...MAGIC_CARDS, ...TRAP_CARDS];
  const hand = [];
  for (let i = 0; i < 4; i++) {
    hand.push({ ...allCards[Math.floor(Math.random() * allCards.length)], uid: Math.random() });
  }
  return hand;
}
function spawnPlayers(players, cells) {
  const maxCol = Math.max(...cells.map(c => c.col));
  const maxRow = Math.max(...cells.map(c => c.row));

  // หาช่องขอบแมพทั้งหมด
  const edgeCells = cells.filter(cell =>
    cell.terrain !== "water" &&
    (
      cell.col === 0 ||
      cell.row === 0 ||
      cell.col === maxCol ||
      cell.row === maxRow
    )
  );

  // สุ่มลำดับ
  const shuffled = [...edgeCells].sort(() => Math.random() - 0.5);

  return players.map((player, index) => {
    const cell = shuffled[index];

    return {
      ...player,
      col: cell.col,
      row: cell.row
    };
  });
}

// ══════════════════════════════════════════════
// CSS
// ══════════════════════════════════════════════
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@400&family=Sarabun:wght@300;400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#c9a84c;--gold-l:#f0d080;--gold-d:#6a4010;--gold-f:rgba(201,168,76,.08);
  --stone:#0a0908;--s2:#141210;--s3:#1e1b16;--s4:#28241c;--s5:#322d24;
  --txt:#e8d5b0;--txt-m:#7a6848;--txt-d:#3d3528;
  --green:#4cc94c;--red:#c94040;--blue:#4080c9;--purple:#8c4cc9;
}
html,body,#root{width:100%;height:100%;overflow:hidden;background:var(--stone)}
body{font-family:'Sarabun',sans-serif;font-size:13px;color:var(--txt)}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--gold-d);border-radius:2px}

/* ── LAYOUT ── */
.game-root{display:grid;grid-template-columns:220px 220px 1fr;grid-template-rows:52px 1fr 200px;height:100vh;gap:0}
.top-bar{grid-column:1/-1;background:var(--s2);border-bottom:1px solid rgba(201,168,76,.2);display:flex;align-items:center;gap:12px;padding:0 16px;z-index:10}
.left-panel{grid-column:1;grid-row:2/4;background:var(--s2);border-right:1px solid rgba(201,168,76,.12);overflow-y:auto;padding:10px}
.map-area{grid-column:3;grid-row:2/3;background:var(--stone);overflow:hidden;position:relative;cursor:grab}
.map-area:active{cursor:grabbing}
.bottom-bar{grid-column:3;grid-row:3/4;background:var(--s2);border-top:1px solid rgba(201,168,76,.12);overflow:hidden;display:flex;flex-direction:column}
.right-panel{grid-column:2;grid-row:2/4;background:var(--s2);border-right:1px solid rgba(201,168,76,.12);overflow-y:auto;padding:10px}

/* ── TOP BAR ── */
.tb-title{font-family:'Cinzel Decorative',serif;font-size:16px;color:var(--gold);letter-spacing:.06em;flex:0 0 auto}
.tb-divider{width:1px;height:28px;background:rgba(201,168,76,.2)}
.tb-phase{font-family:'Cinzel',serif;font-size:11px;color:var(--gold-l);letter-spacing:.1em}
.tb-turn{font-size:12px;color:var(--txt-m)}
.tb-current{background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.25);border-radius:20px;padding:3px 12px;font-size:12px;color:var(--gold)}
.tb-spacer{flex:1}
.tb-btn{background:rgba(201,168,76,.08);color:var(--gold-l);border:1px solid rgba(201,168,76,.2);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-family:'Sarabun',sans-serif;transition:all .15s}
.tb-btn:hover{background:rgba(201,168,76,.18);border-color:var(--gold)}
.tb-btn.primary{background:linear-gradient(135deg,var(--gold-d),var(--gold));color:#0a0908;font-weight:700;border:none}
.tb-btn.primary:hover{filter:brightness(1.1)}
.tb-btn.danger{background:rgba(139,26,26,.5);color:#ffaaaa;border-color:rgba(139,26,26,.7)}
.tb-btn:disabled{opacity:.3;cursor:not-allowed}

/* ── SECTION ── */
.sec{margin-bottom:12px}
.sec-hdr{font-family:'Cinzel',serif;font-size:10px;letter-spacing:.2em;color:var(--txt-m);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.sec-hdr::after{content:'';flex:1;height:1px;background:rgba(201,168,76,.1)}

/* ── PLAYER CARD ── */
.pcard{background:var(--s3);border:1px solid rgba(201,168,76,.1);border-radius:8px;padding:8px;margin-bottom:6px;cursor:pointer;transition:all .2s;position:relative}
.pcard:hover{border-color:rgba(201,168,76,.3);background:var(--s4)}
.pcard.active{border-color:var(--gold);background:var(--gold-f);box-shadow:0 0 12px rgba(201,168,76,.15)}
.pcard.dead{opacity:.4}
.pcard.me{border-color:var(--blue) !important}
.p-head{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.p-ico{font-size:20px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(0,0,0,.3);flex-shrink:0}
.p-name{font-size:12px;font-weight:600}
.p-role{font-size:9px;padding:1px 6px;border-radius:3px;display:inline-block}
.p-bars{display:flex;flex-direction:column;gap:3px}
.bar-row{display:flex;align-items:center;gap:5px;font-size:9px;color:var(--txt-m)}
.bar-row span{min-width:22px;text-align:right}
.bar-track{flex:1;height:6px;background:rgba(0,0,0,.4);border-radius:3px;overflow:hidden}
.bar-fill{height:100%;border-radius:3px;transition:width .3s}
.bar-hp{background:linear-gradient(90deg,#c94040,#e06060)}
.bar-mp{background:linear-gradient(90deg,#4060c9,#6080e0)}
.p-stats{display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:5px;font-size:9px;color:var(--txt-m)}
.p-stat{background:rgba(0,0,0,.2);padding:2px 4px;border-radius:3px;display:flex;justify-content:space-between}
.p-stat span:last-child{color:var(--txt)}
.turn-indicator{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold);animation:glow 1s ease-in-out infinite}
@keyframes glow{0%,100%{opacity:.6}50%{opacity:1}}

/* ── STATUS EFFECTS ── */
.status-row{display:flex;gap:3px;flex-wrap:wrap;margin-top:4px}
.status-tag{font-size:8px;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,.3)}
.status-burn{color:#ff8040;border:1px solid rgba(255,128,64,.3)}
.status-freeze{color:#80c0ff;border:1px solid rgba(128,192,255,.3)}
.status-poison{color:#80ff80;border:1px solid rgba(128,255,128,.3)}
.status-stun{color:#ffff80;border:1px solid rgba(255,255,128,.3)}

/* ── ACTION PANEL ── */
.action-row{display:flex;gap:6px;flex-wrap:wrap;padding:10px}
.act-btn{background:var(--s4);border:1px solid rgba(201,168,76,.15);border-radius:8px;padding:8px 12px;cursor:pointer;font-size:11px;color:var(--txt);font-family:'Sarabun',sans-serif;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:64px}
.act-btn:hover:not(:disabled){border-color:var(--gold);background:var(--gold-f);transform:translateY(-2px)}
.act-btn:disabled{opacity:.3;cursor:not-allowed}
.act-btn.done{border-color:var(--green);background:rgba(76,201,76,.08);color:var(--green)}
.act-btn.active-mode{border-color:var(--gold);background:var(--gold-f);box-shadow:0 0 10px rgba(201,168,76,.2)}
.act-ico{font-size:20px}
.act-label{font-size:9px;color:var(--txt-m)}
.act-used{font-size:8px;color:var(--green)}

/* ── HAND CARDS ── */
.hand-area{flex:1;overflow-x:auto;overflow-y:hidden;padding:10px;display:flex;align-items:center;gap:8px}
.hand-card{background:var(--s3);border:1.5px solid rgba(201,168,76,.15);border-radius:10px;padding:8px;cursor:pointer;transition:all .2s;text-align:center;min-width:70px;max-width:70px;flex-shrink:0;position:relative}
.hand-card:hover{border-color:var(--gold);background:var(--gold-f);transform:translateY(-6px);z-index:5}
.hand-card.selected{border-color:var(--gold);background:var(--gold-f);transform:translateY(-10px);box-shadow:0 8px 20px rgba(201,168,76,.3);z-index:6}
.hand-card .card-ico{font-size:22px;display:block;margin-bottom:3px}
.hand-card .card-nm{font-size:8px;color:var(--gold);font-family:'Cinzel',serif;line-height:1.2}
.hand-card .card-desc{font-size:7px;color:var(--txt-m);margin-top:2px;line-height:1.3}
.hand-card .card-rarity{font-size:7px;position:absolute;top:3px;right:3px;padding:1px 4px;border-radius:2px}
.rarity-common{background:rgba(150,150,150,.2);color:#aaa}
.rarity-rare{background:rgba(80,120,220,.2);color:#80a0ff}
.rarity-divine{background:rgba(200,160,40,.2);color:var(--gold)}
.rarity-secret{background:rgba(160,40,160,.2);color:#d080ff}

/* ── LOG ── */
.log-area{padding:10px;overflow-y:auto;flex:1}
.log-entry{font-size:10px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.04);color:var(--txt-m);line-height:1.5}
.log-entry.important{color:var(--txt)}
.log-entry.dmg{color:#ff8080}
.log-entry.heal{color:#80ff80}
.log-entry.event{color:var(--gold)}
.log-entry.death{color:#ff4040;font-weight:600}
.log-entry.win{color:var(--gold-l);font-size:12px;font-weight:700}

/* ── INFO BOX ── */
.info-box{background:var(--s3);border:1px solid rgba(201,168,76,.15);border-radius:8px;padding:8px;margin-bottom:8px;font-size:11px}
.info-title{font-family:'Cinzel',serif;font-size:10px;color:var(--gold);margin-bottom:5px}
.info-row{display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:10px}
.info-row:last-child{border:none}
.info-val{color:var(--txt)}

/* ── HEX MAP ── */
.hex-map-svg{overflow:visible}
.hex-cell{cursor:pointer;transition:filter .15s}
.hex-cell:hover .hex-bg{filter:brightness(1.3)}
.hex-bg{transition:all .2s}
.hex-reachable .hex-bg{filter:brightness(1.4);stroke:#4cc94c !important;stroke-width:2px !important}
.hex-attackable .hex-bg{filter:brightness(1.2);stroke:#c94040 !important;stroke-width:2px !important}
.hex-selected .hex-bg{stroke:var(--gold) !important;stroke-width:3px !important;filter:brightness(1.5)}
.hex-path .hex-bg{stroke:#80c0ff !important;stroke-width:2px !important;filter:brightness(1.3)}
.hex-label{font-size:8px;fill:rgba(255,255,255,.5);text-anchor:middle;dominant-baseline:middle;pointer-events:none}
.hex-zone-label{font-size:7px;fill:rgba(255,255,255,.7);text-anchor:middle;pointer-events:none}
.player-token{cursor:pointer;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6));transition:all .2s}
.player-token:hover{filter:drop-shadow(0 4px 8px rgba(201,168,76,.5)) brightness(1.2)}
.player-token.current-player{filter:drop-shadow(0 0 8px gold)}
.trap-marker{pointer-events:none}

/* ── TOOLTIP ── */
.tooltip{position:fixed;background:var(--s2);border:1px solid rgba(201,168,76,.3);border-radius:8px;padding:8px 10px;font-size:11px;pointer-events:none;z-index:999;max-width:180px;box-shadow:0 4px 20px rgba(0,0,0,.6)}
.tooltip-title{font-family:'Cinzel',serif;color:var(--gold);font-size:12px;margin-bottom:4px}
.tooltip-desc{color:var(--txt-m);line-height:1.5}

/* ── DICE ── */
.dice-anim{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:80px;z-index:500;animation:dice-roll .6s ease-out forwards;pointer-events:none}
@keyframes dice-roll{0%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(-180deg)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.3) rotate(0deg)}100%{opacity:0;transform:translate(-50%,-50%) scale(.8)}}

/* ── EVENT BANNER ── */
.event-banner{position:fixed;top:70px;left:50%;transform:translateX(-50%);background:rgba(13,11,8,.95);border:1px solid var(--gold);border-radius:12px;padding:14px 24px;text-align:center;z-index:400;animation:slide-down .4s ease-out;min-width:280px;max-width:400px}
@keyframes slide-down{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.event-banner .ev-ico{font-size:36px;display:block;margin-bottom:4px}
.event-banner .ev-name{font-family:'Cinzel',serif;color:var(--gold);font-size:16px;margin-bottom:4px}
.event-banner .ev-desc{font-size:12px;color:var(--txt-m)}

/* ── WIN SCREEN ── */
.win-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:1000}
.win-box{background:var(--s2);border:2px solid var(--gold);border-radius:16px;padding:32px;text-align:center;max-width:380px}
.win-ico{font-size:72px;display:block;margin-bottom:12px;animation:float 2s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.win-title{font-family:'Cinzel Decorative',serif;font-size:24px;color:var(--gold);margin-bottom:8px}
.win-sub{font-size:14px;color:var(--txt-m);margin-bottom:20px}
.win-reason{font-size:12px;color:var(--txt);background:var(--s3);padding:8px 14px;border-radius:8px;margin-bottom:20px}

/* ── PHASE BAR ── */
.phase-track{display:flex;gap:4px;align-items:center}
.phase-dot{width:24px;height:24px;border-radius:50%;border:1px solid rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--txt-m);transition:all .3s}
.phase-dot.done{background:var(--gold-d);border-color:var(--gold-d);color:var(--gold-l)}
.phase-dot.current{background:rgba(201,168,76,.2);border-color:var(--gold);color:var(--gold);box-shadow:0 0 8px rgba(201,168,76,.3)}
.phase-line{width:12px;height:1px;background:rgba(201,168,76,.2)}
.phase-line.done{background:var(--gold-d)}

/* ── MOBILE GUARD ── */
.mobile-msg{display:none;position:fixed;inset:0;background:var(--stone);align-items:center;justify-content:center;text-align:center;padding:24px;z-index:9999}
@media(max-width:900px){.mobile-msg{display:flex}.game-root{display:none}}

/* ── MISC ── */
.gold-text{color:var(--gold)}
.tag{font-size:9px;padding:1px 6px;border-radius:3px}
.tag-king{background:rgba(201,168,76,.2);color:var(--gold)}
.tag-rebel{background:rgba(201,64,64,.2);color:#ff8080}
.tag-traitor{background:rgba(140,76,201,.2);color:#c080ff}
.tag-commoner{background:rgba(76,201,76,.2);color:#80ff80}
.objectives{font-size:10px;color:var(--txt-m);line-height:1.8}
.obj-row{display:flex;align-items:center;gap:5px;padding:2px 0}
.obj-done{color:var(--green)}
.obj-active{color:var(--gold)}
`;

// ══════════════════════════════════════════════
// HEX SVG HELPERS
// ══════════════════════════════════════════════

function hexPoints(cx, cy, size) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return points.join(" ");
}

const TERRAIN_COLORS = {
  plains: "#2d5a27",
  forest: "#1a4a1a",
  mountain: "#4a4040",
  water: "#1a3a5a",
  desert: "#6a5a30",
  swamp: "#2a4a30",
};
const TERRAIN_STROKE = {
  plains: "#3a7a35",
  forest: "#254a25",
  mountain: "#5a5050",
  water: "#254a6a",
  desert: "#7a6a40",
  swamp: "#3a5a40",
};

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════

export default function GameBoard({ roomData, myIdx = 0, onLeave }) {
  // Demo mode if no roomData
  const defaultPlayers = [
    { name: "ฝาง (คุณ)", classId: "warrior", role: "king" },
    { name: "ห่อง", classId: "mage", role: "rebel" },
    { name: "ชัย", classId: "archer", role: "rebel" },
    { name: "นน", classId: "cleric", role: "commoner" },
  ];
  const initPlayers = roomData?.players?.map((p, i) => ({
    name: p.name,
    classId: p.class || "warrior",
    role: roomData.roles?.[i] || ["king", "rebel", "rebel", "commoner"][i % 4],
  })) || defaultPlayers;

  // MAP
  const [cells, setCells] = useState(() => generateHexMap(13, 11));
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] =  useState(1);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const mapAreaRef = useRef(null);

  // GAME STATE
  const [players, setPlayers] = useState(() => {
    const ps = spawnPlayers(createPlayers(initPlayers), cells);
    return ps.map(p => ({ ...p, hand: dealStartingCards() }));
  });
  const [currentTurn, setCurrentTurn] = useState(0);   // player idx
  const [phase, setPhase] = useState(1);
  const [phaseStep, setPhaseStep] = useState(0);        // turn within phase
  const [actionsDone, setActionsDone] = useState({ moved: false, attacked: false, usedItem: false });
  const [actionMode, setActionMode] = useState(null);   // "move" | "attack" | "card" | "trap"
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [reachableCells, setReachableCells] = useState([]);
  const [attackableCells, setAttackableCells] = useState([]);
  const [log, setLog] = useState([{ msg: "🏰 เกมเริ่มต้น! โชคดีทุกคน", type: "event", time: Date.now() }]);
  const [gameOver, setGameOver] = useState(null);
  const [showDice, setShowDice] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [turnPhaseAnnounce, setTurnPhaseAnnounce] = useState(null);
  const [shopItems,setShopItems] = useState([]);

  const addLog = useCallback((msg, type = "") => {
    setLog(l => [{ msg, type, time: Date.now() }, ...l.slice(0, 99)]);
  }, []);

  // ── CENTER MAP ──
  const HEX_SIZE = 46;
  const MAP_COLS = 13;
const MAP_ROWS = 11;

const mapW =
 MAP_COLS * HEX_SIZE * 1.5 + 120;

const mapH =
 MAP_ROWS * HEX_SIZE * 1.73 + 120;
  const mapH = 7 * HEX_SIZE * 1.73 + 100;

  const centerMap = useCallback(() => {
    if (!mapAreaRef.current) return;
    const rect = mapAreaRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // not laid out yet
    setMapOffset({
      x: Math.round((rect.width - mapW) / 2),
      y: Math.round((rect.height - mapH) / 2),
    });
  }, [mapW, mapH]);

  // Center once after layout is fully painted, then watch for resize
  useEffect(() => {
    if (!mapAreaRef.current) return;
    // First center via ResizeObserver (fires once element has real size)
    const ro = new ResizeObserver(() => {
      centerMap();
      ro.disconnect(); // only need the first measurement
    });
    ro.observe(mapAreaRef.current);
    return () => ro.disconnect();
  }, [centerMap]);

  const me = players[myIdx];
  const currentPlayer = players[currentTurn];

  // ── MOVE CELLS CALC ──
  useEffect(() => {
    if (actionMode === "move" && !actionsDone.moved) {
      const cp = players[currentTurn];
      const startCell = cells.find(c => c.col === cp.col && c.row === cp.row);
      if (startCell) setReachableCells(getReachable(startCell, cp.move, cells));
    } else {
      setReachableCells([]);
    }
  }, [actionMode, actionsDone.moved, cells, players, currentTurn]);

  // ── ATTACK CELLS CALC ──
  useEffect(() => {
    if (actionMode === "attack" && !actionsDone.attacked) {
      const cp = players[currentTurn];
      const range = cp.classId === "archer" ? 4 : cp.classId === "mage" ? 3 : 1;
      const cpCell = { col: cp.col, row: cp.row };
      const inRange = cells.filter(c => {
        const dist = hexDistance(cpCell, c);
        return dist > 0 && dist <= range;
      });
      setAttackableCells(inRange);
    } else {
      setAttackableCells([]);
    }
  }, [actionMode, actionsDone.attacked, cells, players, currentTurn]);

  // ── CELL CLICK ──
  const handleCellClick = useCallback((cell) => {
    const cp = players[currentTurn];
    if (!debugMode && currentTurn !== myIdx)
 return;

    if (actionMode === "move") {
      const isReachable = reachableCells.some(c => c.key === cell.key);
      if (!isReachable) return;
      // Move
      setPlayers(ps => ps.map((p, i) => i === currentTurn ? { ...p, col: cell.col, row: cell.row } : p));
      setActionsDone(a => ({ ...a, moved: true }));
      setActionMode(null);
      addLog(`🚶 ${cp.name} เดินไปยัง ${cell.specialZone ? SPECIAL_ZONES[cell.specialZone]?.name : TERRAIN[cell.terrain]?.name}`, "");
      // Zone effect
      applyZoneEffect(cell, currentTurn);
    } else if (actionMode === "attack") {
      const target = players.find(p => p.alive && p.col === cell.col && p.row === cell.row && p.id !== currentTurn);
      if (!target) return;
      performAttack(currentTurn, target.id);
    } else if (actionMode === "card" && selectedCard) {
      // Use selected card at target
      useCard(selectedCard, cell, currentTurn);
      setSelectedCard(null);
      setActionMode(null);
    } else if (actionMode === "trap" && selectedCard) {
      // Place trap
      setCells(cs => cs.map(c => c.key === cell.key ? { ...c, trap: { ...selectedCard, ownerId: currentTurn } } : c));
      setPlayers(ps => ps.map((p, i) => i === currentTurn ? { ...p, hand: p.hand.filter(h => h.uid !== selectedCard.uid) } : p));
      setActionsDone(a => ({ ...a, usedItem: true }));
      setSelectedCard(null);
      setActionMode(null);
      addLog(`🪤 ${cp.name} วางกับดัก "${selectedCard.name}"`, "");
    }
    setSelectedCell(cell);
  }, [actionMode, currentTurn, myIdx, players, reachableCells, selectedCard]);

  // ── ZONE EFFECT ──
  const applyZoneEffect = useCallback((cell, playerIdx) => {
    if (!cell.specialZone) return;
    const zone = cell.specialZone;
    setPlayers(ps => ps.map((p, i) => {
      if (i !== playerIdx) return p;
      if (zone === "throne") {
        if (p.role === "king") { addLog(`⚖️ ${p.name} อยู่บนบัลลังก์ HP+3`, "heal"); return { ...p, hp: Math.min(p.maxHp, p.hp + 3) }; }
        if (p.role === "rebel") { addLog(`⚖️ ${p.name} บุกบัลลังก์ HP-2`, "dmg"); return { ...p, hp: Math.max(0, p.hp - 2) }; }
      }
      if (zone === "village") { addLog(`🏘️ ${p.name} ฟื้น HP+2`, "heal"); return { ...p, hp: Math.min(p.maxHp, p.hp + 2) }; }
      if (zone === "rebel_camp" && p.role === "rebel") { addLog(`⛺ กบฏ ATK+2 HP+2!`, "heal"); return { ...p, atk: p.atk + 2, hp: Math.min(p.maxHp, p.hp + 2) }; }
      if (zone === "cave") {
        const roll = Math.ceil(Math.random() * 6);
        setShowDice(roll);
        setTimeout(() => setShowDice(null), 800);
        if (roll >= 4) { addLog(`🐉 🎲${roll} หนีมังกรสำเร็จ! +3 ทอง`, "event"); return { ...p, gold: p.gold + 3 }; }
        else { addLog(`🐉 🎲${roll} โดนมังกร! HP-3`, "dmg"); return { ...p, hp: Math.max(0, p.hp - 3) }; }
      }
      if (zone === "tower") {
        const magic = MAGIC_CARDS[Math.floor(Math.random() * MAGIC_CARDS.length)];
        addLog(`🗼 ${p.name} ได้เวทย์ "${magic.name}"`, "event");
        return { ...p, hand: [...p.hand, { ...magic, uid: Math.random() }] };
      }
      if (zone === "shrine" && !p._shrineUsed) {
        addLog(`⛩️ ${p.name} ฟื้น HP เต็ม!`, "heal");
        return { ...p, hp: p.maxHp, _shrineUsed: true };
      }
      return p;
    }));
    // Check trap
    if (cell.trap && cell.trap.ownerId !== playerIdx) {
      const trap = cell.trap;
      addLog(`🪤 ${players[playerIdx].name} โดนกับดัก "${trap.name}"!`, "dmg");
      setPlayers(ps => ps.map((p, i) => {
        if (i !== playerIdx) return p;
        let hp = p.hp - (trap.dmg || 0);
        return { ...p, hp: Math.max(0, hp) };
      }));
      setCells(cs => cs.map(c => c.key === cell.key ? { ...c, trap: null } : c));
      // Reward trap owner
      addLog(`💰 ${players[trap.ownerId]?.name} ได้ EXP+2 จากกับดัก`, "");
    }
  }, [players, addLog]);

  // ── ATTACK ──
  const rollD6 = () => Math.ceil(Math.random() * 6);

  const performAttack = useCallback((attackerId, defenderId) => {
    const attacker = players[attackerId];
    const defender = players[defenderId];
    const roll = rollD6();
    setShowDice(roll);
    setTimeout(() => setShowDice(null), 800);

    const hit = roll >= 3; // 66% hit chance base
    if (!hit) {
      addLog(`🎯 ${attacker.name} โจมตี ${defender.name} — พลาด! (🎲${roll})`, "dmg");
      setActionsDone(a => ({ ...a, attacked: true }));
      setActionMode(null);
      return;
    }

    const crit = roll === 6;
    const rawDmg = attacker.atk + (crit ? 2 : 0);
    const finalDmg = Math.max(1, rawDmg - defender.def);

    setPlayers(ps => ps.map(p => {
      if (p.id === defenderId) {
        const newHp = Math.max(0, p.hp - finalDmg);
        if (newHp === 0 && p.alive) {
          setTimeout(() => checkWin(), 200);
          addLog(`💀 ${p.name} ถูกกำจัด!`, "death");
        }
        return { ...p, hp: newHp, alive: newHp > 0 };
      }
      return p;
    }));

    addLog(`⚔️ ${attacker.name} โจมตี ${defender.name} — ${finalDmg} ดาเมจ 🎲${roll}${crit ? " ✨คริต!" : ""}`, "dmg");
    setActionsDone(a => ({ ...a, attacked: true }));
    setActionMode(null);
  }, [players, addLog]);

  // ── USE CARD ──
  const useCard = useCallback((card, targetCell, playerIdx) => {
    const cp = players[playerIdx];
    const targetPlayer = players.find(p => p.alive && p.col === targetCell.col && p.row === targetCell.row);

    if (card.type === "magic" || MAGIC_CARDS.some(m => m.id === card.id)) {
      if (cp.mana < (card.cost || 0)) {
        addLog(`❌ มานาไม่พอ`, "dmg");
        return;
      }
      setPlayers(ps => ps.map(p => {
        if (p.id === playerIdx) return { ...p, mana: Math.max(0, p.mana - (card.cost || 0)), hand: p.hand.filter(h => h.uid !== card.uid) };
        if (targetPlayer && p.id === targetPlayer.id) {
          const newHp = Math.max(0, p.hp - (card.dmg || 0) + (card.heal || 0));
          addLog(`✨ ${cp.name} ใช้ "${card.name}" → ${targetPlayer.name} ${card.dmg ? `HP-${card.dmg}` : `HP+${card.heal}`}`, "event");
          return { ...p, hp: Math.min(p.maxHp, newHp) };
        }
        return p;
      }));
    } else {
      // Weapon/armor — equip
      setPlayers(ps => ps.map(p => {
        if (p.id === playerIdx) {
          const newAtk = p.atk + (card.atk || 0);
          const newDef = p.def + (card.def || 0);
          addLog(`🗡️ ${cp.name} สวมใส่ "${card.name}"`, "");
          return { ...p, atk: newAtk, def: newDef, hand: p.hand.filter(h => h.uid !== card.uid) };
        }
        return p;
      }));
    }
    setActionsDone(a => ({ ...a, usedItem: true }));
  }, [players, addLog]);

  // ── CHECK WIN ──
  const checkWin = useCallback(() => {
    setPlayers(ps => {
      const alive = ps.filter(p => p.alive);
      const king = ps.find(p => p.role === "king");
      const rebels = ps.filter(p => p.role === "rebel");

      if (!king?.alive) {
        const aliveRebels = rebels.filter(r => r.alive);
        if (aliveRebels.length > 0) {
          setGameOver({ winner: "rebel", reason: "กบฏโค่นบัลลังก์สำเร็จ! 🏴", players: aliveRebels });
        }
      }
      if (rebels.every(r => !r.alive) && king?.alive) {
        setGameOver({ winner: "king", reason: "พระราชาปราบกบฏสำเร็จ! 👑", players: [king] });
      }
      if (alive.length === 1) {
        setGameOver({ winner: alive[0].role, reason: `${alive[0].name} รอดคนสุดท้าย!`, players: [alive[0]] });
      }
      return ps;
    });
  }, []);

  // ── END TURN ──
  const endTurn = useCallback(() => {
    // Tick status effects & mana regen
    setPlayers(ps => ps.map(p => {
      if (!p.alive) return p;
      let hp = p.hp;
      const effects = p.statusEffects.filter(s => s.duration > 1).map(s => ({ ...s, duration: s.duration - 1 }));
      p.statusEffects.forEach(s => {
        if (s.type === "burn" || s.type === "poison") hp = Math.max(0, hp - 1);
      });
      const mana = Math.min(p.maxMana, p.mana + 1);
      return { ...p, hp, mana, statusEffects: effects };
    }));

    // Next player
    let next = (currentTurn + 1) % players.length;
    while (!players[next]?.alive) next = (next + 1) % players.length;

    // Phase advancement
    let newPhase = phase;
    let newStep = phaseStep + 1;
    if (newStep >= players.filter(p => p.alive).length) {
      newStep = 0;
      newPhase = phase + 1;
      if (newPhase > 6) {
        // Game over by phases
        const top = [...players].filter(p => p.alive).sort((a, b) => b.hp - a.hp)[0];
        setGameOver({ winner: top?.role || "draw", reason: "ครบ 6 เฟส! ผู้ชนะโดย HP สูงสุด", players: top ? [top] : [] });
        return;
      }
      setPhase(newPhase);
      // Phase event
      const ev = PHASE_EVENTS[Math.floor(Math.random() * PHASE_EVENTS.length)];
      setActiveEvent(ev);
      applyPhaseEvent(ev);
      setTimeout(() => setActiveEvent(null), 3000);
      addLog(`📜 เฟส ${newPhase}: ${ev.ico} ${ev.name} — ${ev.desc}`, "event");
      // Draw 2 cards for all
      setPlayers(ps => ps.map(p => {
        if (!p.alive) return p;
        const allCards = [...WEAPON_CARDS, ...MAGIC_CARDS];
        const newCards = [
          { ...allCards[Math.floor(Math.random() * allCards.length)], uid: Math.random() },
          { ...allCards[Math.floor(Math.random() * allCards.length)], uid: Math.random() },
        ];
        return { ...p, hand: [...p.hand, ...newCards].slice(-8) };
      }));
    }
    setPhaseStep(newStep);
    setCurrentTurn(next);
    setActionsDone({ moved: false, attacked: false, usedItem: false });
    setActionMode(null);
    setSelectedCard(null);
    setTurnPhaseAnnounce(`เทิร์นของ ${players[next]?.name || "?"}`);
    setTimeout(() => setTurnPhaseAnnounce(null), 1500);
    addLog(`🔔 เทิร์นของ ${players[next]?.name} (เฟส ${newPhase})`, "important");

    // Draw 1 card for next player
    const allCards = [...WEAPON_CARDS, ...MAGIC_CARDS, ...TRAP_CARDS];
    const newCard = { ...allCards[Math.floor(Math.random() * allCards.length)], uid: Math.random() };
    setPlayers(ps => ps.map((p, i) => i === next ? { ...p, hand: [...p.hand, newCard].slice(-8) } : p));
    checkWin();
  }, [currentTurn, phase, phaseStep, players, addLog, checkWin]);

  const applyPhaseEvent = useCallback((ev) => {
    setPlayers(ps => ps.map(p => {
      if (!p.alive) return p;
      if (ev.fx === "gold_all") return { ...p, gold: p.gold + 2 };
      if (ev.fx === "heal_all") return { ...p, hp: Math.min(p.maxHp, p.hp + 3) };
      if (ev.fx === "dmg_all") return { ...p, hp: Math.max(1, p.hp - 2) };
      if (ev.fx === "atk_all") return { ...p, atk: p.atk + 1 };
      return p;
    }));
  }, []);

  // ── MAP DRAG ──
  const handleMapMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, ox: mapOffset.x, oy: mapOffset.y };
  };
  const handleMapMouseMove = (e) => {
    if (!isDragging.current) return;
    setMapOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };
  const handleMapMouseUp = () => { isDragging.current = false; };

  const isMyTurn = currentTurn === myIdx;

  return (
    <>
      import "../styles/gameboard.css";

      <div className="mobile-msg">
        <div>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏰</div>
          <div style={{ fontFamily: "'Cinzel',serif", color: "var(--gold)", fontSize: "18px", marginBottom: "8px" }}>บัลลังก์เงา</div>
          <div style={{ color: "var(--txt-m)", fontSize: "13px" }}>กรุณาใช้หน้าจอขนาดใหญ่<br />เพื่อประสบการณ์ที่ดีที่สุด</div>
        </div>
      </div>

      <div className="game-root">
        {/* ═══ TOP BAR ═══ */}
        <div className="top-bar">
          <span className="tb-title">♛ บัลลังก์เงา</span>
          <div className="tb-divider" />

          {/* Phase track */}
          <div className="phase-track">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <>
                <div key={n} className={`phase-dot ${phase > n ? "done" : phase === n ? "current" : ""}`}>
                  {n}
                </div>
                {n < 6 && <div key={`l${n}`} className={`phase-line ${phase > n ? "done" : ""}`} />}
              </>
            ))}
          </div>
          <div className="tb-divider" />
          <span className="tb-turn">เทิร์น {phaseStep + 1}</span>
          <div className="tb-current">
            {currentPlayer?.ico} {currentPlayer?.name} {isMyTurn ? "(คุณ)" : ""}
          </div>
          <div className="tb-spacer" />
          <button className="tb-btn" onClick={centerMap} title="กลับกลาง">⊕ กลาง</button>
          <button className="tb-btn" onClick={() => setShowRules(r => !r)}>📖 กฎ</button>
          {isMyTurn && (
            <button className="tb-btn primary" onClick={endTurn}
              disabled={!!gameOver}>
              ⏭ จบเทิร์น
            </button>
          )}
          {onLeave && <button className="tb-btn danger" onClick={onLeave}>✕ ออก</button>}
        </div>

        {/* ═══ LEFT PANEL — Players ═══ */}
        <div className="left-panel">
          <div className="sec">
            <div className="sec-hdr">👥 ผู้เล่น</div>
            {players.map((p, i) => {
              const cls = CLASSES[p.classId];
              const role = ROLES[p.role];
              const isCurrentTurn = currentTurn === i;
              const isMe = i === myIdx;
              return (
                <div key={i}
                  className={`pcard ${isCurrentTurn ? "active" : ""} ${!p.alive ? "dead" : ""} ${isMe ? "me" : ""}`}
                  onMouseEnter={e => setTooltip({ x: e.clientX + 10, y: e.clientY + 10, title: p.name, desc: `${role?.name} — ${role?.win}` })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {isCurrentTurn && <div className="turn-indicator" />}
                  <div className="p-head">
                    <div className="p-ico" style={{ background: cls?.color + "33", border: `1px solid ${cls?.color}60` }}>
                      {p.alive ? cls?.ico : "💀"}
                    </div>
                    <div>
                      <div className="p-name">{p.name}{isMe ? " (คุณ)" : ""}</div>
                      <span className={`p-role tag tag-${p.role}`}>{role?.ico} {role?.name}</span>
                    </div>
                  </div>
                  <div className="p-bars">
                    <div className="bar-row">
                      <span>❤</span>
                      <div className="bar-track"><div className="bar-fill bar-hp" style={{ width: `${(p.hp / p.maxHp) * 100}%` }} /></div>
                      <span>{p.hp}/{p.maxHp}</span>
                    </div>
                    <div className="bar-row">
                      <span>💧</span>
                      <div className="bar-track"><div className="bar-fill bar-mp" style={{ width: `${(p.mana / p.maxMana) * 100}%` }} /></div>
                      <span>{p.mana}/{p.maxMana}</span>
                    </div>
                  </div>
                  <div className="p-stats">
                    <div className="p-stat"><span>ATK</span><span>{p.atk}</span></div>
                    <div className="p-stat"><span>DEF</span><span>{p.def}</span></div>
                    <div className="p-stat"><span>SPD</span><span>{p.move}</span></div>
                    <div className="p-stat"><span>💰</span><span>{p.gold}</span></div>
                  </div>
                  {p.statusEffects?.length > 0 && (
                    <div className="status-row">
                      {p.statusEffects.map((s, si) => (
                        <span key={si} className={`status-tag status-${s.type}`}>{s.type} {s.duration}t</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Objectives */}
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

        {/* ═══ RIGHT PANEL — Log ═══ */}
        <div className="right-panel">
          <div className="sec">
            <div className="sec-hdr">📜 บันทึกเหตุการณ์</div>
          </div>
          <div className="log-area">
            {log.map((entry, i) => (
              <div key={i} className={`log-entry ${entry.type}`}>
                {entry.msg}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ MAP AREA ═══ */}
        <div className="map-area"
          ref={mapAreaRef}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseUp}
        >
          <svg
            className="hex-map-svg"
            width={mapW}
            height={mapH}
            style={{
              position: "absolute",
              top: 0, left: 0,
              transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
              display: "block",
              overflow: "visible",
            }}
          >
            {/* Cells */}
            {cells.map(cell => {
              const { x, y } = hexToPixel(cell.col, cell.row, HEX_SIZE);
              const isReachable = reachableCells.some(c => c.key === cell.key);
              const isAttackable = attackableCells.some(c => c.key === cell.key);
              const isSelected = selectedCell?.key === cell.key;
              const hasPlayer = players.some(p => p.alive && p.col === cell.col && p.row === cell.row);
              const zone = cell.specialZone ? SPECIAL_ZONES[cell.specialZone] : null;
              const terrain = TERRAIN[cell.terrain] || TERRAIN.plains;
              const fill = TERRAIN_COLORS[cell.terrain] || "#2d5a27";
              const stroke = TERRAIN_STROKE[cell.terrain] || "#3a7a35";

              return (
                <g key={cell.key}
                  className={`hex-cell ${isReachable ? "hex-reachable" : ""} ${isAttackable ? "hex-attackable" : ""} ${isSelected ? "hex-selected" : ""}`}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={e => {
                    if (zone || cell.terrain !== "plains") {
                      setTooltip({ x: e.clientX + 12, y: e.clientY + 12, title: zone?.name || terrain.name, desc: zone?.desc || `ต้นทุนการเดิน: ${terrain.moveCost}` });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <polygon
                    className="hex-bg"
                    points={hexPoints(x, y, HEX_SIZE - 2)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="1"
                  />
                  {/* Overlay tint for reachable/attackable */}
                  {isReachable && (
                    <polygon points={hexPoints(x, y, HEX_SIZE - 2)} fill="rgba(76,201,76,.15)" stroke="none" />
                  )}
                  {isAttackable && !hasPlayer && (
                    <polygon points={hexPoints(x, y, HEX_SIZE - 2)} fill="rgba(201,76,76,.1)" stroke="none" />
                  )}
                  {isAttackable && hasPlayer && (
                    <polygon points={hexPoints(x, y, HEX_SIZE - 2)} fill="rgba(201,76,76,.25)" stroke="none" />
                  )}

                  {/* Terrain icon */}
                  <text x={x} y={y - 10} className="hex-label" fontSize="16">{terrain.ico}</text>

                  {/* Zone label */}
                  {zone && (
                    <>
                      <text x={x} y={y + 4} fontSize="18" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.9)">{zone.ico}</text>
                      <text x={x} y={y + 20} className="hex-zone-label" fontSize="7">{zone.name}</text>
                    </>
                  )}

                  {/* Trap indicator */}
                  {cell.trap && (
                    <text x={x + 16} y={y - 16} fontSize="10" fill="#ff8040">🪤</text>
                  )}
                </g>
              );
            })}

            {/* Players */}
            {players.map((p, i) => {
              if (!p.alive) return null;
              const { x, y } = hexToPixel(p.col, p.row, HEX_SIZE);
              const cls = CLASSES[p.classId];
              const isCurrentTurn = currentTurn === i;
              // Multiple players on same cell — offset
              const sameCell = players.filter(pp => pp.alive && pp.col === p.col && pp.row === p.row);
              const myIdx2 = sameCell.findIndex(pp => pp.id === p.id);
              const offX = sameCell.length > 1 ? (myIdx2 - (sameCell.length - 1) / 2) * 14 : 0;

              return (
                <g key={i}
                  className={`player-token ${isCurrentTurn ? "current-player" : ""}`}
                  transform={`translate(${mapOffset.x}, ${mapOffset.y})scale(${zoom})`}
                >
                  <circle cx="14" cy="14" r="14" fill={cls?.color + "cc"} stroke={isCurrentTurn ? "gold" : "rgba(0,0,0,.5)"} strokeWidth={isCurrentTurn ? "2" : "1"} />
                  <text x="14" y="14" textAnchor="middle" dominantBaseline="middle" fontSize="16">{cls?.ico}</text>
                  {/* HP micro bar */}
                  <rect x="2" y="26" width="24" height="3" rx="1.5" fill="rgba(0,0,0,.5)" />
                  <rect x="2" y="26" width={24 * (p.hp / p.maxHp)} height="3" rx="1.5" fill="#c94040" />
                  {/* Name label */}
                  <text x="14" y="36" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,.8)">{p.name}</text>
                </g>
              );
            })}
          </svg>

          {/* Turn announce */}
          {turnPhaseAnnounce && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "rgba(13,11,8,.9)", border: "1px solid var(--gold)",
              borderRadius: "12px", padding: "12px 28px",
              fontFamily: "'Cinzel',serif", fontSize: "18px", color: "var(--gold)",
              pointerEvents: "none", zIndex: 10,
              animation: "slide-down .3s ease-out"
            }}>
              {turnPhaseAnnounce}
            </div>
          )}
        </div>

        {/* ═══ BOTTOM BAR — Actions + Hand ═══ */}
        <div className="bottom-bar">
          {/* Actions */}
          <div className="action-row">
            <button
              className={`act-btn ${actionsDone.moved ? "done" : actionMode === "move" ? "active-mode" : ""}`}
              disabled={!isMyTurn || actionsDone.moved}
              onClick={() => setActionMode(actionMode === "move" ? null : "move")}
            >
              <span className="act-ico">🚶</span>
              <span>เดิน</span>
              <span className="act-label">{actionsDone.moved ? "✓ ใช้แล้ว" : `ระยะ ${me?.move || 3}`}</span>
            </button>
            <button
              className={`act-btn ${actionsDone.attacked ? "done" : actionMode === "attack" ? "active-mode" : ""}`}
              disabled={!isMyTurn || actionsDone.attacked}
              onClick={() => setActionMode(actionMode === "attack" ? null : "attack")}
            >
              <span className="act-ico">⚔️</span>
              <span>โจมตี</span>
              <span className="act-label">{actionsDone.attacked ? "✓ ใช้แล้ว" : `ATK ${me?.atk || 0}`}</span>
            </button>
            <button
              className={`act-btn ${actionsDone.usedItem ? "done" : actionMode === "card" ? "active-mode" : ""}`}
              disabled={!isMyTurn || actionsDone.usedItem || !selectedCard}
              onClick={() => {
                if (!selectedCard) return;
                if (TRAP_CARDS.some(t => t.id === selectedCard.id)) setActionMode("trap");
                else setActionMode(actionMode === "card" ? null : "card");
              }}
            >
              <span className="act-ico">🃏</span>
              <span>ใช้การ์ด</span>
              <span className="act-label">{actionsDone.usedItem ? "✓ ใช้แล้ว" : selectedCard ? `"${selectedCard.name}"` : "เลือกก่อน"}</span>
            </button>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "0 12px", borderLeft: "1px solid rgba(201,168,76,.1)" }}>
              <span style={{ fontSize: "9px", color: "var(--txt-m)" }}>เฟส</span>
              <span style={{ fontFamily: "'Cinzel',serif", color: "var(--gold)", fontSize: "16px" }}>{phase}/6</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "0 12px", borderLeft: "1px solid rgba(201,168,76,.1)" }}>
              <span style={{ fontSize: "9px", color: "var(--txt-m)" }}>ทอง</span>
              <span style={{ color: "var(--gold-l)", fontSize: "16px" }}>💰 {me?.gold || 0}</span>
            </div>
            {isMyTurn && (
              <button className="tb-btn primary" style={{ margin: "4px 8px", alignSelf: "center" }} onClick={endTurn}>
                ⏭ จบเทิร์น
              </button>
            )}
            {!isMyTurn && (
              <div style={{ display: "flex", alignItems: "center", padding: "0 12px", fontSize: "11px", color: "var(--txt-m)" }}>
                รอ {currentPlayer?.name}...
              </div>
            )}
          </div>

          {/* Hand */}
          <div className="hand-area">
            {me?.hand?.map((card, ci) => {
              const isSelected = selectedCard?.uid === card.uid;
              const isWeapon = WEAPON_CARDS.some(w => w.id === card.id);
              const isMagic = MAGIC_CARDS.some(m => m.id === card.id);
              const isTrap = TRAP_CARDS.some(t => t.id === card.id);
              const rarity = card.rarity || (isTrap ? "common" : "common");
              return (
                <div key={card.uid || ci}
                  className={`hand-card ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    if (!isMyTurn) return;
                    setSelectedCard(isSelected ? null : card);
                    setActionMode(null);
                  }}
                  onMouseEnter={e => setTooltip({ x: e.clientX + 10, y: e.clientY - 80, title: card.name, desc: card.desc || "" })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <span className={`card-rarity rarity-${rarity}`}>{rarity === "divine" ? "✦" : rarity === "rare" ? "◆" : rarity === "secret" ? "★" : "·"}</span>
                  <span className="card-ico">{card.ico}</span>
                  <div className="card-nm">{card.name}</div>
                  <div className="card-desc">{card.desc}</div>
                  <div style={{ fontSize: "8px", marginTop: "3px", color: "var(--txt-d)" }}>
                    {isWeapon ? "🗡️ อาวุธ" : isMagic ? `🔮 เวทย์` : "🪤 กับดัก"}
                  </div>
                </div>
              );
            })}
            {(!me?.hand || me.hand.length === 0) && (
              <div style={{ color: "var(--txt-d)", fontSize: "11px", padding: "0 12px" }}>ไม่มีการ์ดในมือ</div>
            )}
          </div>
        </div>


      </div>

      {/* ═══ DICE ANIMATION ═══ */}
      {showDice !== null && (
        <div className="dice-anim">
          {["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][showDice - 1] || "🎲"}
        </div>
      )}

      {/* ═══ PHASE EVENT BANNER ═══ */}
      {activeEvent && (
        <div className="event-banner">
          <span className="ev-ico">{activeEvent.ico}</span>
          <div className="ev-name">{activeEvent.name}</div>
          <div className="ev-desc">{activeEvent.desc}</div>
        </div>
      )}

      {/* ═══ TOOLTIP ═══ */}
      {tooltip && (
        <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="tooltip-title">{tooltip.title}</div>
          <div className="tooltip-desc">{tooltip.desc}</div>
        </div>
      )}

      {/* ═══ RULES PANEL ═══ */}
      {showRules && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setShowRules(false)}>
          <div style={{
            background: "var(--s2)", border: "1px solid rgba(201,168,76,.3)", borderRadius: "16px",
            padding: "24px", maxWidth: "500px", width: "90%", maxHeight: "80vh", overflowY: "auto"
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Cinzel',serif", color: "var(--gold)", marginBottom: "12px", fontSize: "16px" }}>📖 กฎการเล่น</h3>
            {[
              ["🎯 เป้าหมาย", "ผู้เล่นแต่ละฝ่ายมีเป้าหมายที่แตกต่างกัน พระราชาต้องรักษาบัลลังก์ กบฏต้องโค่นบัลลังก์ คนทรยศสะสมสมบัติ ราษฎรสะสมทอง"],
              ["🚶 แอ็กชั่นเดิน", "เดินได้ไม่เกินตามค่า SPD ของอาชีพ เส้นทางในป่าและหนองน้ำช้ากว่า"],
              ["⚔️ แอ็กชั่นโจมตี", "โจมตีศัตรูที่อยู่ในระยะ (ระยะขึ้นกับอาชีพ) ทอยเต๋า 3+ = โจมตีถูก, 6 = คริต!"],
              ["🃏 แอ็กชั่นการ์ด", "ใช้การ์ดในมือ: เลือกการ์ด → คลิกใช้ → เลือกเป้าหมาย"],
              ["📜 เฟส", "เมื่อทุกคนเล่นครบ 1 รอบ = 1 เฟส เกิดเหตุการณ์สุ่ม จั่วการ์ดเพิ่ม"],
              ["🏰 พื้นที่พิเศษ", "แต่ละพื้นที่มีผลพิเศษ เช่น บัลลังก์ให้ราชา HP+3 ค่ายกบฏให้กบฏ ATK+2"],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: "10px" }}>
                <div style={{ fontFamily: "'Cinzel',serif", color: "var(--gold)", fontSize: "12px", marginBottom: "4px" }}>{title}</div>
                <div style={{ fontSize: "11px", color: "var(--txt-m)", lineHeight: "1.6" }}>{desc}</div>
              </div>
            ))}
            <button style={{ marginTop: "8px", width: "100%", padding: "10px" }} className="tb-btn primary" onClick={() => setShowRules(false)}>
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* ═══ WIN SCREEN ═══ */}
      {gameOver && (
        <div className="win-overlay">
          <div className="win-box">
            <span className="win-ico">
              {gameOver.winner === "king" ? "👑" : gameOver.winner === "rebel" ? "⚔️" : gameOver.winner === "traitor" ? "🗡️" : "🏆"}
            </span>
            <div className="win-title">เกมจบแล้ว!</div>
            <div className="win-sub">ผู้ชนะ: {gameOver.players?.map(p => p.name).join(", ")}</div>
            <div className="win-reason">{gameOver.reason}</div>
            <button className="tb-btn primary" style={{ width: "100%", padding: "12px" }}
              onClick={() => {
                if (onLeave) onLeave();
                else window.location.reload();
              }}>
              🏠 กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </>
  );
}
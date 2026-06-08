import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const POLL_INTERVAL = 2000;

const ROLES = {
  king:     { id:"king",     ico:"👑", name:"พระราชา",  why:"รักษาบัลลังก์และปกป้องอาณาจักร", win:"ปราบกบฏทั้งหมด หรือครองราชย์ครบ 6 เฟส", color:"#c9a84c", startZone:"throne" },
  rebel:    { id:"rebel",    ico:"⚔️",  name:"กบฏ",      why:"โค่นบัลลังก์ด้วยการรวมกำลัง",    win:"ราชา HP=0 หรือยึดศาลบัลลังก์ 2 เฟส",      color:"#c94040", startZone:"camp" },
  traitor:  { id:"traitor",  ico:"🗡️",  name:"คนทรยศ",  why:"ซ่อนตัวเป็นพันธมิตร สะสมสมบัติ", win:"สะสม divine/secret 5 ชิ้น หรือรอดคนสุดท้าย", color:"#8c4cc9", startZone:"forest_l" },
  commoner: { id:"commoner", ico:"🧑‍🌾", name:"ราษฎร",   why:"ไม่อยู่ฝ่ายใด สะสมทรัพย์สิน",     win:"ทอง 10 เหรียญ หรือ Lv.5",                  color:"#4cc94c", startZone:"village" },
};

const CLASSES = {
  warrior: { id:"warrior", ico:"⚔️",  name:"นักรบ",    hp:14, mana:2,  move:2, atk:6, def:0, s:{STR:6,DEX:2,VIT:4,INT:1}, ability:"บ้าคลั่ง: ATK+2 เมื่อ HP<50%", passive:"สะสม Rage ทุกครั้งที่โดนโจมตี" },
  knight:  { id:"knight",  ico:"🛡️",  name:"อัศวิน",   hp:16, mana:2,  move:2, atk:4, def:2, s:{STR:4,DEX:2,VIT:5,INT:1}, ability:"ป้องกัน: ลดดาเมจ 2 ครั้ง/เฟส",  passive:"เมื่อ HP<30% ATK+3" },
  mage:    { id:"mage",    ico:"🔮",  name:"นักเวทย์", hp:9,  mana:8,  move:2, atk:1, def:0, s:{STR:1,DEX:3,VIT:3,INT:6}, ability:"เวทย์ฟรี 1 ครั้ง/เฟส",           passive:"ยืนนิ่ง 1 เทิร์น: Mana+2" },
  archer:  { id:"archer",  ico:"🏹",  name:"นักธนู",   hp:10, mana:3,  move:3, atk:3, def:0, s:{STR:3,DEX:5,VIT:3,INT:2}, ability:"ยิงแม่นยำ: Hit Rate+10%/DEX2",   passive:"หลบระยะประชิด+20%" },
  rogue:   { id:"rogue",   ico:"🗡️",  name:"โจร",      hp:8,  mana:3,  move:4, atk:3, def:0, s:{STR:3,DEX:6,VIT:2,INT:2}, ability:"โจมตีลับ: ATK+3 หลังเดิน",      passive:"ขโมยไอเทมเมื่อ HP<30%" },
  cleric:  { id:"cleric",  ico:"✨",  name:"นักบวช",   hp:11, mana:6,  move:2, atk:1, def:0, s:{STR:2,DEX:2,VIT:4,INT:4}, ability:"รักษา: HP+3 ตัวเอง/พันธมิตร",   passive:"เมื่อตาย: รอบข้าง HP+2" },
};

const ZONES = [
  { id:"throne",      name:"ศาลบัลลังก์",    ico:"⚖️",  col:3, row:1, type:"royal",   effect:"throne_effect",  desc:"ราชา HP+3 / กบฏ HP-2" },
  { id:"palace",      name:"พระราชวัง",      ico:"🏰",  col:3, row:0, type:"royal",   effect:"gold_king",      desc:"ราชา +1 ทอง/เฟส" },
  { id:"village",     name:"หมู่บ้าน",       ico:"🏘️",  col:1, row:1, type:"safe",    effect:"heal_2",         desc:"ฟื้น HP+2" },
  { id:"tower",       name:"หอคอยเวท",       ico:"🗼",  col:2, row:1, type:"magic",   effect:"draw_magic",     desc:"มานา+2 + เวทย์ฟรี" },
  { id:"market",      name:"ตลาดกลาง",       ico:"🏪",  col:3, row:2, type:"trade",   effect:"market",         desc:"ทอง+1" },
  { id:"armory",      name:"คลังอาวุธ",      ico:"⚒️",  col:5, row:1, type:"neutral", effect:"draw_weapon",    desc:"ATK+1 เทิร์นนี้" },
  { id:"riverbank",   name:"ริมแม่น้ำ",      ico:"🌊",  col:4, row:1, type:"neutral", effect:"mana_regen",     desc:"มานา+3" },
  { id:"forest_l",    name:"ป่าตะวันตก",     ico:"🌲",  col:0, row:2, type:"ambush",  effect:"draw_trap",      desc:"ซ่อนตัวได้" },
  { id:"forest_r",    name:"ป่าตะวันออก",    ico:"🌿",  col:6, row:2, type:"ambush",  effect:"draw_trap",      desc:"ซ่อนตัวได้" },
  { id:"camp",        name:"ค่ายกบฏ",        ico:"⛺",  col:1, row:3, type:"rebel",   effect:"rebel_buff",     desc:"กบฏ ATK+2 HP+2" },
  { id:"ruins",       name:"ซากปรัก",        ico:"🏚️",  col:5, row:3, type:"loot",    effect:"ruins_loot",     desc:"ทอย 4+: ของสุ่ม / 1-3: HP-2" },
  { id:"cave",        name:"ถ้ำมังกร",        ico:"🐉",  col:4, row:3, type:"danger",  effect:"cave_loot",      desc:"ทอย 4+: ทอง+3 / 1-3: HP-3" },
  { id:"cemetery",    name:"สุสาน",           ico:"🪦",  col:2, row:3, type:"loot",    effect:"cemetery",       desc:"ATK ใบเก่า แต่ HP-1" },
  { id:"shrine",      name:"ศาลเจ้า",         ico:"⛩️",  col:0, row:4, type:"holy",    effect:"shrine_heal",    desc:"ฟื้น HP เต็ม (1ครั้ง/เกม)" },
  { id:"blackmarket", name:"ตลาดมืด",         ico:"🕵️",  col:6, row:4, type:"secret",  effect:"black_market",   desc:"การ์ด divine/secret" },
  { id:"crossroads",  name:"สี่แยก",          ico:"🛤️",  col:3, row:3, type:"neutral", effect:"extra_move",     desc:"เดินได้อีก +1" },
  { id:"watchtower",  name:"หอสังเกตการณ์",  ico:"🔭",  col:6, row:0, type:"intel",   effect:"spy",            desc:"ดูการ์ดผู้เล่นอื่น" },
  { id:"tavern",      name:"โรงเตี๊ยม",       ico:"🍺",  col:0, row:0, type:"social",  effect:"buy_info",       desc:"เปิดเผยบทบาท (3 ทอง)" },
  { id:"fields",      name:"ทุ่งนา",          ico:"🌾",  col:2, row:4, type:"farm",    effect:"farm_gold",      desc:"ทอง+1 ต่อเทิร์น" },
  { id:"abyss",       name:"หุบเหว",          ico:"⛰️",  col:4, row:4, type:"danger",  effect:"high_ground",    desc:"ระยะโจมตี+1 รอบนี้" },
];

// Pre-compute adjacency
function getNeighbors(col, row) {
  const neighbors = [];
  const isEven = col % 2 === 0;
  const dirs = isEven ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]] : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
  dirs.forEach(([dc, dr]) => {
    const nc = col + dc, nr = row + dr;
    const z = ZONES.find(z => z.col === nc && z.row === nr);
    if (z) neighbors.push(z.id);
  });
  return neighbors;
}
ZONES.forEach(z => { z.neighbors = getNeighbors(z.col, z.row); });

const CARDS = [
  { id:"hellfire",     name:"ไฟนรก",         ico:"🔥", type:"magic",  rarity:"rare",   effect:"ดาเมจ 6", manaCost:3, dmg:6 },
  { id:"holy_heal",    name:"แสงศักดิ์สิทธิ์",ico:"✨", type:"magic",  rarity:"rare",   effect:"ฟื้น HP+5", manaCost:3, heal:5 },
  { id:"ice_freeze",   name:"หิมะนิรันดร์",   ico:"❄️", type:"magic",  rarity:"rare",   effect:"แช่แข็ง 1 เทิร์น", manaCost:2, freeze:1 },
  { id:"amrita",       name:"น้ำอมฤต",        ico:"💧", type:"magic",  rarity:"divine", effect:"ฟื้น HP เต็ม (1ครั้ง/เกม)", manaCost:0, full_heal:true },
  { id:"sword_king",   name:"ดาบกษัตริย์",    ico:"⚔️", type:"weapon", rarity:"divine", effect:"ATK+2 (ราชา: ATK+4)", atk:2, king_bonus:2 },
  { id:"battle_axe",   name:"ขวานสองคม",      ico:"🪓", type:"weapon", rarity:"common", effect:"ATK+3 แต่ HP-1", atk:3, self_dmg:1 },
  { id:"poison_sword", name:"ดาบพิษ",         ico:"🐍", type:"weapon", rarity:"common", effect:"ATK+1 ติดพิษ 2 เทิร์น", atk:1, poison:2 },
  { id:"iron_pit",     name:"หลุมหนาม",       ico:"🕳️", type:"trap",   rarity:"common", effect:"ดาเมจ -3", dmg:3 },
  { id:"chain_trap",   name:"โซ่ตรวน",        ico:"⛓️", type:"trap",   rarity:"common", effect:"ล็อค 1 เทิร์น", lock:1 },
  { id:"light_barrier",name:"ปราการแสง",      ico:"💫", type:"magic",  rarity:"rare",   effect:"กันดาเมจ 1 ครั้ง", manaCost:2, barrier:true },
];

const EVENTS = [
  { id:"harvest",    name:"วันเก็บเกี่ยว", ico:"🌾", desc:"ทุกคนได้ทอง +2", fx:"gold_all_2" },
  { id:"holy_day",   name:"วันศักดิ์สิทธิ์",ico:"🌟", desc:"ทุกคนฟื้น HP +3", fx:"heal_all_3" },
  { id:"ghost_army", name:"ทัพผี",         ico:"👻", desc:"ทุกคนเสีย HP -2", fx:"dmg_all_2" },
  { id:"war_drums",  name:"กลองศึก",       ico:"🥁", desc:"ทุกคน+1 ATK รอบนี้", fx:"atk_all_1" },
  { id:"lightning",  name:"สายฟ้าฟาด",    ico:"⚡", desc:"HP สูงสุดเสีย HP-3", fx:"dmg_highest_3" },
];

// ─── STORAGE (localStorage) ────────────────────────────────────────────────
const storeKey = (code) => `sot_room_${code}`;

function saveRoom(room) {
  try { localStorage.setItem(storeKey(room.code), JSON.stringify(room)); return true; }
  catch { return false; }
}

function loadRoom(code) {
  try {
    const r = localStorage.getItem(storeKey(code));
    return r ? JSON.parse(r) : null;
  } catch { return null; }
}

function deleteRoom(code) {
  try { localStorage.removeItem(storeKey(code)); } catch {}
}

function listRooms() {
  try {
    const rooms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sot_room_")) {
        try {
          const r = JSON.parse(localStorage.getItem(key));
          if (r && r.status !== "started" && (Date.now() - r.createdAt) < 30*60*1000) rooms.push(r);
        } catch {}
      }
    }
    return rooms;
  } catch { return []; }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const genCode = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "SOT-" + Array.from({length:4}, () => c[Math.floor(Math.random()*c.length)]).join("");
};

function assignRoles(n) {
  const roles = ["king"];
  if (n >= 5) roles.push("rebel");
  roles.push("rebel");
  if (n >= 4) roles.push("traitor");
  while (roles.length < n) roles.push("commoner");
  for (let i = roles.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [roles[i],roles[j]] = [roles[j],roles[i]];
  }
  return roles.slice(0, n);
}

function rollD6() { return Math.floor(Math.random()*6)+1; }

function hexDistance(idA, idB) {
  if (idA === idB) return 0;
  const visited = new Set([idA]);
  let frontier = [idA];
  let dist = 0;
  while (frontier.length > 0 && dist < 15) {
    dist++;
    const next = [];
    for (const zid of frontier) {
      const z = ZONES.find(x => x.id === zid);
      for (const nid of (z?.neighbors || [])) {
        if (nid === idB) return dist;
        if (!visited.has(nid)) { visited.add(nid); next.push(nid); }
      }
    }
    frontier = next;
  }
  return 99;
}

function getReachable(zoneId, steps) {
  const visited = new Set([zoneId]);
  let frontier = [zoneId];
  for (let i = 0; i < steps; i++) {
    const next = [];
    for (const zid of frontier) {
      const z = ZONES.find(x => x.id === zid);
      for (const nid of (z?.neighbors || [])) {
        if (!visited.has(nid)) { visited.add(nid); next.push(nid); }
      }
    }
    frontier = next;
  }
  visited.delete(zoneId);
  return [...visited];
}

function rndCard() {
  return JSON.parse(JSON.stringify(CARDS[Math.floor(Math.random()*CARDS.length)]));
}

// ─── GAME STATE INIT ──────────────────────────────────────────────────────────
function initGameState(room) {
  const roles = room.roles || assignRoles(room.players.length);
  const players = room.players.map((p, i) => {
    const cls = CLASSES[p.class] || CLASSES.warrior;
    const role = ROLES[roles[i]];
    return {
      id: i, name: p.name, role: roles[i], classId: p.class || "warrior",
      hp: cls.hp, maxHp: cls.hp, mana: cls.mana, maxMana: cls.mana,
      gold: 4, level: 1, exp: 0, alive: true,
      zoneId: role.startZone || "village",
      hand: [rndCard(), rndCard()],
      equipment: [], statusEffects: [],
      kills: 0, damageDealt: 0,
      usedAbility: false, throneCount: 0,
    };
  });
  return {
    players, phase: 1, currentIdx: 0, totalTurns: 0, gameOver: false, winner: null,
    log: [], turnActions: { moved: false, attacked: false, usedCard: false },
    globalAtkBonus: 0, throneHeld: {},
    pendingMove: null, pendingAttack: null, pendingEvent: null,
    reachableZones: [], attackableZones: [],
  };
}

// ─── CSS ─────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&family=Sarabun:wght@300;400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#c9a84c;--gold-l:#f0d080;--gold-d:#6a4010;--gold-f:rgba(201,168,76,0.07);
  --blood:#8b1a1a;--stone:#0d0b08;--s2:#191510;--s3:#231f18;--s4:#2e2920;
  --txt:#e8d5b0;--txt-m:#7a6848;--txt-d:#3d3528;--r:10px;
}
body{background:var(--stone);color:var(--txt);font-family:'Sarabun',sans-serif;font-size:14px;overflow-x:hidden;min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:var(--gold-d);border-radius:2px}
.cinzel{font-family:'Cinzel',serif}.deco{font-family:'Cinzel Decorative',serif}

/* screens */
.screen{display:none;min-height:100vh;flex-direction:column}
.screen.on{display:flex}

/* title */
#t{align-items:center;justify-content:center;text-align:center;
  background:radial-gradient(ellipse 100% 80% at 50% 0%,#1a1208,var(--stone) 70%);
  position:relative;overflow:hidden}
.stars{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(1px 1px at 10% 20%,rgba(201,168,76,.4),transparent),
  radial-gradient(1px 1px at 85% 15%,rgba(201,168,76,.3),transparent),
  radial-gradient(2px 2px at 60% 45%,rgba(201,168,76,.15),transparent)}
.twrap{position:relative;z-index:1;padding:40px 20px;max-width:560px;width:100%}
.crown{font-size:72px;display:block;animation:float 3s ease-in-out infinite;
  filter:drop-shadow(0 0 30px rgba(201,168,76,.5))}
@keyframes float{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-14px) rotate(3deg)}}
.tmain{font-family:'Cinzel Decorative',serif;font-size:clamp(26px,5vw,52px);color:var(--gold);
  text-shadow:0 0 50px rgba(201,168,76,.3);letter-spacing:.06em;margin:.3em 0 .1em}
.tsub{font-family:'Cinzel',serif;font-size:clamp(9px,1.2vw,12px);letter-spacing:.5em;color:var(--txt-m);text-transform:uppercase}
.div{width:240px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:1.2rem auto}
.lore{font-size:13px;color:var(--txt-m);line-height:2;max-width:380px;margin:0 auto 1.8rem;font-style:italic}
.mcards{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:360px;margin:0 auto;width:100%;padding:0 16px}
.mcard{background:var(--s3);border:1px solid rgba(201,168,76,.15);border-radius:12px;padding:16px 12px;cursor:pointer;transition:all .2s;text-align:center}
.mcard:hover{border-color:var(--gold);background:var(--gold-f);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.mico{font-size:32px;display:block;margin-bottom:6px}
.mnm{font-family:'Cinzel',serif;font-size:12px;color:var(--gold);margin-bottom:3px}
.mdesc{font-size:10px;color:var(--txt-m);line-height:1.4}

/* btn */
.btn{font-family:'Cinzel',serif;cursor:pointer;border:none;border-radius:var(--r);transition:all .2s;letter-spacing:.04em;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.b-gold{background:linear-gradient(135deg,var(--gold-d),var(--gold));color:#0d0b09;padding:11px 28px;font-size:13px;font-weight:700;box-shadow:0 4px 20px rgba(201,168,76,.2)}
.b-gold:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(201,168,76,.4)}
.b-gold:disabled{opacity:.35;cursor:not-allowed}
.b-ghost{background:transparent;color:var(--gold);border:1px solid rgba(201,168,76,.3);padding:9px 22px;font-size:12px}
.b-ghost:hover{background:var(--gold-f);border-color:var(--gold)}
.b-sm{background:rgba(201,168,76,.08);color:var(--gold-l);border:1px solid rgba(201,168,76,.18);padding:6px 14px;border-radius:6px;cursor:pointer;font-size:11px;font-family:'Sarabun',sans-serif;transition:all .15s}
.b-sm:hover:not(:disabled){background:rgba(201,168,76,.18);border-color:var(--gold)}
.b-sm:disabled{opacity:.3;cursor:not-allowed}
.b-danger{background:rgba(139,26,26,.5);color:#ffaaaa;border:1px solid rgba(139,26,26,.7);padding:7px 18px;border-radius:8px;cursor:pointer;font-size:12px;font-family:'Sarabun',sans-serif;transition:all .15s}
.b-danger:hover{background:rgba(180,30,30,.8)}
.b-blue{background:rgba(50,100,200,.4);color:#aaccff;border:1px solid rgba(50,100,200,.6);padding:7px 14px;border-radius:6px;cursor:pointer;font-size:11px;font-family:'Sarabun',sans-serif;transition:all .15s}
.b-blue:hover{background:rgba(50,100,200,.7)}

/* forms */
input,select{background:var(--s4);color:var(--txt);border:1px solid rgba(201,168,76,.2);border-radius:6px;padding:8px 12px;font-family:'Sarabun',sans-serif;font-size:13px;outline:none;width:100%}
input:focus,select:focus{border-color:var(--gold)}
input::placeholder{color:var(--txt-d)}
.sbox{background:var(--s3);border:1px solid rgba(201,168,76,.12);border-radius:12px;padding:16px;margin-bottom:12px}
.sh{font-family:'Cinzel',serif;font-size:11px;letter-spacing:.18em;color:var(--txt-m);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.sh::after{content:'';flex:1;height:1px;background:rgba(201,168,76,.1)}

/* lobby */
#l{background:var(--s2);align-items:center;justify-content:flex-start;padding:20px;overflow-y:auto}
.lwrap{max-width:720px;width:100%;margin:0 auto}
.lhdr{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.code-badge{background:var(--s3);border:1px solid var(--gold-d);border-radius:8px;padding:5px 14px;font-family:'Cinzel',serif;font-size:15px;color:var(--gold-l);letter-spacing:.25em}
.slots{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.slot{background:var(--s4);border:1px solid rgba(201,168,76,.1);border-radius:8px;padding:10px 12px;transition:all .2s}
.slot.filled{border-color:rgba(201,168,76,.3)}.slot.ready-s{border-color:#2a7a35;background:rgba(42,122,53,.08)}
.slot.host-s{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.04)}.slot.empty{opacity:.45}
.sn{font-size:13px;font-weight:600;margin-bottom:2px}.sc{font-size:10px;color:var(--txt-m);margin-bottom:3px}
.tag{font-size:9px;padding:2px 8px;border-radius:4px;margin-left:6px}
.tag-you{background:rgba(201,168,76,.2);color:var(--gold)}.tag-host{background:rgba(201,168,76,.3);color:var(--gold-l)}
.tag-ready{background:rgba(42,122,53,.3);color:#4cc94c}
.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ccard{background:var(--s4);border:1.5px solid rgba(201,168,76,.12);border-radius:10px;padding:12px 8px;cursor:pointer;transition:all .2s;text-align:center}
.ccard:hover,.ccard.sel{border-color:var(--gold);background:var(--gold-f);transform:translateY(-2px)}
.ci{font-size:32px;margin-bottom:4px}.cn{font-family:'Cinzel',serif;font-size:11px;color:var(--gold);margin-bottom:3px}
.cst{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-bottom:4px}
.cs{font-size:8px;background:rgba(0,0,0,.3);padding:1px 5px;border-radius:3px;color:var(--txt-m)}
.cab{font-size:9px;color:rgba(201,168,76,.7);line-height:1.4;text-align:left}
.pulse{animation:pulse .9s ease-in-out infinite;font-size:11px;color:var(--txt-m);text-align:center}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
.warn{font-size:10px;color:rgba(255,180,50,.7);background:rgba(200,120,0,.1);border:1px solid rgba(200,120,0,.3);border-radius:6px;padding:7px 14px;margin-bottom:12px;text-align:center}
.row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.row label{font-size:12px;color:var(--txt-m);min-width:96px;flex-shrink:0}
.row select,.row input{flex:1}
.join-box{background:var(--s3);border:1px solid rgba(201,168,76,.2);border-radius:12px;padding:20px;text-align:center;max-width:340px;margin:0 auto}
.join-title{font-family:'Cinzel',serif;font-size:14px;color:var(--gold);margin-bottom:12px}
.join-input{text-align:center;letter-spacing:.2em;font-family:'Cinzel',serif;font-size:16px;text-transform:uppercase;margin-bottom:12px}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tab{flex:1;background:var(--s3);border:1px solid rgba(201,168,76,.12);border-radius:8px;padding:10px;cursor:pointer;text-align:center;font-family:'Cinzel',serif;font-size:12px;color:var(--txt-m);transition:all .2s}
.tab.on{border-color:var(--gold);color:var(--gold);background:var(--gold-f)}
.room-card{background:var(--s3);border:1px solid rgba(201,168,76,.15);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .2s}
.room-card:hover{border-color:var(--gold);background:var(--gold-f);transform:translateX(4px)}
.rc-code{font-family:'Cinzel',serif;font-size:16px;color:var(--gold);letter-spacing:.15em;min-width:90px}
.rc-info{flex:1}.rc-host{font-size:13px;font-weight:600}.rc-meta{font-size:11px;color:var(--txt-m);margin-top:2px}
.rc-count{font-family:'Cinzel',serif;font-size:13px;color:var(--gold-l);background:var(--s4);padding:4px 10px;border-radius:6px;border:1px solid var(--gold-d)}
.ready-bar{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px}
.r-dot{width:10px;height:10px;border-radius:50%;background:var(--s4);border:1px solid var(--txt-d);transition:all .3s}
.r-dot.on{background:#4cc94c;border-color:#4cc94c;box-shadow:0 0 6px rgba(76,201,76,.4)}

/* role reveal */
#rr{background:radial-gradient(ellipse at 50% 50%,#0d0a05,#040302);align-items:center;justify-content:center}
.rrwrap{display:flex;flex-direction:column;align-items:center;padding:24px 20px;min-height:100vh;justify-content:center}
.flip-outer{perspective:700px;cursor:pointer;margin:16px 0}
.flip{width:220px;height:300px;position:relative;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,0,.2,1)}
.flip.f{transform:rotateY(180deg)}
.fback,.ffront{position:absolute;inset:0;border-radius:14px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;border:2px solid var(--gold-d)}
.fback{background:linear-gradient(160deg,var(--s3),var(--s2))}
.fbglyph{font-size:64px;color:var(--gold-d);opacity:.4;animation:ps 2s ease-in-out infinite}
@keyframes ps{0%,100%{opacity:.2}50%{opacity:.5}}
.ffront{transform:rotateY(180deg)}
.ff-king{background:linear-gradient(160deg,#2a1800,#4a2e00)}
.ff-rebel{background:linear-gradient(160deg,#1a0808,#3a1010)}
.ff-traitor{background:linear-gradient(160deg,#0a0a12,#181828)}
.ff-commoner{background:linear-gradient(160deg,#081008,#10281a)}
.fico{font-size:56px;margin-bottom:8px}.fnm{font-family:'Cinzel',serif;font-size:17px;color:var(--gold);margin-bottom:4px}
.fwhy{font-size:10px;color:var(--txt-m);text-align:center;line-height:1.6}
.fwin{font-size:9px;color:var(--gold-l);margin-top:8px;border-top:1px solid rgba(201,168,76,.2);padding-top:6px;width:100%;text-align:center;line-height:1.4}
.blink{animation:blink 1.4s ease-in-out infinite;color:var(--txt-m);font-size:11px}
@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
.rogrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:480px;width:100%;margin-top:12px}
@media(min-width:500px){.rogrid{grid-template-columns:repeat(3,1fr)}}
.rocard{background:var(--s3);border:1.5px solid rgba(201,168,76,.18);border-radius:10px;padding:12px;text-align:center}
.ronm{font-family:'Cinzel',serif;font-size:12px;color:var(--gold);margin:6px 0 3px}

/* toast */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(0);
  background:rgba(201,168,76,.92);color:#0d0b09;padding:8px 22px;border-radius:8px;
  font-size:13px;font-family:'Sarabun',sans-serif;z-index:9999;transition:opacity .3s,transform .3s;pointer-events:none}
.toast.hide{opacity:0;transform:translateX(-50%) translateY(8px)}
.loading-overlay{position:fixed;inset:0;background:rgba(13,11,8,.85);display:flex;align-items:center;justify-content:center;z-index:999;flex-direction:column;gap:12px}
.loading-spinner{width:40px;height:40px;border:3px solid var(--gold-d);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-txt{font-family:'Cinzel',serif;font-size:13px;color:var(--gold);letter-spacing:.1em}

/* ═══ GAME BOARD ═══ */
#gb{background:#0a0906;overflow:hidden;flex-direction:row}
.gb-left{display:flex;flex-direction:column;width:260px;min-width:220px;background:var(--s2);border-right:1px solid rgba(201,168,76,.1);overflow-y:auto;flex-shrink:0}
.gb-center{flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative}
.gb-right{display:flex;flex-direction:column;width:240px;min-width:200px;background:var(--s2);border-left:1px solid rgba(201,168,76,.1);overflow-y:auto;flex-shrink:0}

/* panel */
.panel{padding:12px;border-bottom:1px solid rgba(201,168,76,.08)}
.panel-title{font-family:'Cinzel',serif;font-size:10px;letter-spacing:.15em;color:var(--txt-m);text-transform:uppercase;margin-bottom:8px}

/* player card in sidebar */
.pcard{background:var(--s3);border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid rgba(201,168,76,.1);cursor:pointer;transition:all .15s}
.pcard:hover{border-color:rgba(201,168,76,.3)}
.pcard.active{border-color:var(--gold);background:rgba(201,168,76,.05)}
.pcard.dead{opacity:.4}
.pcard-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.pcard-name{font-size:12px;font-weight:700;flex:1}
.pcard-role{font-size:10px}
.hp-bar{height:6px;background:var(--s4);border-radius:3px;overflow:hidden;margin-bottom:3px}
.hp-fill{height:100%;background:linear-gradient(90deg,#6a1010,#c94040);border-radius:3px;transition:width .3s}
.hp-fill.mid{background:linear-gradient(90deg,#6a4010,#c9a84c)}
.hp-fill.high{background:linear-gradient(90deg,#104a10,#4cc94c)}
.mana-bar{height:4px;background:var(--s4);border-radius:2px;overflow:hidden}
.mana-fill{height:100%;background:linear-gradient(90deg,#0a2a4a,#3080c0);border-radius:2px;transition:width .3s}
.pcard-stats{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.pstat{font-size:9px;background:rgba(0,0,0,.3);padding:1px 5px;border-radius:3px;color:var(--txt-m)}

/* hex map */
.hex-map{position:relative;width:100%;flex:1;overflow:hidden}
.hex-svg{width:100%;height:100%}
.hex-cell{cursor:pointer;transition:all .2s}
.hex-cell:hover .hex-bg{filter:brightness(1.3)}
.hex-bg{transition:all .2s}
.hex-cell.reachable .hex-bg{fill:rgba(76,201,76,.25);stroke:#4cc94c;stroke-width:2}
.hex-cell.attackable .hex-bg{fill:rgba(201,60,60,.25);stroke:#c94040;stroke-width:2}
.hex-cell.selected .hex-bg{fill:rgba(201,168,76,.3);stroke:var(--gold);stroke-width:2.5}
.hex-cell.current-player .hex-bg{stroke:var(--gold);stroke-width:2;animation:pulse-hex 1.5s ease-in-out infinite}
@keyframes pulse-hex{0%,100%{stroke-opacity:.6}50%{stroke-opacity:1}}

/* turn panel */
.turn-panel{background:var(--s3);border-top:1px solid rgba(201,168,76,.1);padding:12px;flex-shrink:0}
.turn-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.phase-badge{font-family:'Cinzel',serif;font-size:10px;color:var(--gold);background:rgba(201,168,76,.1);padding:3px 10px;border-radius:4px;border:1px solid rgba(201,168,76,.2)}
.turn-actions{display:flex;gap:6px;flex-wrap:wrap}
.action-btn{font-size:11px;padding:6px 12px;border-radius:6px;cursor:pointer;border:none;font-family:'Sarabun',sans-serif;transition:all .15s;display:flex;align-items:center;gap:4px}
.action-btn.move{background:rgba(76,180,76,.2);color:#7fe07f;border:1px solid rgba(76,180,76,.4)}
.action-btn.attack{background:rgba(200,60,60,.2);color:#f08080;border:1px solid rgba(200,60,60,.4)}
.action-btn.card{background:rgba(120,80,200,.2);color:#c0a0ff;border:1px solid rgba(120,80,200,.4)}
.action-btn.end{background:rgba(201,168,76,.15);color:var(--gold);border:1px solid rgba(201,168,76,.3)}
.action-btn:hover:not(:disabled){filter:brightness(1.3);transform:translateY(-1px)}
.action-btn:disabled{opacity:.3;cursor:not-allowed}
.action-btn.done{filter:brightness(.5);cursor:not-allowed}

/* hand / cards */
.hand-panel{padding:10px}
.card-list{display:flex;flex-direction:column;gap:6px}
.card-item{background:var(--s4);border:1px solid rgba(201,168,76,.12);border-radius:8px;padding:8px 10px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:8px}
.card-item:hover{border-color:var(--gold);background:var(--gold-f)}
.card-item.selected{border-color:var(--gold);background:rgba(201,168,76,.15)}
.card-ico{font-size:18px;flex-shrink:0}
.card-info{flex:1}
.card-name{font-size:11px;color:var(--gold-l);font-weight:600}
.card-effect{font-size:9px;color:var(--txt-m);line-height:1.4}
.card-type-badge{font-size:8px;padding:1px 5px;border-radius:3px}
.type-magic{background:rgba(120,80,200,.3);color:#c0a0ff}
.type-weapon{background:rgba(200,100,40,.3);color:#f0a070}
.type-trap{background:rgba(40,120,40,.3);color:#80c080}

/* log */
.log-panel{padding:10px;flex:1;overflow-y:auto;min-height:0}
.log-entry{font-size:10px;color:var(--txt-m);margin-bottom:4px;line-height:1.5;padding:3px 6px;border-radius:4px;border-left:2px solid transparent}
.log-entry.dmg{color:#f08080;border-left-color:#c94040;background:rgba(139,26,26,.1)}
.log-entry.heal{color:#80c080;border-left-color:#4cc94c;background:rgba(42,122,53,.1)}
.log-entry.magic{color:#c0a0ff;border-left-color:#8060c0;background:rgba(80,40,160,.1)}
.log-entry.turn{color:var(--gold-l);border-left-color:var(--gold);background:rgba(201,168,76,.08);font-weight:700}
.log-entry.death{color:#ff6060;border-left-color:#ff2020;font-weight:700}
.log-entry.win{color:#ffd700;border-left-color:#ffd700;font-weight:700;font-size:12px}
.log-entry.event{color:#ffe090;border-left-color:#c9a840}

/* zone info popup */
.zone-info{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:var(--s3);border:1px solid var(--gold-d);border-radius:10px;padding:12px 16px;font-size:12px;z-index:10;pointer-events:none;white-space:nowrap;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.5)}
.zone-info-name{font-family:'Cinzel',serif;font-size:13px;color:var(--gold);margin-bottom:4px}
.zone-info-desc{font-size:11px;color:var(--txt-m)}

/* event modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100}
.modal{background:var(--s3);border:1px solid var(--gold-d);border-radius:14px;padding:24px;max-width:360px;width:90%;text-align:center}
.modal-ico{font-size:52px;margin-bottom:12px}
.modal-title{font-family:'Cinzel Decorative',serif;font-size:18px;color:var(--gold);margin-bottom:8px}
.modal-desc{font-size:13px;color:var(--txt-m);line-height:1.8;margin-bottom:16px}

/* win screen */
#ws{background:radial-gradient(ellipse at 50% 30%,#1a1200,#0d0b08 70%);align-items:center;justify-content:center;text-align:center}
.win-crown{font-size:80px;animation:float 2s ease-in-out infinite;filter:drop-shadow(0 0 40px rgba(201,168,76,.6));margin-bottom:16px}
.win-title{font-family:'Cinzel Decorative',serif;font-size:clamp(20px,4vw,36px);color:var(--gold);margin-bottom:8px}
.win-reason{font-size:14px;color:var(--txt-m);margin-bottom:24px}
.win-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-width:400px;margin:0 auto 24px;text-align:left}
.win-stat{background:var(--s3);border:1px solid rgba(201,168,76,.15);border-radius:8px;padding:10px 12px}
.ws-name{font-size:12px;font-weight:700;margin-bottom:3px}
.ws-info{font-size:10px;color:var(--txt-m)}

@media(max-width:900px){
  #gb{flex-direction:column}
  .gb-left,.gb-right{width:100%;min-width:unset;max-height:180px;flex-direction:row;overflow-x:auto;overflow-y:hidden;border-right:none;border-bottom:1px solid rgba(201,168,76,.1)}
  .gb-right{border-left:none;border-top:1px solid rgba(201,168,76,.1)}
  .panel{padding:8px;border-bottom:none;border-right:1px solid rgba(201,168,76,.08);flex-shrink:0}
  .gb-center{min-height:300px}
}
`;

// ─── HEX SVG HELPERS ─────────────────────────────────────────────────────────
function hexCorners(cx, cy, size) {
  return Array.from({length:6}, (_,i) => {
    const a = Math.PI/180 * (60*i - 30);
    return `${cx + size*Math.cos(a)},${cy + size*Math.sin(a)}`;
  }).join(" ");
}

function hexCenter(col, row, size) {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = col * (w * 0.75) + size + 20;
  const y = row * h + (col % 2 === 1 ? h/2 : 0) + size + 10;
  return { x, y };
}

const ZONE_COLORS = {
  royal:"#3a2a00", safe:"#0a2a0a", magic:"#1a0a3a", trade:"#2a2000",
  ambush:"#0a2a0a", rebel:"#2a0a0a", loot:"#1a1a0a", danger:"#2a0a0a",
  holy:"#1a1a2a", secret:"#1a0a1a", neutral:"#1a1a1a", intel:"#0a1a2a",
  social:"#1a100a", farm:"#0a1a0a",
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("title");
  const [tab, setTab] = useState("browse");
  const [myName, setMyName] = useState("");
  const [myClass, setMyClass] = useState("");
  const [myIdx, setMyIdx] = useState(0);
  const [room, setRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [newName, setNewName] = useState("");
  const [newCount, setNewCount] = useState(4);
  const [newMode, setNewMode] = useState("standard");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [revIdx, setRevIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [assignedRoles, setAssignedRoles] = useState([]);
  const [toast, setToast] = useState({ msg:"", show:false });
  const [gameState, setGameState] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [actionMode, setActionMode] = useState(null); // "move"|"attack"|"card"
  const [hoverZone, setHoverZone] = useState(null);
  const [eventModal, setEventModal] = useState(null);
  const [myGameIdx, setMyGameIdx] = useState(0);
  const pollRef = useRef(null);
  const roomCodeRef = useRef(null);
  const svgRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ msg, show:true });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 2400);
  }, []);

  // ─── POLLING ─────────────────────────────────────────────────────────────
  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPoll = useCallback((code) => {
    stopPoll();
    roomCodeRef.current = code;
    pollRef.current = setInterval(() => {
      const r = loadRoom(code);
      if (!r) { showToast("⚠ ห้องถูกปิดแล้ว"); stopPoll(); setScreen("title"); return; }
      setRoom(r);
      if (r.status === "started" && screen !== "game" && screen !== "roles") {
        stopPoll();
        setAssignedRoles(r.roles || []);
        setRevIdx(0); setFlipped(false); setRevealed(false);
        setScreen("roles");
      }
    }, POLL_INTERVAL);
  }, [showToast, stopPoll, screen]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const browseRooms = useCallback(() => { setRooms(listRooms()); }, []);
  useEffect(() => { if (screen === "join") browseRooms(); }, [screen, browseRooms]);
  useEffect(() => {
    if (screen !== "join") return;
    const t = setInterval(browseRooms, 3000);
    return () => clearInterval(t);
  }, [screen, browseRooms]);

  // ─── CREATE ROOM ─────────────────────────────────────────────────────────
  const createRoom = () => {
    const name = newName.trim() || "ผู้เล่น 1";
    const code = genCode();
    const newRoom = {
      code, createdAt: Date.now(), status:"waiting", mode:newMode,
      maxPlayers:newCount,
      players:[{ name, class:"", idx:0, ready:false, host:true }],
    };
    setLoading(true); setLoadMsg("กำลังสร้างห้อง...");
    const ok = saveRoom(newRoom);
    setLoading(false);
    if (!ok) { showToast("❌ สร้างห้องไม่สำเร็จ"); return; }
    setMyName(name); setMyIdx(0); setMyClass(""); setRoom(newRoom);
    startPoll(code);
    setScreen("lobby");
    showToast("✅ สร้างห้องสำเร็จ! รหัส: " + code);
  };

  // ─── JOIN ROOM ───────────────────────────────────────────────────────────
  const joinRoom = (codeArg, nameArg) => {
    const code = (codeArg || joinCode).trim().toUpperCase();
    const name = (nameArg || joinName).trim() || "ผู้เล่น";
    if (!code) { showToast("กรอกรหัสห้องก่อน"); return; }
    setLoading(true); setLoadMsg("กำลังค้นหาห้อง...");
    const r = loadRoom(code);
    setLoading(false);
    if (!r) { showToast("❌ ไม่พบห้อง " + code); return; }
    if (r.status === "started") { showToast("ห้องนี้เกมเริ่มไปแล้ว"); return; }
    if (r.players.length >= r.maxPlayers) { showToast("ห้องเต็มแล้ว"); return; }
    const idx = r.players.length;
    r.players.push({ name, class:"", idx, ready:false, host:false });
    saveRoom(r);
    setMyName(name); setMyIdx(idx); setMyClass(""); setRoom(r);
    startPoll(code);
    setScreen("lobby");
    showToast("✅ เข้าห้องสำเร็จ!");
  };

  const pickClass = (clsId) => {
    if (!room) return;
    setMyClass(clsId);
    const r = { ...room };
    r.players = r.players.map((p,i) => i===myIdx ? { ...p, class:clsId } : p);
    setRoom(r); saveRoom(r);
  };

  const toggleReady = () => {
    if (!room) return;
    const me = room.players[myIdx];
    if (!me.class) { showToast("เลือกอาชีพก่อน"); return; }
    const r = { ...room };
    r.players = r.players.map((p,i) => i===myIdx ? { ...p, ready:!p.ready } : p);
    setRoom(r); saveRoom(r);
  };

  const startGame = () => {
    if (!room) return;
    if (room.players.slice(1).some(p => !p.ready)) { showToast("รอผู้เล่นทุกคนกดพร้อม"); return; }
    if (room.players.length < 3) { showToast("ต้องมีอย่างน้อย 3 คน"); return; }
    const roles = assignRoles(room.players.length);
    const r = { ...room, status:"started", roles, startedAt:Date.now() };
    saveRoom(r); setRoom(r);
    setAssignedRoles(roles); setRevIdx(0); setFlipped(false); setRevealed(false);
    stopPoll(); setScreen("roles");
  };

  const leaveRoom = () => {
    if (!room) { setScreen("title"); return; }
    stopPoll();
    if (myIdx === 0) { deleteRoom(room.code); }
    else {
      const r = { ...room };
      r.players = r.players.filter((_,i) => i !== myIdx).map((p,i) => ({ ...p, idx:i }));
      saveRoom(r);
    }
    setRoom(null); setScreen("title");
  };

  const kickPlayer = (idx) => {
    if (!room || myIdx !== 0) return;
    const r = { ...room };
    r.players = r.players.filter((_,i) => i !== idx).map((p,i) => ({ ...p, idx:i }));
    setRoom(r); saveRoom(r);
  };

  // ─── ROLE REVEAL ─────────────────────────────────────────────────────────
  const players = room?.players || [];
  const isHost = myIdx === 0;
  const meInRoom = players[myIdx];
  const currentRevPlayer = players[revIdx];
  const currentRevRole = ROLES[assignedRoles[revIdx]];
  const amCurrentRev = revIdx === myIdx;

  const nextReveal = () => {
    if (revIdx + 1 >= players.length) { setRevealed(true); }
    else { setRevIdx(r => r+1); setFlipped(false); }
  };

  // ─── START GAME BOARD ─────────────────────────────────────────────────────
  const enterGame = () => {
    const gs = initGameState(room || { players: players.map((p,i) => ({ ...p, role: assignedRoles[i] })) });
    const myRoleId = assignedRoles[myIdx];
    const myPlayerInGame = gs.players.findIndex(p => p.name === myName);
    setMyGameIdx(myPlayerInGame >= 0 ? myPlayerInGame : myIdx);
    setGameState(gs);
    setActionMode(null);
    setSelectedCard(null);
    setSelectedZone(null);
    setScreen("game");
  };

  // ─── GAME LOGIC ───────────────────────────────────────────────────────────
  const gs = gameState;
  const isMyTurn = gs && gs.currentIdx === myGameIdx;
  const currentPlayer = gs?.players[gs?.currentIdx];

  function addLog(gs, msg, type="") {
    return { ...gs, log: [{ msg, type, ts: Date.now() }, ...(gs.log || [])].slice(0, 100) };
  }

  function applyZoneEffect(gs, player) {
    const zone = ZONES.find(z => z.id === player.zoneId);
    if (!zone) return [gs, player];
    let log = "";
    switch(zone.effect) {
      case "heal_2": player = { ...player, hp: Math.min(player.maxHp, player.hp+2) }; log = `🏘️ ${player.name} ฟื้น HP+2`; break;
      case "throne_effect":
        if (player.role === "king") { player = { ...player, hp: Math.min(player.maxHp, player.hp+3) }; log = `⚖️ ราชาที่บัลลังก์ HP+3`; }
        else if (player.role === "rebel") { player = { ...player, hp: Math.max(0, player.hp-2) }; log = `⚖️ กบฏที่บัลลังก์ HP-2`; }
        break;
      case "gold_king": if (player.role === "king") { player = { ...player, gold: player.gold+1 }; log = `🏰 ราชา +1 ทอง`; } break;
      case "draw_magic": player = { ...player, mana: Math.min(player.maxMana, player.mana+2) }; log = `🗼 มานา+2`; break;
      case "market": player = { ...player, gold: player.gold+1 }; log = `🏪 ทอง+1`; break;
      case "farm_gold": player = { ...player, gold: player.gold+1 }; log = `🌾 ทอง+1`; break;
      case "mana_regen": player = { ...player, mana: Math.min(player.maxMana, player.mana+3) }; log = `🌊 มานา+3`; break;
      case "rebel_buff": if (player.role === "rebel") { player = { ...player, hp: Math.min(player.maxHp, player.hp+2) }; log = `⛺ กบฏ HP+2`; } break;
      case "ruins_loot": {
        const roll = rollD6();
        if (roll >= 4) { const c = rndCard(); player = { ...player, hand: [...player.hand, c] }; log = `🏚️ 🎲${roll} พบสมบัติ "${c.name}"!`; }
        else { player = { ...player, hp: Math.max(0, player.hp-2) }; log = `🏚️ 🎲${roll} ไม่พบอะไร HP-2`; }
      } break;
      case "cave_loot": {
        const roll = rollD6();
        if (roll >= 4) { player = { ...player, gold: player.gold+3 }; log = `🐉 🎲${roll} หนีมังกร! +3 ทอง`; }
        else { player = { ...player, hp: Math.max(0, player.hp-3) }; log = `🐉 🎲${roll} โดนมังกร! HP-3`; }
      } break;
      default: break;
    }
    if (log) gs = addLog(gs, log, "evt");
    return [gs, player];
  }

  function checkVictory(gs) {
    const alive = gs.players.filter(p => p.alive);
    if (alive.length <= 1) {
      const w = alive[0];
      return w ? { winner: w.role, player: w, reason: `${w.name} รอดคนสุดท้าย` } : { winner:"draw", reason:"ทุกคนตาย" };
    }
    const king = gs.players.find(p => p.role === "king");
    const rebels = gs.players.filter(p => p.role === "rebel");
    if (!king?.alive) {
      const aliveRebels = rebels.filter(r => r.alive);
      if (aliveRebels.length) return { winner:"rebel", players:aliveRebels, reason:"โค่นบัลลังก์สำเร็จ!" };
    }
    if (king?.alive && rebels.every(r => !r.alive)) {
      return { winner:"king", player:king, reason:"ปราบกบฏทั้งหมด!" };
    }
    if (gs.phase > 6) {
      const w = alive.sort((a,b) => (b.hp+b.gold*0.5+b.level*2)-(a.hp+a.gold*0.5+a.level*2))[0];
      if (w) return { winner:w.role, player:w, reason:`${w.name} — คะแนนรวมสูงสุด` };
    }
    return null;
  }

  const handleMoveToZone = (zoneId) => {
    if (!gs || !isMyTurn || actionMode !== "move") return;
    if (!gs.reachableZones.includes(zoneId)) { showToast("ไม่สามารถเดินไปที่นั่นได้"); return; }
    let newGs = { ...gs };
    let players = [...gs.players];
    let player = { ...players[gs.currentIdx], prevZoneId: players[gs.currentIdx].zoneId, zoneId };
    const zone = ZONES.find(z => z.id === zoneId);
    newGs = addLog(newGs, `🚶 ${player.name} → ${zone?.name || zoneId}`);
    [newGs, player] = applyZoneEffect(newGs, player);
    players[gs.currentIdx] = player;
    newGs = { ...newGs, players, turnActions: { ...gs.turnActions, moved:true }, reachableZones:[], attackableZones:[] };
    const v = checkVictory(newGs);
    if (v) { newGs = { ...newGs, gameOver:true, winner:v }; newGs = addLog(newGs, `🏆 ${v.reason}`, "win"); }
    setGameState(newGs);
    setActionMode(null);
    setSelectedZone(null);
  };

  const handleAttackPlayer = (targetIdx) => {
    if (!gs || !isMyTurn || actionMode !== "attack") return;
    const attacker = gs.players[gs.currentIdx];
    const defender = gs.players[targetIdx];
    if (!defender.alive) { showToast("เป้าหมายตายแล้ว"); return; }
    if (targetIdx === gs.currentIdx) { showToast("ไม่สามารถโจมตีตัวเองได้"); return; }
    const dist = hexDistance(attacker.zoneId, defender.zoneId);
    const cls = CLASSES[attacker.classId] || CLASSES.warrior;
    const range = cls.atk > 3 ? 4 : 1; // archer range check approx
    if (dist > (attacker.classId === "archer" ? 4 : 2)) { showToast(`ไกลเกิน! ระยะ ${dist}`); return; }

    const rollA = rollD6();
    const defCls = CLASSES[defender.classId] || CLASSES.warrior;
    const hit = rollA > Math.floor(6 * (1 - Math.min(0.85, 0.6 + (cls.s.DEX - defCls.s.DEX)*0.05)));
    let newGs = { ...gs };
    let players = [...gs.players];

    if (!hit) {
      newGs = addLog(newGs, `🎯 ${attacker.name} โจมตี ${defender.name} — พลาด! 🎲${rollA}`, "miss");
    } else {
      const crit = rollA >= 5;
      let dmg = cls.s.STR + (attacker.classId === "warrior" && attacker.hp < attacker.maxHp/2 ? 2 : 0);
      if (crit) dmg = Math.ceil(dmg * 1.5);
      const def = defender.classId === "knight" ? 2 : 0;
      const finalDmg = Math.max(1, dmg - def);
      let d = { ...players[targetIdx], hp: Math.max(0, players[targetIdx].hp - finalDmg), damageReceived: (players[targetIdx].damageReceived||0)+finalDmg };
      let a = { ...players[gs.currentIdx], damageDealt: (players[gs.currentIdx].damageDealt||0)+finalDmg };
      newGs = addLog(newGs, `⚔️ ${attacker.name} โจมตี ${defender.name} — ${finalDmg} ดาเมจ 🎲${rollA}${crit?" ✨คริต!":""}${def>0?` (DEF-${def})`:""}`, "dmg");
      if (d.hp <= 0) {
        d = { ...d, alive:false, hp:0 };
        newGs = addLog(newGs, `💀 ${defender.name} (${ROLES[defender.role]?.name}) ถูกกำจัด!`, "death");
        a = { ...a, kills: (a.kills||0)+1 };
      }
      players[gs.currentIdx] = a;
      players[targetIdx] = d;
    }
    newGs = { ...newGs, players, turnActions: { ...gs.turnActions, attacked:true }, reachableZones:[], attackableZones:[] };
    const v = checkVictory(newGs);
    if (v) { newGs = { ...newGs, gameOver:true, winner:v }; newGs = addLog(newGs, `🏆 ${v.reason}`, "win"); }
    setGameState(newGs);
    setActionMode(null);
    setSelectedZone(null);
  };

  const handleUseCard = (card, targetIdx) => {
    if (!gs || !isMyTurn) return;
    let newGs = { ...gs };
    let players = [...gs.players];
    let caster = { ...players[gs.currentIdx] };
    if (card.manaCost && caster.mana < card.manaCost) { showToast(`มานาไม่พอ (ต้องการ ${card.manaCost})`); return; }
    if (card.manaCost) caster = { ...caster, mana: caster.mana - card.manaCost };
    let msg = `✨ ${caster.name} ใช้ "${card.name}"`;
    if (card.full_heal) { caster = { ...caster, hp:caster.maxHp }; msg += " → ฟื้น HP เต็ม!"; }
    else if (card.heal && targetIdx !== undefined) {
      let t = { ...players[targetIdx], hp: Math.min(players[targetIdx].maxHp, players[targetIdx].hp+card.heal) };
      players[targetIdx] = t; msg += ` → ${t.name} ฟื้น +${card.heal} HP`;
    }
    else if (card.dmg && targetIdx !== undefined) {
      let t = { ...players[targetIdx], hp: Math.max(0, players[targetIdx].hp - card.dmg) };
      if (t.hp <= 0) { t = { ...t, alive:false }; msg += ` → ${t.name} ตาย!`; }
      else msg += ` → ${players[targetIdx].name} เสีย ${card.dmg} HP`;
      players[targetIdx] = t;
    }
    else if (card.barrier) { caster = { ...caster, statusEffects: [...(caster.statusEffects||[]), {type:"barrier",dur:2}] }; msg += " → บาเรียป้องกัน!"; }
    // remove card from hand
    const hi = caster.hand.findIndex(c => c.id === card.id);
    if (hi >= 0) { const h = [...caster.hand]; h.splice(hi,1); caster = { ...caster, hand:h }; }
    players[gs.currentIdx] = caster;
    newGs = { ...newGs, players, turnActions: { ...gs.turnActions, usedCard:true } };
    newGs = addLog(newGs, msg, "magic");
    const v = checkVictory(newGs);
    if (v) { newGs = { ...newGs, gameOver:true, winner:v }; newGs = addLog(newGs, `🏆 ${v.reason}`, "win"); }
    setGameState(newGs);
    setActionMode(null);
    setSelectedCard(null);
    showToast(msg.slice(0,40));
  };

  const handleEndTurn = () => {
    if (!gs || !isMyTurn) return;
    let newGs = { ...gs };
    let players = [...gs.players];
    let curr = { ...players[gs.currentIdx] };
    // mana regen
    curr = { ...curr, mana: Math.min(curr.maxMana, curr.mana+1) };
    // auto draw
    const card = rndCard();
    curr = { ...curr, hand: [...curr.hand, card] };
    newGs = addLog(newGs, `🃏 ${curr.name} จั่ว "${card.name}"`, "draw");
    players[gs.currentIdx] = curr;

    // next player
    let next = (gs.currentIdx + 1) % players.length;
    let tries = 0;
    while (!players[next].alive && tries < players.length) { next = (next+1)%players.length; tries++; }

    let phase = gs.phase;
    let totalTurns = gs.totalTurns + 1;
    if (next <= gs.currentIdx && tries < players.length) {
      phase++;
      newGs = addLog(newGs, `─── เฟส ${phase} เริ่มต้น! ───`, "event");
      // phase event
      const ev = EVENTS[Math.floor(Math.random()*EVENTS.length)];
      newGs = addLog(newGs, `📜 ${ev.ico} ${ev.name} — ${ev.desc}`, "event");
      // apply event
      if (ev.fx === "gold_all_2") players = players.map(p => p.alive ? {...p, gold:p.gold+2} : p);
      else if (ev.fx === "heal_all_3") players = players.map(p => p.alive ? {...p, hp:Math.min(p.maxHp, p.hp+3)} : p);
      else if (ev.fx === "dmg_all_2") players = players.map(p => p.alive ? {...p, hp:Math.max(0, p.hp-2)} : p);
      else if (ev.fx === "atk_all_1") newGs = { ...newGs, globalAtkBonus:(newGs.globalAtkBonus||0)+1 };
      else if (ev.fx === "dmg_highest_3") {
        const top = players.filter(p=>p.alive).reduce((a,b)=>a.hp>b.hp?a:b, players[0]);
        if (top) players = players.map(p => p.id===top.id ? {...p, hp:Math.max(0,p.hp-3)} : p);
      }
      setEventModal(ev);
    }

    newGs = { ...newGs, players, currentIdx:next, phase, totalTurns, turnActions:{moved:false,attacked:false,usedCard:false}, reachableZones:[], attackableZones:[] };
    const v = checkVictory(newGs);
    if (v) { newGs = { ...newGs, gameOver:true, winner:v }; newGs = addLog(newGs, `🏆 ${v.reason}`, "win"); }
    newGs = addLog(newGs, `🔔 เทิร์นของ ${players[next].name}`, "turn");
    setGameState(newGs);
    setActionMode(null);
    setSelectedCard(null);
    setSelectedZone(null);
  };

  // Action mode toggles
  const startMove = () => {
    if (!gs || !isMyTurn || gs.turnActions.moved) { showToast("เดินไปแล้วในเทิร์นนี้"); return; }
    const cp = gs.players[gs.currentIdx];
    const cls = CLASSES[cp.classId] || CLASSES.warrior;
    const reachable = getReachable(cp.zoneId, cls.move);
    setGameState({ ...gs, reachableZones: reachable, attackableZones:[] });
    setActionMode("move");
    showToast(`เลือกพื้นที่ที่จะเดิน (ระยะ ${cls.move})`);
  };

  const startAttack = () => {
    if (!gs || !isMyTurn || gs.turnActions.attacked) { showToast("โจมตีไปแล้วในเทิร์นนี้"); return; }
    const cp = gs.players[gs.currentIdx];
    const cls = CLASSES[cp.classId] || CLASSES.warrior;
    const atkRange = cp.classId === "archer" ? 4 : cp.classId === "mage" ? 3 : 2;
    const attackable = gs.players.filter(p => p.alive && p.id !== cp.id && hexDistance(cp.zoneId, p.zoneId) <= atkRange).map(p => p.zoneId);
    setGameState({ ...gs, attackableZones: attackable, reachableZones:[] });
    setActionMode("attack");
    showToast("เลือกเป้าหมายที่จะโจมตี");
  };

  const cancelAction = () => {
    if (!gs) return;
    setGameState({ ...gs, reachableZones:[], attackableZones:[] });
    setActionMode(null);
    setSelectedCard(null);
  };

  // ─── HEX MAP RENDER ──────────────────────────────────────────────────────
  const HEX_SIZE = 44;
  const svgW = 620;
  const svgH = 380;

  function renderHexMap() {
    if (!gs) return null;
    return (
      <svg ref={svgRef} viewBox={`0 0 ${svgW} ${svgH}`} style={{width:"100%",height:"100%",display:"block"}}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {ZONES.map(zone => {
          const {x, y} = hexCenter(zone.col, zone.row, HEX_SIZE);
          const pts = hexCorners(x, y, HEX_SIZE - 2);
          const isReachable = gs.reachableZones.includes(zone.id);
          const isAttackable = gs.attackableZones.includes(zone.id);
          const playersHere = gs.players.filter(p => p.alive && p.zoneId === zone.id);
          const isCurrent = currentPlayer && currentPlayer.zoneId === zone.id;
          const baseFill = ZONE_COLORS[zone.type] || "#1a1a1a";
          return (
            <g key={zone.id} className={`hex-cell${isReachable?" reachable":""}${isAttackable?" attackable":""}${isCurrent?" current-player":""}`}
              onClick={() => {
                if (actionMode === "move" && isReachable) { handleMoveToZone(zone.id); return; }
                if (actionMode === "attack") {
                  const target = gs.players.find(p => p.alive && p.zoneId === zone.id && p.id !== (currentPlayer?.id));
                  if (target) { handleAttackPlayer(target.id); return; }
                }
                setHoverZone(hoverZone === zone.id ? null : zone.id);
              }}
              onMouseEnter={() => setHoverZone(zone.id)}
              onMouseLeave={() => setHoverZone(null)}
            >
              <polygon points={pts} className="hex-bg"
                fill={isReachable?"rgba(30,80,30,0.7)":isAttackable?"rgba(80,20,20,0.7)":baseFill}
                stroke={isReachable?"#4cc94c":isAttackable?"#c94040":"rgba(201,168,76,0.2)"}
                strokeWidth={isReachable||isAttackable?"2":"1"}
              />
              {/* zone icon */}
              <text x={x} y={y-10} textAnchor="middle" fontSize="16" style={{pointerEvents:"none"}}>{zone.ico}</text>
              {/* zone name */}
              <text x={x} y={y+6} textAnchor="middle" fontSize="7" fill="rgba(232,213,176,0.7)" style={{pointerEvents:"none"}}>
                {zone.name.slice(0,6)}
              </text>
              {/* players */}
              {playersHere.map((p,i) => {
                const cls = CLASSES[p.classId];
                const isMe = p.id === myGameIdx;
                const angle = (i / Math.max(1,playersHere.length)) * Math.PI * 2;
                const r = playersHere.length > 1 ? 14 : 0;
                const px = x + r * Math.cos(angle);
                const py = y + 18 + r * Math.sin(angle) * 0.5;
                return (
                  <g key={p.id}>
                    <circle cx={px} cy={py} r="9" fill={ROLES[p.role]?.color || "#888"} opacity="0.85"
                      stroke={isMe?"#fff":"rgba(0,0,0,.3)"} strokeWidth={isMe?"2":"1"}
                      filter={isMe?"url(#glow)":"none"}
                    />
                    <text x={px} y={py+4} textAnchor="middle" fontSize="10" style={{pointerEvents:"none"}}>{cls?.ico || "🧑"}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── GAME BOARD SCREEN ────────────────────────────────────────────────────
  const myPlayer = gs?.players[myGameIdx];

  const readyCount = players.filter(p => p.ready || p.host).length;

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"/>
          <div className="loading-txt">{loadMsg}</div>
        </div>
      )}

      <div className={`toast${toast.show?"" :" hide"}`}>{toast.msg}</div>

      {/* EVENT MODAL */}
      {eventModal && (
        <div className="modal-overlay" onClick={() => setEventModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-ico">{eventModal.ico}</div>
            <div className="modal-title">{eventModal.name}</div>
            <div className="modal-desc">{eventModal.desc}</div>
            <button className="btn b-gold" onClick={() => setEventModal(null)}>รับทราบ</button>
          </div>
        </div>
      )}

      {/* ═══ TITLE ═══ */}
      <div id="t" className={`screen${screen==="title"?" on":""}`}>
        <div className="stars"/>
        <div className="twrap">
          <span className="crown">♛</span>
          <h1 className="tmain">บัลลังก์เงา</h1>
          <div className="tsub">Shadow of Throne</div>
          <div className="div"/>
          <p className="lore">ในยุคแห่งความแตกแยก บัลลังก์รอผู้พิชิต<br/>ใช้เล่ห์เหลี่ยม อาวุธ เวทย์มนตร์ และโชคชะตา</p>
          <div className="mcards">
            <div className="mcard" onClick={() => setScreen("create")}>
              <span className="mico">🏰</span><div className="mnm">สร้างห้อง</div><div className="mdesc">เริ่มเกมใหม่<br/>3-6 ผู้เล่น</div>
            </div>
            <div className="mcard" onClick={() => setScreen("join")}>
              <span className="mico">⚔️</span><div className="mnm">เข้าร่วม</div><div className="mdesc">เลือกห้องที่มีอยู่<br/>หรือใส่รหัส</div>
            </div>
          </div>
          <div style={{marginTop:"20px"}}>
            <button className="btn b-ghost" onClick={() => {
              // Solo test mode
              const testRoom = {
                code:"TEST", createdAt:Date.now(), status:"started", mode:"standard", maxPlayers:4,
                players:[
                  {name:"คุณ",class:"warrior",idx:0,ready:true,host:true},
                  {name:"เพื่อน1",class:"mage",idx:1,ready:true,host:false},
                  {name:"เพื่อน2",class:"archer",idx:2,ready:true,host:false},
                  {name:"เพื่อน3",class:"rogue",idx:3,ready:true,host:false},
                ],
                roles:assignRoles(4),
              };
              setRoom(testRoom);
              setMyName("คุณ"); setMyIdx(0);
              const gs = initGameState(testRoom);
              setMyGameIdx(0);
              setGameState(gs);
              setAssignedRoles(testRoom.roles);
              setScreen("roles");
            }}>🎮 ทดสอบเดี่ยว (4 ผู้เล่น)</button>
          </div>
        </div>
      </div>

      {/* ═══ CREATE ROOM ═══ */}
      <div id="cr" className={`screen${screen==="create"?" on":""}`} style={{background:"var(--s2)",alignItems:"center",justifyContent:"center",padding:"20px"}}>
        <div style={{maxWidth:"420px",width:"100%"}}>
          <div className="lhdr" style={{marginBottom:"20px"}}>
            <button className="b-sm" onClick={() => setScreen("title")}>← กลับ</button>
            <h2 className="cinzel" style={{fontSize:"18px",color:"var(--gold)"}}>🏰 สร้างห้องใหม่</h2>
          </div>
          <div className="sbox">
            <div className="sh">⚙ ตั้งค่าห้อง</div>
            <div className="row"><label>ชื่อของคุณ:</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="ชื่อ Host" maxLength={12}/></div>
            <div className="row"><label>จำนวนผู้เล่น:</label>
              <select value={newCount} onChange={e=>setNewCount(+e.target.value)}>
                <option value={3}>3 คน</option><option value={4}>4 คน</option><option value={5}>5 คน</option><option value={6}>6 คน</option>
              </select>
            </div>
            <div className="row"><label>โหมดเกม:</label>
              <select value={newMode} onChange={e=>setNewMode(e.target.value)}>
                <option value="standard">มาตรฐาน (6 เฟส)</option><option value="quick">ด่วน (4 เฟส)</option><option value="epic">มหากาพย์ (8 เฟส)</option>
              </select>
            </div>
          </div>
          <div className="warn">⚠ ต้องเปิดในเบราว์เซอร์เดียวกันเพื่อใช้ localStorage</div>
          <div style={{textAlign:"center",marginTop:"8px"}}>
            <button className="btn b-gold" onClick={createRoom} disabled={!newName.trim()}>🏰 สร้างห้อง</button>
          </div>
        </div>
      </div>

      {/* ═══ JOIN / BROWSE ═══ */}
      <div id="rl" className={`screen${screen==="join"?" on":""}`} style={{background:"var(--s2)",alignItems:"center",justifyContent:"flex-start",padding:"20px",overflowY:"auto"}}>
        <div style={{maxWidth:"600px",width:"100%",margin:"0 auto"}}>
          <div className="lhdr">
            <button className="b-sm" onClick={() => setScreen("title")}>← กลับ</button>
            <h2 className="cinzel" style={{fontSize:"18px",color:"var(--gold)"}}>⚔️ เข้าร่วมเกม</h2>
          </div>
          <div className="tabs">
            <div className={`tab${tab==="browse"?" on":""}`} onClick={() => { setTab("browse"); browseRooms(); }}>🔍 ห้องที่เปิดอยู่</div>
            <div className={`tab${tab==="manual"?" on":""}`} onClick={() => setTab("manual")}>📋 ใส่รหัสห้อง</div>
          </div>
          {tab === "browse" && (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                <div style={{fontSize:"12px",color:"var(--txt-m)"}}>ห้องที่กำลังรอ</div>
                <button className="b-sm" onClick={browseRooms}>🔄 รีเฟรช</button>
              </div>
              {rooms.length === 0 ? (
                <div style={{textAlign:"center",padding:"48px 20px",color:"var(--txt-m)"}}>
                  <div style={{fontSize:"48px",marginBottom:"12px"}}>🏰</div>
                  <div className="cinzel" style={{fontSize:"15px",marginBottom:"6px"}}>ยังไม่มีห้องเปิดอยู่</div>
                  <button className="btn b-ghost" onClick={() => setScreen("create")}>+ สร้างห้อง</button>
                </div>
              ) : rooms.map(r => (
                <div className="room-card" key={r.code} onClick={() => {
                  const n = prompt("ชื่อของคุณ:","");
                  if (n !== null) joinRoom(r.code, n || "ผู้เล่น");
                }}>
                  <div className="rc-code">{r.code}</div>
                  <div className="rc-info">
                    <div className="rc-host">🏰 {r.players[0]?.name || "Host"}</div>
                    <div className="rc-meta">{r.mode === "quick" ? "โหมดด่วน" : r.mode === "epic" ? "มหากาพย์" : "มาตรฐาน"} · {Math.round((Date.now()-r.createdAt)/60000)} นาทีที่แล้ว</div>
                  </div>
                  <div className="rc-count">{r.players.length}/{r.maxPlayers}</div>
                </div>
              ))}
            </>
          )}
          {tab === "manual" && (
            <div className="join-box">
              <div className="join-title">📋 กรอกรหัสห้อง</div>
              <input className="join-input" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="SOT-XXXX" maxLength={8}/>
              <input style={{textAlign:"center",marginBottom:"12px"}} value={joinName} onChange={e=>setJoinName(e.target.value)} placeholder="ชื่อของคุณ" maxLength={12}/>
              <button className="btn b-gold" onClick={() => joinRoom()} disabled={joinCode.length < 4}>เข้าร่วมห้อง →</button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LOBBY ═══ */}
      <div id="l" className={`screen${screen==="lobby"?" on":""}`}>
        <div className="lwrap">
          <div className="lhdr">
            <button className="b-danger" onClick={leaveRoom}>✕ ออก</button>
            <h2 className="cinzel" style={{fontSize:"17px",color:"var(--gold)"}}>ห้องเกม</h2>
            {room && <>
              <div className="code-badge">{room.code}</div>
              <button className="b-sm" onClick={() => { navigator.clipboard?.writeText(room.code); showToast("คัดลอกรหัสแล้ว!"); }}>📋 คัดลอก</button>
            </>}
          </div>
          {room && (
            <div className="sbox">
              <div className="sh">👥 ผู้เล่น ({room.players.length}/{room.maxPlayers})</div>
              <div className="ready-bar">
                {Array.from({length:room.maxPlayers}).map((_,i) => {
                  const p = room.players[i];
                  return <div key={i} className={`r-dot${p&&(p.ready||p.host)?" on":""}`} title={p?.name||"ว่าง"}/>;
                })}
                <span style={{fontSize:"11px",color:"var(--txt-m)",marginLeft:"6px"}}>{readyCount}/{room.maxPlayers} พร้อม</span>
              </div>
              <div className="slots">
                {Array.from({length:room.maxPlayers}).map((_,i) => {
                  const p = room.players[i];
                  const cls = p?.class ? CLASSES[p.class] : null;
                  if (!p) return <div key={i} className="slot empty"><div className="sn" style={{color:"var(--txt-d)"}}>รอผู้เล่น...</div></div>;
                  return (
                    <div key={i} className={`slot filled${p.ready?" ready-s":""} ${p.host?" host-s":""}`}>
                      <div className="sn">{cls?.ico || "🧑"} {p.name}{i===myIdx&&<span className="tag tag-you">คุณ</span>}{p.host&&<span className="tag tag-host">Host</span>}{p.ready&&<span className="tag tag-ready">✓</span>}</div>
                      <div className="sc">{cls ? cls.name : "ยังไม่เลือกอาชีพ"}</div>
                      {isHost && i!==0 && <button className="b-danger" style={{fontSize:"10px",padding:"2px 8px",marginTop:"4px"}} onClick={() => kickPlayer(i)}>✕ Kick</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="sbox">
            <div className="sh">⚔ เลือกอาชีพ</div>
            <div className="cgrid">
              {Object.values(CLASSES).map(cls => (
                <div key={cls.id} className={`ccard${myClass===cls.id?" sel":""}`} onClick={() => pickClass(cls.id)}>
                  <div className="ci">{cls.ico}</div><div className="cn">{cls.name}</div>
                  <div className="cst">
                    <span className="cs">STR {cls.s.STR}</span><span className="cs">DEX {cls.s.DEX}</span>
                    <span className="cs">VIT {cls.s.VIT}</span><span className="cs">INT {cls.s.INT}</span>
                  </div>
                  <div style={{display:"flex",gap:"6px",justifyContent:"center",fontSize:"9px",color:"var(--txt-m)",marginBottom:"4px"}}>
                    <span>❤{cls.hp}</span><span>💧{cls.mana}</span><span>🗺{cls.move}</span>
                  </div>
                  <div className="cab">⚡ {cls.ability}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:"10px",alignItems:"center",justifyContent:"center",marginTop:"4px",flexWrap:"wrap"}}>
            {!isHost && <button className={`btn b-ghost`} style={meInRoom?.ready?{background:"rgba(42,122,53,.3)",borderColor:"#2a7a35"}:{}} onClick={toggleReady} disabled={!myClass}>{meInRoom?.ready?"✓ พร้อมแล้ว!":"✓ พร้อม"}</button>}
            {isHost && <button className="btn b-gold" onClick={startGame} disabled={!room||room.players.length<3||room.players.slice(1).some(p=>!p.ready)}>🎮 เริ่มเกม!</button>}
          </div>
          {!myClass && <div className="pulse" style={{marginTop:"8px"}}>เลือกอาชีพก่อนกดพร้อม</div>}
        </div>
      </div>

      {/* ═══ ROLE REVEAL ═══ */}
      <div id="rr" className={`screen${screen==="roles"?" on":""}`}>
        <div className="rrwrap">
          <span style={{fontSize:"40px",display:"block",animation:"float 3s ease-in-out infinite",filter:"drop-shadow(0 0 20px rgba(201,168,76,.5))"}}>♛</span>
          <h2 className="deco" style={{color:"var(--gold)",margin:"8px 0 4px",fontSize:"clamp(16px,3vw,22px)"}}>
            {revealed ? "ภาพรวมผู้เล่น" : `${currentRevPlayer?.name || "?"} — ดูบทบาท`}
          </h2>
          {!revealed ? (
            <>
              <div className="warn">⚠ แตะการ์ดเพื่อดูบทบาท — ห้ามให้คนอื่นเห็น!</div>
              <div className="flip-outer" onClick={() => {
                if (!amCurrentRev) { showToast(`รอถึง ${currentRevPlayer?.name}`); return; }
                setFlipped(true);
              }}>
                <div className={`flip${flipped?" f":""}`}>
                  <div className="fback"><div className="fbglyph">⚜</div><p style={{fontSize:"10px",color:"var(--txt-m)",marginTop:"10px"}}>{amCurrentRev?"แตะเพื่อดู":`รอ ${currentRevPlayer?.name}`}</p></div>
                  {currentRevRole && (
                    <div className={`ffront ff-${currentRevRole.id}`}>
                      <div className="fico">{currentRevRole.ico}</div>
                      <div className="fnm">{currentRevRole.name}</div>
                      <div className="fwhy">{currentRevRole.why}</div>
                      <div className="fwin">🏆 {currentRevRole.win}</div>
                    </div>
                  )}
                </div>
              </div>
              {flipped && amCurrentRev && (
                <div style={{textAlign:"center",marginTop:"12px"}}>
                  <div style={{fontSize:"11px",color:"var(--txt-m)",marginBottom:"6px"}}>คุณคือ {currentRevRole?.ico} <span className="cinzel" style={{color:"var(--gold)"}}>{currentRevRole?.name}</span></div>
                  <button className="btn b-gold" onClick={nextReveal}>จำแล้ว → ส่งต่อ</button>
                  <div style={{fontSize:"10px",color:"var(--txt-d)",marginTop:"6px"}}>ส่งหน้าจอให้คนถัดไป</div>
                </div>
              )}
              {!flipped && <div className="blink" style={{marginTop:"12px"}}>{amCurrentRev?"แตะการ์ดเพื่อดูบทบาท":`รอ ${currentRevPlayer?.name} ดูบทบาท`}</div>}
            </>
          ) : (
            <>
              <p style={{fontSize:"12px",color:"var(--txt-m)",marginBottom:"12px",textAlign:"center"}}>ทุกคนดูบทบาทครบแล้ว</p>
              <div className="rogrid">
                {players.map((p,i) => {
                  const cls = p.class ? CLASSES[p.class] : null;
                  return (
                    <div key={i} className="rocard">
                      <div style={{fontSize:"28px"}}>{cls?.ico || "🧑"}</div>
                      <div className="ronm">{p.name}</div>
                      <div style={{fontSize:"9px",color:"var(--txt-d)"}}>{cls?.name || "-"}</div>
                      {i === myIdx && <div style={{fontSize:"9px",color:ROLES[assignedRoles[i]]?.color,marginTop:"3px"}}>{ROLES[assignedRoles[i]]?.ico} {ROLES[assignedRoles[i]]?.name}</div>}
                      {i !== myIdx && <div style={{fontSize:"9px",color:"var(--txt-d)",marginTop:"3px"}}>? บทบาทซ่อน</div>}
                    </div>
                  );
                })}
              </div>
              <button className="btn b-gold" style={{margin:"20px auto 0",display:"block"}} onClick={enterGame}>⚔️ เริ่มการรบ!</button>
            </>
          )}
        </div>
      </div>

      {/* ═══ GAME BOARD ═══ */}
      <div id="gb" className={`screen${screen==="game"?" on":""}`}>
        {gs && !gs.gameOver && (
          <>
            {/* LEFT: Players */}
            <div className="gb-left">
              <div className="panel">
                <div className="panel-title">⚔ ผู้เล่น</div>
                {gs.players.map((p,i) => {
                  const cls = CLASSES[p.classId] || CLASSES.warrior;
                  const hpPct = p.hp / p.maxHp * 100;
                  const manaPct = p.mana / p.maxMana * 100;
                  const isMe = i === myGameIdx;
                  const isTurn = i === gs.currentIdx;
                  return (
                    <div key={i} className={`pcard${isTurn?" active":""}${!p.alive?" dead":""}`}
                      onClick={() => { if (actionMode === "attack" && p.alive && i !== myGameIdx) handleAttackPlayer(i); }}
                    >
                      <div className="pcard-top">
                        <span style={{fontSize:"18px"}}>{cls.ico}</span>
                        <div style={{flex:1}}>
                          <div className="pcard-name">{p.name}{isMe&&<span className="tag tag-you">คุณ</span>}{isTurn&&<span className="tag" style={{background:"rgba(201,168,76,.3)",color:"var(--gold)"}}>เทิร์น</span>}</div>
                          <div className="pcard-role" style={{color:p.alive?ROLES[p.role]?.color:"#666"}}>{ROLES[p.role]?.ico} {p.revealed||i===myGameIdx?ROLES[p.role]?.name:"?"}</div>
                        </div>
                        <div style={{textAlign:"right",fontSize:"9px",color:"var(--txt-m)"}}>
                          <div>❤{p.hp}/{p.maxHp}</div><div>💧{p.mana}/{p.maxMana}</div><div>🪙{p.gold}</div>
                        </div>
                      </div>
                      <div className="hp-bar"><div className="hp-fill" style={{width:`${hpPct}%`}} className={`hp-fill${hpPct>60?" high":hpPct>30?" mid":""}`}/></div>
                      <div className="mana-bar"><div className="mana-fill" style={{width:`${manaPct}%`}}/></div>
                      <div className="pcard-stats">
                        <span className="pstat">Lv.{p.level}</span>
                        <span className="pstat">STR{cls.s.STR}</span>
                        <span className="pstat">DEX{cls.s.DEX}</span>
                        {!p.alive && <span className="pstat" style={{color:"#f06060"}}>💀 ตาย</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CENTER: Map */}
            <div className="gb-center">
              <div style={{padding:"8px 12px",background:"var(--s3)",borderBottom:"1px solid rgba(201,168,76,.1)",display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
                <span className="phase-badge">เฟส {gs.phase}</span>
                <span style={{fontSize:"12px",color:"var(--gold)",flex:1}}>
                  {currentPlayer ? `🔔 เทิร์นของ ${currentPlayer.name}` : ""}
                </span>
                <span style={{fontSize:"11px",color:"var(--txt-m)"}}>รอบที่ {gs.totalTurns+1}</span>
              </div>
              <div className="hex-map">{renderHexMap()}</div>
              {hoverZone && (() => {
                const z = ZONES.find(x => x.id === hoverZone);
                return z ? (
                  <div className="zone-info">
                    <div className="zone-info-name">{z.ico} {z.name}</div>
                    <div className="zone-info-desc">{z.desc}</div>
                  </div>
                ) : null;
              })()}
              {/* Turn actions */}
              <div className="turn-panel">
                <div className="turn-header">
                  <span style={{fontSize:"12px",color:"var(--txt-m)"}}>
                    {isMyTurn ? "เทิร์นของคุณ" : `รอ ${currentPlayer?.name}...`}
                  </span>
                  {actionMode && <button className="b-sm" onClick={cancelAction}>✕ ยกเลิก</button>}
                </div>
                <div className="turn-actions">
                  <button className={`action-btn move${gs.turnActions.moved?" done":""}`}
                    disabled={!isMyTurn || gs.turnActions.moved || actionMode === "move"}
                    onClick={startMove}>
                    🗺 เดิน {gs.turnActions.moved?"✓":""}
                  </button>
                  <button className={`action-btn attack${gs.turnActions.attacked?" done":""}`}
                    disabled={!isMyTurn || gs.turnActions.attacked || actionMode === "attack"}
                    onClick={startAttack}>
                    ⚔️ โจมตี {gs.turnActions.attacked?"✓":""}
                  </button>
                  <button className={`action-btn card${gs.turnActions.usedCard?" done":""}`}
                    disabled={!isMyTurn || gs.turnActions.usedCard || !myPlayer?.hand?.length}
                    onClick={() => setActionMode(actionMode==="card"?null:"card")}>
                    🃏 ใช้การ์ด {gs.turnActions.usedCard?"✓":""}
                  </button>
                  <button className="action-btn end" disabled={!isMyTurn} onClick={handleEndTurn}>⏭ จบเทิร์น</button>
                </div>
                {actionMode === "move" && <div style={{fontSize:"11px",color:"#7fe07f",marginTop:"6px"}}>▶ คลิกพื้นที่สีเขียวเพื่อเดิน</div>}
                {actionMode === "attack" && <div style={{fontSize:"11px",color:"#f08080",marginTop:"6px"}}>▶ คลิกผู้เล่นหรือพื้นที่สีแดงเพื่อโจมตี</div>}
              </div>
            </div>

            {/* RIGHT: Hand + Log */}
            <div className="gb-right">
              <div className="panel">
                <div className="panel-title">🃏 การ์ดในมือ ({myPlayer?.hand?.length || 0})</div>
                <div className="card-list">
                  {(myPlayer?.hand || []).map((card,i) => (
                    <div key={i} className={`card-item${selectedCard?.id===card.id?" selected":""}`}
                      onClick={() => {
                        if (actionMode === "card") {
                          if (card.type === "magic" && (card.heal || card.full_heal || card.barrier)) {
                            handleUseCard(card, myGameIdx);
                          } else if (card.type === "magic" && card.dmg) {
                            const t = gs.players.find(p => p.alive && p.id !== myGameIdx);
                            if (t) handleUseCard(card, t.id);
                          } else {
                            handleUseCard(card, myGameIdx);
                          }
                        } else {
                          setSelectedCard(selectedCard?.id === card.id ? null : card);
                        }
                      }}>
                      <span className="card-ico">{card.ico}</span>
                      <div className="card-info">
                        <div className="card-name">{card.name}</div>
                        <div className="card-effect">{card.effect}</div>
                      </div>
                      <span className={`card-type-badge type-${card.type}`}>{card.type === "magic" ? "🔮" : card.type === "weapon" ? "⚔️" : "🕳️"}</span>
                    </div>
                  ))}
                  {(!myPlayer?.hand?.length) && <div style={{fontSize:"11px",color:"var(--txt-d)",textAlign:"center",padding:"12px"}}>ไม่มีการ์ดในมือ</div>}
                </div>
              </div>
              <div className="log-panel">
                <div className="panel-title" style={{padding:"10px 10px 4px"}}>📜 บันทึกเกม</div>
                {(gs.log || []).map((entry,i) => (
                  <div key={i} className={`log-entry${entry.type?" "+entry.type:""}`}>{entry.msg}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* GAME OVER OVERLAY */}
        {gs?.gameOver && (
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}>
            <div style={{textAlign:"center",padding:"40px",maxWidth:"500px"}}>
              <div style={{fontSize:"80px",animation:"float 2s ease-in-out infinite",filter:"drop-shadow(0 0 40px rgba(201,168,76,.6))"}}>
                {gs.winner?.winner === "king" ? "👑" : gs.winner?.winner === "rebel" ? "⚔️" : gs.winner?.winner === "traitor" ? "🗡️" : gs.winner?.winner === "commoner" ? "🧑‍🌾" : "💀"}
              </div>
              <div className="cinzel" style={{fontSize:"28px",color:"var(--gold)",margin:"12px 0 8px"}}>
                {gs.winner?.player?.name || gs.winner?.winner || "เกมจบ"}
              </div>
              <div style={{fontSize:"14px",color:"var(--txt-m)",marginBottom:"8px"}}>{gs.winner?.reason}</div>
              <div style={{fontSize:"12px",color:ROLES[gs.winner?.winner]?.color,marginBottom:"24px"}}>
                {ROLES[gs.winner?.winner]?.ico} ฝ่าย{ROLES[gs.winner?.winner]?.name} ชนะ!
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"24px"}}>
                {gs.players.map((p,i) => (
                  <div key={i} className="win-stat" style={{opacity:p.alive?1:.6}}>
                    <div className="ws-name">{CLASSES[p.classId]?.ico} {p.name} {!p.alive?"💀":""}</div>
                    <div className="ws-info">{ROLES[p.role]?.ico} {ROLES[p.role]?.name} | Lv.{p.level} | ❤{p.hp}/{p.maxHp} | 🪙{p.gold}</div>
                  </div>
                ))}
              </div>
              <button className="btn b-gold" onClick={() => { setGameState(null); setScreen("title"); }}>🏠 กลับหน้าหลัก</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

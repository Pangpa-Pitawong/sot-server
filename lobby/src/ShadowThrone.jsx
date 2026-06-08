import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const POLL_INTERVAL = 2000;

const ROLES = {
  king:     { id: "king",     ico: "👑", name: "พระราชา", why: "รักษาบัลลังก์และปกป้องอาณาจักร", win: "ครองราชย์ครบ 8 เฟส หรือปราบกบฏ",         color: "#c9a84c" },
  rebel:    { id: "rebel",    ico: "⚔️", name: "กบฏ",     why: "โค่นบัลลังก์ด้วยการรวมกำลัง",    win: "ราชา HP=0 หรือยึดศาลบัลลังก์",          color: "#c94040" },
  traitor:  { id: "traitor",  ico: "🗡️", name: "คนทรยศ", why: "ซ่อนตัวเป็นพันธมิตร สะสมสมบัติลับ", win: "สมบัติ 5 ชิ้น หรือรอดคนสุดท้าย",    color: "#8c4cc9" },
  commoner: { id: "commoner", ico: "🧑‍🌾", name: "ราษฎร", why: "ไม่อยู่ฝ่ายใด สะสมทรัพย์สิน",    win: "ทอง 10 เหรียญ หรือ Lv.5",              color: "#4cc94c" },
};

const CLASSES = {
  warrior: { id: "warrior", ico: "⚔️", name: "นักรบ",   evo: "→ คนเถื่อน → เบอร์เซิกเกอร์", hp: 12, mana: 4,  move: 3, atk: 2, s: { STR: 5, DEX: 2, VIT: 4, INT: 1 }, ability: "โจมตีกว้าง 3 เป้าหมาย",    passive: "ทนดาเมจสุดท้าย 1 ครั้ง" },
  knight:  { id: "knight",  ico: "🛡️", name: "อัศวิน",  evo: "→ พาราดิน → โรยัลไนท์",       hp: 14, mana: 5,  move: 2, atk: 2, s: { STR: 4, DEX: 2, VIT: 5, INT: 2 }, ability: "พระบัญชา: สั่งย้ายผู้เล่น", passive: "ลดดาเมจรับ 1 ตลอดเวลา" },
  mage:    { id: "mage",    ico: "🔮", name: "นักเวทย์", evo: "→ จอมเวทย์ → นักปราญ์",       hp: 7,  mana: 14, move: 2, atk: 1, s: { STR: 1, DEX: 3, VIT: 2, INT: 7 }, ability: "เวทย์พื้นที่ 3 ช่อง",       passive: "จั่วเวทย์เพิ่ม 1 ใบ/เฟส" },
  archer:  { id: "archer",  ico: "🏹", name: "นักธนู",   evo: "→ พลซุ่มยิง → นักล่า",        hp: 9,  mana: 6,  move: 4, atk: 3, s: { STR: 2, DEX: 6, VIT: 3, INT: 2 }, ability: "ยิงข้ามกำแพง ระยะ 4",      passive: "ตีคริต 15% เสมอ" },
  rogue:   { id: "rogue",   ico: "🗡️", name: "โจร",     evo: "→ นักฆ่า → จอมอุบาย",         hp: 9,  mana: 7,  move: 5, atk: 3, s: { STR: 3, DEX: 6, VIT: 3, INT: 2 }, ability: "โจมตีด้านหลัง ATK×2",     passive: "หลบ 20% เสมอ" },
  cleric:  { id: "cleric",  ico: "✨", name: "นักบวช",  evo: "→ บาทหลวง → บิชอป",            hp: 10, mana: 10, move: 2, atk: 1, s: { STR: 1, DEX: 2, VIT: 4, INT: 6 }, ability: "ฟื้น HP +4 ให้พันธมิตร",   passive: "ฟื้น HP +1 ทุกต้นเทิร์น" },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const genCode = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "SOT-" + Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

// ─── ROLE ASSIGNMENT ─────────────────────────────────────────────────────────
function assignRoles(count) {
  // Always: 1 king, rebels scale with player count, traitor optional, rest commoners
  const pool = ["king"];
  if (count >= 3) pool.push("rebel");
  if (count >= 4) pool.push("rebel");
  if (count >= 5) pool.push("traitor");
  while (pool.length < count) pool.push("commoner");
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// ─── ROOM STORE (localStorage) ───────────────────────────────────────────────
function saveRoom(room) {
  try { localStorage.setItem("room:" + room.code, JSON.stringify(room)); return true; }
  catch (e) { console.error(e); return false; }
}
function loadRoom(code) {
  try { const r = localStorage.getItem("room:" + code); return r ? JSON.parse(r) : null; }
  catch (e) { return null; }
}
function deleteRoom(code) {
  try { localStorage.removeItem("room:" + code); } catch {}
}
function listRooms() {
  try {
    const rooms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("room:")) {
        try {
          const r = JSON.parse(localStorage.getItem(key));
          if (r && r.status !== "started" && (Date.now() - r.createdAt) < 30 * 60 * 1000)
            rooms.push(r);
        } catch {}
      }
    }
    return rooms;
  } catch (e) { return []; }
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
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
.cinzel{font-family:'Cinzel',serif}
.deco{font-family:'Cinzel Decorative',serif}

.screen{display:none;min-height:100vh;flex-direction:column}
.screen.on{display:flex}

#t{align-items:center;justify-content:center;text-align:center;
  background:radial-gradient(ellipse 100% 80% at 50% 0%,#1a1208,var(--stone) 70%);
  position:relative;overflow:hidden}
.stars{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(1px 1px at 10% 20%,rgba(201,168,76,.4),transparent),
  radial-gradient(1px 1px at 85% 15%,rgba(201,168,76,.3),transparent),
  radial-gradient(1px 1px at 30% 70%,rgba(201,168,76,.2),transparent),
  radial-gradient(2px 2px at 60% 45%,rgba(201,168,76,.15),transparent)}
.twrap{position:relative;z-index:1;padding:40px 20px;max-width:560px;width:100%}
.crown{font-size:72px;display:block;animation:float 3s ease-in-out infinite;
  filter:drop-shadow(0 0 30px rgba(201,168,76,.5))}
@keyframes float{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-14px) rotate(3deg)}}
.tmain{font-family:'Cinzel Decorative',serif;font-size:clamp(26px,5vw,52px);color:var(--gold);
  text-shadow:0 0 50px rgba(201,168,76,.3),0 2px 8px rgba(0,0,0,.8);letter-spacing:.06em;margin:.3em 0 .1em}
.tsub{font-family:'Cinzel',serif;font-size:clamp(9px,1.2vw,12px);letter-spacing:.5em;color:var(--txt-m);text-transform:uppercase}
.div{width:240px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:1.2rem auto}
.lore{font-size:13px;color:var(--txt-m);line-height:2;max-width:380px;margin:0 auto 1.8rem;font-style:italic}

.mcards{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:360px;margin:0 auto;width:100%;padding:0 16px}
.mcard{background:var(--s3);border:1px solid rgba(201,168,76,.15);border-radius:12px;padding:16px 12px;cursor:pointer;transition:all .2s;text-align:center}
.mcard:hover{border-color:var(--gold);background:var(--gold-f);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.mico{font-size:32px;display:block;margin-bottom:6px}
.mnm{font-family:'Cinzel',serif;font-size:12px;color:var(--gold);margin-bottom:3px}
.mdesc{font-size:10px;color:var(--txt-m);line-height:1.4}

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

input,select{background:var(--s4);color:var(--txt);border:1px solid rgba(201,168,76,.2);border-radius:6px;padding:8px 12px;font-family:'Sarabun',sans-serif;font-size:13px;outline:none;width:100%}
input:focus,select:focus{border-color:var(--gold)}
input::placeholder{color:var(--txt-d)}

.sbox{background:var(--s3);border:1px solid rgba(201,168,76,.12);border-radius:12px;padding:16px;margin-bottom:12px}
.sh{font-family:'Cinzel',serif;font-size:11px;letter-spacing:.18em;color:var(--txt-m);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.sh::after{content:'';flex:1;height:1px;background:rgba(201,168,76,.1)}

#l{background:var(--s2);align-items:center;justify-content:flex-start;padding:20px;overflow-y:auto}
.lwrap{max-width:720px;width:100%;margin:0 auto}
.lhdr{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.code-badge{background:var(--s3);border:1px solid var(--gold-d);border-radius:8px;padding:5px 14px;font-family:'Cinzel',serif;font-size:15px;color:var(--gold-l);letter-spacing:.25em}
.slots{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.slot{background:var(--s4);border:1px solid rgba(201,168,76,.1);border-radius:8px;padding:10px 12px;transition:all .2s}
.slot.filled{border-color:rgba(201,168,76,.3)}
.slot.ready-s{border-color:#2a7a35;background:rgba(42,122,53,.08)}
.slot.host-s{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.04)}
.slot.empty{opacity:.45}
.sn{font-size:13px;font-weight:600;margin-bottom:2px}
.sc{font-size:10px;color:var(--txt-m);margin-bottom:3px}
.ss{font-size:10px}
.s-rdy{color:#4cc94c}.s-wait{color:var(--txt-m)}.s-host{color:var(--gold)}

#rl{background:var(--s2);align-items:center;justify-content:flex-start;padding:20px;overflow-y:auto}
.rlwrap{max-width:600px;width:100%;margin:0 auto}
.room-card{background:var(--s3);border:1px solid rgba(201,168,76,.15);border-radius:12px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .2s}
.room-card:hover{border-color:var(--gold);background:var(--gold-f);transform:translateX(4px)}
.rc-code{font-family:'Cinzel',serif;font-size:16px;color:var(--gold);letter-spacing:.15em;min-width:90px}
.rc-info{flex:1}
.rc-host{font-size:13px;font-weight:600}
.rc-meta{font-size:11px;color:var(--txt-m);margin-top:2px}
.rc-count{font-family:'Cinzel',serif;font-size:13px;color:var(--gold-l);background:var(--s4);padding:4px 10px;border-radius:6px;border:1px solid var(--gold-d)}
.empty-rooms{text-align:center;padding:48px 20px;color:var(--txt-m)}
.eri{font-size:48px;margin-bottom:12px}
.ern{font-family:'Cinzel',serif;font-size:15px;color:var(--txt-m);margin-bottom:6px}
.reload-spin{display:inline-block;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.ccard{background:var(--s4);border:1.5px solid rgba(201,168,76,.12);border-radius:10px;padding:12px 8px;cursor:pointer;transition:all .2s;text-align:center}
.ccard:hover,.ccard.sel{border-color:var(--gold);background:var(--gold-f);transform:translateY(-2px)}
.ci{font-size:32px;margin-bottom:4px}
.cn{font-family:'Cinzel',serif;font-size:11px;color:var(--gold);margin-bottom:3px}
.ce{font-size:8px;color:var(--txt-d);margin-bottom:4px}
.cst{display:flex;gap:3px;justify-content:center;flex-wrap:wrap;margin-bottom:4px}
.cs{font-size:8px;background:rgba(0,0,0,.3);padding:1px 5px;border-radius:3px;color:var(--txt-m)}
.cab{font-size:9px;color:rgba(201,168,76,.7);line-height:1.4;text-align:left}
.cpas{font-size:8px;color:rgba(100,180,100,.7);line-height:1.3;margin-top:2px;text-align:left}

#rr{background:radial-gradient(ellipse at 50% 50%,#0d0a05,#040302);align-items:center;justify-content:center}
.rrwrap{display:flex;flex-direction:column;align-items:center;padding:24px 20px;min-height:100vh;justify-content:center}
.flip-outer{perspective:700px;cursor:pointer;margin:16px 0}
.flip{width:220px;height:300px;position:relative;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,0,.2,1)}
.flip.f{transform:rotateY(180deg)}
.fback,.ffront{position:absolute;inset:0;border-radius:14px;backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;border:2px solid var(--gold-d)}
.fback{background:linear-gradient(160deg,var(--s3),var(--s2));background-image:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(201,168,76,.03) 8px,rgba(201,168,76,.03) 9px)}
.fbglyph{font-size:64px;color:var(--gold-d);opacity:.4;animation:ps 2s ease-in-out infinite}
@keyframes ps{0%,100%{opacity:.2}50%{opacity:.5}}
.ffront{transform:rotateY(180deg)}
.ff-king{background:linear-gradient(160deg,#2a1800,#4a2e00)}
.ff-rebel{background:linear-gradient(160deg,#1a0808,#3a1010)}
.ff-traitor{background:linear-gradient(160deg,#0a0a12,#181828)}
.ff-commoner{background:linear-gradient(160deg,#081008,#10281a)}
.fico{font-size:56px;margin-bottom:8px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.5))}
.fnm{font-family:'Cinzel',serif;font-size:17px;color:var(--gold);margin-bottom:4px}
.fwhy{font-size:10px;color:var(--txt-m);text-align:center;line-height:1.6}
.fwin{font-size:9px;color:var(--gold-l);margin-top:8px;border-top:1px solid rgba(201,168,76,.2);padding-top:6px;width:100%;text-align:center;line-height:1.4}
.blink{animation:blink 1.4s ease-in-out infinite;color:var(--txt-m);font-size:11px}
@keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}

.rogrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:560px;width:100%;margin-top:12px}
@media(min-width:540px){.rogrid{grid-template-columns:repeat(3,1fr)}}
.rocard{background:var(--s3);border:1.5px solid rgba(201,168,76,.18);border-radius:10px;padding:12px;text-align:center;animation:rev .5s ease-out both}
@keyframes rev{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.ronm{font-family:'Cinzel',serif;font-size:12px;color:var(--gold);margin:6px 0 3px}
.rorl{font-size:9px;padding:2px 8px;border-radius:3px;display:inline-block;background:rgba(255,255,255,.05);color:var(--txt-m)}

.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(0);
  background:rgba(201,168,76,.92);color:#0d0b09;padding:8px 22px;border-radius:8px;
  font-size:13px;font-family:'Sarabun',sans-serif;z-index:9999;
  transition:opacity .3s,transform .3s;pointer-events:none}
.toast.hide{opacity:0;transform:translateX(-50%) translateY(8px)}

.pulse{animation:pulse .9s ease-in-out infinite;font-size:11px;color:var(--txt-m);text-align:center}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}

.warn{font-size:10px;color:rgba(255,180,50,.7);background:rgba(200,120,0,.1);border:1px solid rgba(200,120,0,.3);border-radius:6px;padding:7px 14px;margin-bottom:12px;text-align:center}

.tabs{display:flex;gap:8px;margin-bottom:16px}
.tab{flex:1;background:var(--s3);border:1px solid rgba(201,168,76,.12);border-radius:8px;padding:10px;cursor:pointer;text-align:center;font-family:'Cinzel',serif;font-size:12px;color:var(--txt-m);transition:all .2s}
.tab.on{border-color:var(--gold);color:var(--gold);background:var(--gold-f)}

.join-box{background:var(--s3);border:1px solid rgba(201,168,76,.2);border-radius:12px;padding:20px;text-align:center;max-width:340px;margin:0 auto}
.join-title{font-family:'Cinzel',serif;font-size:14px;color:var(--gold);margin-bottom:12px}
.join-input{text-align:center;letter-spacing:.2em;font-family:'Cinzel',serif;font-size:16px;text-transform:uppercase;margin-bottom:12px}

.loading-overlay{position:fixed;inset:0;background:rgba(13,11,8,.85);display:flex;align-items:center;justify-content:center;z-index:999;flex-direction:column;gap:12px}
.loading-spinner{width:40px;height:40px;border:3px solid var(--gold-d);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite}
.loading-txt{font-family:'Cinzel',serif;font-size:13px;color:var(--gold);letter-spacing:.1em}

.row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.row label{font-size:12px;color:var(--txt-m);min-width:96px;flex-shrink:0}
.row select,.row input{flex:1}

.tag{font-size:9px;padding:2px 8px;border-radius:4px;margin-left:6px}
.tag-you{background:rgba(201,168,76,.2);color:var(--gold)}
.tag-host{background:rgba(201,168,76,.3);color:var(--gold-l)}
.tag-ready{background:rgba(42,122,53,.3);color:#4cc94c}

.ready-bar{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px}
.r-dot{width:10px;height:10px;border-radius:50%;background:var(--s4);border:1px solid var(--txt-d);transition:all .3s}
.r-dot.on{background:#4cc94c;border-color:#4cc94c;box-shadow:0 0 6px rgba(76,201,76,.4)}

/* join-name input spacing */
.join-name-input{text-align:center;margin-bottom:12px}
`;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
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

  const [toast, setToast] = useState({ msg: "", show: false });

  const pollRef = useRef(null);
  const roomCodeRef = useRef(null);
  // Track our own player index per room code so polling can detect kicks
  const myIdxRef = useRef(0);

  // ─── TOAST ───────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 2200);
  }, []);

  // ─── STOP POLL ───────────────────────────────────────────────────────────
  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── POLLING ─────────────────────────────────────────────────────────────
  const startPoll = useCallback((code, playerIdx) => {
    stopPoll();
    roomCodeRef.current = code;
    myIdxRef.current = playerIdx ?? 0;

    pollRef.current = setInterval(() => {
      const r = loadRoom(code);
      if (!r) {
        showToast("⚠ ห้องถูกปิดแล้ว");
        stopPoll();
        setScreen("title");
        setRoom(null);
        return;
      }

      // Detect kick: our slot no longer exists
      const idx = myIdxRef.current;
      if (idx > 0 && (!r.players[idx] || r.players[idx].name !== myName)) {
        // Try to find ourselves by name
        const newIdx = r.players.findIndex(p => p.name === myName);
        if (newIdx === -1) {
          showToast("คุณถูกเตะออกจากห้อง");
          stopPoll();
          setRoom(null);
          setScreen("title");
          return;
        }
        myIdxRef.current = newIdx;
        setMyIdx(newIdx);
      }

      setRoom(r);

      if (r.status === "started") {
        stopPoll();
        setAssignedRoles(r.roles || []);
        setRevIdx(0);
        setFlipped(false);
        setRevealed(false);
        setScreen("roles");
      }
    }, POLL_INTERVAL);
  }, [showToast, stopPoll, myName]);

  // Cleanup on unmount
  useEffect(() => () => stopPoll(), [stopPoll]);

  // ─── BROWSE ROOMS ────────────────────────────────────────────────────────
  const browseRooms = useCallback(() => {
    setRooms(listRooms());
  }, []);

  // Auto-browse when switching to join screen
  useEffect(() => {
    if (screen === "join") browseRooms();
  }, [screen, browseRooms]);

  // ─── CREATE ROOM ─────────────────────────────────────────────────────────
  const createRoom = () => {
    const name = newName.trim() || "ผู้เล่น 1";
    const code = genCode();
    const newRoom = {
      code,
      createdAt: Date.now(),
      status: "waiting",
      mode: newMode,
      maxPlayers: newCount,
      players: [{ name, class: "", idx: 0, ready: false, host: true }],
    };
    setLoading(true);
    setLoadMsg("กำลังสร้างห้อง...");
    const ok = saveRoom(newRoom);
    setLoading(false);
    if (!ok) { showToast("❌ สร้างห้องไม่สำเร็จ"); return; }
    setMyName(name);
    setMyIdx(0);
    myIdxRef.current = 0;
    setMyClass("");
    setRoom(newRoom);
    startPoll(code, 0);
    setScreen("lobby");
    showToast("✅ สร้างห้องสำเร็จ! รหัส: " + code);
  };

  // ─── JOIN ROOM ───────────────────────────────────────────────────────────
  const joinRoom = (codeArg, nameArg) => {
    const code = (codeArg || joinCode).trim().toUpperCase();
    const name = (nameArg || joinName).trim() || "ผู้เล่น";
    if (!code) { showToast("กรอกรหัสห้องก่อน"); return; }
    setLoading(true);
    setLoadMsg("กำลังค้นหาห้อง...");
    const r = loadRoom(code);
    setLoading(false);
    if (!r) { showToast("❌ ไม่พบห้อง " + code); return; }
    if (r.status === "started") { showToast("ห้องนี้เกมเริ่มไปแล้ว"); return; }
    if (r.players.length >= r.maxPlayers) { showToast("ห้องเต็มแล้ว"); return; }
    const idx = r.players.length;
    r.players.push({ name, class: "", idx, ready: false, host: false });
    const ok = saveRoom(r);
    if (!ok) { showToast("❌ เข้าห้องไม่สำเร็จ"); return; }
    setMyName(name);
    setMyIdx(idx);
    myIdxRef.current = idx;
    setMyClass("");
    setRoom(r);
    startPoll(code, idx);
    setScreen("lobby");
    showToast("✅ เข้าห้องสำเร็จ!");
  };

  // ─── UPDATE MY CLASS ─────────────────────────────────────────────────────
  const pickClass = (clsId) => {
    if (!room) return;
    setMyClass(clsId);
    const r = loadRoom(room.code) || { ...room };
    r.players = r.players.map((p, i) => i === myIdxRef.current ? { ...p, class: clsId } : p);
    setRoom(r);
    saveRoom(r);
  };

  // ─── TOGGLE READY ────────────────────────────────────────────────────────
  const toggleReady = () => {
    if (!room) return;
    const idx = myIdxRef.current;
    const me = room.players[idx];
    if (!me || !me.class) { showToast("เลือกอาชีพก่อน"); return; }
    const r = loadRoom(room.code) || { ...room };
    r.players = r.players.map((p, i) => i === idx ? { ...p, ready: !p.ready } : p);
    setRoom(r);
    saveRoom(r);
  };

  // ─── START GAME (host only) ──────────────────────────────────────────────
  const startGame = () => {
    if (!room) return;
    const allReady = room.players.slice(1).every(p => p.ready);
    if (!allReady) { showToast("รอผู้เล่นทุกคนกดพร้อมก่อน"); return; }
    if (room.players.length < 3) { showToast("ต้องมีอย่างน้อย 3 คน"); return; }
    const roles = assignRoles(room.players.length);
    const r = { ...room, status: "started", roles, startedAt: Date.now() };
    saveRoom(r);
    setRoom(r);
    setAssignedRoles(roles);
    setRevIdx(0);
    setFlipped(false);
    setRevealed(false);
    stopPoll();
    setScreen("roles");
  };

  // ─── KICK PLAYER ─────────────────────────────────────────────────────────
  const kickPlayer = (idx) => {
    if (!room || myIdxRef.current !== 0) return;
    const r = { ...room };
    r.players = r.players.filter((_, i) => i !== idx).map((p, i) => ({ ...p, idx: i }));
    setRoom(r);
    saveRoom(r);
  };

  // ─── LEAVE ROOM ──────────────────────────────────────────────────────────
  const leaveRoom = () => {
    if (!room) { setScreen("title"); return; }
    stopPoll();
    if (myIdxRef.current === 0) {
      deleteRoom(room.code);
    } else {
      const r = { ...room };
      r.players = r.players.filter((_, i) => i !== myIdxRef.current).map((p, i) => ({ ...p, idx: i }));
      saveRoom(r);
    }
    setRoom(null);
    setMyClass("");
    setScreen("title");
  };

  // ─── DERIVED ─────────────────────────────────────────────────────────────
  const players = room?.players || [];
  const meInRoom = players[myIdxRef.current];
  const isHost = myIdxRef.current === 0;
  const currentRevPlayer = players[revIdx];
  const currentRevRole = ROLES[assignedRoles[revIdx]];
  const amCurrentRev = revIdx === myIdxRef.current;
  const readyCount = players.filter(p => p.ready || p.host).length;

  const nextReveal = () => {
    if (revIdx + 1 >= players.length) {
      setRevealed(true);
    } else {
      setRevIdx(r => r + 1);
      setFlipped(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <div className="loading-txt">{loadMsg}</div>
        </div>
      )}

      <div className={`toast${toast.show ? "" : " hide"}`}>{toast.msg}</div>

      {/* ═══ TITLE ═══ */}
      <div id="t" className={`screen${screen === "title" ? " on" : ""}`}>
        <div className="stars" />
        <div className="twrap">
          <span className="crown">♛</span>
          <h1 className="tmain">บัลลังก์เงา</h1>
          <div className="tsub">Shadow of Throne</div>
          <div className="div" />
          <p className="lore">
            ในยุคแห่งความแตกแยก บัลลังก์รอผู้พิชิต<br />
            ใช้เล่ห์เหลี่ยม อาวุธ เวทย์มนตร์ และโชคชะตา
          </p>
          <div className="mcards">
            <div className="mcard" onClick={() => setScreen("create")}>
              <span className="mico">🏰</span>
              <div className="mnm">สร้างห้อง</div>
              <div className="mdesc">เริ่มเกมใหม่<br />3-6 ผู้เล่น</div>
            </div>
            <div className="mcard" onClick={() => setScreen("join")}>
              <span className="mico">⚔️</span>
              <div className="mnm">หาห้อง / เข้าร่วม</div>
              <div className="mdesc">เลือกห้องที่มีอยู่<br />หรือใส่รหัส</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CREATE ROOM ═══ */}
      <div
        id="cr"
        className={`screen${screen === "create" ? " on" : ""}`}
        style={{ background: "var(--s2)", alignItems: "center", justifyContent: "center", padding: "20px" }}
      >
        <div style={{ maxWidth: "420px", width: "100%" }}>
          <div className="lhdr" style={{ marginBottom: "20px" }}>
            <button className="b-sm" onClick={() => setScreen("title")}>← กลับ</button>
            <h2 className="cinzel" style={{ fontSize: "18px", color: "var(--gold)" }}>🏰 สร้างห้องใหม่</h2>
          </div>
          <div className="sbox">
            <div className="sh">⚙ ตั้งค่าห้อง</div>
            <div className="row">
              <label>ชื่อของคุณ:</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="ชื่อ Host" maxLength={12} />
            </div>
            <div className="row">
              <label>จำนวนผู้เล่น:</label>
              <select value={newCount} onChange={e => setNewCount(+e.target.value)}>
                <option value={3}>3 คน</option>
                <option value={4}>4 คน</option>
                <option value={5}>5 คน</option>
                <option value={6}>6 คน</option>
              </select>
            </div>
            <div className="row">
              <label>โหมดเกม:</label>
              <select value={newMode} onChange={e => setNewMode(e.target.value)}>
                <option value="standard">มาตรฐาน (6 เฟส)</option>
                <option value="quick">ด่วน (4 เฟส)</option>
                <option value="epic">มหากาพย์ (8 เฟส)</option>
              </select>
            </div>
          </div>
          <div className="warn">⚠ รหัสห้องจะแสดงหลังสร้าง — ส่งให้เพื่อนเพื่อเข้าร่วม</div>
          <div style={{ textAlign: "center", marginTop: "8px" }}>
            <button className="btn b-gold" onClick={createRoom} disabled={!newName.trim()}>
              🏰 สร้างห้องเลย
            </button>
          </div>
        </div>
      </div>

      {/* ═══ JOIN / BROWSE ═══ */}
      <div id="rl" className={`screen${screen === "join" ? " on" : ""}`}>
        <div className="rlwrap">
          <div className="lhdr">
            <button className="b-sm" onClick={() => setScreen("title")}>← กลับ</button>
            <h2 className="cinzel" style={{ fontSize: "18px", color: "var(--gold)" }}>⚔️ เข้าร่วมเกม</h2>
          </div>
          <div className="tabs">
            <div
              className={`tab${tab === "browse" ? " on" : ""}`}
              onClick={() => { setTab("browse"); browseRooms(); }}
            >
              🔍 ห้องที่เปิดอยู่
            </div>
            <div
              className={`tab${tab === "manual" ? " on" : ""}`}
              onClick={() => setTab("manual")}
            >
              📋 ใส่รหัสห้อง
            </div>
          </div>

          {tab === "browse" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", color: "var(--txt-m)" }}>ห้องที่กำลังรอผู้เล่น</div>
                <button className="b-sm" onClick={browseRooms}>🔄 รีเฟรช</button>
              </div>
              {rooms.length === 0 ? (
                <div className="empty-rooms">
                  <div className="eri">🏰</div>
                  <div className="ern">ยังไม่มีห้องเปิดอยู่</div>
                  <div style={{ fontSize: "11px", marginBottom: "16px" }}>ให้เพื่อนสร้างห้องก่อน หรือสร้างเอง</div>
                  <button className="btn b-ghost" onClick={() => setScreen("create")}>+ สร้างห้อง</button>
                </div>
              ) : (
                rooms.map(r => (
                  <JoinCard
                    key={r.code}
                    r={r}
                    onJoin={(code, name) => joinRoom(code, name)}
                  />
                ))
              )}
            </>
          )}

          {tab === "manual" && (
            <div className="join-box">
              <div className="join-title">📋 กรอกรหัสห้อง</div>
              <input
                className="join-input"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="SOT-XXXX"
                maxLength={8}
              />
              <input
                className="join-name-input"
                style={{ textAlign: "center", marginBottom: "12px" }}
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                placeholder="ชื่อของคุณ"
                maxLength={12}
              />
              <button className="btn b-gold" onClick={() => joinRoom()} disabled={joinCode.length < 4}>
                เข้าร่วมห้อง →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LOBBY ═══ */}
      <div id="l" className={`screen${screen === "lobby" ? " on" : ""}`}>
        <div className="lwrap">
          <div className="lhdr">
            <button className="b-danger" onClick={leaveRoom}>✕ ออก</button>
            <h2 className="cinzel" style={{ fontSize: "17px", color: "var(--gold)" }}>ห้องเกม</h2>
            {room && (
              <>
                <div className="code-badge">{room.code}</div>
                <button className="b-sm" onClick={() => {
                  navigator.clipboard?.writeText(room.code);
                  showToast("คัดลอกรหัสแล้ว!");
                }}>📋 คัดลอก</button>
              </>
            )}
          </div>

          {room && (
            <div className="sbox">
              <div className="sh">👥 ผู้เล่น ({room.players.length}/{room.maxPlayers})</div>
              <div className="ready-bar" style={{ marginBottom: "10px" }}>
                {Array.from({ length: room.maxPlayers }).map((_, i) => {
                  const p = room.players[i];
                  const isOn = p && (p.ready || p.host);
                  return <div key={i} className={`r-dot${isOn ? " on" : ""}`} title={p?.name || "ว่าง"} />;
                })}
                <span style={{ fontSize: "11px", color: "var(--txt-m)", marginLeft: "6px" }}>
                  {readyCount}/{room.maxPlayers} พร้อม
                </span>
              </div>
              <div className="slots">
                {Array.from({ length: room.maxPlayers }).map((_, i) => {
                  const p = room.players[i];
                  const isMe = i === myIdxRef.current;
                  const cls = p?.class ? CLASSES[p.class] : null;
                  if (!p) return (
                    <div key={i} className="slot empty">
                      <div className="sn" style={{ color: "var(--txt-d)" }}>รอผู้เล่น...</div>
                    </div>
                  );
                  return (
                    <div key={i} className={`slot filled${p.ready ? " ready-s" : ""}${p.host ? " host-s" : ""}`}>
                      <div className="sn">
                        {cls?.ico || "🧑"} {p.name}
                        {isMe && <span className="tag tag-you">คุณ</span>}
                        {p.host && <span className="tag tag-host">Host</span>}
                        {p.ready && <span className="tag tag-ready">✓</span>}
                      </div>
                      <div className="sc">{cls ? cls.name : "ยังไม่เลือกอาชีพ"}</div>
                      {isHost && !isMe && (
                        <button
                          className="b-danger"
                          style={{ fontSize: "10px", padding: "2px 8px", marginTop: "4px" }}
                          onClick={() => kickPlayer(i)}
                        >✕ Kick</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="sbox">
            <div className="sh">⚔ เลือกอาชีพของคุณ</div>
            <div className="cgrid">
              {Object.values(CLASSES).map(cls => (
                <div
                  key={cls.id}
                  className={`ccard${myClass === cls.id ? " sel" : ""}`}
                  onClick={() => pickClass(cls.id)}
                >
                  <div className="ci">{cls.ico}</div>
                  <div className="cn">{cls.name}</div>
                  <div className="ce">{cls.evo}</div>
                  <div className="cst">
                    <span className="cs">STR {cls.s.STR}</span>
                    <span className="cs">DEX {cls.s.DEX}</span>
                    <span className="cs">VIT {cls.s.VIT}</span>
                    <span className="cs">INT {cls.s.INT}</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center", fontSize: "9px", color: "var(--txt-m)", marginBottom: "4px" }}>
                    <span>❤{cls.hp}</span>
                    <span>💧{cls.mana}</span>
                    <span>🗺{cls.move}</span>
                  </div>
                  <div className="cab">⚡ {cls.ability}</div>
                  <div className="cpas">🟢 {cls.passive}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center", marginTop: "4px", flexWrap: "wrap" }}>
            {!isHost && (
              <button
                className="btn b-ghost"
                style={meInRoom?.ready ? { background: "rgba(42,122,53,.3)", borderColor: "#2a7a35" } : {}}
                onClick={toggleReady}
                disabled={!myClass}
              >
                {meInRoom?.ready ? "✓ พร้อมแล้ว!" : "✓ พร้อมแล้ว"}
              </button>
            )}
            {isHost && (
              <button
                className="btn b-gold"
                onClick={startGame}
                disabled={!room || room.players.length < 3 || room.players.slice(1).some(p => !p.ready)}
              >
                🎮 เริ่มเกม!
              </button>
            )}
          </div>
          {!myClass && <div className="pulse" style={{ marginTop: "8px" }}>เลือกอาชีพก่อนกดพร้อม</div>}
          {isHost && room && room.players.slice(1).some(p => !p.ready) && (
            <div className="pulse" style={{ marginTop: "8px" }}>รอผู้เล่นทุกคนกดพร้อม...</div>
          )}
        </div>
      </div>

      {/* ═══ ROLE REVEAL ═══ */}
      <div id="rr" className={`screen${screen === "roles" ? " on" : ""}`}>
        <div className="rrwrap">
          <span style={{
            fontSize: "40px", display: "block",
            animation: "float 3s ease-in-out infinite",
            filter: "drop-shadow(0 0 20px rgba(201,168,76,.5))"
          }}>♛</span>
          <h2 className="deco" style={{ color: "var(--gold)", margin: "8px 0 4px", fontSize: "clamp(16px,3vw,22px)" }}>
            {revealed ? "ภาพรวมผู้เล่น" : `${currentRevPlayer?.name || "?"} — ดูบทบาท`}
          </h2>

          {!revealed ? (
            <>
              <div className="warn">⚠ แตะการ์ดเพื่อดูบทบาท — ห้ามให้คนอื่นเห็น!</div>
              <div className="flip-outer" onClick={() => {
                if (!amCurrentRev) { showToast(`รอถึง ${currentRevPlayer?.name}`); return; }
                setFlipped(true);
              }}>
                <div className={`flip${flipped ? " f" : ""}`}>
                  <div className="fback">
                    <div className="fbglyph">⚜</div>
                    <p style={{ fontSize: "10px", color: "var(--txt-m)", marginTop: "10px" }}>
                      {amCurrentRev ? "แตะเพื่อดู" : `รอ ${currentRevPlayer?.name}`}
                    </p>
                  </div>
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
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <div style={{ fontSize: "11px", color: "var(--txt-m)", marginBottom: "6px" }}>
                    คุณคือ {currentRevRole?.ico}{" "}
                    <span className="cinzel" style={{ color: "var(--gold)" }}>{currentRevRole?.name}</span>
                  </div>
                  <button className="btn b-gold" onClick={nextReveal}>
                    จำแล้ว → ส่งต่อ
                  </button>
                  <div style={{ fontSize: "10px", color: "var(--txt-d)", marginTop: "6px" }}>ส่งหน้าจอให้คนถัดไป</div>
                </div>
              )}
              {!flipped && (
                <div className="blink" style={{ marginTop: "12px" }}>
                  {amCurrentRev ? "แตะการ์ดเพื่อดูบทบาท" : `รอ ${currentRevPlayer?.name} ดูบทบาท`}
                </div>
              )}
            </>
          ) : (
            <>
              <p style={{ fontSize: "12px", color: "var(--txt-m)", marginBottom: "12px", textAlign: "center" }}>
                ทุกคนดูบทบาทครบแล้ว — บทบาทซ่อนอยู่จากผู้เล่นอื่น
              </p>
              <div className="rogrid">
                {players.map((p, i) => {
                  const cls = p.class ? CLASSES[p.class] : null;
                  return (
                    <div key={i} className="rocard" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div style={{ fontSize: "28px" }}>{cls?.ico || "🧑"}</div>
                      <div className="ronm">{p.name}</div>
                      <span className="rorl">? บทบาทซ่อนอยู่</span>
                      <div style={{ fontSize: "10px", color: "var(--txt-d)", marginTop: "4px" }}>{cls?.name || "ไม่มีอาชีพ"}</div>
                    </div>
                  );
                })}
              </div>
              <button
                className="btn b-gold"
                style={{ margin: "20px auto 0", display: "block" }}
                onClick={() => showToast("🎮 เกมเริ่มแล้ว! โชคดีทุกคน")}
              >
                ⚔️ เริ่มการรบ!
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── JOIN CARD (uses local state for name prompt instead of window.prompt) ───
function JoinCard({ r, onJoin }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <div className="room-card" onClick={() => setOpen(true)}>
        <div className="rc-code">{r.code}</div>
        <div className="rc-info">
          <div className="rc-host">🏰 {r.players[0]?.name || "Host"}</div>
          <div className="rc-meta">
            {r.mode === "quick" ? "โหมดด่วน" : r.mode === "epic" ? "มหากาพย์" : "มาตรฐาน"}
            &ensp;·&ensp;{Math.round((Date.now() - r.createdAt) / 60000)} นาทีที่แล้ว
          </div>
        </div>
        <div className="rc-count">{r.players.length}/{r.maxPlayers}</div>
      </div>

      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999
        }}>
          <div className="join-box" style={{ position: "relative" }}>
            <div className="join-title">เข้าร่วมห้อง {r.code}</div>
            <input
              style={{ textAlign: "center", marginBottom: "12px" }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="ชื่อของคุณ"
              maxLength={12}
              autoFocus
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              <button className="b-sm" onClick={() => setOpen(false)}>ยกเลิก</button>
              <button
                className="btn b-gold"
                style={{ padding: "8px 20px", fontSize: "12px" }}
                onClick={() => { onJoin(r.code, name || "ผู้เล่น"); setOpen(false); }}
              >
                เข้าร่วม →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

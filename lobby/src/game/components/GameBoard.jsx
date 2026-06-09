// src/game/components/GameBoard.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "../styles/gameboard.css";

import { ROLES }       from "../constants/roles.js";
import { CLASSES }     from "../constants/classes.js";
import { WEAPON_CARDS, MAGIC_CARDS, TRAP_CARDS } from "../constants/cards.js";
import { TERRAIN, TERRAIN_COLORS, TERRAIN_STROKE, SPECIAL_ZONES } from "../constants/terrain.js";
import { PHASE_EVENTS } from "../constants/events.js";

import { hexToPixel, hexPoints, hexDistance, getNeighbors, getReachable } from "../utils/hexMath.js";
import { generateHexMap }  from "../utils/mapGenerator.js";
import { createPlayers, dealStartingCards, spawnPlayers } from "../utils/gameLogic.js";

import TopBar        from "./TopBar.jsx";
import LeftPanel     from "./LeftPanel.jsx";
import RightPanel    from "./RightPanel.jsx";
import BottomBar     from "./BottomBar.jsx";
import WinScreen     from "./overlays/WinScreen.jsx";
import DiceAnimation from "./overlays/DiceAnimation.jsx";
import EventBanner   from "./overlays/EventBanner.jsx";
import Tooltip       from "./overlays/Tooltip.jsx";

// ✅ constants ระดับ module — ไม่ประกาศซ้ำใน component
const HEX_SIZE = 46;
const MAP_COLS = 13;
const MAP_ROWS = 11;
const HEX_W   = HEX_SIZE * 2;
const HEX_H   = Math.sqrt(3) * HEX_SIZE;
const MAP_W   = MAP_COLS * (HEX_W * 0.75) + HEX_W * 0.25 + 80;
const MAP_H   = MAP_ROWS * HEX_H + HEX_H * 0.5 + 100;
const ALL_CARDS = [...WEAPON_CARDS, ...MAGIC_CARDS, ...TRAP_CARDS];

function makeUid() { return `${Date.now()}-${Math.random()}`; }
function drawCard() { return { ...ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)], uid: makeUid() }; }

export default function GameBoard({ roomData, myIdx = 0, onLeave }) {
  const defaultPlayers = [
    { name: "ฝาง (คุณ)", classId: "warrior",  role: "king"     },
    { name: "ห่อง",       classId: "mage",     role: "rebel"    },
    { name: "ชัย",        classId: "archer",   role: "rebel"    },
    { name: "นน",         classId: "cleric",   role: "commoner" },
  ];
  const initPlayers = roomData?.players?.map((p, i) => ({
    name:    p.name,
    classId: p.class || "warrior",
    role:    roomData.roles?.[i] || ["king","rebel","rebel","commoner"][i % 4],
  })) || defaultPlayers;

  // ── MAP ──
  const [cells, setCells]           = useState(() => generateHexMap(MAP_COLS, MAP_ROWS));
  const [mapOffset, setMapOffset]   = useState({ x: 0, y: 0 });
  const [zoom, setZoom]             = useState(1);
  const isDragging  = useRef(false);
  const dragStart   = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const mapAreaRef  = useRef(null);

  // ── GAME STATE ──
  const [players, setPlayers] = useState(() => {
    const ps = spawnPlayers(createPlayers(initPlayers), cells);
    // ✅ FIX 6: จั่ว 4 ใบให้ทุกคนตั้งแต่เริ่มเกม
    return ps.map(p => ({ ...p, hand: Array.from({ length: 4 }, drawCard) }));
  });
  const [currentTurn, setCurrentTurn] = useState(0);
  const [phase, setPhase]             = useState(1);
  const [phaseStep, setPhaseStep]     = useState(0);
  // ✅ FIX 4: actionsDone เริ่มต้นถูกต้อง
  const [actionsDone, setActionsDone] = useState({ moved: false, attacked: false, usedItem: false });
  const [actionMode, setActionMode]   = useState(null);
  const [selectedCard, setSelectedCard]     = useState(null);
  const [selectedCell, setSelectedCell]     = useState(null);
  const [reachableCells, setReachableCells] = useState([]);
  const [attackableCells, setAttackableCells] = useState([]);
  const [log, setLog]       = useState([{ msg: "🏰 เกมเริ่มต้น! โชคดีทุกคน", type: "event" }]);
  const [gameOver, setGameOver]   = useState(null);
  const [showDice, setShowDice]   = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [tooltip, setTooltip]     = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [turnAnnounce, setTurnAnnounce] = useState(null);

  const addLog = useCallback((msg, type = "") => {
    setLog(l => [{ msg, type }, ...l.slice(0, 99)]);
  }, []);

  // ── CENTER MAP ──
  const centerMap = useCallback(() => {
    if (!mapAreaRef.current) return;
    const rect = mapAreaRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const fitZoom = Math.min((rect.width - 40) / MAP_W, (rect.height - 40) / MAP_H, 1);
    setZoom(fitZoom);
    setMapOffset({
      x: Math.round((rect.width  - MAP_W * fitZoom) / 2),
      y: Math.round((rect.height - MAP_H * fitZoom) / 2),
    });
  }, []);

  useEffect(() => {
    if (!mapAreaRef.current) return;
    const ro = new ResizeObserver(() => { centerMap(); ro.disconnect(); });
    ro.observe(mapAreaRef.current);
    return () => ro.disconnect();
  }, [centerMap]);

  // ✅ FIX 5: ผูก wheel event แบบ non-passive เพื่อให้ preventDefault ทำงานได้
  useEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = el.getBoundingClientRect();
      const cx = rect.width  / 2;
      const cy = rect.height / 2;
      setZoom(prevZoom => {
        const nextZoom = Math.min(Math.max(prevZoom * factor, 0.25), 2.5);
        setMapOffset(prev => ({
          x: cx - (cx - prev.x) * (nextZoom / prevZoom),
          y: cy - (cy - prev.y) * (nextZoom / prevZoom),
        }));
        return nextZoom;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const me            = players[myIdx];
  const currentPlayer = players[currentTurn];
  // ✅ FIX 3: isMyTurn ต้องขึ้นกับ currentTurn state เท่านั้น
  const isMyTurn = useMemo(() => currentTurn === myIdx, [currentTurn, myIdx]);

  // ── MOVE CELLS ──
  useEffect(() => {
    if (actionMode === "move" && !actionsDone.moved) {
      const cp = players[currentTurn];
      const startCell = cells.find(c => c.col === cp.col && c.row === cp.row);
      if (startCell) setReachableCells(getReachable(startCell, cp.move, cells, TERRAIN));
    } else {
      setReachableCells([]);
    }
  }, [actionMode, actionsDone.moved, cells, players, currentTurn]);

  // ── ATTACK CELLS ──
  useEffect(() => {
    if (actionMode === "attack" && !actionsDone.attacked) {
      const cp = players[currentTurn];
      const range = cp.classId === "archer" ? 4 : cp.classId === "mage" ? 3 : 1;
      const cpCell = { col: cp.col, row: cp.row };
      setAttackableCells(cells.filter(c => {
        const d = hexDistance(cpCell, c);
        return d > 0 && d <= range;
      }));
    } else {
      setAttackableCells([]);
    }
  }, [actionMode, actionsDone.attacked, cells, players, currentTurn]);

  // ── ZONE EFFECT ──
  const applyZoneEffect = useCallback((cell, playerIdx) => {
    if (!cell.specialZone && !cell.trap) return;
    const zone = cell.specialZone;
    if (zone) {
      setPlayers(ps => ps.map((p, i) => {
        if (i !== playerIdx) return p;
        if (zone === "throne") {
          if (p.role === "king")  { addLog(`⚖️ ${p.name} HP+3`, "heal"); return { ...p, hp: Math.min(p.maxHp, p.hp + 3) }; }
          if (p.role === "rebel") { addLog(`⚖️ ${p.name} HP-2`, "dmg");  return { ...p, hp: Math.max(0, p.hp - 2) }; }
        }
        if (zone === "village")  { addLog(`🏘️ ${p.name} ฟื้น HP+2`, "heal"); return { ...p, hp: Math.min(p.maxHp, p.hp + 2) }; }
        if (zone === "rebel_camp" && p.role === "rebel") {
          addLog(`⛺ กบฏ ATK+2 HP+2!`, "heal");
          return { ...p, atk: p.atk + 2, hp: Math.min(p.maxHp, p.hp + 2) };
        }
        if (zone === "cave") {
          const roll = Math.ceil(Math.random() * 6);
          setShowDice(roll); setTimeout(() => setShowDice(null), 800);
          if (roll >= 4) { addLog(`🐉 🎲${roll} หนีสำเร็จ! +3 ทอง`, "event"); return { ...p, gold: p.gold + 3 }; }
          else           { addLog(`🐉 🎲${roll} โดนมังกร! HP-3`, "dmg");       return { ...p, hp: Math.max(0, p.hp - 3) }; }
        }
        if (zone === "tower") {
          const magic = MAGIC_CARDS[Math.floor(Math.random() * MAGIC_CARDS.length)];
          addLog(`🗼 ${p.name} ได้เวทย์ "${magic.name}"`, "event");
          return { ...p, hand: [...p.hand, { ...magic, uid: makeUid() }] };
        }
        if (zone === "shrine" && !p._shrineUsed) {
          addLog(`⛩️ ${p.name} ฟื้น HP เต็ม!`, "heal");
          return { ...p, hp: p.maxHp, _shrineUsed: true };
        }
        return p;
      }));
    }
    // Check trap
    if (cell.trap && cell.trap.ownerId !== playerIdx) {
      const trap = cell.trap;
      addLog(`🪤 โดนกับดัก "${trap.name}"!`, "dmg");
      setPlayers(ps => ps.map((p, i) =>
        i !== playerIdx ? p : { ...p, hp: Math.max(0, p.hp - (trap.dmg || 0)) }
      ));
      setCells(cs => cs.map(c => c.key === cell.key ? { ...c, trap: null } : c));
    }
  }, [addLog]);

  // ── CHECK WIN ──
  const checkWin = useCallback(() => {
    setPlayers(ps => {
      const alive  = ps.filter(p => p.alive);
      const king   = ps.find(p => p.role === "king");
      const rebels = ps.filter(p => p.role === "rebel");
      if (!king?.alive && rebels.some(r => r.alive))
        setGameOver({ winner: "rebel", reason: "กบฏโค่นบัลลังก์สำเร็จ! 🏴", players: rebels.filter(r => r.alive) });
      if (rebels.every(r => !r.alive) && king?.alive)
        setGameOver({ winner: "king",  reason: "พระราชาปราบกบฏสำเร็จ! 👑", players: [king] });
      if (alive.length === 1)
        setGameOver({ winner: alive[0].role, reason: `${alive[0].name} รอดคนสุดท้าย!`, players: [alive[0]] });
      return ps;
    });
  }, []);

  // ── ATTACK ──
  const performAttack = useCallback((attackerId, defenderId) => {
    const attacker = players[attackerId];
    const defender = players[defenderId];
    const roll = Math.ceil(Math.random() * 6);
    setShowDice(roll); setTimeout(() => setShowDice(null), 800);
    if (roll < 3) {
      addLog(`🎯 ${attacker.name} โจมตี ${defender.name} — พลาด! (🎲${roll})`, "dmg");
      setActionsDone(a => ({ ...a, attacked: true }));
      setActionMode(null);
      return;
    }
    const crit     = roll === 6;
    const finalDmg = Math.max(1, attacker.atk + (crit ? 2 : 0) - defender.def);
    setPlayers(ps => ps.map(p => {
      if (p.id !== defenderId) return p;
      const newHp = Math.max(0, p.hp - finalDmg);
      if (newHp === 0 && p.alive) {
        addLog(`💀 ${p.name} ถูกกำจัด!`, "death");
        setTimeout(() => checkWin(), 200);
      }
      return { ...p, hp: newHp, alive: newHp > 0 };
    }));
    addLog(`⚔️ ${attacker.name} → ${defender.name} ${finalDmg} ดาเมจ 🎲${roll}${crit ? " ✨คริต!" : ""}`, "dmg");
    setActionsDone(a => ({ ...a, attacked: true }));
    setActionMode(null);
  }, [players, addLog, checkWin]);

  // ── USE CARD ──
  const useCard = useCallback((card, targetCell, playerIdx) => {
    const cp           = players[playerIdx];
    const targetPlayer = players.find(p => p.alive && p.col === targetCell.col && p.row === targetCell.row);
    if (MAGIC_CARDS.some(m => m.id === card.id)) {
      if (cp.mana < (card.cost || 0)) { addLog(`❌ มานาไม่พอ`, "dmg"); return; }
      setPlayers(ps => ps.map(p => {
        if (p.id === playerIdx)
          return { ...p, mana: Math.max(0, p.mana - (card.cost || 0)), hand: p.hand.filter(h => h.uid !== card.uid) };
        if (targetPlayer && p.id === targetPlayer.id) {
          const newHp = Math.min(p.maxHp, Math.max(0, p.hp - (card.dmg || 0) + (card.heal || 0)));
          addLog(`✨ ${cp.name} ใช้ "${card.name}" → ${targetPlayer.name}`, "event");
          return { ...p, hp: newHp };
        }
        return p;
      }));
    } else {
      setPlayers(ps => ps.map(p => {
        if (p.id !== playerIdx) return p;
        addLog(`🗡️ ${cp.name} สวมใส่ "${card.name}"`, "");
        return { ...p, atk: p.atk + (card.atk || 0), def: p.def + (card.def || 0), hand: p.hand.filter(h => h.uid !== card.uid) };
      }));
    }
    setActionsDone(a => ({ ...a, usedItem: true }));
  }, [players, addLog]);

  // ── CELL CLICK ──
  // ✅ FIX 1 & 3: ใช้ currentTurn ref เพื่อกัน stale closure ใน isMyTurn check
  const currentTurnRef = useRef(currentTurn);
  useEffect(() => { currentTurnRef.current = currentTurn; }, [currentTurn]);

  const handleCellClick = useCallback((cell) => {
    // ✅ FIX 3: เช็ค isMyTurn จาก ref ที่ up-to-date เสมอ
    if (currentTurnRef.current !== myIdx) return;
    const cp = players[currentTurnRef.current];

    if (actionMode === "move") {
      if (!reachableCells.some(c => c.key === cell.key)) return;
      setPlayers(ps => ps.map((p, i) => i === currentTurnRef.current ? { ...p, col: cell.col, row: cell.row } : p));
      // ✅ FIX 1: set moved = true แต่ไม่ reset actionMode ทิ้ง — ผู้เล่นยังเล่นต่อได้
      setActionsDone(a => ({ ...a, moved: true }));
      setActionMode(null);
      addLog(`🚶 ${cp.name} → ${cell.specialZone ? SPECIAL_ZONES[cell.specialZone]?.name : TERRAIN[cell.terrain]?.name}`, "");
      applyZoneEffect(cell, currentTurnRef.current);

    } else if (actionMode === "attack") {
      const target = players.find(p => p.alive && p.col === cell.col && p.row === cell.row && p.id !== currentTurnRef.current);
      if (!target) return;
      performAttack(currentTurnRef.current, target.id);

    } else if (actionMode === "card" && selectedCard) {
      useCard(selectedCard, cell, currentTurnRef.current);
      setSelectedCard(null);
      setActionMode(null);

    } else if (actionMode === "trap" && selectedCard) {
      setCells(cs => cs.map(c => c.key === cell.key ? { ...c, trap: { ...selectedCard, ownerId: currentTurnRef.current } } : c));
      setPlayers(ps => ps.map((p, i) => i === currentTurnRef.current ? { ...p, hand: p.hand.filter(h => h.uid !== selectedCard.uid) } : p));
      setActionsDone(a => ({ ...a, usedItem: true }));
      setSelectedCard(null);
      setActionMode(null);
      addLog(`🪤 ${cp.name} วางกับดัก "${selectedCard.name}"`, "");
    }
    setSelectedCell(cell);
  }, [actionMode, myIdx, players, reachableCells, selectedCard, applyZoneEffect, performAttack, useCard, addLog]);

  // ── PHASE EVENT ──
  const applyPhaseEvent = useCallback((ev) => {
    setPlayers(ps => ps.map(p => {
      if (!p.alive) return p;
      if (ev.fx === "gold_all") return { ...p, gold: p.gold + 2 };
      if (ev.fx === "heal_all") return { ...p, hp: Math.min(p.maxHp, p.hp + 3) };
      if (ev.fx === "dmg_all")  return { ...p, hp: Math.max(1, p.hp - 2) };
      if (ev.fx === "atk_all")  return { ...p, atk: p.atk + 1 };
      return p;
    }));
  }, []);

  // ── END TURN ──
  // ✅ FIX 4: เขียน endTurn ใหม่ทั้งหมด — flat state updates, ไม่ nested
  const endTurn = useCallback(() => {
    if (gameOver) return;

    const snap = players; // snapshot ณ ตอนนี้

    // 1. หา next player ที่ยังมีชีวิต
    let next = (currentTurn + 1) % snap.length;
    let guard = 0;
    while (!snap[next]?.alive && guard < snap.length) {
      next = (next + 1) % snap.length;
      guard++;
    }

    // 2. คำนวณ phase
    const aliveCount = snap.filter(p => p.alive).length;
    const newStep    = phaseStep + 1;
    const phaseOver  = newStep >= aliveCount;
    const newPhase   = phaseOver ? phase + 1 : phase;

    // 3. Game over by phase limit
    if (phaseOver && newPhase > 6) {
      const top = [...snap].filter(p => p.alive).sort((a, b) => b.hp - a.hp)[0];
      setGameOver({ winner: top?.role || "draw", reason: "ครบ 6 เฟส! ผู้ชนะโดย HP สูงสุด", players: top ? [top] : [] });
      return;
    }

    // 4. อัปเดต players ทั้งหมดในครั้งเดียว
    setPlayers(ps => {
      // tick status effects + mana regen
      let updated = ps.map(p => {
        if (!p.alive) return p;
        let hp = p.hp;
        const effects = p.statusEffects
          .map(s => ({ ...s, duration: s.duration - 1 }))
          .filter(s => s.duration > 0);
        p.statusEffects.forEach(s => {
          if (s.type === "burn" || s.type === "poison") hp = Math.max(0, hp - 1);
        });
        return { ...p, hp, mana: Math.min(p.maxMana, p.mana + 1), statusEffects: effects };
      });

      // จั่ว 2 ใบให้ทุกคนเมื่อขึ้นเฟสใหม่
      if (phaseOver) {
        updated = updated.map(p => !p.alive ? p : ({
          ...p,
          hand: [...p.hand, drawCard(), drawCard()].slice(-8),
        }));
      }

      // ✅ FIX 6: จั่ว 1 ใบให้ผู้เล่นถัดไปเสมอทุกเทิร์น
      updated = updated.map((p, i) =>
        i === next ? { ...p, hand: [...p.hand, drawCard()].slice(-8) } : p
      );

      return updated;
    });

    // 5. Phase event
    if (phaseOver) {
      setPhase(newPhase);
      const ev = PHASE_EVENTS[Math.floor(Math.random() * PHASE_EVENTS.length)];
      setActiveEvent(ev);
      applyPhaseEvent(ev);
      setTimeout(() => setActiveEvent(null), 3000);
      addLog(`📜 เฟส ${newPhase}: ${ev.ico} ${ev.name} — ${ev.desc}`, "event");
    }

    // 6. ✅ FIX 4: Reset state ทั้งหมดพร้อมกัน flat — ไม่มี nested setState
    setPhaseStep(phaseOver ? 0 : newStep);
    setCurrentTurn(next);
    setActionsDone({ moved: false, attacked: false, usedItem: false });
    setActionMode(null);
    setSelectedCard(null);
    setSelectedCell(null);
    setReachableCells([]);
    setAttackableCells([]);

    // 7. Announce
    const nextName = snap[next]?.name || "?";
    setTurnAnnounce(`เทิร์นของ ${nextName}`);
    setTimeout(() => setTurnAnnounce(null), 1500);
    addLog(`🔔 เทิร์นของ ${nextName} (เฟส ${newPhase})`, "important");

    checkWin();
  }, [gameOver, currentTurn, phase, phaseStep, players, addLog, checkWin, applyPhaseEvent]);

  // ── MAP DRAG ──
  const handleMapMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current  = { x: e.clientX, y: e.clientY, ox: mapOffset.x, oy: mapOffset.y };
  };
  const handleMapMouseMove = (e) => {
    if (!isDragging.current) return;
    setMapOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };
  const handleMapMouseUp = () => { isDragging.current = false; };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <>
      <div className="mobile-msg">
        <div>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏰</div>
          <div style={{ fontFamily: "'Cinzel',serif", color: "var(--gold)", fontSize: "18px", marginBottom: "8px" }}>บัลลังก์เงา</div>
          <div style={{ color: "var(--txt-m)", fontSize: "13px" }}>กรุณาใช้หน้าจอขนาดใหญ่<br />เพื่อประสบการณ์ที่ดีที่สุด</div>
        </div>
      </div>

      <div className="game-root">
        <TopBar
          phase={phase}
          phaseStep={phaseStep}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onEndTurn={endTurn}
          onCenter={centerMap}
          onToggleRules={() => setShowRules(r => !r)}
          onLeave={onLeave}
        />
        <LeftPanel players={players} currentTurn={currentTurn} myIdx={myIdx} me={me} setTooltip={setTooltip} />
        <RightPanel log={log} />

        {/* ═══ MAP AREA ═══ */}
        <div
          className="map-area"
          ref={mapAreaRef}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onMouseLeave={handleMapMouseUp}
          // ✅ FIX 5: ไม่ใช้ onWheel inline — ผูกผ่าน useEffect แบบ non-passive แทน
        >
          <svg
            className="hex-map-svg"
            width={MAP_W}
            height={MAP_H}
            style={{
              position: "absolute", top: 0, left: 0,
              transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              overflow: "visible",
            }}
          >
            {/* Hex cells */}
            {cells.map(cell => {
              const { x, y }     = hexToPixel(cell.col, cell.row, HEX_SIZE);
              const isReachable  = reachableCells.some(c => c.key === cell.key);
              const isAttackable = attackableCells.some(c => c.key === cell.key);
              const isSelected   = selectedCell?.key === cell.key;
              const hasEnemy     = players.some(p => p.alive && p.col === cell.col && p.row === cell.row && p.id !== currentTurn);
              const zone         = cell.specialZone ? SPECIAL_ZONES[cell.specialZone] : null;
              const terrain      = TERRAIN[cell.terrain] || TERRAIN.plains;
              const fill         = TERRAIN_COLORS[cell.terrain] || "#2d5a27";
              const stroke       = TERRAIN_STROKE[cell.terrain]  || "#3a7a35";

              return (
                <g
                  key={cell.key}
                  className={`hex-cell${isReachable ? " hex-reachable" : ""}${isAttackable ? " hex-attackable" : ""}${isSelected ? " hex-selected" : ""}`}
                  onClick={() => handleCellClick(cell)}
                  onMouseEnter={e => {
                    if (zone || cell.terrain !== "plains")
                      setTooltip({ x: e.clientX + 12, y: e.clientY + 12, title: zone?.name || terrain.name, desc: zone?.desc || `ต้นทุนการเดิน: ${terrain.moveCost}` });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <polygon className="hex-bg" points={hexPoints(x, y, HEX_SIZE - 2)} fill={fill} stroke={stroke} strokeWidth="1" />
                  {isReachable  && <polygon points={hexPoints(x, y, HEX_SIZE - 2)} fill="rgba(76,201,76,.18)"  stroke="none" />}
                  {isAttackable && <polygon points={hexPoints(x, y, HEX_SIZE - 2)} fill={`rgba(201,76,76,${hasEnemy ? ".28" : ".10"})`} stroke="none" />}
                  <text x={x} y={y - 10} className="hex-label" fontSize="16">{terrain.ico}</text>
                  {zone && (
                    <>
                      <text x={x} y={y + 4} fontSize="18" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,.9)">{zone.ico}</text>
                      <text x={x} y={y + 20} className="hex-zone-label" fontSize="7">{zone.name}</text>
                    </>
                  )}
                  {cell.trap && <text x={x + 16} y={y - 16} fontSize="10">🪤</text>}
                </g>
              );
            })}

            {/* Player tokens */}
            {players.map((p, i) => {
              if (!p.alive) return null;
              const { x, y }      = hexToPixel(p.col, p.row, HEX_SIZE);
              const cls           = CLASSES[p.classId];
              const isCurrentTurn = currentTurn === i;
              const sameCell      = players.filter(pp => pp.alive && pp.col === p.col && pp.row === p.row);
              const slotIdx       = sameCell.findIndex(pp => pp.id === p.id);
              const offX          = sameCell.length > 1 ? (slotIdx - (sameCell.length - 1) / 2) * 14 : 0;
              const tx            = x + offX - 14;
              const ty            = y - 8 - 14;

              return (
                <g key={i} className={`player-token${isCurrentTurn ? " current-player" : ""}`} transform={`translate(${tx}, ${ty})`}>
                  <circle cx="14" cy="14" r="14" fill={cls?.color + "cc"} stroke={isCurrentTurn ? "gold" : "rgba(0,0,0,.5)"} strokeWidth={isCurrentTurn ? 2.5 : 1} />
                  <text x="14" y="14" textAnchor="middle" dominantBaseline="middle" fontSize="16">{cls?.ico}</text>
                  <rect x="2" y="26" width="24" height="3" rx="1.5" fill="rgba(0,0,0,.5)" />
                  <rect x="2" y="26" width={24 * (p.hp / p.maxHp)} height="3" rx="1.5" fill="#c94040" />
                  <text x="14" y="36" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,.8)">{p.name}</text>
                </g>
              );
            })}
          </svg>

          {/* ✅ FIX 2: Compass — บอกทิศทางแผนที่ */}
          <div style={{
            position: "absolute", bottom: 12, right: 12,
            background: "rgba(13,11,8,.85)", border: "1px solid rgba(201,168,76,.3)",
            borderRadius: "8px", padding: "6px 10px", fontSize: "10px",
            color: "var(--txt-m)", lineHeight: "1.6", pointerEvents: "none",
            fontFamily: "'Cinzel',serif",
          }}>
            <div style={{ textAlign: "center", color: "var(--gold)", marginBottom: "2px" }}>🧭 แผนที่</div>
            <div>⬆ พระราชวัง</div>
            <div>⬇ ค่ายกบฏ</div>
            <div style={{ fontSize: "9px", color: "var(--txt-d)", marginTop: "2px" }}>Scroll = ซูม | ลาก = เลื่อน</div>
          </div>

          {/* Zoom indicator */}
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(13,11,8,.7)", border: "1px solid rgba(201,168,76,.2)",
            borderRadius: "6px", padding: "3px 8px", fontSize: "10px",
            color: "var(--txt-m)", pointerEvents: "none",
          }}>
            {Math.round(zoom * 100)}%
          </div>

          {/* Turn announce overlay */}
          {turnAnnounce && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              background: "rgba(13,11,8,.92)", border: "1px solid var(--gold)",
              borderRadius: "12px", padding: "12px 28px",
              fontFamily: "'Cinzel',serif", fontSize: "18px", color: "var(--gold)",
              pointerEvents: "none", zIndex: 10,
              animation: "slide-down .3s ease-out",
            }}>
              {turnAnnounce}
            </div>
          )}
        </div>

        <BottomBar
          me={me}
          isMyTurn={isMyTurn}
          currentPlayer={currentPlayer}
          phase={phase}
          actionsDone={actionsDone}
          actionMode={actionMode}
          selectedCard={selectedCard}
          onMove={() => {
            if (!isMyTurn || actionsDone.moved) return;
            setActionMode(prev => prev === "move" ? null : "move");
          }}
          onAttack={() => {
            if (!isMyTurn || actionsDone.attacked) return;
            setActionMode(prev => prev === "attack" ? null : "attack");
          }}
          onUseCard={() => {
            if (!selectedCard || !isMyTurn || actionsDone.usedItem) return;
            setActionMode(TRAP_CARDS.some(t => t.id === selectedCard.id) ? "trap" : (actionMode === "card" ? null : "card"));
          }}
          onEndTurn={endTurn}
          onSelectCard={card => { setSelectedCard(card); setActionMode(null); }}
          setTooltip={setTooltip}
        />
      </div>

      <DiceAnimation roll={showDice} />
      <EventBanner event={activeEvent} />
      <Tooltip tooltip={tooltip} />

      {/* Rules panel */}
      {showRules && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={() => setShowRules(false)}>
          <div style={{ background:"var(--s2)", border:"1px solid rgba(201,168,76,.3)", borderRadius:"16px",
            padding:"24px", maxWidth:"500px", width:"90%", maxHeight:"80vh", overflowY:"auto" }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily:"'Cinzel',serif", color:"var(--gold)", marginBottom:"12px", fontSize:"16px" }}>📖 กฎการเล่น</h3>
            {[
              ["🎯 เป้าหมาย",    "ผู้เล่นแต่ละฝ่ายมีเป้าหมายที่แตกต่างกัน พระราชาต้องรักษาบัลลังก์ กบฏต้องโค่นบัลลังก์"],
              ["🚶 การเดิน",     "เดินได้ไม่เกินตามค่า SPD คลิก 'เดิน' แล้วเลือก hex สีเขียว"],
              ["⚔️ การโจมตี",   "คลิก 'โจมตี' แล้วเลือก hex ศัตรูสีแดง ทอยเต๋า 3+ = โจมตีถูก, 6 = คริต!"],
              ["🃏 การ์ด",      "เลือกการ์ดในมือก่อน จากนั้นคลิก 'ใช้การ์ด' แล้วเลือกเป้าหมาย"],
              ["📜 เฟส",        "เมื่อทุกคนเล่นครบ 1 รอบ = 1 เฟส เกิดเหตุการณ์สุ่มและจั่วการ์ดเพิ่ม"],
              ["🏰 พื้นที่พิเศษ","แต่ละ zone มีผลพิเศษ hover เพื่อดูรายละเอียด"],
            ].map(([t, d]) => (
              <div key={t} style={{ marginBottom:"10px" }}>
                <div style={{ fontFamily:"'Cinzel',serif", color:"var(--gold)", fontSize:"12px", marginBottom:"4px" }}>{t}</div>
                <div style={{ fontSize:"11px", color:"var(--txt-m)", lineHeight:"1.6" }}>{d}</div>
              </div>
            ))}
            <button className="tb-btn primary" style={{ width:"100%", padding:"10px", marginTop:"8px" }} onClick={() => setShowRules(false)}>ปิด</button>
          </div>
        </div>
      )}

      <WinScreen gameOver={gameOver} onLeave={onLeave} />
    </>
  );
}
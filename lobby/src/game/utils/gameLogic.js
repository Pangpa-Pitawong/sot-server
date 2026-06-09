// src/game/utils/gameLogic.js
import { CLASSES } from "../constants/classes.js";
import { ROLES }   from "../constants/roles.js";
import { WEAPON_CARDS, MAGIC_CARDS, TRAP_CARDS } from "../constants/cards.js";

export function createPlayers(playerData) {
  return playerData.map((p, i) => {
    const cls  = CLASSES[p.classId] || CLASSES.warrior;
    const role = ROLES[p.role]     || ROLES.commoner;
    return {
      id: i,
      name: p.name,
      role: p.role,
      classId: p.classId,
      color: cls.color,
      ico: cls.ico,
      hp: cls.hp, maxHp: cls.hp,
      mana: cls.mana, maxMana: cls.mana,
      atk: cls.atk, def: cls.def, move: cls.move,
      gold: 4, level: 1, exp: 0,
      hand: [],
      alive: true,
      statusEffects: [],
      col: 0, row: 0,
      revealed: false,
    };
  });
}

export function dealStartingCards() {
  const allCards = [...WEAPON_CARDS, ...MAGIC_CARDS, ...TRAP_CARDS];
  const hand = [];
  for (let i = 0; i < 4; i++) {
    hand.push({ ...allCards[Math.floor(Math.random() * allCards.length)], uid: Math.random() });
  }
  return hand;
}

export function spawnPlayers(players, cells) {
  const maxCol = Math.max(...cells.map(c => c.col));
  const maxRow = Math.max(...cells.map(c => c.row));

  const edgeCells = cells.filter(cell =>
    cell.terrain !== "water" &&
    (cell.col === 0 || cell.row === 0 || cell.col === maxCol || cell.row === maxRow)
  );

  const shuffled = [...edgeCells].sort(() => Math.random() - 0.5);

  // ✅ แก้: fallback ใช้ cell ใดก็ได้ถ้า edge ไม่พอ
  const allNonWater = cells.filter(c => c.terrain !== "water");

  return players.map((player, index) => {
    const cell = shuffled[index] ?? allNonWater[index % allNonWater.length];
    return { ...player, col: cell.col, row: cell.row };
  });
}
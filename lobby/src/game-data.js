// ═══════════════════════════════════════════════════════════════
// SHADOW OF THRONE — game-data.js
// ═══════════════════════════════════════════════════════════════

const SOT_DATA = (() => {

// ─── ROLES ──────────────────────────────────────────────────────
const ROLES = {
  king: {
    id: 'king', name: 'พระราชา', ico: '👑', face: 'f-king',
    color: '#c9a84c',
    desc: 'ผู้ครองบัลลังก์ — รักษาอำนาจ ปกป้องอาณาจักร ขจัดกบฏ',
    lore: 'คุณคือผู้ปกครองแผ่นดิน มีพลังสูงสุดแต่ก็เป็นเป้าหมายของทุกคน รักษาบัลลังก์ไว้ให้นานที่สุด',
    win: 'ครองราชย์ครบ 8 เฟส หรือปราบกบฏทั้งหมด',
    secret_win: 'ยึดครอง "ศาลบัลลังก์" ครบ 3 เฟสติดต่อกัน',
    why: 'คุณต้องรักษาบัลลังก์ไว้ สั่งสมพลังอำนาจ และกำจัดภัยคุกคาม',
    startZone: 'throne',
    passiveAbility: {
      name: 'อำนาจราชันย์',
      desc: 'ขณะอยู่ใน "ศาลบัลลังก์" หรือ "พระราชวัง" รับ HP+1 ต่อเฟส และเรียกองครักษ์ได้ฟรี 1 ครั้ง/เกม'
    },
    activeAbility: {
      name: 'พระบัญชา',
      desc: 'สั่งให้ผู้เล่นคนหนึ่งย้ายมาในระยะ 2 ช่อง (ใช้ได้ 1 ครั้ง/เฟส)',
      cooldown: 1, cost: 0
    },
    baseStats: { STR: 4, DEX: 3, VIT: 5, INT: 3, HP: 16, MANA: 4 },
    attackRange: 1,
    moveRange: 3
  },
  rebel: {
    id: 'rebel', name: 'กบฏ', ico: '⚔', face: 'f-rebel',
    color: '#c94040',
    desc: 'นักรบผู้ลุกขึ้นโค่นบัลลังก์ — รวมพลังพิชิตราชา',
    lore: 'คุณลุกขึ้นต่อต้านอำนาจเก่า แต่ระวัง — คนทรยศอาจซ่อนอยู่แม้แต่ในหมู่กบฏด้วยกัน',
    win: 'ทำให้พระราชา HP = 0 หรือยึดศาลบัลลังก์ครบ 2 เฟส',
    secret_win: 'เปิดเผยตัวตนคนทรยศและกำจัดเขา',
    why: 'โจมตีราชา รวมพลังกัน แต่ระวังคนทรยศที่อาจแทงข้างหลัง',
    startZone: 'camp',
    passiveAbility: {
      name: 'ไฟกบฏ',
      desc: 'เมื่อ HP < 50% ATK เพิ่ม +2 และหลบการโจมตีได้ +10%'
    },
    activeAbility: {
      name: 'จู่โจมพร้อมกัน',
      desc: 'กบฏทุกคนในรัศมี 3 ช่องโจมตีเป้าหมายเดียวกันพร้อมกัน +1 ATK ต่อคน (ใช้ได้ 1 ครั้ง/เฟส)',
      cooldown: 1, cost: 2
    },
    baseStats: { STR: 5, DEX: 4, VIT: 4, INT: 2, HP: 13, MANA: 3 },
    attackRange: 1,
    moveRange: 3
  },
  traitor: {
    id: 'traitor', name: 'คนทรยศ', ico: '🗡', face: 'f-traitor',
    color: '#8c4cc9',
    desc: 'สายลับซ่อนตัว — ทรยศทุกฝ่ายเพื่อผลประโยชน์ตัวเอง',
    lore: 'คุณเริ่มเกมในฐานะ "พันธมิตร" แต่มีแผนการของตัวเอง ช่วยเหลือทั้งสองฝ่ายเพื่อดึงผลประโยชน์',
    win: 'สะสมสมบัติ (divine/secret) 5 ชิ้น หรือเป็นผู้รอดคนสุดท้าย',
    secret_win: 'ตายพร้อมกับพระราชาหรือกบฏหัวหน้า',
    why: 'ช่วยเหลือทั้งสองฝ่ายแบบลับๆ สะสมอำนาจ และโผล่มาชนะตอนท้าย',
    startZone: 'forest',
    passiveAbility: {
      name: 'หน้ากากสองหน้า',
      desc: 'ฝ่ายตรงข้ามไม่รู้บทบาทจริงจนกว่าจะถูกเปิดเผย ทอยเต๋าหลบ +15%'
    },
    activeAbility: {
      name: 'แทงข้างหลัง',
      desc: 'โจมตีแบบไม่คาดฝัน ATK x2 และเปิดเผยไอเท็ม 1 ใบของเป้าหมาย (ใช้ได้เมื่อเป้าหมายหันหลัง/ไม่รู้ตัว)',
      cooldown: 2, cost: 1
    },
    baseStats: { STR: 3, DEX: 6, VIT: 3, INT: 4, HP: 10, MANA: 4 },
    attackRange: 1,
    moveRange: 4
  },
  commoner: {
    id: 'commoner', name: 'ราษฎร', ico: '🧑‍🌾', face: 'f-commoner',
    color: '#4cc94c',
    desc: 'ชาวบ้านผู้พยายามเอาตัวรอด — สะสมทรัพย์สินและพลังให้มากที่สุด',
    lore: 'คุณไม่ได้อยู่ฝ่ายใด แต่สงครามนี้มีโอกาสให้คนธรรมดาลุกขึ้นมาครองอำนาจได้',
    win: 'รวบรวมทอง 10 เหรียญ หรือเลเวล 5',
    secret_win: 'ช่วยฝ่ายผู้ชนะ 3 ครั้งและรอดชีวิต',
    why: 'การค้าขาย สะสมทรัพยากร และวิวัฒน์ตัวเองคือทางรอด',
    startZone: 'village',
    passiveAbility: {
      name: 'เฉลียวฉลาด',
      desc: 'ได้ทอง+1 เมื่อเดินผ่านตลาด และได้ EXP+1 ทุกเทิร์นที่ยังมีชีวิตอยู่'
    },
    activeAbility: {
      name: 'ขอความเห็นใจ',
      desc: 'ขอทองหรือไอเทม 1 ชิ้นจากผู้เล่นคนอื่น (เป้าหมายสามารถปฏิเสธได้ ใช้ได้ 1 ครั้ง/เฟส)',
      cooldown: 1, cost: 0
    },
    baseStats: { STR: 2, DEX: 4, VIT: 4, INT: 4, HP: 11, MANA: 5 },
    attackRange: 1,
    moveRange: 3
  }
};

// ─── CLASSES ─────────────────────────────────────────────────────
const CLASSES = {
  knight: {
    id: 'knight', name: 'อัศวิน', evo: 'พาราดิน → โรยัลไนท์', ico: '🛡',
    s: { STR: 4, DEX: 2, VIT: 5, INT: 1 }, hp: 16, mana: 2,
    desc: 'นักรบหุ้มเกราะ แข็งแกร่ง ทนทาน', attackRange: 1, moveRange: 2,
    ability: 'ป้องกันพิเศษ: ลดดาเมจ 2 ครั้ง/เฟส (ขึ้น DEF Shield)',
    passive: 'เมื่อ HP < 30% ได้รับ Berserker Rage: ATK+3'
  },
  mage: {
    id: 'mage', name: 'นักเวทย์', evo: 'จอมเวทย์ → นักปราชญ์', ico: '🔮',
    s: { STR: 1, DEX: 3, VIT: 3, INT: 6 }, hp: 9, mana: 8,
    desc: 'ผู้ควบคุมเวทย์มนตร์ พลังสูงแต่บอบบาง', attackRange: 3, moveRange: 2,
    ability: 'ใช้เวทย์ฟรี 1 ครั้ง/เฟส และ INT ทุก 2 แต้ม = +1 Magic ATK',
    passive: 'เมื่อยืนนิ่ง 1 เทิร์น รับ Mana+2 ทันที'
  },
  archer: {
    id: 'archer', name: 'นักธนู', evo: 'พลซุ่มยิง → นักล่า', ico: '🏹',
    s: { STR: 3, DEX: 5, VIT: 3, INT: 2 }, hp: 10, mana: 3,
    desc: 'พลซุ่มยิงแม่นยำ คล่องแคล่ว โจมตีระยะไกล', attackRange: 4, moveRange: 3,
    ability: 'ยิงแม่นยำ: DEX ทุก 2 แต้ม = +1 Hit Rate และ +10% Crit Chance',
    passive: 'หลบการโจมตีระยะประชิด +20% (DEX สูง)'
  },
  rogue: {
    id: 'rogue', name: 'โจร', evo: 'นักฆ่า → จอมอุบาย', ico: '🗡',
    s: { STR: 3, DEX: 6, VIT: 2, INT: 2 }, hp: 8, mana: 3,
    desc: 'ลักขโมยและลอบสังหาร เร็วและอันตราย', attackRange: 1, moveRange: 4,
    ability: 'โจมตีลับ: ถ้าย้ายก่อนโจมตี ATK+3 ต่อเทิร์น (ใช้ได้ 1 ครั้ง/เทิร์น)',
    passive: 'สามารถขโมยไอเทมจากเป้าหมายที่ HP < 30% (หลังโจมตีสำเร็จ)'
  },
  cleric: {
    id: 'cleric', name: 'นักบวช', evo: 'บาทหลวง → บิชอป', ico: '✨',
    s: { STR: 2, DEX: 2, VIT: 4, INT: 4 }, hp: 11, mana: 6,
    desc: 'ผู้รักษาและสนับสนุน สร้างขวัญกำลังใจ', attackRange: 2, moveRange: 2,
    ability: 'รักษา: ฟื้น HP+3 ให้ตัวเอง/พันธมิตร 1 คน ต่อเทิร์น (แทนการโจมตี)',
    passive: 'ทุกการตาย ราษฎรรอบข้าง 2 ช่องได้ HP+2'
  },
  warrior: {
    id: 'warrior', name: 'นักรบ', evo: 'คนเถื่อน → เบอร์เซิกเกอร์', ico: '⚔',
    s: { STR: 6, DEX: 2, VIT: 4, INT: 1 }, hp: 14, mana: 2,
    desc: 'นักรบดุดัน โจมตีหนัก มีพลังดิบสูงสุด', attackRange: 1, moveRange: 2,
    ability: 'บ้าคลั่ง: ATK+2 เมื่อ HP < 50% และ +1 ATK ต่อศัตรูที่ตายในเฟสนี้',
    passive: 'ทุกครั้งโดนโจมตี สะสม Rage +1 (MAX 5) แลกเป็น ATK ได้'
  }
};

// ─── HEX MAP ZONES ─────────────────────────────────────────────
// Hex grid: 7 cols x 5 rows = 35 hexes (some disabled at corners)
const HEX_ZONES = [
  // id, name, ico, desc, type, special effect
  { id: 'palace', name: 'พระราชวัง', ico: '🏰', type: 'royal', desc: 'ราชา+1 ทอง/เฟส บุคคลอื่นต้องขออนุญาต', col: 3, row: 0, effect: 'gold_king' },
  { id: 'throne', name: 'ศาลบัลลังก์', ico: '⚖', type: 'royal', desc: 'ราชา HP+3 / กบฏ HP-2 เมื่อยืนที่นี่', col: 3, row: 1, effect: 'throne_effect' },
  { id: 'armory', name: 'คลังอาวุธ', ico: '⚒', type: 'neutral', desc: 'จั่วอาวุธฟรี 1 ใบ เมื่อยืน', col: 5, row: 1, effect: 'draw_weapon' },
  { id: 'village', name: 'หมู่บ้าน', ico: '🏘', type: 'safe', desc: 'ฟื้น HP+2 เมื่อยืน (เขตปลอดภัยเฟสแรก)', col: 1, row: 1, effect: 'heal_2' },
  { id: 'market', name: 'ตลาดกลาง', ico: '🏪', type: 'trade', desc: 'ซื้อขายได้ทุกรายการ ทอง+1 เมื่อผ่าน', col: 3, row: 2, effect: 'market' },
  { id: 'forest_l', name: 'ป่าตะวันตก', ico: '🌲', type: 'ambush', desc: 'ซ่อนตัวได้ กับดักฟรี 1 ใบ', col: 0, row: 2, effect: 'draw_trap' },
  { id: 'forest_r', name: 'ป่าตะวันออก', ico: '🌿', type: 'ambush', desc: 'ซ่อนตัวได้ กับดักฟรี 1 ใบ', col: 6, row: 2, effect: 'draw_trap' },
  { id: 'camp', name: 'ค่ายกบฏ', ico: '⛺', type: 'rebel', desc: 'กบฏ+2 ATK ฟื้น HP+2 ผู้อื่นถูกโจมตีทันที', col: 1, row: 3, effect: 'rebel_buff' },
  { id: 'ruins', name: 'ซากปรัก', ico: '🏚', type: 'loot', desc: 'ทอย 4+ ได้ของสุ่ม ทอย 1-3 เสีย HP-2', col: 5, row: 3, effect: 'ruins_loot' },
  { id: 'tower', name: 'หอคอยเวท', ico: '🗼', type: 'magic', desc: 'จั่วเวทย์ฟรี 1 ใบ มานาฟื้น+2', col: 2, row: 1, effect: 'draw_magic' },
  { id: 'cave', name: 'ถ้ำมังกร', ico: '🐉', type: 'danger', desc: 'ทอย 4+ ทอง+3 / ทอย 1-3 HP-3', col: 4, row: 3, effect: 'cave_loot' },
  { id: 'shrine', name: 'ศาลเจ้า', ico: '⛩', type: 'holy', desc: 'ฟื้น HP เต็ม แต่ต้องทิ้งการ์ด 1 ใบ (ใช้ได้ 1 ครั้ง/เกม)', col: 0, row: 4, effect: 'shrine_heal' },
  { id: 'blackmarket', name: 'ตลาดมืด', ico: '🕵', type: 'secret', desc: 'ซื้อการ์ด divine/secret ด้วยราคาต่ำ', col: 6, row: 4, effect: 'black_market' },
  { id: 'cemetery', name: 'สุสานนักรบ', ico: '🪦', type: 'loot', desc: 'ได้อาวุธเก่า แต่เสีย HP 1 (บูชา)', col: 2, row: 3, effect: 'cemetery' },
  { id: 'riverbank', name: 'ริมแม่น้ำ', ico: '🌊', type: 'neutral', desc: 'ฟื้นมานา+3 แต่ไม่สามารถโจมตีรอบนี้', col: 4, row: 1, effect: 'mana_regen' },
  { id: 'crossroads', name: 'สี่แยก', ico: '🛤', type: 'neutral', desc: 'เดินต่อได้อีก +1 ช่องในเทิร์นนี้', col: 3, row: 3, effect: 'extra_move' },
  { id: 'watchtower', name: 'หอสังเกตการณ์', ico: '🔭', type: 'intel', desc: 'ดูการ์ดของผู้เล่นคนหนึ่ง (สุ่ม 2 ใบ)', col: 6, row: 0, effect: 'spy' },
  { id: 'tavern', name: 'โรงเตี๊ยม', ico: '🍺', type: 'social', desc: 'ซื้อข้อมูล: เปิดเผยบทบาทผู้เล่น 1 คน (ราคา 3 ทอง)', col: 0, row: 0, effect: 'buy_info' },
  { id: 'fields', name: 'ทุ่งนา', ico: '🌾', type: 'farm', desc: 'ทอง+1 ต่อเทิร์นที่ยืนที่นี่ (สะสม)', col: 2, row: 4, effect: 'farm_gold' },
  { id: 'abyss', name: 'หุบเหวลึก', ico: '⛰', type: 'danger', desc: 'โจมตีระยะไกลจากที่นี่ +1 ระยะ แต่โดนดาเมจสูงกว่า', col: 4, row: 4, effect: 'high_ground' },
];

// Helper: build hex adjacency (offset coordinates)
function getHexNeighbors(col, row) {
  const neighbors = [];
  const isEven = col % 2 === 0;
  const dirs = isEven
    ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
    : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]];
  dirs.forEach(([dc, dr]) => {
    const nc = col + dc, nr = row + dr;
    if (nc >= 0 && nc < 7 && nr >= 0 && nr < 5) {
      const zone = HEX_ZONES.find(z => z.col === nc && z.row === nr);
      if (zone) neighbors.push(zone.id);
    }
  });
  return neighbors;
}

// Pre-compute adjacency
HEX_ZONES.forEach(z => {
  z.neighbors = getHexNeighbors(z.col, z.row);
});

// ─── WEAPON CARDS ──────────────────────────────────────────────
const WEAPONS = [
  { id: 'sword_king', name: 'ดาบแห่งกษัตริย์', ico: '⚔', type: 'weapon', rarity: 'divine',
    effect: 'ATK+2 (เฉพาะกษัตริย์ ATK+4)', atk: 2, king_bonus: 2,
    condition: 'role:king', desc: 'ดาบศักดิ์สิทธิ์คู่บัลลังก์' },
  { id: 'fire_spear', name: 'หอกปลายเพลิง', ico: '🔱', type: 'weapon', rarity: 'divine',
    effect: 'ทะลุเกราะ+เผาไหม้ 1 เทิร์น', atk: 3, burn: 1, pierce: true,
    desc: 'หอกปลายคริสตัลเพลิง' },
  { id: 'ice_bow', name: 'ธนูคริสตัลน้ำแข็ง', ico: '🏹', type: 'weapon', rarity: 'divine',
    effect: 'โจมตีระยะ 4 + แช่แข็ง 1 เทิร์น', atk: 2, freeze: 1, range: 4, uses: 3,
    desc: 'ธนูเวทเยือกแข็ง' },
  { id: 'assassin_dagger', name: 'มีดลอบสังหาร', ico: '🗡', type: 'weapon', rarity: 'common',
    effect: 'โจมตีหลัง ATK+3', atk: 1, backstab: 3, desc: 'มีดคมกริบของนักฆ่าเงา' },
  { id: 'battle_axe', name: 'ขวานสองคม', ico: '🪓', type: 'weapon', rarity: 'common',
    effect: 'ATK+3 แต่เสีย HP 1 หลังโจมตี', atk: 3, self_dmg: 1, desc: 'ขวานโลหิต' },
  { id: 'fire_sword', name: 'ดาบหทัยอัคคี', ico: '🔥', type: 'weapon', rarity: 'divine',
    effect: 'เสีย HP 1 → ATK+4', atk: 4, self_dmg: 1, desc: 'ดาบโบราณเรืองเพลิง' },
  { id: 'thunder_axe', name: 'ขวานสายฟ้า', ico: '⚡', type: 'weapon', rarity: 'divine',
    effect: 'ATK+2 มึนงง 1 เทิร์น (พื้นที่โล่ง)', atk: 2, stun: 1, desc: 'ขวานอัสนีบาต' },
  { id: 'war_hammer', name: 'ค้อนราชันย์', ico: '🔨', type: 'weapon', rarity: 'secret',
    effect: 'ATK+5 สั่นสะเทือนรอบข้าง 1 ช่อง', atk: 5, aoe_adj: 2, desc: 'ค้อนเหล็กเทพ' },
  { id: 'poison_sword', name: 'ดาบพิษงูเขียว', ico: '🐍', type: 'weapon', rarity: 'common',
    effect: 'ATK+1 ติดพิษ 2 เทิร์น', atk: 1, poison: 2, desc: 'ดาบพิษร้าย' },
  { id: 'blood_sword', name: 'ดาบเลือดสาบาน', ico: '💀', type: 'weapon', rarity: 'secret',
    effect: 'เสีย HP 2 → ATK+6', atk: 6, self_dmg: 2, desc: 'ดาบต้องสาป' },
  { id: 'dragon_armor', name: 'เกราะเงินมังกร', ico: '🛡', type: 'armor', rarity: 'divine',
    effect: 'ลด damage -2 ทุกครั้ง', def: 2, desc: 'โลหะเงินหลอมกับเกล็ดมังกร' },
  { id: 'oak_shield', name: 'โล่ไม้โอ๊ค', ico: '🛡', type: 'armor', rarity: 'common',
    effect: 'ป้องกัน+ฟื้น HP+1 เมื่อบล็อก', def: 1, heal_on_block: 1, desc: 'โล่ไม้โอ๊คศักดิ์สิทธิ์' },
  { id: 'iron_helm', name: 'หมวกเหล็กอัศวิน', ico: '⛑', type: 'armor', rarity: 'common',
    effect: 'ลดโอกาสโดนคริต 50%', anti_crit: true, def: 0, desc: 'หมวกเหล็กขัดเงา' },
  { id: 'thorn_armor', name: 'เกราะหนามเหล็ก', ico: '🔰', type: 'armor', rarity: 'common',
    effect: 'ผู้โจมตีเสีย HP 1 ทุกครั้ง', reflect: 1, def: 0, desc: 'เกราะหนาม' },
  { id: 'shadow_armor', name: 'เกราะพรางเงา', ico: '🌑', type: 'armor', rarity: 'divine',
    effect: 'ซ่อนตำแหน่ง 1 เทิร์น (พื้นที่มืด/ป่า)', stealth: 1, def: 1, desc: 'เกราะปกปิดตัว' },
  { id: 'wind_spear', name: 'หอกสายลม', ico: '💨', type: 'weapon', rarity: 'secret',
    effect: 'ATK+2 ระยะ 3 + ดึงศัตรูเข้าใกล้', atk: 2, range: 3, pull: true, desc: 'หอกปลุกพายุ' },
  { id: 'eagle_armor', name: 'เกราะขนนกอินทรี', ico: '🦅', type: 'armor', rarity: 'common',
    effect: 'เคลื่อนที่+1 ช่อง', def: 0, extra_move: 1, desc: 'เกราะเบาคล่องตัว' },
  { id: 'water_armor', name: 'เกราะคลื่นสมุทร', ico: '🌊', type: 'armor', rarity: 'common',
    effect: 'ลดดาเมจจากเวทไฟและไฟ 50%', def: 1, fire_resist: true, desc: 'เกราะชุบน้ำ' },
];

// ─── MAGIC CARDS ───────────────────────────────────────────────
const MAGICS = [
  { id: 'hellfire', name: 'ไฟนรกกรีดวิญญาณ', ico: '🔥', type: 'magic', rarity: 'rare',
    effect: 'ดาเมจเวทย์ 6 แก่เป้าหมายเดี่ยว', dmg: 6, target: 'enemy', manaCost: 3,
    desc: 'ลุกโชนอย่างรุนแรง' },
  { id: 'eternal_snow', name: 'หิมะนิรันดร์', ico: '❄', type: 'magic', rarity: 'rare',
    effect: 'แช่แข็งศัตรู 1 เทิร์น', freeze: 1, target: 'enemy', manaCost: 2, desc: 'ยุติการเคลื่อนไหว' },
  { id: 'lightning_storm', name: 'พายุสายฟ้าสวรรค์', ico: '⚡', type: 'magic', rarity: 'divine',
    effect: 'ดาเมจ 3 ทุกศัตรูในสนาม', aoe: 3, target: 'all_enemies', manaCost: 5,
    desc: 'เรียกฟ้าฝ่าทุกฝ่าย' },
  { id: 'holy_heal', name: 'แสงศักดิ์สิทธิ์เยียวยา', ico: '✨', type: 'magic', rarity: 'rare',
    effect: 'ฟื้น HP+5 ตัวเองหรือพันธมิตร', heal: 5, target: 'self_or_ally', manaCost: 3,
    desc: 'แสงอรุณแห่งการรักษา' },
  { id: 'dark_curse', name: 'คำสาปเงามืด', ico: '🌑', type: 'magic', rarity: 'rare',
    effect: 'ลด ATK ศัตรู 2 เป็นเวลา 2 เทิร์น', debuff_atk: 2, duration: 2, target: 'enemy', manaCost: 2,
    desc: 'ดึงพลังออกจากร่าง' },
  { id: 'magic_shield', name: 'เกราะเวทย์มนตร์', ico: '🔮', type: 'magic', rarity: 'rare',
    effect: 'ลดดาเมจเวทย์ 50% เป็น 2 เทิร์น', magic_resist: 2, target: 'self', manaCost: 2,
    desc: 'โล่พลังมนตร์' },
  { id: 'warp', name: 'วาร์ปหลบหนี', ico: '🌀', type: 'magic', rarity: 'rare',
    effect: 'เทเลพอร์ตไปพื้นที่ใดก็ได้ทันที', teleport: true, target: 'self', manaCost: 3,
    desc: 'หลุดพ้นจากอันตราย' },
  { id: 'blood_oath', name: 'คำสาบานเลือด', ico: '🩸', type: 'magic', rarity: 'secret',
    effect: 'เสีย HP 3 → ATK+5 เป็น 1 เทิร์น', self_dmg: 3, atk_buff: 5, target: 'self', manaCost: 0,
    desc: 'แลกชีวิตเป็นพลัง' },
  { id: 'amrita', name: 'น้ำอมฤต', ico: '💧', type: 'magic', rarity: 'divine',
    effect: 'ฟื้น HP เต็มหลอด (1 ครั้ง/เกม)', full_heal: true, once_per_game: true, target: 'self', manaCost: 0,
    desc: 'น้ำยาอมตะแห่งสวรรค์' },
  { id: 'light_barrier', name: 'ปราการแสง', ico: '💫', type: 'magic', rarity: 'rare',
    effect: 'กันดาเมจทั้งหมด 1 ครั้ง', barrier: true, target: 'self', manaCost: 2,
    desc: 'กำแพงแสงศักดิ์สิทธิ์' },
  { id: 'soul_drain', name: 'เวทย์ดูดวิญญาณ', ico: '👻', type: 'magic', rarity: 'rare',
    effect: 'ดูด HP ศัตรู 3 มาฟื้นตัวเอง', drain: 3, target: 'enemy', manaCost: 3,
    desc: 'ดูดชีวิตคนอื่น' },
  { id: 'inferno', name: 'เปลวเพลิงสวรรค์', ico: '☄', type: 'magic', rarity: 'divine',
    effect: 'ดาเมจ 8 แก่เป้าหมาย (1 ครั้ง/เกม)', dmg: 8, once_per_game: true, target: 'enemy', manaCost: 0,
    desc: 'พลังไฟสูงสุด' },
  { id: 'skeleton_call', name: 'เรียกโครงกระดูก', ico: '💀', type: 'magic', rarity: 'rare',
    effect: 'โจมตี 2 ดาเมจ/เทิร์น เป็น 3 เทิร์น', summon: 2, duration: 3, target: 'self', manaCost: 4,
    desc: 'เรียกทัพโครงกระดูก' },
  { id: 'mirror', name: 'กระจกสะท้อนเวทย์', ico: '🪞', type: 'magic', rarity: 'secret',
    effect: 'สะท้อนเวทย์ถัดไปกลับผู้ใช้ทันที', reflect_magic: true, target: 'self', manaCost: 2,
    desc: 'ย้อนคาถากลับ' },
  { id: 'wind_barrier', name: 'กำแพงลม', ico: '💨', type: 'magic', rarity: 'rare',
    effect: 'ป้องกันโจมตีระยะไกล 1 เทิร์น', ranged_block: true, target: 'self', manaCost: 2,
    desc: 'โล่ลมปราณ' },
  { id: 'time_stop', name: 'กาลเวลาเฉือนวิญญาณ', ico: '⏳', type: 'magic', rarity: 'divine',
    effect: 'ศัตรูพลาดเทิร์นถัดไป (1 ครั้ง/เกม)', skip_turn: true, once_per_game: true, target: 'enemy', manaCost: 0,
    desc: 'หยุดเวลา' },
];

// ─── TRAP CARDS ────────────────────────────────────────────────
const TRAPS = [
  { id: 'iron_pit', name: 'หลุมหนามเหล็ก', ico: '🕳', type: 'trap', rarity: 'common',
    effect: 'ดาเมจ -3 ทันที', dmg: 3, trigger: 'walk_on' },
  { id: 'chain_trap', name: 'กับดักโซ่ตรวน', ico: '⛓', type: 'trap', rarity: 'common',
    effect: 'ล็อคไม่ให้เคลื่อนที่ 1 เทิร์น', lock: 1, trigger: 'walk_on' },
  { id: 'poison_needle', name: 'เข็มพิษซ่อนเร้น', ico: '💉', type: 'trap', rarity: 'common',
    effect: 'ติดพิษ (-1 HP/เทิร์น) 3 เทิร์น', poison: 3, val: 1, trigger: 'walk_on' },
  { id: 'arrow_trap', name: 'กลไกธนูยิง', ico: '🎯', type: 'trap', rarity: 'common',
    effect: 'ดาเมจ -5 ทันที', dmg: 5, trigger: 'walk_on' },
  { id: 'stone_fall', name: 'หินถล่ม', ico: '🪨', type: 'trap', rarity: 'rare',
    effect: 'ดาเมจ -6 + ปิดเส้นทาง 1 เทิร์น', dmg: 6, block_zone: true, trigger: 'walk_on' },
  { id: 'fire_floor', name: 'พื้นไฟลุก', ico: '🔥', type: 'trap', rarity: 'common',
    effect: 'ดาเมจ -3 + ไฟ 2 เทิร์น', dmg: 3, burn: 2, val: 1, trigger: 'walk_on' },
  { id: 'smoke_bomb', name: 'ระเบิดควัน', ico: '💨', type: 'trap', rarity: 'common',
    effect: 'ตาบอด 2 เทิร์น (เดินสุ่ม)', blind: 2, trigger: 'walk_on' },
  { id: 'net_trap', name: 'ตาข่ายดักจับ', ico: '🕸', type: 'trap', rarity: 'common',
    effect: 'หยุดเคลื่อนที่ 2 เทิร์น', lock: 2, trigger: 'walk_on' },
  { id: 'flash_bomb', name: 'ระเบิดแฟลช', ico: '💥', type: 'trap', rarity: 'common',
    effect: 'ตาบอด 1 เทิร์น + โจมตีพลาด 50%', blind: 1, miss_chance: 50, trigger: 'walk_on' },
  { id: 'beast_pit', name: 'บ่อสัตว์ร้าย', ico: '🐺', type: 'trap', rarity: 'rare',
    effect: 'ดาเมจ -5 + ล็อค 1 เทิร์น', dmg: 5, lock: 1, trigger: 'walk_on' },
  { id: 'spike_trap', name: 'กงเล็บเหล็ก', ico: '⚙', type: 'trap', rarity: 'rare',
    effect: 'ทำลายเกราะ + ดาเมจ -2', dmg: 2, destroy_armor: true, trigger: 'walk_on' },
];

// ─── EVENT CARDS ───────────────────────────────────────────────
const EVENTS = [
  { id: 'harvest', name: 'วันเก็บเกี่ยว', ico: '🌾', desc: 'ทุกคนได้ทอง +2', fx: 'gold_all_2', timing: 'phase_start' },
  { id: 'holy_day', name: 'วันศักดิ์สิทธิ์', ico: '🌟', desc: 'ทุกคนฟื้น HP +3', fx: 'heal_all_3', timing: 'phase_start' },
  { id: 'ghost_army', name: 'ขบวนทัพผี', ico: '👻', desc: 'ทุกคนเสีย HP -2', fx: 'dmg_all_2', timing: 'phase_start' },
  { id: 'banquet', name: 'งานเลี้ยงปราสาท', ico: '🍖', desc: 'จั่วเวทย์ฟรี 1 ใบ', fx: 'draw_magic', timing: 'phase_start' },
  { id: 'festival', name: 'เทศกาลดนตรี', ico: '🎵', desc: 'จั่วการ์ดเพิ่ม 2 ใบ', fx: 'draw_2', timing: 'phase_start' },
  { id: 'golden_dragon', name: 'มังกรทองมา', ico: '✨', desc: 'ได้ทอง +5 (ผู้จั่ว)', fx: 'gold_5', timing: 'phase_start' },
  { id: 'lightning', name: 'สายฟ้าฟาด', ico: '⚡', desc: 'ผู้มี HP มากสุดเสีย HP -3', fx: 'dmg_highest_3', timing: 'phase_start' },
  { id: 'storm', name: 'พายุฝน', ico: '⛈', desc: 'ทุกคนทิ้งอาวุธ 1 ใบ', fx: 'discard_weapon', timing: 'phase_start' },
  { id: 'drought', name: 'ภัยแล้ง', ico: '☀', desc: 'จ่าย 1 ทองต่อเวทย์ที่ถือ', fx: 'tax_magic', timing: 'phase_start' },
  { id: 'cold_wind', name: 'ลมหนาว', ico: '🌬', desc: 'ทุกคน HP-1 ห้ามใช้เวทย์รอบนี้', fx: 'hp1_no_magic', timing: 'phase_start' },
  { id: 'war_drums', name: 'กลองศึก', ico: '🥁', desc: 'ทุกคน+1 ATK รอบนี้', fx: 'atk_all_1', timing: 'phase_start' },
  { id: 'treasure_map', name: 'แผนที่สมบัติ', ico: '🗺', desc: 'เปิดดูการ์ดบนสุดของกอง 3 ใบ', fx: 'peek_3', timing: 'phase_start' },
  { id: 'assassin_event', name: 'นักฆ่าลึกลับ', ico: '🗡', desc: 'เลือกเป้าหมายเสีย HP -3', fx: 'target_dmg_3', timing: 'phase_start' },
  { id: 'dragon_raid', name: 'มังกรบุก', ico: '🐉', desc: 'ทุกคนเสียอาวุธ ATK < 3', fx: 'discard_weak', timing: 'phase_start' },
  { id: 'black_market_open', name: 'ตลาดมืดเปิด', ico: '🕵', desc: 'ซื้อการ์ดจากกองทิ้ง ราคา 2 ทอง', fx: 'open_black_market', timing: 'phase_start' },
];

// ─── PHASE SYSTEM ──────────────────────────────────────────────
const PHASES = [
  { num: 1, name: 'รุ่งอรุณแห่งสงคราม', icon: '🌅', desc: 'เฟสแรก: ทุกคนเห็นบทบาทกัน ห้ามโจมตี/สร้างความเสียหาย', noDamage: true, eventChance: 0.3 },
  { num: 2, name: 'ไฟสงครามลุกโชน', icon: '🔥', desc: 'การต่อสู้เริ่มต้น กบฏเริ่มรวมกำลัง', noDamage: false, eventChance: 0.4 },
  { num: 3, name: 'เล่ห์เหลี่ยมในเงา', icon: '🌑', desc: 'คนทรยศเริ่มเปิดเผยตัว ตลาดมืดเปิด', noDamage: false, eventChance: 0.4 },
  { num: 4, name: 'จุดพีคแห่งอำนาจ', icon: '⚡', desc: 'การต่อสู้ดุเดือด พื้นที่พิเศษทั้งหมดเปิดใช้', noDamage: false, eventChance: 0.5 },
  { num: 5, name: 'วันสิ้นสุดการรบ', icon: '🌪', desc: 'ทุกคนโจมตีแรงขึ้น +1 ATK ทั่วกัน', noDamage: false, eventChance: 0.6, global_atk_bonus: 1 },
  { num: 6, name: 'ผู้พิชิตแห่งบัลลังก์', icon: '♛', desc: 'เฟสสุดท้าย — ผู้มีชีวิตรอดและ HP มากสุดชนะ', noDamage: false, eventChance: 0.7, final: true },
];

// ─── TURN STEPS ───────────────────────────────────────────────
const TURN_STEPS = [
  { id: 'event', name: 'จั่วเหตุการณ์', icon: '📜', desc: 'จั่วการ์ดเหตุการณ์หรือพลิกผันสถานการณ์' },
  { id: 'move', name: 'เคลื่อนที่', icon: '🗺', desc: 'เดินได้ไม่เกิน 3 ช่องบน hexagonal map' },
  { id: 'action', name: 'ใช้ไอเทม/สกิล', icon: '🃏', desc: 'ใช้การ์ด วางกับดัก หรือใช้ความสามารถพิเศษ' },
  { id: 'combat', name: 'โจมตี', icon: '⚔', desc: 'โจมตีศัตรูในระยะที่กำหนดของอาชีพ' },
  { id: 'quest', name: 'ทำ Quest', icon: '📋', desc: 'ตรวจสอบภารกิจและเก็บ EXP' },
  { id: 'end', name: 'จบเทิร์น', icon: '⏭', desc: 'ส่งต่อให้ผู้เล่นถัดไป' },
];

// ─── COMBAT FORMULA ───────────────────────────────────────────
function calcHitChance(attacker, defender, classA, classD) {
  // Base: DEX(attacker) vs DEX(defender)
  const atkDex = classA ? classA.s.DEX : 3;
  const defDex = classD ? classD.s.DEX : 3;
  const base = 0.65;
  const dexMod = (atkDex - defDex) * 0.05;
  return Math.min(0.95, Math.max(0.15, base + dexMod));
}

function calcDamage(attacker, defender, weaponAtk, classA, classD, diceRoll) {
  const str = classA ? classA.s.STR : 2;
  const defVal = (defender.equipment || []).reduce((s, e) => s + (e.def || 0), 0);
  const critThreshold = classA && classA.id === 'archer' ? 4 : 5;
  const isCrit = diceRoll >= critThreshold;
  const rawDmg = str + weaponAtk;
  const afterDef = Math.max(1, rawDmg - defVal);
  return { dmg: isCrit ? Math.ceil(afterDmg * 1.5) : afterDef, isCrit, afterDef };
}

// ─── VICTORY CONDITIONS ────────────────────────────────────────
function checkVictory(gameState) {
  const { players, currentPhase } = gameState;
  const alive = players.filter(p => p.alive);
  const king = players.find(p => p.role === 'king');
  const rebels = players.filter(p => p.role === 'rebel');

  // King wins
  if (king && king.alive) {
    if (currentPhase >= 8) return { winner: 'king', player: king, reason: 'ครองราชย์ครบ 8 เฟส' };
    if (rebels.every(r => !r.alive)) return { winner: 'king', player: king, reason: 'ปราบกบฏทั้งหมด' };
    const throneHeld = gameState.throneHeldPhases && gameState.throneHeldPhases[king.id] >= 3;
    if (throneHeld) return { winner: 'king', player: king, reason: 'ครองศาลบัลลังก์ 3 เฟส' };
  }

  // Rebel wins
  if (!king || !king.alive) {
    const aliveRebels = rebels.filter(r => r.alive);
    if (aliveRebels.length > 0) return { winner: 'rebel', players: aliveRebels, reason: 'โค่นบัลลังก์สำเร็จ' };
  }

  // Traitor wins
  const traitors = players.filter(p => p.role === 'traitor' && p.alive);
  traitors.forEach(t => {
    const divineCards = (t.hand || []).filter(c => c.rarity === 'divine' || c.rarity === 'secret').length;
    if (divineCards >= 5) return { winner: 'traitor', player: t, reason: 'สะสมสมบัติ 5 ชิ้น' };
  });
  if (alive.length === 1 && traitors.some(t => t.id === alive[0].id)) {
    return { winner: 'traitor', player: alive[0], reason: 'รอดคนสุดท้าย' };
  }

  // Commoner wins
  const commoners = players.filter(p => p.role === 'commoner' && p.alive);
  commoners.forEach(c => {
    if (c.gold >= 10) return { winner: 'commoner', player: c, reason: 'รวบรวมทอง 10 เหรียญ' };
    if (c.level >= 5) return { winner: 'commoner', player: c, reason: 'วิวัฒน์ถึงระดับ 5' };
  });

  // Final phase - HP tiebreaker
  if (currentPhase > 6 || alive.length === 1) {
    const w = alive.sort((a, b) => b.hp - a.hp)[0];
    if (w) return { winner: w.role, player: w, reason: 'HP มากสุดในตอนจบ' };
  }

  return null;
}

return {
  ROLES, CLASSES, HEX_ZONES, WEAPONS, MAGICS, TRAPS, EVENTS,
  PHASES, TURN_STEPS, calcHitChance, calcDamage, checkVictory
};

})();

if (typeof module !== 'undefined') module.exports = SOT_DATA;

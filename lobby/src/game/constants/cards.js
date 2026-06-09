// src/game/constants/cards.js
export const WEAPON_CARDS = [
  { id: "sword_king", name: "ดาบแห่งกษัตริย์", ico: "⚔️", rarity: "divine",
    atk: 2, desc: "ATK+2 (ราชา ATK+4)", effect: "king_only" },
  { id: "fire_spear", name: "หอกปลายเพลิง", ico: "🔱", rarity: "divine",
    atk: 3, desc: "ทะลุเกราะ + เผา 1 เทิร์น", effect: "burn" },
  { id: "ice_bow", name: "ธนูคริสตัลน้ำแข็ง", ico: "🏹", rarity: "divine",
    atk: 2, desc: "แช่แข็งเป้า 1 เทิร์น", effect: "freeze" },
  { id: "dagger", name: "มีดลอบสังหาร", ico: "🗡️", rarity: "common",
    atk: 1, desc: "โจมตีหลัง ATK+3", effect: "backstab" },
  { id: "battle_axe", name: "ขวานสองคม", ico: "🪓", rarity: "common",
    atk: 3, desc: "ATK+3 เสีย HP1", effect: "self_dmg" },
  { id: "dragon_armor", name: "เกราะเงินมังกร", ico: "🛡️", rarity: "divine",
    def: 2, desc: "ลด DMG -2 ทุกครั้ง", effect: "def" },
  { id: "oak_shield", name: "โล่ไม้โอ๊ค", ico: "🛡️", rarity: "common",
    def: 1, desc: "ป้องกัน ฟื้น HP+1", effect: "def_heal" },
  { id: "thorn_armor", name: "เกราะหนามเหล็ก", ico: "🔰", rarity: "common",
    def: 0, desc: "ผู้โจมตีเสีย HP1", effect: "reflect" },
  { id: "war_hammer", name: "ค้อนราชันย์", ico: "🔨", rarity: "secret",
    atk: 5, desc: "ATK+5 สั่นสะเทือนรอบข้าง", effect: "aoe" },
  { id: "blood_sword", name: "ดาบเลือดสาบาน", ico: "💀", rarity: "secret",
    atk: 6, desc: "เสีย HP2 → ATK+6", effect: "blood" },
];

export const MAGIC_CARDS = [
  { id: "hellfire",  name: "ไฟนรก",       ico: "🔥", rarity: "rare",   dmg: 6,  desc: "DMG 6 เป้าเดี่ยว", cost: 3 },
  { id: "ice_storm", name: "พายุน้ำแข็ง", ico: "❄️", rarity: "rare",   dmg: 3,  desc: "แช่แข็ง 1 เทิร์น", cost: 2 },
  { id: "lightning", name: "สายฟ้า",      ico: "⚡", rarity: "divine", dmg: 3,  desc: "DMG 3 ทุกศัตรู",    cost: 5 },
  { id: "holy_heal", name: "แสงศักดิ์สิทธิ์", ico: "✨", rarity: "rare", heal: 5, desc: "ฟื้น HP+5",       cost: 3 },
  { id: "dark_curse", name: "คำสาปเงา",   ico: "🌑", rarity: "rare",   dmg: 0,  desc: "ATK ศัตรู -2 เป็น 2 เทิร์น", cost: 2 },
  { id: "time_stop", name: "หยุดเวลา",    ico: "⏳", rarity: "divine", dmg: 0,  desc: "ศัตรูพลาดเทิร์นถัดไป", cost: 0, once: true },
  { id: "warp",      name: "วาร์ปหลบ",    ico: "🌀", rarity: "rare",   dmg: 0,  desc: "เทเลพอร์ตไปพื้นที่ใดก็ได้", cost: 3 },
  { id: "amrita",    name: "น้ำอมฤต",     ico: "💧", rarity: "divine", heal: 99, desc: "ฟื้น HP เต็ม 1 ครั้ง/เกม", cost: 0, once: true },
];

export const TRAP_CARDS = [
  { id: "iron_pit", name: "หลุมหนาม",    ico: "🕳️", dmg: 3, desc: "DMG -3 ทันที" },
  { id: "poison",   name: "พิษเถาวัลย์", ico: "☠️", dmg: 1, desc: "ติดพิษ -1HP/เทิร์น 3 เทิร์น", poison: 3 },
  { id: "net",      name: "ตาข่าย",      ico: "🕸️", dmg: 0, desc: "ล็อค 1 เทิร์น", lock: 1 },
  { id: "bomb",     name: "ระเบิดควัน",  ico: "💨", dmg: 0, desc: "ตาบอด 2 เทิร์น", blind: 2 },
  { id: "spikes",   name: "กงเล็บเหล็ก", ico: "⚙️", dmg: 2, desc: "ทำลายเกราะ + DMG -2", destroy_armor: true },
];
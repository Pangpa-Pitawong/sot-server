// src/game/constants/roles.js
export const ROLES = {
  king: { id: "king", ico: "👑", name: "พระราชา", color: "#c9a84c", hp: 16,
    desc: "รักษาบัลลังก์และปกป้องอาณาจักร",
    win: "ครองราชย์ครบ 6 เฟส หรือปราบกบฏทั้งหมด" },
  rebel: { id: "rebel", ico: "⚔️", name: "กบฏ", color: "#c94040", hp: 13,
    desc: "โค่นบัลลังก์ด้วยการรวมกำลัง",
    win: "ราชา HP=0 หรือยึดศาลบัลลังก์ 2 เฟส" },
  traitor: { id: "traitor", ico: "🗡️", name: "คนทรยศ", color: "#8c4cc9", hp: 10,
    desc: "ซ่อนตัวสะสมสมบัติลับ",
    win: "สมบัติ 5 ชิ้น หรือรอดคนสุดท้าย" },
  commoner: { id: "commoner", ico: "🧑", name: "ราษฎร", color: "#4cc94c", hp: 11,
    desc: "สะสมทรัพย์สินเอาตัวรอด",
    win: "ทอง 10 เหรียญ หรือ Lv.5" },
};
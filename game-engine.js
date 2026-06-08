// ═══════════════════════════════════════════════════════════════
// SHADOW OF THRONE — game-engine.js
// Core game logic, state, combat system
// ═══════════════════════════════════════════════════════════════

const SOT_ENGINE = (() => {
  'use strict';

  // ─── STATE ────────────────────────────────────────────────────
  let G = null;

  function createInitialState() {
    return {
      players: [],
      currentPlayerIdx: 0,
      phase: 1,           // 1-6 phases (full rounds)
      turn: 1,            // turn within phase
      totalTurns: 0,      // absolute turn count
      gameOver: false,
      winner: null,
      throneHeldPhases: {},
      noMagicThisTurn: false,
      globalAtkBonus: 0,
      trapMap: {},        // zoneId -> [trap]
      discardPile: [],
      drawPile: [],
      log: [],            // {msg, type, turn, phase}
      eventLog: [],       // important events only
      phaseEventPlayed: false,
      turnActions: {      // reset each turn
        moved: false,
        attacked: false,
        usedItem: false,
        drewCard: false,
      },
      shopItems: [],      // market items available
      pendingEvent: null,
      settings: { playerCount: 4, names: [] },
    };
  }

  // ─── PLAYER FACTORY ────────────────────────────────────────────
  function createPlayer(id, name, role, classId, startZoneId) {
    const D = SOT_DATA;
    const cls = D.CLASSES[classId];
    const roleData = D.ROLES[role];
    const baseStats = roleData.baseStats;

    return {
      id,
      name,
      role,
      classId,
      level: 1,
      exp: 0,
      expToNext: 10,
      hp: cls.hp,
      maxHp: cls.hp,
      mana: cls.mana,
      maxMana: cls.mana,
      gold: 4,
      hand: [],
      equipment: [],         // equipped items (armor/weapon)
      statusEffects: [],     // [{type, duration, val}]
      zoneId: startZoneId,
      prevZoneId: startZoneId,
      alive: true,
      questDone: false,
      revealed: false,       // role revealed publicly?
      stats: {
        STR: baseStats.STR + cls.s.STR,
        DEX: baseStats.DEX + cls.s.DEX,
        VIT: baseStats.VIT + cls.s.VIT,
        INT: baseStats.INT + cls.s.INT,
      },
      attackRange: cls.attackRange || 1,
      moveRange: cls.moveRange || 3,
      usedAbility: false,
      usedAmrita: false,
      usedInferno: false,
      usedTimeStop: false,
      throneCount: 0,
      kills: 0,
      damageDealt: 0,
      damageReceived: 0,
      tradeHistory: [],
      rage: 0,           // warrior mechanic
      shieldCount: 0,    // knight mechanic
      freeMagicThisTurn: false,
      extraMoveUsed: false,
    };
  }

  // ─── DICE SYSTEM ───────────────────────────────────────────────
  function rollD6() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function rollHit(attacker, defender) {
    const D = SOT_DATA;
    const clsA = D.CLASSES[attacker.classId];
    const clsD = D.CLASSES[defender.classId];
    const hitChance = D.calcHitChance(attacker, defender, clsA, clsD);

    // Status modifiers
    let finalChance = hitChance;
    if (defender.statusEffects.find(s => s.type === 'blind')) finalChance -= 0.1;
    if (attacker.statusEffects.find(s => s.type === 'blind')) finalChance -= 0.2;
    if (attacker.statusEffects.find(s => s.type === 'stun')) finalChance -= 0.3;
    if (defender.role === 'traitor') finalChance -= 0.15; // traitor passive

    const roll = rollD6();
    const threshold = Math.round((1 - Math.min(0.95, Math.max(0.1, finalChance))) * 6);
    const hit = roll > threshold;
    const crit = roll >= (clsA.id === 'archer' ? 4 : 5) && hit;

    return { roll, hit, crit, hitChance: finalChance };
  }

  function calcDamageValue(attacker, weaponAtk, crit) {
    const D = SOT_DATA;
    const cls = D.CLASSES[attacker.classId];
    let str = cls.s.STR;

    // Status buffs
    const atkBuff = attacker.statusEffects.find(s => s.type === 'atk_buff');
    if (atkBuff) str += atkBuff.val;

    // Warrior rage
    if (attacker.classId === 'warrior' && attacker.hp < attacker.maxHp / 2) str += 2;
    if (attacker.classId === 'warrior' && attacker.rage > 0) {
      str += Math.min(3, attacker.rage);
    }

    // Global bonus
    if (G && G.globalAtkBonus) str += G.globalAtkBonus;
    if (G && G.phase >= 5) str += 1; // phase 5 bonus

    const base = str + weaponAtk;
    return crit ? Math.ceil(base * 1.5) : base;
  }

  function calcDefenseValue(defender) {
    let def = 0;
    (defender.equipment || []).forEach(e => { def += (e.def || 0); });
    // status
    const magicShield = defender.statusEffects.find(s => s.type === 'magic_resist');
    if (magicShield) def += 2;
    return def;
  }

  // ─── ATTACK SYSTEM ─────────────────────────────────────────────
  function performAttack(attacker, defender, weapon) {
    if (G.phase === 1 && G.phases[0].noDamage) {
      addLog('❌ เฟสแรก — ห้ามโจมตี!', 'error');
      return { success: false, reason: 'noDamage' };
    }
    if (!attacker.alive || !defender.alive) return { success: false, reason: 'dead' };

    // Range check
    const dist = hexDistance(attacker.zoneId, defender.zoneId);
    const range = weapon ? (weapon.range || 1) : attacker.attackRange;
    if (dist > range) return { success: false, reason: 'outOfRange', dist, range };

    // Status: frozen/stunned
    const frozen = attacker.statusEffects.find(s => s.type === 'freeze' || s.type === 'stun');
    if (frozen) return { success: false, reason: 'statusBlocked' };

    // Roll hit
    const hitResult = rollHit(attacker, defender);
    const weaponAtk = weapon ? (weapon.atk || 0) : 0;

    // Backstab (rogue)
    let actualWeaponAtk = weaponAtk;
    if (weapon && weapon.backstab && attacker.classId === 'rogue' && G.turnActions.moved) {
      actualWeaponAtk += weapon.backstab;
    }
    // King sword bonus
    if (weapon && weapon.king_bonus && attacker.role === 'king') {
      actualWeaponAtk += weapon.king_bonus;
    }

    if (!hitResult.hit) {
      addLog(`🎯 ${attacker.name} โจมตี ${defender.name} — พลาด! (🎲${hitResult.roll})`, 'miss');
      return { success: true, hit: false, roll: hitResult.roll };
    }

    const rawDmg = calcDamageValue(attacker, actualWeaponAtk, hitResult.crit);
    const defVal = calcDefenseValue(defender);

    // Barrier check
    const barrier = defender.statusEffects.find(s => s.type === 'barrier');
    if (barrier) {
      defender.statusEffects = defender.statusEffects.filter(s => s.type !== 'barrier');
      addLog(`💫 ${defender.name} บาเรียดูดดาเมจ!`, 'evt');
      return { success: true, hit: true, blocked: true };
    }

    // Reflect magic
    const reflectMagic = defender.statusEffects.find(s => s.type === 'reflect_magic');
    if (reflectMagic && weapon && weapon.type === 'magic') {
      defender.statusEffects = defender.statusEffects.filter(s => s.type !== 'reflect_magic');
      const selfDmg = Math.max(1, rawDmg - calcDefenseValue(attacker));
      attacker.hp = Math.max(0, attacker.hp - selfDmg);
      addLog(`🪞 เวทย์สะท้อนกลับ! ${attacker.name} เสีย ${selfDmg} HP`, 'dmg');
      checkDeath(attacker);
      return { success: true, hit: true, reflected: true };
    }

    const finalDmg = Math.max(1, rawDmg - defVal);

    // Thorn armor
    const thorn = defender.equipment.find(e => e.reflect);
    if (thorn) {
      attacker.hp = Math.max(0, attacker.hp - thorn.reflect);
      addLog(`🔰 เกราะหนามสะท้อน ${thorn.reflect} HP`, 'dmg');
    }

    // Apply damage
    defender.hp = Math.max(0, defender.hp - finalDmg);
    attacker.damageDealt += finalDmg;
    defender.damageReceived += finalDmg;

    // Apply weapon effects
    if (weapon) {
      if (weapon.burn) applyStatus(defender, 'burn', weapon.burn, 1);
      if (weapon.poison) applyStatus(defender, 'poison', weapon.poison, 1);
      if (weapon.freeze) applyStatus(defender, 'freeze', weapon.freeze);
      if (weapon.stun) applyStatus(defender, 'stun', weapon.stun);
      if (weapon.self_dmg) { attacker.hp = Math.max(1, attacker.hp - weapon.self_dmg); }
      if (weapon.pull) {
        // Move defender adjacent to attacker
        const adjZones = SOT_DATA.HEX_ZONES.find(z => z.id === attacker.zoneId)?.neighbors || [];
        if (adjZones.length > 0) { defender.zoneId = adjZones[0]; addLog(`💨 ${defender.name} ถูกดึงเข้ามา`); }
      }
      if (weapon.aoe_adj) {
        // Area damage to adjacent players
        const adjZones = SOT_DATA.HEX_ZONES.find(z => z.id === attacker.zoneId)?.neighbors || [];
        G.players.filter(p => p.alive && p.id !== attacker.id && adjZones.includes(p.zoneId)).forEach(p => {
          p.hp = Math.max(0, p.hp - weapon.aoe_adj);
          addLog(`💥 AoE: ${p.name} เสีย ${weapon.aoe_adj} HP`, 'dmg');
          checkDeath(p);
        });
      }
    }

    // Warrior rage mechanic
    if (attacker.classId === 'warrior') {
      attacker.rage = Math.max(0, attacker.rage - Math.min(3, attacker.rage));
    }

    const msg = `⚔ ${attacker.name} โจมตี ${defender.name} — ${finalDmg} ดาเมจ 🎲${hitResult.roll}${hitResult.crit ? ' ✨คริต!' : ''}${defVal > 0 ? ` (DEF-${defVal})` : ''}`;
    addLog(msg, hitResult.crit ? 'crit' : 'dmg');

    gainExp(attacker, 2);
    checkDeath(defender);

    return { success: true, hit: true, dmg: finalDmg, crit: hitResult.crit, roll: hitResult.roll };
  }

  // ─── STATUS EFFECTS ────────────────────────────────────────────
  function applyStatus(player, type, duration, val = 0) {
    // Don't stack same type, just refresh
    player.statusEffects = player.statusEffects.filter(s => s.type !== type);
    player.statusEffects.push({ type, duration, val });
  }

  function tickStatusEffects(player) {
    const toRemove = [];
    player.statusEffects.forEach(s => {
      if (s.type === 'poison' && s.val) {
        player.hp = Math.max(0, player.hp - s.val);
        addLog(`☠ พิษ: ${player.name} HP-${s.val}`, 'dmg');
        checkDeath(player);
      }
      if (s.type === 'burn' && s.val) {
        player.hp = Math.max(0, player.hp - s.val);
        addLog(`🔥 ไฟ: ${player.name} HP-${s.val}`, 'dmg');
        checkDeath(player);
      }
      if (s.type === 'summon' && s.val) {
        const en = G.players.find(e => e.alive && e.id !== player.id);
        if (en) {
          en.hp = Math.max(0, en.hp - s.val);
          addLog(`💀 โครงกระดูก: ${en.name} HP-${s.val}`, 'dmg');
          checkDeath(en);
        }
      }
      s.duration--;
      if (s.duration <= 0) toRemove.push(s.type);
    });
    player.statusEffects = player.statusEffects.filter(s => !toRemove.includes(s.type));
  }

  // ─── HEX PATHFINDING ──────────────────────────────────────────
  function hexDistance(zoneIdA, zoneIdB) {
    if (zoneIdA === zoneIdB) return 0;
    const D = SOT_DATA;
    const za = D.HEX_ZONES.find(z => z.id === zoneIdA);
    const zb = D.HEX_ZONES.find(z => z.id === zoneIdB);
    if (!za || !zb) return 99;
    // BFS
    const visited = new Set([zoneIdA]);
    let frontier = [zoneIdA];
    let dist = 0;
    while (frontier.length > 0) {
      dist++;
      const next = [];
      for (const zid of frontier) {
        const z = D.HEX_ZONES.find(x => x.id === zid);
        for (const nid of (z?.neighbors || [])) {
          if (nid === zoneIdB) return dist;
          if (!visited.has(nid)) { visited.add(nid); next.push(nid); }
        }
      }
      frontier = next;
      if (dist > 10) return 99;
    }
    return 99;
  }

  function getReachableZones(player, steps) {
    const D = SOT_DATA;
    const visited = new Set([player.zoneId]);
    let frontier = [player.zoneId];
    for (let i = 0; i < steps; i++) {
      const next = [];
      for (const zid of frontier) {
        const z = D.HEX_ZONES.find(x => x.id === zid);
        for (const nid of (z?.neighbors || [])) {
          if (!visited.has(nid)) { visited.add(nid); next.push(nid); }
        }
      }
      frontier = next;
    }
    visited.delete(player.zoneId);
    return [...visited];
  }

  // ─── MOVEMENT ────────────────────────────────────────────────
  function movePlayer(player, targetZoneId) {
    if (G.turnActions.moved) return { success: false, reason: 'already_moved' };
    const frozen = player.statusEffects.find(s => s.type === 'freeze' || s.type === 'stun' || s.type === 'lock');
    if (frozen) return { success: false, reason: 'statusBlocked' };

    // Eagle armor bonus
    let moveRange = player.moveRange;
    const eagleArmor = player.equipment.find(e => e.extra_move);
    if (eagleArmor) moveRange += eagleArmor.extra_move;

    const dist = hexDistance(player.zoneId, targetZoneId);
    if (dist > moveRange) return { success: false, reason: 'tooFar', dist, range: moveRange };

    player.prevZoneId = player.zoneId;
    player.zoneId = targetZoneId;
    G.turnActions.moved = true;

    addLog(`🚶 ${player.name} → ${SOT_DATA.HEX_ZONES.find(z => z.id === targetZoneId)?.name || targetZoneId}`);

    // Apply zone effect on arrival
    applyZoneEffect(player, targetZoneId);

    // Check traps
    checkTraps(player, targetZoneId);

    return { success: true };
  }

  function applyZoneEffect(player, zoneId) {
    const zone = SOT_DATA.HEX_ZONES.find(z => z.id === zoneId);
    if (!zone) return;

    switch (zone.effect) {
      case 'heal_2':
        player.hp = Math.min(player.maxHp, player.hp + 2);
        addLog(`🏘 ${player.name} ฟื้น HP+2 (หมู่บ้าน)`, 'heal');
        break;
      case 'gold_king':
        if (player.role === 'king') { player.gold += 1; addLog(`🏰 ราชา +1 ทอง`); }
        break;
      case 'throne_effect':
        if (player.role === 'king') {
          player.hp = Math.min(player.maxHp, player.hp + 3);
          addLog(`⚖ ราชาที่บัลลังก์ HP+3`, 'heal');
          player.throneCount = (player.throneCount || 0) + 1;
          if (!G.throneHeldPhases) G.throneHeldPhases = {};
          G.throneHeldPhases[player.id] = (G.throneHeldPhases[player.id] || 0) + 1;
        } else if (player.role === 'rebel') {
          player.hp = Math.max(0, player.hp - 2);
          addLog(`⚖ กบฏที่ศาลบัลลังก์ HP-2`, 'dmg');
          // If rebel holds throne for 2 phases
          G.throneHeldPhases = G.throneHeldPhases || {};
          G.throneHeldPhases[player.id] = (G.throneHeldPhases[player.id] || 0) + 1;
          checkDeath(player);
        }
        break;
      case 'draw_weapon':
        { const w = rndCard('weapon'); player.hand.push(w); addLog(`⚒ ได้อาวุธ "${w.name}"`, 'evt'); }
        break;
      case 'draw_magic':
        { player.mana = Math.min(player.maxMana, player.mana + 2);
          const m = rndCard('magic'); player.hand.push(m);
          addLog(`🗼 ฟื้นมานา+2 + ได้เวทย์ "${m.name}"`, 'evt'); }
        break;
      case 'draw_trap':
        { const t = rndCard('trap'); player.hand.push(t); addLog(`🌲 ได้กับดัก "${t.name}"`, 'evt'); }
        break;
      case 'market':
        player.gold += 1;
        addLog(`🏪 ผ่านตลาด +1 ทอง`, 'evt');
        break;
      case 'ruins_loot':
        { const roll = rollD6();
          if (roll >= 4) { const it = rndWeighted(); player.hand.push(it); addLog(`🏚 🎲${roll} พบสมบัติ "${it.name}"!`, 'imp'); }
          else { player.hp = Math.max(0, player.hp - 2); addLog(`🏚 🎲${roll} ไม่พบอะไร HP-2`, 'dmg'); checkDeath(player); }
        } break;
      case 'cave_loot':
        { const roll = rollD6();
          if (roll >= 4) { player.gold += 3; addLog(`🐉 🎲${roll} หนีมังกร! +3 ทอง`, 'imp'); }
          else { player.hp = Math.max(0, player.hp - 3); addLog(`🐉 🎲${roll} โดนมังกร! HP-3`, 'dmg'); checkDeath(player); }
        } break;
      case 'rebel_buff':
        if (player.role === 'rebel') {
          applyStatus(player, 'atk_buff', 2, 2);
          player.hp = Math.min(player.maxHp, player.hp + 2);
          addLog(`⛺ กบฏ: ATK+2 HP+2`, 'evt');
        } else {
          // Non-rebels at rebel camp get attacked
          addLog(`⛺ ${player.name} บุกเข้าค่ายกบฏ! (ระวังการโต้ตอบ)`, 'evt');
        }
        break;
      case 'shrine_heal':
        if (!player._shrineUsed) {
          const cost = player.hand.length > 0 ? 1 : 0;
          if (cost === 0) { player.hp = player.maxHp; addLog(`⛩ ฟื้น HP เต็ม!`, 'heal'); player._shrineUsed = true; }
          else { addLog(`⛩ ศาลเจ้า: ทิ้งการ์ด 1 ใบเพื่อฟื้น HP เต็ม`, 'evt'); }
        }
        break;
      case 'black_market':
        addLog(`🕵 ตลาดมืดเปิด — ซื้อการ์ด divine/secret ราคาพิเศษ`, 'evt');
        break;
      case 'cemetery':
        { const w = rndCard('weapon'); player.hand.push(w); player.hp = Math.max(0, player.hp - 1);
          addLog(`🪦 ได้ "${w.name}" จากสุสาน HP-1`, 'evt'); }
        break;
      case 'riverbank':
        player.mana = Math.min(player.maxMana, player.mana + 3);
        G.turnActions.attacked = true; // can't attack this turn
        addLog(`🌊 ฟื้นมานา+3 แต่ไม่สามารถโจมตีรอบนี้`, 'evt');
        break;
      case 'extra_move':
        if (!player.extraMoveUsed) { player.extraMoveUsed = true; addLog(`🛤 สี่แยก: เดินได้อีก +1 ช่อง`, 'evt'); G.turnActions.moved = false; }
        break;
      case 'spy':
        addLog(`🔭 หอสังเกตการณ์: ดูการ์ดของผู้เล่นคนหนึ่ง`, 'evt');
        break;
      case 'buy_info':
        addLog(`🍺 โรงเตี๊ยม: ซื้อข้อมูลบทบาทผู้เล่น (ราคา 3 ทอง)`, 'evt');
        break;
      case 'farm_gold':
        player.gold += 1;
        addLog(`🌾 ทุ่งนา: +1 ทอง`, 'evt');
        break;
      case 'mana_regen':
        player.mana = Math.min(player.maxMana, player.mana + 3);
        addLog(`🌊 ฟื้นมานา+3`, 'evt');
        break;
      case 'high_ground':
        applyStatus(player, 'high_ground', 1);
        addLog(`⛰ พื้นที่สูง: ระยะโจมตี+1 รอบนี้`, 'evt');
        break;
    }
  }

  function checkTraps(player, zoneId) {
    const traps = (G.trapMap[zoneId] || []).filter(t => !t.triggered && t.ownerId !== player.id);
    traps.forEach(trap => {
      trap.triggered = true;
      const tc = trap.card;
      addLog(`🪤 ${player.name} โดนกับดัก "${tc.name}"!`, 'trap');
      if (tc.dmg) { player.hp = Math.max(0, player.hp - tc.dmg); addLog(`💥 เสีย ${tc.dmg} HP`, 'dmg'); }
      if (tc.poison) applyStatus(player, 'poison', tc.poison, tc.val || 1);
      if (tc.burn) applyStatus(player, 'burn', tc.burn, tc.val || 1);
      if (tc.freeze || tc.lock) applyStatus(player, 'freeze', tc.lock || 1);
      if (tc.blind) applyStatus(player, 'blind', tc.blind);
      if (tc.destroy_armor) {
        const armor = player.equipment.find(e => e.def > 0);
        if (armor) { player.equipment = player.equipment.filter(e => e !== armor); addLog(`🛡 เกราะถูกทำลาย!`, 'dmg'); }
      }
      // Reward trap owner
      const owner = G.players.find(p => p.id === trap.ownerId);
      if (owner) gainExp(owner, 2);
      checkDeath(player);
    });
    G.trapMap[zoneId] = (G.trapMap[zoneId] || []).filter(t => t.triggered);
  }

  // ─── CARD SYSTEM ──────────────────────────────────────────────
  function rndCard(type) {
    const D = SOT_DATA;
    const pool = type === 'weapon' ? D.WEAPONS
      : type === 'magic' ? D.MAGICS
      : type === 'trap' ? D.TRAPS
      : type === 'event' ? D.EVENTS
      : [...D.WEAPONS, ...D.MAGICS, ...D.TRAPS];
    return JSON.parse(JSON.stringify(pool[Math.floor(Math.random() * pool.length)]));
  }

  function rndWeighted() {
    const r = Math.random();
    return r < 0.35 ? rndCard('weapon') : r < 0.65 ? rndCard('magic') : rndCard('trap');
  }

  function autoDrawCard(player) {
    const card = rndWeighted();
    player.hand.push(card);
    addLog(`🃏 ${player.name} จั่ว "${card.name}" (อัตโนมัติ)`, 'draw');
    return card;
  }

  function useMagic(caster, card, targetId) {
    const D = SOT_DATA;
    if (G.noMagicThisTurn) { addLog('❌ ห้ามใช้เวทย์รอบนี้!', 'error'); return { success: false }; }

    // Mana cost
    const cost = card.manaCost || 0;
    if (!caster.freeMagicThisTurn && caster.mana < cost) {
      addLog(`❌ มานาไม่พอ (ต้องการ ${cost})`, 'error');
      return { success: false };
    }
    if (!caster.freeMagicThisTurn) caster.mana -= cost;
    caster.freeMagicThisTurn = false;

    // Once per game checks
    if (card.once_per_game) {
      if (card.id === 'amrita' && caster.usedAmrita) { addLog('น้ำอมฤตใช้แล้ว', 'error'); return { success: false }; }
      if (card.id === 'inferno' && caster.usedInferno) { addLog('เปลวเพลิงใช้แล้ว', 'error'); return { success: false }; }
      if (card.id === 'time_stop' && caster.usedTimeStop) { addLog('หยุดเวลาใช้แล้ว', 'error'); return { success: false }; }
    }

    const target = targetId === 'self' ? caster
      : targetId === 'all' ? null
      : G.players.find(p => p.id === targetId);

    let msg = `✨ ${caster.name} ใช้ "${card.name}"`;

    if (card.full_heal) {
      caster.hp = caster.maxHp;
      caster.statusEffects = caster.statusEffects.filter(s => s.type !== 'poison' && s.type !== 'burn');
      caster.usedAmrita = true;
      msg += ' → ฟื้น HP เต็ม!';
    } else if (card.dmg && target) {
      const defVal = calcDefenseValue(target);
      const dmg = Math.max(1, (card.dmg) - defVal);
      target.hp = Math.max(0, target.hp - dmg);
      caster.damageDealt += dmg;
      target.damageReceived += dmg;
      msg += ` → ${target.name} เสีย ${dmg} HP`;
      checkDeath(target);
    } else if (card.aoe) {
      G.players.filter(p => p.alive && p.id !== caster.id).forEach(p => {
        const dmg = Math.max(1, card.aoe - calcDefenseValue(p));
        p.hp = Math.max(0, p.hp - dmg);
        checkDeath(p);
      });
      msg += ` → AoE ${card.aoe} ทุกศัตรู!`;
    } else if (card.heal && target) {
      target.hp = Math.min(target.maxHp, target.hp + card.heal);
      msg += ` → ${target.name} ฟื้น +${card.heal} HP`;
    } else if (card.drain && target) {
      const amt = Math.min(card.drain, target.hp - 1);
      target.hp -= amt; caster.hp = Math.min(caster.maxHp, caster.hp + amt);
      msg += ` → ดูด ${amt} HP จาก ${target.name}`;
      checkDeath(target);
    } else if (card.barrier) {
      applyStatus(caster, 'barrier', 2);
      msg += ' → บาเรียป้องกัน!';
    } else if (card.reflect_magic) {
      applyStatus(caster, 'reflect_magic', 2);
      msg += ' → สะท้อนเวทย์ถัดไป!';
    } else if (card.ranged_block) {
      applyStatus(caster, 'ranged_block', 1);
      msg += ' → ป้องกันระยะไกล!';
    } else if (card.magic_resist) {
      applyStatus(caster, 'magic_resist', card.magic_resist);
      msg += ` → ต้านเวทย์ ${card.magic_resist} เทิร์น`;
    } else if (card.atk_buff) {
      if (card.self_dmg) caster.hp = Math.max(1, caster.hp - card.self_dmg);
      applyStatus(caster, 'atk_buff', 1, card.atk_buff);
      msg += ` → ATK+${card.atk_buff} 1 เทิร์น`;
    } else if (card.freeze && target) {
      applyStatus(target, 'freeze', card.freeze);
      msg += ` → ${target.name} แช่แข็ง!`;
    } else if (card.stun && target) {
      applyStatus(target, 'stun', card.stun);
      msg += ` → ${target.name} มึนงง!`;
    } else if (card.debuff_atk && target) {
      applyStatus(target, 'debuff_atk', card.duration || 2, card.debuff_atk);
      msg += ` → ${target.name} ATK-${card.debuff_atk}`;
    } else if (card.summon) {
      applyStatus(caster, 'summon', card.duration || 3, card.summon);
      msg += ` → เรียกโครงกระดูก! (${card.summon} ดาเมจ/${3} เทิร์น)`;
    } else if (card.teleport) {
      msg += ' → เลือกพื้นที่เดินทาง (pending)';
    } else if (card.skip_turn && target) {
      applyStatus(target, 'skip_turn', 1);
      caster.usedTimeStop = true;
      msg += ` → ${target.name} เสียเทิร์นถัดไป!`;
    }

    if (card.once_per_game) {
      if (card.id === 'inferno') caster.usedInferno = true;
    }

    // Remove from hand
    const idx = caster.hand.findIndex(c => c.id === card.id);
    if (idx >= 0) caster.hand.splice(idx, 1);

    gainExp(caster, 3);
    addLog(msg, 'magic');
    return { success: true };
  }

  // ─── TRADING SYSTEM ───────────────────────────────────────────
  function offerTrade(fromPlayer, toPlayer, offer, request) {
    // offer: {cards: [], gold: 0}
    // request: {cards: [], gold: 0}
    return {
      id: `trade_${Date.now()}`,
      from: fromPlayer.id,
      to: toPlayer.id,
      offer,
      request,
      status: 'pending',
    };
  }

  function acceptTrade(trade) {
    const from = G.players.find(p => p.id === trade.from);
    const to = G.players.find(p => p.id === trade.to);
    if (!from || !to) return { success: false };

    // Gold transfer
    if (trade.offer.gold) { from.gold -= trade.offer.gold; to.gold += trade.offer.gold; }
    if (trade.request.gold) { to.gold -= trade.request.gold; from.gold += trade.request.gold; }

    // Card transfer
    (trade.offer.cards || []).forEach(cardId => {
      const idx = from.hand.findIndex(c => c.id === cardId);
      if (idx >= 0) { to.hand.push(from.hand[idx]); from.hand.splice(idx, 1); }
    });
    (trade.request.cards || []).forEach(cardId => {
      const idx = to.hand.findIndex(c => c.id === cardId);
      if (idx >= 0) { from.hand.push(to.hand[idx]); to.hand.splice(idx, 1); }
    });

    trade.status = 'accepted';
    from.tradeHistory.push(trade);
    to.tradeHistory.push(trade);
    addLog(`🤝 ${from.name} ↔ ${to.name} แลกเปลี่ยนสำเร็จ!`, 'evt');
    return { success: true };
  }

  // ─── EVENT SYSTEM ─────────────────────────────────────────────
  function playPhaseEvent() {
    if (G.phaseEventPlayed) return null;
    const D = SOT_DATA;
    const ev = D.EVENTS[Math.floor(Math.random() * D.EVENTS.length)];
    G.phaseEventPlayed = true;
    addLog(`📜 เหตุการณ์: ${ev.ico} ${ev.name} — ${ev.desc}`, 'event', true);
    applyEvent(ev);
    return ev;
  }

  function applyEvent(ev) {
    const cp = G.players[G.currentPlayerIdx];
    switch (ev.fx) {
      case 'gold_all_2': G.players.forEach(p => { if (p.alive) p.gold += 2; }); addLog('💰 ทุกคน+2 ทอง'); break;
      case 'heal_all_3': G.players.forEach(p => { if (p.alive) p.hp = Math.min(p.maxHp, p.hp + 3); }); addLog('✨ ทุกคนฟื้น HP+3', 'heal'); break;
      case 'dmg_all_2': G.players.forEach(p => { if (p.alive) { p.hp = Math.max(0, p.hp - 2); checkDeath(p); } }); addLog('👻 ทุกคนเสีย HP-2', 'dmg'); break;
      case 'draw_magic': { const m = rndCard('magic'); cp.hand.push(m); addLog(`🔮 จั่วเวทย์ "${m.name}"`, 'evt'); } break;
      case 'draw_2': for (let i = 0; i < 2; i++) { const c = rndWeighted(); cp.hand.push(c); addLog(`🃏 จั่ว "${c.name}"`, 'draw'); } break;
      case 'gold_5': cp.gold += 5; addLog('✨ ผู้จั่ว +5 ทอง!', 'imp'); break;
      case 'dmg_highest_3': {
        const top = G.players.filter(p => p.alive).reduce((a, b) => a.hp > b.hp ? a : b);
        top.hp = Math.max(0, top.hp - 3); addLog(`⚡ ${top.name} HP-3`, 'dmg'); checkDeath(top);
      } break;
      case 'discard_weapon': G.players.forEach(p => { if (!p.alive) return; const wi = p.hand.findIndex(c => c.type === 'weapon'); if (wi >= 0) { G.discardPile.push(p.hand[wi]); p.hand.splice(wi, 1); } }); addLog('⛈ ทุกคนทิ้งอาวุธ 1 ใบ'); break;
      case 'tax_magic': G.players.forEach(p => { if (!p.alive) return; const mc = p.hand.filter(c => c.type === 'magic').length; p.gold = Math.max(0, p.gold - mc); }); addLog('☀ จ่ายทองตามจำนวนเวทย์'); break;
      case 'hp1_no_magic': G.players.forEach(p => { if (p.alive) p.hp = Math.max(0, p.hp - 1); }); G.noMagicThisTurn = true; addLog('🌬 ทุกคน HP-1 ห้ามใช้เวทย์', 'dmg'); break;
      case 'atk_all_1': G.globalAtkBonus += 1; addLog('🥁 ทุกคน+1 ATK รอบนี้', 'evt'); break;
      case 'draw_item': { const it = rndWeighted(); cp.hand.push(it); addLog(`📦 ได้ "${it.name}"`, 'evt'); } break;
      case 'target_dmg_3': addLog('🗡 เลือกเป้าหมาย -3 HP (ดำเนินการผ่าน UI)', 'evt'); break;
      case 'discard_weak': G.players.forEach(p => { if (p.alive) p.hand = p.hand.filter(c => c.type !== 'weapon' || (c.atk || 0) >= 3); }); addLog('🐉 ทิ้งอาวุธ ATK<3', 'evt'); break;
      case 'peek_3': addLog('🗺 ดูการ์ดบนสุด 3 ใบ (ดำเนินการผ่าน UI)', 'evt'); break;
    }
  }

  // ─── EXP / LEVEL UP ───────────────────────────────────────────
  function gainExp(player, amount) {
    player.exp += amount;
    // Commoner passive: +1 EXP per alive turn
    const need = player.level * 10;
    while (player.exp >= need) {
      player.exp -= need;
      player.level++;
      player.maxHp += 2;
      player.hp = Math.min(player.maxHp, player.hp + 3);
      player.maxMana += 1;
      // Cleric: heal adjacent on level up
      if (player.classId === 'cleric') {
        const D = SOT_DATA;
        const zone = D.HEX_ZONES.find(z => z.id === player.zoneId);
        G.players.filter(p => p.alive && p.id !== player.id && (zone?.neighbors || []).includes(p.zoneId)).forEach(p => {
          p.hp = Math.min(p.maxHp, p.hp + 2);
        });
      }
      addLog(`⬆ ${player.name} เลเวลอัพ Lv.${player.level}! HP+2 MP+1`, 'level');
    }
  }

  // ─── DEATH ───────────────────────────────────────────────────
  function checkDeath(player) {
    if (!player.alive || player.hp > 0) return;
    player.alive = false;
    player.hp = 0;
    player.revealed = true; // reveal role on death
    addLog(`💀 ${player.name} (${SOT_DATA.ROLES[player.role]?.name || player.role}) ถูกกำจัด!`, 'death', true);
    // Check victory
    const victory = SOT_DATA.checkVictory(G);
    if (victory && !G.gameOver) triggerWin(victory);
  }

  function triggerWin(victory) {
    G.gameOver = true;
    G.winner = victory;
    addLog(`🏆 เกมจบ! ${victory.reason}`, 'win', true);
    // Trigger UI callback
    if (G._onWin) G._onWin(victory);
  }

  // ─── TURN MANAGEMENT ──────────────────────────────────────────
  function startTurn() {
    const player = G.players[G.currentPlayerIdx];
    if (!player.alive) { nextPlayer(); return; }

    // Skip turn effect
    const skipTurn = player.statusEffects.find(s => s.type === 'skip_turn');
    if (skipTurn) {
      player.statusEffects = player.statusEffects.filter(s => s.type !== 'skip_turn');
      addLog(`⏭ ${player.name} เสียเทิร์น!`);
      endTurn();
      return;
    }

    G.turnActions = { moved: false, attacked: false, usedItem: false, drewCard: false };
    G.noMagicThisTurn = false;
    G.globalAtkBonus = 0;
    player.extraMoveUsed = false;

    // Commoner passive: +1 EXP per alive turn
    if (player.role === 'commoner') gainExp(player, 1);

    // Mage: free magic turn
    if (player.classId === 'mage') player.freeMagicThisTurn = true;

    // Auto-draw 1 card at turn start
    autoDrawCard(player);

    addLog(`🔔 เทิร์นของ ${player.name} (${SOT_DATA.CLASSES[player.classId]?.name})`, 'turn', true);

    // Phase 1: show roles turn
    if (G.phase === 1 && !G.phaseIntroShown) {
      G.phaseIntroShown = true;
      addLog('👁 เฟสแรก: ทุกคนเห็นบทบาทกัน ห้ามโจมตี', 'event', true);
    }

    if (G._onTurnStart) G._onTurnStart(player);
  }

  function endTurn() {
    const player = G.players[G.currentPlayerIdx];
    if (player.alive) {
      // Tick status effects
      tickStatusEffects(player);
      // Mana regen
      player.mana = Math.min(player.maxMana, player.mana + 1);
      // Knight: regain shield
      if (player.classId === 'knight') player.shieldCount = Math.min(2, (player.shieldCount || 0) + 1);
      // Quest check
      checkQuest(player);
    }

    nextPlayer();
  }

  function nextPlayer() {
    let next = (G.currentPlayerIdx + 1) % G.players.length;
    let tries = 0;
    while (!G.players[next].alive && tries < G.players.length) {
      next = (next + 1) % G.players.length;
      tries++;
    }

    // Completed a full round
    if (next <= G.currentPlayerIdx && tries < G.players.length) {
      G.phase++;
      G.phaseEventPlayed = false;
      G.phaseIntroShown = false;
      addLog(`─── เฟส ${G.phase} เริ่มต้น! ───`, 'phase', true);
      // Phase 6+ = final
      if (G.phase > 6) { finalWin(); return; }
    }

    G.currentPlayerIdx = next;
    G.totalTurns++;
    startTurn();
  }

  function finalWin() {
    if (G.gameOver) return;
    const alive = G.players.filter(p => p.alive);
    if (alive.length === 0) {
      G.gameOver = true;
      G.winner = { winner: 'draw', reason: 'ทุกคนตาย — ไม่มีผู้ชนะ' };
    } else {
      const w = alive.sort((a, b) => {
        const scoreA = b.hp + b.gold * 0.5 + b.level * 2;
        const scoreB = a.hp + a.gold * 0.5 + a.level * 2;
        return scoreA - scoreB;
      })[0];
      triggerWin({ winner: w.role, player: w, reason: `${w.name} — คะแนนรวมสูงสุด` });
    }
  }

  function checkQuest(player) {
    if (player.questDone) return;
    if (player.role === 'king' && G.phase >= 8) { player.questDone = true; addLog(`👑 ${player.name} ครองราชย์ครบ!`, 'win', true); }
    if (player.role === 'commoner' && player.gold >= 10) { player.questDone = true; addLog(`🧑‍🌾 ${player.name} รวบรวมทอง 10!`, 'win', true); }
    if (player.role === 'commoner' && player.level >= 5) { player.questDone = true; addLog(`🧑‍🌾 ${player.name} วิวัฒน์ Lv.5!`, 'win', true); }
    if (player.role === 'traitor') {
      const divine = (player.hand || []).filter(c => c.rarity === 'divine' || c.rarity === 'secret').length;
      if (divine >= 5) { player.questDone = true; addLog(`🗡 ${player.name} รวบรวมสมบัติ 5 ชิ้น!`, 'win', true); }
    }
    if (player.questDone) {
      const victory = SOT_DATA.checkVictory(G);
      if (victory && !G.gameOver) triggerWin(victory);
    }
  }

  // ─── LOG ─────────────────────────────────────────────────────
  function addLog(msg, type = '', important = false) {
    const entry = { msg, type, phase: G ? G.phase : 0, turn: G ? G.totalTurns : 0, ts: Date.now() };
    if (G) {
      G.log.unshift(entry);
      if (G.log.length > 200) G.log.pop();
      if (important || ['win', 'death', 'phase', 'event'].includes(type)) {
        G.eventLog.unshift(entry);
        if (G.eventLog.length > 50) G.eventLog.pop();
      }
    }
    if (G && G._onLog) G._onLog(entry);
  }

  // ─── INITIALIZATION ───────────────────────────────────────────
  function initGame(settings) {
    G = createInitialState();
    G.settings = settings;

    const D = SOT_DATA;
    const { playerCount, names, classes } = settings;

    // Assign roles
    const roles = assignRoles(playerCount);

    // Create players
    roles.forEach((role, i) => {
      const classId = classes[i] || 'warrior';
      const startZone = D.ROLES[role].startZone || 'village';
      const player = createPlayer(i, names[i] || `ผู้เล่น ${i + 1}`, role, classId, startZone);
      G.players.push(player);
    });

    // Deal initial cards
    G.players.forEach(p => {
      for (let i = 0; i < 2; i++) p.hand.push(rndWeighted());
    });

    // Phase 1 event
    G.phase = 1;
    startTurn();

    return G;
  }

  function assignRoles(n) {
    const roles = ['king'];
    const rebelCount = n >= 5 ? 2 : 1;
    for (let i = 0; i < rebelCount; i++) roles.push('rebel');
    if (n >= 4) roles.push('traitor');
    while (roles.length < n) roles.push('commoner');
    // Shuffle
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    return roles;
  }

  // ─── SAVE/LOAD ────────────────────────────────────────────────
  function saveGameRecord() {
    if (!G) return null;
    return {
      timestamp: Date.now(),
      phase: G.phase,
      totalTurns: G.totalTurns,
      winner: G.winner,
      players: G.players.map(p => ({
        name: p.name, role: p.role, classId: p.classId,
        finalHp: p.hp, finalLevel: p.level, finalGold: p.gold,
        alive: p.alive, kills: p.kills,
        damageDealt: p.damageDealt, damageReceived: p.damageReceived,
      })),
      log: G.eventLog,
    };
  }

  // ─── PUBLIC API ───────────────────────────────────────────────
  return {
    initGame,
    getState: () => G,
    movePlayer: (playerId, zoneId) => movePlayer(G.players.find(p => p.id === playerId), zoneId),
    performAttack: (attackerId, defenderId, weapon) => performAttack(
      G.players.find(p => p.id === attackerId),
      G.players.find(p => p.id === defenderId),
      weapon
    ),
    useMagic: (casterId, card, targetId) => useMagic(G.players.find(p => p.id === casterId), card, targetId),
    endTurn,
    playPhaseEvent,
    offerTrade,
    acceptTrade,
    placeTrap: (player, card, zoneId) => {
      if (!G.trapMap[zoneId]) G.trapMap[zoneId] = [];
      G.trapMap[zoneId].push({ zoneId, card, ownerId: player.id, triggered: false });
      const idx = player.hand.findIndex(c => c.id === card.id);
      if (idx >= 0) player.hand.splice(idx, 1);
      addLog(`🪤 ${player.name} วางกับดัก "${card.name}"`, 'trap');
    },
    buyInfo: (buyer, targetPlayer, price = 3) => {
      if (buyer.gold < price) { addLog('ทองไม่พอ', 'error'); return false; }
      buyer.gold -= price;
      targetPlayer.revealed = true;
      addLog(`🍺 ${buyer.name} รู้บทบาทของ ${targetPlayer.name}: ${SOT_DATA.ROLES[targetPlayer.role]?.name}`, 'evt');
      return true;
    },
    equipCard: (player, cardIdx) => {
      const card = player.hand[cardIdx];
      if (!card || (card.type !== 'weapon' && card.type !== 'armor')) return false;
      player.equipment.push(card);
      player.hand.splice(cardIdx, 1);
      addLog(`${player.name} สวม ${card.ico} ${card.name}`);
      gainExp(player, 1);
      return true;
    },
    rollD6,
    rndCard,
    rndWeighted,
    hexDistance,
    getReachableZones,
    saveGameRecord,
    addLog,
    checkVictory: () => SOT_DATA.checkVictory(G),
    onLog: (cb) => { if (G) G._onLog = cb; },
    onTurnStart: (cb) => { if (G) G._onTurnStart = cb; },
    onWin: (cb) => { if (G) G._onWin = cb; },
    applyEvent,
    rndCard,
    autoDrawCard,
    gainExp,
    checkDeath,
    applyStatus,
  };
})();

if (typeof module !== 'undefined') module.exports = SOT_ENGINE;

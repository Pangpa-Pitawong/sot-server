// src/game/utils/mapGenerator.js

import { SPECIAL_ZONES } from "../constants/terrain.js";

export function generateHexMap(cols = 9, rows = 7) {
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
/**
 * Rummikub rule verification and validation utility.
 */

// Helper to sort tiles for Run grouping (consecutive numbers of the same color)
export const sortForRun = (tiles) => {
  return [...tiles].sort((a, b) => {
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return a.number - b.number;
  });
};

// Helper to sort tiles for Group grouping (same number, different colors)
export const sortForGroup = (tiles) => {
  return [...tiles].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return a.color.localeCompare(b.color);
  });
};

/**
 * Validates a single set/run of tiles.
 * A valid set must be either:
 * 1. A Run: 3 or more consecutive numbers of the SAME color (e.g. Red 3-4-5).
 * 2. A Group: 3 or 4 tiles of the SAME number but all DIFFERENT colors (e.g. Red 7, Blue 7, Yellow 7).
 */
export const isValidSet = (set) => {
  if (set.length < 3) return false;

  // Check if it's a Group (same number, different colors, max 4 tiles)
  const isGroupCandidate = set.every(tile => tile.number === set[0].number);
  if (isGroupCandidate && set.length <= 4) {
    const colors = set.map(t => t.color);
    const uniqueColors = new Set(colors);
    return uniqueColors.size === set.length; // No duplicate colors
  }

  // Check if it's a Run (same color, consecutive numbers)
  const isSameColor = set.every(tile => tile.color === set[0].color);
  if (isSameColor) {
    // Sort by number
    const sorted = [...set].sort((a, b) => a.number - b.number);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].number !== sorted[i].number + 1) {
        return false; // Not consecutive
      }
    }
    return true;
  }

  return false;
};

/**
 * Validates the entire board.
 * Board is represented as an array of rows, where each row contains an array of tiles.
 * The board can also be partitioned by spaces (empty cells) within a row.
 */
export const validateBoard = (board) => {
  // Extract continuous segments of tiles on the board
  const sets = [];

  board.forEach(row => {
    let currentSet = [];
    row.forEach(cell => {
      if (cell && cell.number !== undefined) {
        currentSet.push(cell);
      } else {
        if (currentSet.length > 0) {
          sets.push(currentSet);
          currentSet = [];
        }
      }
    });
    if (currentSet.length > 0) {
      sets.push(currentSet);
    }
  });

  if (sets.length === 0) return { isValid: false, reason: '보드판에 배치된 타일이 없습니다.' };

  for (let i = 0; i < sets.length; i++) {
    if (!isValidSet(sets[i])) {
      const tileDetails = sets[i].map(t => `${t.color} ${t.number}`).join(', ');
      return { 
        isValid: false, 
        reason: `올바르지 않은 세트가 포함되어 있습니다: [${tileDetails}] (루미큐브 규칙에 맞게 3개 이상 연속된 숫자 또는 다른 색상의 같은 숫자로 배치해 주세요.)` 
      };
    }
  }

  return { isValid: true, sets };
};

/**
 * Generates an initial pool of 106 Rummikub tiles (1 to 13 of 4 colors, two copies of each, plus 2 jokers if desired, 
 * but for simpler validation we'll use 104 standard tiles: 4 colors * 13 numbers * 2 sets).
 */
export const generateTilePool = () => {
  const colors = ['red', 'blue', 'black', 'green'];
  const pool = [];
  
  colors.forEach(color => {
    for (let num = 1; num <= 13; num++) {
      // Two copies of each tile
      pool.push({ id: `${color}-${num}-a`, color, number: num });
      pool.push({ id: `${color}-${num}-b`, color, number: num });
    }
  });

  // Shuffle pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
};

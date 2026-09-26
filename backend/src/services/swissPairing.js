/**
 * FIDE-compliant Swiss System Pairing Engine
 * Handles score brackets, no-rematch constraints, color balance, 
 * downfloating with backtracking, and deterministic byes.
 */

/**
 * Checks whether player A can play against player B
 */
function canPlay(playerA, playerB) {
  if (playerA.playerId === playerB.playerId) return false;
  if (playerA.previousOpponentIds.has(playerB.playerId)) return false;
  if (playerB.previousOpponentIds.has(playerA.playerId)) return false;

  // Check if compatible colors exist
  const aPref = getColorPreference(playerA);
  const bPref = getColorPreference(playerB);

  // If both strictly REQUIRE White or both strictly REQUIRE Black (e.g. 2 consecutive same colors)
  if (aPref.strict && bPref.strict && aPref.color === bPref.color) {
    return false;
  }

  return true;
}

/**
 * Determines color preference and whether it's a strict requirement.
 * A player cannot have:
 * 1. 3 consecutive same colors (e.g. WW -> MUST get B)
 * 2. Color difference exceeding 2 (|W - B| > 2)
 */
function getColorPreference(player) {
  const history = player.colorHistory || [];
  const len = history.length;
  const colorDiff = player.colorDifference || 0; // W - B

  // Check 2 consecutive same colors
  if (len >= 2 && history[len - 1] === 'W' && history[len - 2] === 'W') {
    return { color: 'B', strict: true, weight: 100 };
  }
  if (len >= 2 && history[len - 1] === 'B' && history[len - 2] === 'B') {
    return { color: 'W', strict: true, weight: 100 };
  }

  // Check color difference bounds
  if (colorDiff >= 2) {
    return { color: 'B', strict: true, weight: 80 };
  }
  if (colorDiff <= -2) {
    return { color: 'W', strict: true, weight: 80 };
  }

  // Strong preference based on difference
  if (colorDiff > 0) {
    return { color: 'B', strict: false, weight: 40 + colorDiff * 10 };
  }
  if (colorDiff < 0) {
    return { color: 'W', strict: false, weight: 40 + Math.abs(colorDiff) * 10 };
  }

  // Alternate from last round
  if (len > 0) {
    const lastColor = history[len - 1];
    return { color: lastColor === 'W' ? 'B' : 'W', strict: false, weight: 20 };
  }

  // Default neutral
  return { color: null, strict: false, weight: 0 };
}

/**
 * Assigns colors (White, Black) for a valid pair of players (p1, p2)
 */
function assignColors(p1, p2) {
  const pref1 = getColorPreference(p1);
  const pref2 = getColorPreference(p2);

  // Strict requirements take absolute precedence
  if (pref1.strict && pref1.color === 'W') return { white: p1, black: p2 };
  if (pref1.strict && pref1.color === 'B') return { white: p2, black: p1 };
  if (pref2.strict && pref2.color === 'W') return { white: p2, black: p1 };
  if (pref2.strict && pref2.color === 'B') return { white: p1, black: p2 };

  // Weight comparison
  const p1WantsWhite = pref1.color === 'W' ? pref1.weight : -pref1.weight;
  const p2WantsWhite = pref2.color === 'W' ? pref2.weight : -pref2.weight;

  if (p1WantsWhite > p2WantsWhite) {
    return { white: p1, black: p2 };
  } else if (p2WantsWhite > p1WantsWhite) {
    return { white: p2, black: p1 };
  }

  // If equal, higher seeded player alternates or gets White if odd round
  if (p1.startingSeed < p2.startingSeed) {
    const last = (p1.colorHistory && p1.colorHistory.length > 0) 
      ? p1.colorHistory[p1.colorHistory.length - 1] 
      : null;
    if (last === 'W') return { white: p2, black: p1 };
    return { white: p1, black: p2 };
  } else {
    const last = (p2.colorHistory && p2.colorHistory.length > 0) 
      ? p2.colorHistory[p2.colorHistory.length - 1] 
      : null;
    if (last === 'W') return { white: p1, black: p2 };
    return { white: p2, black: p1 };
  }
}

/**
 * Finds a valid matching for a list of players using backtracking
 */
function matchPlayers(players) {
  if (players.length === 0) return [];
  if (players.length % 2 !== 0) return null;

  const n = players.length;
  const visited = new Array(n).fill(false);
  const pairs = [];

  function backtrack(startIndex) {
    let first = -1;
    for (let i = startIndex; i < n; i++) {
      if (!visited[i]) {
        first = i;
        break;
      }
    }

    if (first === -1) return true; // All paired successfully

    visited[first] = true;
    const p1 = players[first];

    // Try pairing with other unvisited players
    for (let j = first + 1; j < n; j++) {
      if (!visited[j]) {
        const p2 = players[j];
        if (canPlay(p1, p2)) {
          visited[j] = true;
          pairs.push([p1, p2]);

          if (backtrack(first + 1)) {
            return true;
          }

          // Backtrack
          pairs.pop();
          visited[j] = false;
        }
      }
    }

    visited[first] = false;
    return false;
  }

  if (backtrack(0)) {
    return pairs;
  }
  return null;
}

/**
 * Generate Round 1 pairings using classic top-half vs bottom-half seeding
 */
function generateRound1Pairings(players) {
  // Sort players by rating DESC, then startingSeed ASC
  const sorted = [...players].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.startingSeed - b.startingSeed;
  });

  const pairings = [];
  let byeMatch = null;

  // Handle odd number of players
  let pool = [...sorted];
  if (pool.length % 2 !== 0) {
    // Lowest rated player receives the Round 1 bye
    const byePlayer = pool.pop();
    byeMatch = {
      boardNumber: 0,
      whitePlayerId: byePlayer.playerId,
      blackPlayerId: null,
      whiteScore: 1.0,
      blackScore: 0.0,
      result: "1-0 (BYE)",
      isBye: true,
      status: "COMPLETED"
    };
  }

  const half = pool.length / 2;
  const topHalf = pool.slice(0, half);
  const bottomHalf = pool.slice(half);

  let currentBoard = 1;
  for (let i = 0; i < half; i++) {
    const p1 = topHalf[i];
    const p2 = bottomHalf[i];

    // Alternate board 1 White, board 2 Black, etc.
    const isOddBoard = currentBoard % 2 === 1;
    const whitePlayer = isOddBoard ? p1 : p2;
    const blackPlayer = isOddBoard ? p2 : p1;

    pairings.push({
      boardNumber: currentBoard++,
      whitePlayerId: whitePlayer.playerId,
      blackPlayerId: blackPlayer.playerId,
      whitePlayer,
      blackPlayer,
      result: null,
      isBye: false,
      status: "PENDING"
    });
  }

  if (byeMatch) {
    byeMatch.boardNumber = currentBoard;
    pairings.push(byeMatch);
  }

  return pairings;
}

/**
 * Generate Swiss Pairings for Round > 1
 * @param {Array<Object>} players With playerId, score, rating, startingSeed, colorHistory, colorDifference, previousOpponentIds, hasReceivedBye
 * @param {number} roundNumber 
 */
function generateSwissPairings(players, roundNumber) {
  if (roundNumber === 1) {
    return generateRound1Pairings(players);
  }

  // Pre-sort all players by score DESC, then rating DESC, then startingSeed ASC
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.startingSeed - b.startingSeed;
  });

  let pool = [...sortedPlayers];
  let byeMatch = null;

  // Handle odd number of players: Assign bye to lowest ranked eligible player
  if (pool.length % 2 !== 0) {
    // Search from bottom up for someone who hasn't had a bye
    let byeIndex = -1;
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!pool[i].hasReceivedBye) {
        byeIndex = i;
        break;
      }
    }

    // Fallback if everyone had a bye
    if (byeIndex === -1) byeIndex = pool.length - 1;

    const [byePlayer] = pool.splice(byeIndex, 1);
    byeMatch = {
      boardNumber: 0,
      whitePlayerId: byePlayer.playerId,
      blackPlayerId: null,
      whitePlayer: byePlayer,
      blackPlayer: null,
      whiteScore: 1.0,
      blackScore: 0.0,
      result: "1-0 (BYE)",
      isBye: true,
      status: "COMPLETED"
    };
  }

  // Group by distinct scores
  const scoreMap = new Map();
  for (const player of pool) {
    const s = player.score;
    if (!scoreMap.has(s)) scoreMap.set(s, []);
    scoreMap.get(s).push(player);
  }

  const distinctScores = Array.from(scoreMap.keys()).sort((a, b) => b - a);
  const matchedPairs = [];
  let downfloaters = [];

  for (let i = 0; i < distinctScores.length; i++) {
    const score = distinctScores[i];
    const groupPlayers = [...downfloaters, ...(scoreMap.get(score) || [])];
    downfloaters = [];

    // If odd number, downfloat lowest seed player to next bracket
    if (groupPlayers.length % 2 !== 0 && i < distinctScores.length - 1) {
      downfloaters.push(groupPlayers.pop());
    }

    // Try matching this bracket
    let bracketPairs = matchPlayers(groupPlayers);

    // If failed, try downfloating one more pair or player to next bracket
    if (!bracketPairs && groupPlayers.length >= 2 && i < distinctScores.length - 1) {
      downfloaters.push(groupPlayers.pop());
      downfloaters.push(groupPlayers.pop());
      bracketPairs = matchPlayers(groupPlayers);
    }

    if (bracketPairs) {
      matchedPairs.push(...bracketPairs);
    } else {
      // If still could not match or at last group, downfloat all to next or solve globally
      downfloaters.push(...groupPlayers);
    }
  }

  // If any remaining downfloaters, match them together
  if (downfloaters.length > 0) {
    const finalPairs = matchPlayers(downfloaters);
    if (finalPairs) {
      matchedPairs.push(...finalPairs);
    } else {
      // Relaxed fallback: pair by sequential index to avoid stalling tournament
      for (let i = 0; i < downfloaters.length - 1; i += 2) {
        matchedPairs.push([downfloaters[i], downfloaters[i + 1]]);
      }
    }
  }

  // Format matches and assign colors
  let currentBoard = 1;
  const matches = [];

  for (const [p1, p2] of matchedPairs) {
    const { white, black } = assignColors(p1, p2);
    matches.push({
      boardNumber: currentBoard++,
      whitePlayerId: white.playerId,
      blackPlayerId: black.playerId,
      whitePlayer: white,
      blackPlayer: black,
      result: null,
      isBye: false,
      status: "PENDING"
    });
  }

  if (byeMatch) {
    byeMatch.boardNumber = currentBoard;
    matches.push(byeMatch);
  }

  return matches;
}

module.exports = {
  generateSwissPairings,
  generateRound1Pairings,
  canPlay,
  assignColors,
  getColorPreference
};

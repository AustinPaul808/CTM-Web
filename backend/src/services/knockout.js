/**
 * Single Elimination Knockout Tournament Engine
 * Generates seeded brackets and advances winners to subsequent rounds.
 */

/**
 * Standard bracket seeding generator for power of 2
 */
function getStandardBracketOrder(numPlayers) {
  let rounds = Math.log2(numPlayers);
  let order = [1, 2];

  for (let r = 1; r < rounds; r++) {
    const nextOrder = [];
    const sum = Math.pow(2, r + 1) + 1;
    for (const seed of order) {
      nextOrder.push(seed);
      nextOrder.push(sum - seed);
    }
    order = nextOrder;
  }
  return order;
}

/**
 * Generate Round 1 pairings for Knockout tournament
 */
function generateKnockoutRound1(players) {
  // Sort players by rating / seed
  const sorted = [...players].sort((a, b) => a.startingSeed - b.startingSeed);
  const n = sorted.length;

  // Determine nearest power of 2 (at least 2)
  const power = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const bracketSeeds = getStandardBracketOrder(power);

  const playerBySeed = new Map();
  sorted.forEach((p, idx) => playerBySeed.set(idx + 1, p));

  const matches = [];
  let boardNumber = 1;

  for (let i = 0; i < bracketSeeds.length; i += 2) {
    const seed1 = bracketSeeds[i];
    const seed2 = bracketSeeds[i + 1];

    const p1 = playerBySeed.get(seed1);
    const p2 = playerBySeed.get(seed2);

    if (p1 && p2) {
      matches.push({
        boardNumber: boardNumber++,
        bracketNode: `R1_M${matches.length + 1}`,
        whitePlayerId: p1.playerId,
        blackPlayerId: p2.playerId,
        whitePlayer: p1,
        blackPlayer: p2,
        result: null,
        isBye: false,
        status: "PENDING"
      });
    } else if (p1 && !p2) {
      // Automatic Bye advance for seed 1
      matches.push({
        boardNumber: boardNumber++,
        bracketNode: `R1_M${matches.length + 1}`,
        whitePlayerId: p1.playerId,
        blackPlayerId: null,
        whitePlayer: p1,
        blackPlayer: null,
        whiteScore: 1.0,
        blackScore: 0.0,
        result: "1-0 (BYE)",
        isBye: true,
        status: "COMPLETED"
      });
    } else if (!p1 && p2) {
      matches.push({
        boardNumber: boardNumber++,
        bracketNode: `R1_M${matches.length + 1}`,
        whitePlayerId: p2.playerId,
        blackPlayerId: null,
        whitePlayer: p2,
        blackPlayer: null,
        whiteScore: 1.0,
        blackScore: 0.0,
        result: "1-0 (BYE)",
        isBye: true,
        status: "COMPLETED"
      });
    }
  }

  return matches;
}

/**
 * Generate Next Round pairings for Knockout based on previous round's winners
 */
function generateKnockoutNextRound(prevRoundMatches, nextRoundNumber, totalRounds) {
  // Ensure all previous matches are completed
  const uncompleted = prevRoundMatches.filter(m => m.status !== 'COMPLETED' || !m.result);
  if (uncompleted.length > 0) {
    throw new Error(`Cannot advance knockout round: ${uncompleted.length} match(es) in the previous round have no winner.`);
  }

  // Determine winners of each match
  const winners = [];
  for (const m of prevRoundMatches) {
    if (m.isBye) {
      winners.push(m.whitePlayerId || m.blackPlayerId);
      continue;
    }

    if (m.result === '1-0' || m.result === '1-0 (FORFEIT)') {
      winners.push(m.whitePlayerId);
    } else if (m.result === '0-1' || m.result === '0-1 (FORFEIT)') {
      winners.push(m.blackPlayerId);
    } else {
      throw new Error(`Match on Board ${m.boardNumber} ended in a draw (½-½). Knockout tournaments require an armageddon / playoff winner!`);
    }
  }

  // Pair consecutive winners
  const matches = [];
  let boardNum = 1;

  for (let i = 0; i < winners.length; i += 2) {
    const w1 = winners[i];
    const w2 = winners[i + 1];

    let nodeName = `R${nextRoundNumber}_M${matches.length + 1}`;
    if (winners.length === 2) {
      nodeName = "FINAL";
    } else if (winners.length === 4) {
      nodeName = `SF_${matches.length + 1}`;
    }

    matches.push({
      boardNumber: boardNum++,
      bracketNode: nodeName,
      whitePlayerId: w1,
      blackPlayerId: w2,
      result: null,
      isBye: false,
      status: "PENDING"
    });
  }

  return matches;
}

module.exports = {
  generateKnockoutRound1,
  generateKnockoutNextRound
};

/**
 * Chess Tournament Tiebreak Calculations
 * Implements Direct Encounter, Buchholz, Buchholz Cut-1, and Sonneborn-Berger
 */

/**
 * Calculate Buchholz and Buchholz Cut-1
 * @param {Array<{ opponentId: string, isBye: boolean }>} playerMatches 
 * @param {Map<string, number>} playerScoresMap Map of playerId -> total score
 */
function calculateBuchholz(playerMatches, playerScoresMap) {
  const opponentScores = [];

  for (const m of playerMatches) {
    if (!m.isBye && m.opponentId && playerScoresMap.has(m.opponentId)) {
      opponentScores.push(playerScoresMap.get(m.opponentId));
    }
  }

  if (opponentScores.length === 0) {
    return { buchholz: 0, buchholzCut1: 0 };
  }

  const totalBuchholz = opponentScores.reduce((sum, score) => sum + score, 0);

  // Buchholz Cut-1 removes the lowest score
  const lowestScore = Math.min(...opponentScores);
  const buchholzCut1 = opponentScores.length > 1 ? (totalBuchholz - lowestScore) : totalBuchholz;

  return {
    buchholz: Number(totalBuchholz.toFixed(2)),
    buchholzCut1: Number(buchholzCut1.toFixed(2))
  };
}

/**
 * Calculate Sonneborn-Berger
 * SB = Sum of scores of opponents beaten + 0.5 * Sum of scores of opponents drawn
 * @param {Array<{ opponentId: string, resultScore: number, isBye: boolean }>} playerMatches 
 * @param {Map<string, number>} playerScoresMap 
 */
function calculateSonnebornBerger(playerMatches, playerScoresMap) {
  let sb = 0;

  for (const m of playerMatches) {
    if (!m.isBye && m.opponentId && playerScoresMap.has(m.opponentId)) {
      const oppScore = playerScoresMap.get(m.opponentId);
      if (m.resultScore === 1.0) {
        sb += oppScore;
      } else if (m.resultScore === 0.5) {
        sb += 0.5 * oppScore;
      }
    }
  }

  return Number(sb.toFixed(2));
}

/**
 * Evaluate Direct Encounter among a group of tied players
 * Returns a score map for the sub-mini tournament among tied players, or null if not all have played each other.
 * @param {Array<string>} tiedPlayerIds 
 * @param {Array<{ whitePlayerId: string, blackPlayerId: string, whiteScore: number, blackScore: number }>} allMatches 
 */
function evaluateDirectEncounter(tiedPlayerIds, allMatches) {
  if (tiedPlayerIds.length <= 1) return null;

  const idSet = new Set(tiedPlayerIds);
  const headToHeadMatches = allMatches.filter(
    m => idSet.has(m.whitePlayerId) && idSet.has(m.blackPlayerId)
  );

  // Count encounters between distinct pairs
  const pairEncounters = new Set();
  const directScores = new Map();
  tiedPlayerIds.forEach(id => directScores.set(id, 0));

  for (const m of headToHeadMatches) {
    const pairKey = [m.whitePlayerId, m.blackPlayerId].sort().join(':');
    pairEncounters.add(pairKey);
    directScores.set(m.whitePlayerId, (directScores.get(m.whitePlayerId) || 0) + (m.whiteScore || 0));
    directScores.set(m.blackPlayerId, (directScores.get(m.blackPlayerId) || 0) + (m.blackScore || 0));
  }

  // Necessary pairs for complete round robin: N * (N - 1) / 2
  const neededPairs = (tiedPlayerIds.length * (tiedPlayerIds.length - 1)) / 2;
  if (pairEncounters.size === neededPairs) {
    return directScores;
  }

  // If only 2 tied players and they played each other:
  if (tiedPlayerIds.length === 2 && pairEncounters.size === 1) {
    return directScores;
  }

  return null;
}

module.exports = {
  calculateBuchholz,
  calculateSonnebornBerger,
  evaluateDirectEncounter
};

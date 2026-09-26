/**
 * Continuous Arena Pairing Engine
 * Pairs active/available players continuously based on current scores and minimal cooldown.
 */

function generateArenaPairings(availablePlayers, recentOpponentMap = new Map()) {
  // Sort players by current score descending
  const sorted = [...availablePlayers].sort((a, b) => b.score - a.score);
  const matched = [];
  const used = new Set();

  for (let i = 0; i < sorted.length; i++) {
    const p1 = sorted[i];
    if (used.has(p1.playerId)) continue;

    let bestOpponent = null;
    let bestScoreDiff = Infinity;

    // Search for closest available opponent who is not recently played
    for (let j = i + 1; j < sorted.length; j++) {
      const p2 = sorted[j];
      if (used.has(p2.playerId)) continue;

      const recentOpponents = recentOpponentMap.get(p1.playerId) || [];
      const isRecent = recentOpponents.includes(p2.playerId);

      const scoreDiff = Math.abs(p1.score - p2.score);

      // Prioritize non-recent opponents
      const effectiveDiff = isRecent ? scoreDiff + 100 : scoreDiff;

      if (effectiveDiff < bestScoreDiff) {
        bestScoreDiff = effectiveDiff;
        bestOpponent = p2;
      }
    }

    if (bestOpponent) {
      used.add(p1.playerId);
      used.add(bestOpponent.playerId);

      // Alternate color based on last color
      const p1LastColor = p1.lastColor || 'B';
      const white = p1LastColor === 'B' ? p1 : bestOpponent;
      const black = p1LastColor === 'B' ? bestOpponent : p1;

      matched.push({
        whitePlayerId: white.playerId,
        blackPlayerId: black.playerId,
        whitePlayer: white,
        blackPlayer: black,
        result: null,
        isBye: false,
        status: "PENDING"
      });
    }
  }

  return matched;
}

module.exports = {
  generateArenaPairings
};

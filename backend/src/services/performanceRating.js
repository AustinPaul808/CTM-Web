/**
 * Performance Rating Calculation according to FIDE rules
 * Rp = Ra + dp
 * Where Ra is the average rating of opponents, and dp is rating difference from score percentage.
 */

// FIDE Table 8.1a conversion table (score percentage to dp)
const FIDE_DP_TABLE = [
  { p: 1.00, dp: 800 },
  { p: 0.99, dp: 677 },
  { p: 0.98, dp: 589 },
  { p: 0.97, dp: 538 },
  { p: 0.96, dp: 501 },
  { p: 0.95, dp: 470 },
  { p: 0.94, dp: 444 },
  { p: 0.93, dp: 422 },
  { p: 0.92, dp: 401 },
  { p: 0.91, dp: 383 },
  { p: 0.90, dp: 366 },
  { p: 0.85, dp: 301 },
  { p: 0.80, dp: 251 },
  { p: 0.75, dp: 193 },
  { p: 0.70, dp: 149 },
  { p: 0.65, dp: 110 },
  { p: 0.60, dp: 72 },
  { p: 0.55, dp: 36 },
  { p: 0.50, dp: 0 },
  { p: 0.45, dp: -36 },
  { p: 0.40, dp: -72 },
  { p: 0.35, dp: -110 },
  { p: 0.30, dp: -149 },
  { p: 0.25, dp: -193 },
  { p: 0.20, dp: -251 },
  { p: 0.15, dp: -301 },
  { p: 0.10, dp: -366 },
  { p: 0.05, dp: -470 },
  { p: 0.01, dp: -677 },
  { p: 0.00, dp: -800 },
];

function getDp(percentage) {
  if (percentage >= 1.0) return 800;
  if (percentage <= 0.0) return -800;

  // Find closest or interpolate in table
  for (let i = 0; i < FIDE_DP_TABLE.length - 1; i++) {
    const curr = FIDE_DP_TABLE[i];
    const next = FIDE_DP_TABLE[i + 1];
    if (percentage <= curr.p && percentage >= next.p) {
      const range = curr.p - next.p;
      if (range === 0) return curr.dp;
      const weight = (percentage - next.p) / range;
      return Math.round(next.dp + weight * (curr.dp - next.dp));
    }
  }

  // Logistic fallback formula: 400 * log10(p / (1 - p))
  const dp = 400 * Math.log10(percentage / (1 - percentage));
  return Math.round(Math.max(-800, Math.min(800, dp)));
}

/**
 * Calculates Performance Rating for a player
 * @param {Array<{ opponentRating: number, score: number, isBye?: boolean }>} games 
 * @param {number} playerDefaultRating 
 * @returns {number}
 */
function calculatePerformanceRating(games, playerDefaultRating = 1500) {
  // Exclude unplayed byes or non-rated forfeits from performance rating
  const ratedGames = games.filter(g => !g.isBye && typeof g.opponentRating === 'number');

  if (ratedGames.length === 0) {
    return playerDefaultRating;
  }

  const totalOpponentRating = ratedGames.reduce((acc, g) => acc + g.opponentRating, 0);
  const averageOpponentRating = totalOpponentRating / ratedGames.length;
  const totalScore = ratedGames.reduce((acc, g) => acc + g.score, 0);
  const percentage = totalScore / ratedGames.length;

  const dp = getDp(percentage);
  return Math.round(averageOpponentRating + dp);
}

module.exports = {
  calculatePerformanceRating,
  getDp
};

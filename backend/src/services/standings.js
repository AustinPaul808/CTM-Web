/**
 * Tournament Standings Calculation Service
 * Computes scores, tiebreaks (Buchholz, Buchholz Cut-1, Sonneborn-Berger),
 * and FIDE Performance Ratings.
 */

const { calculateBuchholz, calculateSonnebornBerger, evaluateDirectEncounter } = require('./tiebreaks');
const { calculatePerformanceRating } = require('./performanceRating');

/**
 * Calculates current standings for a tournament
 * @param {Array<Object>} tournamentPlayers Array of tournament player records with player info
 * @param {Array<Object>} matches All matches recorded in the tournament
 */
function calculateTournamentStandings(tournamentPlayers, matches) {
  const playerStatsMap = new Map();
  const playerScoresMap = new Map();

  // Initialize stats for each player
  for (const tp of tournamentPlayers) {
    const stats = {
      tournamentPlayerId: tp.id,
      playerId: tp.playerId,
      name: tp.player ? tp.player.name : tp.name,
      rating: tp.player ? tp.player.rating : (tp.rating || 1500),
      fideId: tp.player ? tp.player.fideId : tp.fideId,
      federation: tp.player ? tp.player.federation : (tp.federation || 'FIDE'),
      club: tp.player ? tp.player.club : tp.club,
      title: tp.player ? tp.player.title : tp.title,
      startingSeed: tp.startingSeed || 1,
      score: 0.0,
      wins: 0,
      draws: 0,
      losses: 0,
      matches: [],
      hasReceivedBye: tp.hasReceivedBye || false
    };
    playerStatsMap.set(tp.playerId, stats);
    playerScoresMap.set(tp.playerId, 0.0);
  }

  // Iterate over completed matches to accumulate scores
  for (const match of matches) {
    if (match.status !== 'COMPLETED' && !match.result) continue;

    const { whitePlayerId, blackPlayerId, isBye, result, whiteScore, blackScore } = match;

    if (isBye && whitePlayerId && playerStatsMap.has(whitePlayerId)) {
      const stats = playerStatsMap.get(whitePlayerId);
      const scoreGain = typeof whiteScore === 'number' ? whiteScore : 1.0;
      stats.score += scoreGain;
      stats.wins += 1;
      stats.hasReceivedBye = true;
      stats.matches.push({
        opponentId: null,
        opponentRating: null,
        color: 'W',
        resultScore: scoreGain,
        isBye: true
      });
      playerScoresMap.set(whitePlayerId, stats.score);
      continue;
    }

    if (whitePlayerId && blackPlayerId) {
      const whiteStats = playerStatsMap.get(whitePlayerId);
      const blackStats = playerStatsMap.get(blackPlayerId);

      let wScore = whiteScore;
      let bScore = blackScore;

      // Determine score from result string if not provided
      if (typeof wScore !== 'number') {
        if (result === '1-0' || result === '1-0 (FORFEIT)') {
          wScore = 1.0;
          bScore = 0.0;
        } else if (result === '0-1' || result === '0-1 (FORFEIT)') {
          wScore = 0.0;
          bScore = 1.0;
        } else if (result === '1/2-1/2' || result === '½-½') {
          wScore = 0.5;
          bScore = 0.5;
        } else {
          wScore = 0;
          bScore = 0;
        }
      }

      if (whiteStats) {
        whiteStats.score += wScore;
        if (wScore === 1.0) whiteStats.wins += 1;
        else if (wScore === 0.5) whiteStats.draws += 1;
        else whiteStats.losses += 1;

        whiteStats.matches.push({
          opponentId: blackPlayerId,
          opponentRating: blackStats ? blackStats.rating : 1500,
          color: 'W',
          resultScore: wScore,
          isBye: false
        });
        playerScoresMap.set(whitePlayerId, whiteStats.score);
      }

      if (blackStats) {
        blackStats.score += bScore;
        if (bScore === 1.0) blackStats.wins += 1;
        else if (bScore === 0.5) blackStats.draws += 1;
        else blackStats.losses += 1;

        blackStats.matches.push({
          opponentId: whitePlayerId,
          opponentRating: whiteStats ? whiteStats.rating : 1500,
          color: 'B',
          resultScore: bScore,
          isBye: false
        });
        playerScoresMap.set(blackPlayerId, blackStats.score);
      }
    }
  }

  // Calculate Tiebreaks and Performance Ratings for each player
  const standings = Array.from(playerStatsMap.values()).map(stats => {
    const { buchholz, buchholzCut1 } = calculateBuchholz(stats.matches, playerScoresMap);
    const sonnebornBerger = calculateSonnebornBerger(stats.matches, playerScoresMap);
    const performanceRating = calculatePerformanceRating(
      stats.matches.map(m => ({
        opponentRating: m.opponentRating,
        score: m.resultScore,
        isBye: m.isBye
      })),
      stats.rating
    );

    return {
      ...stats,
      score: Number(stats.score.toFixed(1)),
      buchholz,
      buchholzCut1,
      sonnebornBerger,
      performanceRating
    };
  });

  // Group by score to evaluate Direct Encounter where applicable
  const scoreGroups = new Map();
  for (const s of standings) {
    if (!scoreGroups.has(s.score)) scoreGroups.set(s.score, []);
    scoreGroups.get(s.score).push(s);
  }

  // Multi-tier Sorting
  standings.sort((a, b) => {
    // 1. Primary: Total Score DESC
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // 2. Direct Encounter if group of tied players have played
    const tiedGroup = scoreGroups.get(a.score);
    if (tiedGroup && tiedGroup.length > 1) {
      const deScores = evaluateDirectEncounter(tiedGroup.map(p => p.playerId), matches);
      if (deScores) {
        const deA = deScores.get(a.playerId) || 0;
        const deB = deScores.get(b.playerId) || 0;
        if (deB !== deA) return deB - deA;
      }
    }

    // 3. Buchholz Cut-1 DESC
    if (b.buchholzCut1 !== a.buchholzCut1) {
      return b.buchholzCut1 - a.buchholzCut1;
    }

    // 4. Buchholz System DESC
    if (b.buchholz !== a.buchholz) {
      return b.buchholz - a.buchholz;
    }

    // 5. Sonneborn-Berger DESC
    if (b.sonnebornBerger !== a.sonnebornBerger) {
      return b.sonnebornBerger - a.sonnebornBerger;
    }

    // 6. Number of Wins DESC
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }

    // 7. Initial Rating DESC
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }

    // 8. Starting Seed ASC
    return a.startingSeed - b.startingSeed;
  });

  // Assign ranks
  standings.forEach((player, idx) => {
    player.rank = idx + 1;
  });

  return standings;
}

module.exports = {
  calculateTournamentStandings
};

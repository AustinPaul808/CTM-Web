/**
 * Round Robin Tournament Pairing Engine
 * Uses the Berger Tables (Circle Method) to generate all rounds or round-by-round pairings.
 */

/**
 * Generate full round-robin schedule for a roster of players
 * @param {Array<Object>} players 
 * @returns {Array<Array<Object>>} Array of rounds, each containing board pairings
 */
function generateAllRoundRobinRounds(players) {
  const sorted = [...players].sort((a, b) => a.startingSeed - b.startingSeed);
  const n = sorted.length;
  const isOdd = n % 2 !== 0;

  // If odd, add a dummy BYE player
  const playerList = [...sorted];
  if (isOdd) {
    playerList.push({
      playerId: null,
      name: "BYE",
      rating: 0,
      isBye: true
    });
  }

  const totalPlayers = playerList.length;
  const totalRounds = totalPlayers - 1;
  const matchesPerRound = totalPlayers / 2;

  // We rotate players 1 through totalPlayers - 1 while keeping player 0 fixed
  const roundSchedules = [];

  // Indices representation
  let indices = playerList.map((_, i) => i);

  for (let round = 1; round <= totalRounds; round++) {
    const roundPairings = [];
    let boardNum = 1;

    for (let i = 0; i < matchesPerRound; i++) {
      const idx1 = indices[i];
      const idx2 = indices[totalPlayers - 1 - i];

      const p1 = playerList[idx1];
      const p2 = playerList[idx2];

      // Handle byes
      if (p1.isBye || p2.isBye) {
        const activePlayer = p1.isBye ? p2 : p1;
        roundPairings.push({
          boardNumber: matchesPerRound, // place bye on last board
          whitePlayerId: activePlayer.playerId,
          blackPlayerId: null,
          whitePlayer: activePlayer,
          blackPlayer: null,
          whiteScore: 1.0,
          blackScore: 0.0,
          result: "1-0 (BYE)",
          isBye: true,
          status: "COMPLETED"
        });
      } else {
        // Alternate colors based on round and board
        const shouldInvert = (round % 2 === 1 && i === 0) || (i > 0 && (i + round) % 2 === 1);
        const white = shouldInvert ? p2 : p1;
        const black = shouldInvert ? p1 : p2;

        roundPairings.push({
          boardNumber: boardNum++,
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

    // Sort boards so numerical boards come first and bye is last
    roundPairings.sort((a, b) => {
      if (a.isBye) return 1;
      if (b.isBye) return -1;
      return a.boardNumber - b.boardNumber;
    });

    // Re-index boards
    roundPairings.forEach((m, idx) => {
      m.boardNumber = idx + 1;
    });

    roundSchedules.push(roundPairings);

    // Rotate indices: keep index 0 fixed, shift others circularly
    const fixed = indices[0];
    const rest = indices.slice(1);
    const last = rest.pop();
    rest.unshift(last);
    indices = [fixed, ...rest];
  }

  return roundSchedules;
}

/**
 * Get pairings for a specific round of Round Robin
 */
function generateRoundRobinPairings(players, roundNumber) {
  const allRounds = generateAllRoundRobinRounds(players);
  if (roundNumber < 1 || roundNumber > allRounds.length) {
    throw new Error(`Invalid round number ${roundNumber}. Round Robin has ${allRounds.length} rounds.`);
  }
  return allRounds[roundNumber - 1];
}

module.exports = {
  generateAllRoundRobinRounds,
  generateRoundRobinPairings
};

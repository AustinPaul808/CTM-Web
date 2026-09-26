const test = require('node:test');
const assert = require('node:assert');

const { generateRound1Pairings, generateSwissPairings, canPlay, assignColors } = require('../src/services/swissPairing');
const { generateAllRoundRobinRounds } = require('../src/services/roundRobin');
const { calculateBuchholz, calculateSonnebornBerger } = require('../src/services/tiebreaks');
const { calculatePerformanceRating } = require('../src/services/performanceRating');
const { calculateTournamentStandings } = require('../src/services/standings');

test('Swiss Pairing - Round 1 top vs bottom half pairing', () => {
  const players = [
    { playerId: 'p1', startingSeed: 1, rating: 2800, score: 0 },
    { playerId: 'p2', startingSeed: 2, rating: 2750, score: 0 },
    { playerId: 'p3', startingSeed: 3, rating: 2700, score: 0 },
    { playerId: 'p4', startingSeed: 4, rating: 2650, score: 0 },
  ];

  const pairings = generateRound1Pairings(players);
  assert.strictEqual(pairings.length, 2);

  // Board 1: p1 vs p3, Board 2: p2 vs p4 (or vice versa with colors)
  const board1 = pairings[0];
  const board2 = pairings[1];

  const pair1 = [board1.whitePlayerId, board1.blackPlayerId].sort();
  const pair2 = [board2.whitePlayerId, board2.blackPlayerId].sort();

  assert.deepStrictEqual(pair1, ['p1', 'p3']);
  assert.deepStrictEqual(pair2, ['p2', 'p4']);
});

test('Swiss Pairing - Round 1 Odd Players Bye assignment', () => {
  const players = [
    { playerId: 'p1', startingSeed: 1, rating: 2800, score: 0 },
    { playerId: 'p2', startingSeed: 2, rating: 2700, score: 0 },
    { playerId: 'p3', startingSeed: 3, rating: 2600, score: 0 },
  ];

  const pairings = generateRound1Pairings(players);
  assert.strictEqual(pairings.length, 2);

  const byeBoard = pairings.find(p => p.isBye);
  assert.ok(byeBoard);
  assert.strictEqual(byeBoard.whitePlayerId, 'p3'); // lowest rated gets bye
  assert.strictEqual(byeBoard.result, '1-0 (BYE)');
});

test('Swiss Pairing - No repeat encounters in Round 2', () => {
  const players = [
    {
      playerId: 'p1',
      startingSeed: 1,
      rating: 2800,
      score: 1.0,
      colorHistory: ['W'],
      colorDifference: 1,
      previousOpponentIds: new Set(['p3']),
      hasReceivedBye: false
    },
    {
      playerId: 'p2',
      startingSeed: 2,
      rating: 2750,
      score: 1.0,
      colorHistory: ['B'],
      colorDifference: -1,
      previousOpponentIds: new Set(['p4']),
      hasReceivedBye: false
    },
    {
      playerId: 'p3',
      startingSeed: 3,
      rating: 2700,
      score: 0.0,
      colorHistory: ['B'],
      colorDifference: -1,
      previousOpponentIds: new Set(['p1']),
      hasReceivedBye: false
    },
    {
      playerId: 'p4',
      startingSeed: 4,
      rating: 2650,
      score: 0.0,
      colorHistory: ['W'],
      colorDifference: 1,
      previousOpponentIds: new Set(['p2']),
      hasReceivedBye: false
    }
  ];

  const pairings = generateSwissPairings(players, 2);
  assert.strictEqual(pairings.length, 2);

  // Winners should play winners: p1 vs p2
  const topBoard = pairings[0];
  const topPair = [topBoard.whitePlayerId, topBoard.blackPlayerId].sort();
  assert.deepStrictEqual(topPair, ['p1', 'p2']);

  // p2 had Black in R1, p1 had White in R1 -> p2 should be White, p1 Black
  assert.strictEqual(topBoard.whitePlayerId, 'p2');
  assert.strictEqual(topBoard.blackPlayerId, 'p1');
});

test('Round Robin - Berger circle schedule coverage', () => {
  const players = [
    { playerId: 'p1', startingSeed: 1 },
    { playerId: 'p2', startingSeed: 2 },
    { playerId: 'p3', startingSeed: 3 },
    { playerId: 'p4', startingSeed: 4 },
  ];

  const rounds = generateAllRoundRobinRounds(players);
  assert.strictEqual(rounds.length, 3); // 4 players = 3 rounds

  // Collect all pairs
  const encountered = new Set();
  for (const r of rounds) {
    for (const m of r) {
      const pair = [m.whitePlayerId, m.blackPlayerId].sort().join(':');
      encountered.add(pair);
    }
  }

  // Total unique matchups: 4 * 3 / 2 = 6
  assert.strictEqual(encountered.size, 6);
  assert.ok(encountered.has('p1:p2'));
  assert.ok(encountered.has('p1:p3'));
  assert.ok(encountered.has('p1:p4'));
  assert.ok(encountered.has('p2:p3'));
  assert.ok(encountered.has('p2:p4'));
  assert.ok(encountered.has('p3:p4'));
});

test('Tiebreaks - Buchholz and Sonneborn-Berger', () => {
  const playerScoresMap = new Map([
    ['pA', 3.0],
    ['pB', 2.0],
    ['pC', 1.0],
    ['pD', 0.0]
  ]);

  const matchesForPlayer = [
    { opponentId: 'pA', resultScore: 0.0, isBye: false }, // loss vs 3.0
    { opponentId: 'pB', resultScore: 1.0, isBye: false }, // win vs 2.0
    { opponentId: 'pC', resultScore: 0.5, isBye: false }, // draw vs 1.0
  ];

  const { buchholz, buchholzCut1 } = calculateBuchholz(matchesForPlayer, playerScoresMap);
  // Total Buchholz = 3.0 + 2.0 + 1.0 = 6.0
  assert.strictEqual(buchholz, 6.0);
  // Cut-1 excludes lowest (1.0) = 5.0
  assert.strictEqual(buchholzCut1, 5.0);

  const sb = calculateSonnebornBerger(matchesForPlayer, playerScoresMap);
  // SB = 1.0 * 2.0 (pB) + 0.5 * 1.0 (pC) = 2.5
  assert.strictEqual(sb, 2.5);
});

test('Performance Rating - Calculation based on FIDE dp', () => {
  // 3 wins out of 4 games (75%) against average rating 2000
  const games = [
    { opponentRating: 2000, score: 1.0 },
    { opponentRating: 2000, score: 1.0 },
    { opponentRating: 2000, score: 1.0 },
    { opponentRating: 2000, score: 0.0 },
  ];

  const perf = calculatePerformanceRating(games, 1500);
  // 75% score gives dp around +193 => 2000 + 193 = 2193
  assert.ok(perf >= 2185 && perf <= 2205);
});

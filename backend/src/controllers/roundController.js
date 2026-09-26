const prisma = require('../db/prisma');
const { generateSwissPairings } = require('../services/swissPairing');
const { generateRoundRobinPairings } = require('../services/roundRobin');
const { generateKnockoutNextRound } = require('../services/knockout');
const { calculateTournamentStandings } = require('../services/standings');

async function getRounds(req, res) {
  try {
    const { tournamentId } = req.params;
    const rounds = await prisma.round.findMany({
      where: { tournamentId },
      include: {
        matches: {
          orderBy: { boardNumber: 'asc' }
        }
      },
      orderBy: { roundNumber: 'asc' }
    });

    // Populate player names & ratings for each match
    const players = await prisma.player.findMany();
    const playerMap = new Map();
    players.forEach(p => playerMap.set(p.id, p));

    const enriched = rounds.map(r => ({
      ...r,
      matches: r.matches.map(m => ({
        ...m,
        whitePlayer: m.whitePlayerId ? playerMap.get(m.whitePlayerId) : null,
        blackPlayer: m.blackPlayerId ? playerMap.get(m.blackPlayerId) : null
      }))
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function generateNextRound(req, res) {
  try {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: { include: { player: true } },
        rounds: {
          include: { matches: true },
          orderBy: { roundNumber: 'asc' }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    if (tournament.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Tournament is not in active state.' });
    }

    const nextRoundNumber = tournament.rounds.length + 1;
    if (nextRoundNumber > tournament.numberOfRounds) {
      return res.status(400).json({ error: `Tournament has reached max rounds (${tournament.numberOfRounds}). Finalize the tournament instead.` });
    }

    // Verify all previous round matches are completed
    const currentRound = tournament.rounds[tournament.rounds.length - 1];
    if (currentRound) {
      const pendingMatches = currentRound.matches.filter(m => m.status !== 'COMPLETED' || !m.result);
      if (pendingMatches.length > 0) {
        return res.status(400).json({
          error: `Round ${currentRound.roundNumber} has ${pendingMatches.length} pending match(es). Please record all results before generating the next round.`
        });
      }

      // Mark previous round as completed
      await prisma.round.update({
        where: { id: currentRound.id },
        data: { status: 'COMPLETED' }
      });
    }

    // Gather all completed matches so far
    const allMatches = [];
    tournament.rounds.forEach(r => allMatches.push(...r.matches));

    // Calculate current scores and standings
    const currentStandings = calculateTournamentStandings(tournament.players, allMatches);
    const scoreMap = new Map();
    currentStandings.forEach(s => scoreMap.set(s.playerId, s.score));

    // Construct player history state for pairing engine
    const pairingPlayers = tournament.players.map(tp => {
      const pId = tp.playerId;
      const colorHistory = [];
      let whiteCount = 0;
      let blackCount = 0;
      const previousOpponentIds = new Set();
      let receivedBye = false;

      for (const r of tournament.rounds) {
        for (const m of r.matches) {
          if (m.whitePlayerId === pId) {
            colorHistory.push('W');
            whiteCount++;
            if (m.isBye) receivedBye = true;
            else if (m.blackPlayerId) previousOpponentIds.add(m.blackPlayerId);
          } else if (m.blackPlayerId === pId) {
            colorHistory.push('B');
            blackCount++;
            if (m.whitePlayerId) previousOpponentIds.add(m.whitePlayerId);
          }
        }
      }

      return {
        playerId: pId,
        name: tp.player.name,
        rating: tp.player.rating,
        startingSeed: tp.startingSeed,
        score: scoreMap.get(pId) || 0.0,
        colorHistory,
        colorDifference: whiteCount - blackCount,
        previousOpponentIds,
        hasReceivedBye: receivedBye
      };
    });

    let newMatches = [];

    if (tournament.type === 'ROUND_ROBIN') {
      newMatches = generateRoundRobinPairings(pairingPlayers, nextRoundNumber);
    } else if (tournament.type === 'KNOCKOUT') {
      newMatches = generateKnockoutNextRound(currentRound.matches, nextRoundNumber, tournament.numberOfRounds);
    } else {
      // SWISS
      newMatches = generateSwissPairings(pairingPlayers, nextRoundNumber);
    }

    // Create new Round
    const newRound = await prisma.round.create({
      data: {
        tournamentId,
        roundNumber: nextRoundNumber,
        status: 'ACTIVE'
      }
    });

    for (const m of newMatches) {
      await prisma.match.create({
        data: {
          roundId: newRound.id,
          boardNumber: m.boardNumber,
          whitePlayerId: m.whitePlayerId,
          blackPlayerId: m.blackPlayerId,
          whiteScore: m.whiteScore || null,
          blackScore: m.blackScore || null,
          result: m.result || null,
          isBye: m.isBye || false,
          bracketNode: m.bracketNode || null,
          status: m.isBye ? 'COMPLETED' : 'PENDING'
        }
      });
    }

    // Update tournament current round
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { currentRound: nextRoundNumber }
    });

    // Fetch and return the newly generated round
    const createdRound = await prisma.round.findUnique({
      where: { id: newRound.id },
      include: {
        matches: {
          orderBy: { boardNumber: 'asc' }
        }
      }
    });

    const allPlayers = await prisma.player.findMany();
    const playerLookup = new Map();
    allPlayers.forEach(p => playerLookup.set(p.id, p));

    const responseRound = {
      ...createdRound,
      matches: createdRound.matches.map(m => ({
        ...m,
        whitePlayer: m.whitePlayerId ? playerLookup.get(m.whitePlayerId) : null,
        blackPlayer: m.blackPlayerId ? playerLookup.get(m.blackPlayerId) : null
      }))
    };

    res.status(201).json(responseRound);
  } catch (err) {
    console.error('Error generating next round:', err);
    res.status(500).json({ error: err.message });
  }
}

async function updateMatchResult(req, res) {
  try {
    const { matchId } = req.params;
    const { result } = req.body;

    // Validate result
    const VALID_RESULTS = ['1-0', '0-1', '1/2-1/2', '1-0 (BYE)', '1-0 (FORFEIT)', '0-1 (FORFEIT)'];
    if (!VALID_RESULTS.includes(result)) {
      return res.status(400).json({
        error: `Invalid result '${result}'. Valid results: ${VALID_RESULTS.join(', ')}`
      });
    }

    let whiteScore = 0.0;
    let blackScore = 0.0;
    let isForfeit = false;

    if (result === '1-0') {
      whiteScore = 1.0;
      blackScore = 0.0;
    } else if (result === '0-1') {
      whiteScore = 0.0;
      blackScore = 1.0;
    } else if (result === '1/2-1/2') {
      whiteScore = 0.5;
      blackScore = 0.5;
    } else if (result === '1-0 (BYE)') {
      whiteScore = 1.0;
      blackScore = 0.0;
    } else if (result === '1-0 (FORFEIT)') {
      whiteScore = 1.0;
      blackScore = 0.0;
      isForfeit = true;
    } else if (result === '0-1 (FORFEIT)') {
      whiteScore = 0.0;
      blackScore = 1.0;
      isForfeit = true;
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        result,
        whiteScore,
        blackScore,
        isForfeit,
        status: 'COMPLETED'
      },
      include: {
        round: {
          include: {
            tournament: {
              include: {
                players: { include: { player: true } },
                rounds: { include: { matches: true } }
              }
            }
          }
        }
      }
    });

    const tournament = updatedMatch.round.tournament;

    // Recompute standings
    const allMatches = [];
    tournament.rounds.forEach(r => allMatches.push(...r.matches));

    const standings = calculateTournamentStandings(tournament.players, allMatches);

    // Save updated stats to DB
    for (const s of standings) {
      await prisma.tournamentPlayer.update({
        where: { id: s.tournamentPlayerId },
        data: {
          rank: s.rank,
          score: s.score,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          buchholz: s.buchholz,
          buchholzCut1: s.buchholzCut1,
          sonnebornBerger: s.sonnebornBerger,
          performanceRating: s.performanceRating
        }
      });
    }

    // Attach player details for response
    const whitePlayer = updatedMatch.whitePlayerId ? await prisma.player.findUnique({ where: { id: updatedMatch.whitePlayerId } }) : null;
    const blackPlayer = updatedMatch.blackPlayerId ? await prisma.player.findUnique({ where: { id: updatedMatch.blackPlayerId } }) : null;

    res.json({
      match: {
        ...updatedMatch,
        whitePlayer,
        blackPlayer
      },
      standings
    });
  } catch (err) {
    console.error('Error updating match result:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getRounds,
  generateNextRound,
  updateMatchResult
};

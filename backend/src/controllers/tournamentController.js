const prisma = require('../db/prisma');
const { generateRound1Pairings, generateSwissPairings } = require('../services/swissPairing');
const { generateRoundRobinPairings } = require('../services/roundRobin');
const { generateKnockoutRound1 } = require('../services/knockout');
const { calculateTournamentStandings } = require('../services/standings');

async function createTournament(req, res) {
  try {
    const {
      name,
      location,
      organizer,
      type = 'SWISS',
      numberOfRounds = 7,
      timeControl = '10+0 Rapid',
      ratingSystem = 'FIDE'
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Tournament name is required.' });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: name.trim(),
        location: location ? location.trim() : null,
        organizer: organizer ? organizer.trim() : null,
        type: type.toUpperCase(),
        numberOfRounds: parseInt(numberOfRounds, 10) || 7,
        timeControl,
        ratingSystem,
        status: 'REGISTRATION'
      }
    });

    res.status(201).json(tournament);
  } catch (err) {
    console.error('Error creating tournament:', err);
    res.status(500).json({ error: err.message });
  }
}

async function listTournaments(req, res) {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        _count: {
          select: {
            players: true,
            rounds: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTournamentById(req, res) {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          include: { player: true },
          orderBy: { startingSeed: 'asc' }
        },
        rounds: {
          include: {
            matches: true
          },
          orderBy: { roundNumber: 'asc' }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function startTournament(req, res) {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          include: { player: true },
          orderBy: { player: { rating: 'desc' } }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    if (tournament.status !== 'REGISTRATION') {
      return res.status(400).json({ error: `Tournament is already ${tournament.status}.` });
    }

    if (tournament.players.length < 2) {
      return res.status(400).json({ error: 'At least 2 players are required to start a tournament.' });
    }

    // Set initial starting seeds by rating
    for (let i = 0; i < tournament.players.length; i++) {
      await prisma.tournamentPlayer.update({
        where: { id: tournament.players[i].id },
        data: { startingSeed: i + 1 }
      });
    }

    // Prepare player objects for pairing engine
    const pairingPlayers = tournament.players.map((tp, idx) => ({
      playerId: tp.playerId,
      name: tp.player.name,
      rating: tp.player.rating,
      startingSeed: idx + 1,
      score: 0.0,
      hasReceivedBye: false,
      colorHistory: [],
      colorDifference: 0,
      previousOpponentIds: new Set()
    }));

    let round1Matches = [];

    if (tournament.type === 'ROUND_ROBIN') {
      round1Matches = generateRoundRobinPairings(pairingPlayers, 1);
    } else if (tournament.type === 'KNOCKOUT') {
      round1Matches = generateKnockoutRound1(pairingPlayers);
    } else {
      // SWISS or ARENA
      round1Matches = generateRound1Pairings(pairingPlayers);
    }

    // Create Round 1 in database
    const round1 = await prisma.round.create({
      data: {
        tournamentId: id,
        roundNumber: 1,
        status: 'ACTIVE'
      }
    });

    // Create matches
    for (const m of round1Matches) {
      await prisma.match.create({
        data: {
          roundId: round1.id,
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

    // Update tournament status
    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        currentRound: 1
      },
      include: {
        rounds: {
          include: { matches: true }
        },
        players: {
          include: { player: true }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    console.error('Error starting tournament:', err);
    res.status(500).json({ error: err.message });
  }
}

async function finishTournament(req, res) {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: { include: { player: true } },
        rounds: { include: { matches: true } }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    // Gather all matches
    const allMatches = [];
    tournament.rounds.forEach(r => allMatches.push(...r.matches));

    // Calculate final standings
    const standings = calculateTournamentStandings(tournament.players, allMatches);

    // Save final ranks and tiebreaks back to DB
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

    const updated = await prisma.tournament.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: {
        players: {
          include: { player: true },
          orderBy: { rank: 'asc' }
        }
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPodium(req, res) {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        players: { include: { player: true } },
        rounds: { include: { matches: true } }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    const allMatches = [];
    tournament.rounds.forEach(r => allMatches.push(...r.matches));

    const standings = calculateTournamentStandings(tournament.players, allMatches);
    const podium = {
      champion: standings[0] || null,
      second: standings[1] || null,
      third: standings[2] || null,
      allStandings: standings
    };

    res.json(podium);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteTournament(req, res) {
  try {
    const { id } = req.params;
    await prisma.tournament.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createTournament,
  listTournaments,
  getTournamentById,
  startTournament,
  finishTournament,
  getPodium,
  deleteTournament
};

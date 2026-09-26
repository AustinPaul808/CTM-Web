const prisma = require('../db/prisma');
const { calculateTournamentStandings } = require('../services/standings');

// Pre-defined sample players for 1-click testing
const SAMPLE_GRANDMASTERS = [
  { name: "Magnus Carlsen", fideId: "1503014", rating: 2837, age: 35, federation: "NOR", club: "Offerspill", title: "GM" },
  { name: "Hikaru Nakamura", fideId: "2016192", rating: 2816, age: 38, federation: "USA", club: "Chess.com", title: "GM" },
  { name: "Arjun Erigaisi", fideId: "35009192", rating: 2795, age: 22, federation: "IND", club: "Telangana Chess", title: "GM" },
  { name: "Gukesh D", fideId: "46616543", rating: 2785, age: 19, federation: "IND", club: "WACA", title: "GM" },
  { name: "Fabiano Caruana", fideId: "2020000", rating: 2779, age: 34, federation: "USA", club: "Saint Louis CC", title: "GM" },
  { name: "Nodirbek Abdusattorov", fideId: "14203988", rating: 2768, age: 21, federation: "UZB", club: "Tashkent", title: "GM" },
  { name: "Alireza Firouzja", fideId: "12573981", rating: 2767, age: 22, federation: "FRA", club: "Chartres", title: "GM" },
  { name: "Wei Yi", fideId: "8603405", rating: 2762, age: 26, federation: "CHN", club: "Jiangsu", title: "GM" },
  { name: "Ian Nepomniachtchi", fideId: "4152956", rating: 2755, age: 35, federation: "FID", club: "Moscow", title: "GM" },
  { name: "Praggnanandhaa R", fideId: "25059530", rating: 2746, age: 20, federation: "IND", club: "Chennai Chess", title: "GM" },
  { name: "Vidit Gujrathi", fideId: "5029410", rating: 2720, age: 31, federation: "IND", club: "PSPB", title: "GM" },
  { name: "Anish Giri", fideId: "24116068", rating: 2718, age: 31, federation: "NED", club: "En Passant", title: "GM" },
  { name: "Levon Aronian", fideId: "13300881", rating: 2715, age: 43, federation: "USA", club: "Saint Louis CC", title: "GM" },
  { name: "Maxime Vachier-Lagrave", fideId: "623539", rating: 2712, age: 35, federation: "FRA", club: "Clichy", title: "GM" },
  { name: "Vincent Keymer", fideId: "12940690", rating: 2708, age: 21, federation: "GER", club: "Baden-Baden", title: "GM" },
  { name: "Ding Liren", fideId: "8603677", rating: 2705, age: 33, federation: "CHN", club: "Zhejiang", title: "GM" }
];

async function addPlayer(req, res) {
  try {
    const { tournamentId } = req.params;
    const { name, fideId, rating, age, federation, club, title } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Player name is required.' });
    }

    // Check tournament status
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: true }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    if (tournament.status !== 'REGISTRATION') {
      return res.status(400).json({ error: 'Cannot add players after tournament has started.' });
    }

    // Upsert Player record
    let player = await prisma.player.create({
      data: {
        name: name.trim(),
        fideId: fideId ? String(fideId).trim() : null,
        rating: rating ? parseInt(rating, 10) : 1500,
        age: age ? parseInt(age, 10) : null,
        federation: federation ? federation.trim().toUpperCase() : 'FIDE',
        club: club ? club.trim() : null,
        title: title ? title.trim().toUpperCase() : null
      }
    });

    // Determine seed based on current player count
    const seed = tournament.players.length + 1;

    const tournamentPlayer = await prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        playerId: player.id,
        startingSeed: seed
      },
      include: { player: true }
    });

    res.status(201).json(tournamentPlayer);
  } catch (err) {
    console.error('Error adding player:', err);
    res.status(500).json({ error: err.message });
  }
}

async function loadSamplePlayers(req, res) {
  try {
    const { tournamentId } = req.params;
    const count = parseInt(req.query.count, 10) || 8;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: true }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found.' });
    }

    if (tournament.status !== 'REGISTRATION') {
      return res.status(400).json({ error: 'Cannot add sample players after tournament has started.' });
    }

    const toAdd = SAMPLE_GRANDMASTERS.slice(0, Math.min(count, SAMPLE_GRANDMASTERS.length));
    const addedPlayers = [];

    for (let i = 0; i < toAdd.length; i++) {
      const pData = toAdd[i];
      const player = await prisma.player.create({
        data: {
          name: pData.name,
          fideId: pData.fideId,
          rating: pData.rating,
          age: pData.age,
          federation: pData.federation,
          club: pData.club,
          title: pData.title
        }
      });

      const seed = tournament.players.length + i + 1;
      const tp = await prisma.tournamentPlayer.create({
        data: {
          tournamentId,
          playerId: player.id,
          startingSeed: seed
        },
        include: { player: true }
      });
      addedPlayers.push(tp);
    }

    // Re-seed all players in tournament by rating DESC
    const allTPs = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { player: { rating: 'desc' } }
    });

    for (let i = 0; i < allTPs.length; i++) {
      await prisma.tournamentPlayer.update({
        where: { id: allTPs[i].id },
        data: { startingSeed: i + 1 }
      });
    }

    const updatedRoster = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { startingSeed: 'asc' }
    });

    res.json(updatedRoster);
  } catch (err) {
    console.error('Error loading sample players:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getTournamentPlayers(req, res) {
  try {
    const { tournamentId } = req.params;
    const players = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { startingSeed: 'asc' }
    });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removePlayer(req, res) {
  try {
    const { tournamentId, playerId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (tournament && tournament.status !== 'REGISTRATION') {
      return res.status(400).json({ error: 'Cannot remove players from an active or completed tournament.' });
    }

    await prisma.tournamentPlayer.deleteMany({
      where: { tournamentId, playerId }
    });

    // Re-seed remaining
    const remaining = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { player: { rating: 'desc' } }
    });

    for (let i = 0; i < remaining.length; i++) {
      await prisma.tournamentPlayer.update({
        where: { id: remaining[i].id },
        data: { startingSeed: i + 1 }
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPlayerProfile(req, res) {
  try {
    const { tournamentId, playerId } = req.params;

    const tp = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_playerId: { tournamentId, playerId }
      },
      include: {
        player: true,
        tournament: true
      }
    });

    if (!tp) {
      return res.status(404).json({ error: 'Player not found in tournament.' });
    }

    // Fetch all matches involving this player in this tournament
    const rounds = await prisma.round.findMany({
      where: { tournamentId },
      include: {
        matches: true
      },
      orderBy: { roundNumber: 'asc' }
    });

    const playerMatches = [];
    for (const round of rounds) {
      for (const m of round.matches) {
        if (m.whitePlayerId === playerId || m.blackPlayerId === playerId) {
          const isWhite = m.whitePlayerId === playerId;
          const opponentId = isWhite ? m.blackPlayerId : m.whitePlayerId;

          let opponent = null;
          if (opponentId) {
            opponent = await prisma.player.findUnique({ where: { id: opponentId } });
          }

          playerMatches.push({
            roundNumber: round.roundNumber,
            boardNumber: m.boardNumber,
            isWhite,
            color: isWhite ? 'White' : 'Black',
            opponent,
            isBye: m.isBye,
            result: m.result,
            playerScore: isWhite ? m.whiteScore : m.blackScore,
            status: m.status
          });
        }
      }
    }

    res.json({
      player: tp.player,
      tournamentStats: {
        startingSeed: tp.startingSeed,
        score: tp.score,
        wins: tp.wins,
        draws: tp.draws,
        losses: tp.losses,
        buchholz: tp.buchholz,
        buchholzCut1: tp.buchholzCut1,
        sonnebornBerger: tp.sonnebornBerger,
        performanceRating: tp.performanceRating,
        rank: tp.rank
      },
      matchHistory: playerMatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addPlayer,
  loadSamplePlayers,
  getTournamentPlayers,
  removePlayer,
  getPlayerProfile
};

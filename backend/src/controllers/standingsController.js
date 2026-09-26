const prisma = require('../db/prisma');
const { calculateTournamentStandings } = require('../services/standings');

async function getStandings(req, res) {
  try {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
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
    res.json(standings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function exportStandingsCsv(req, res) {
  try {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
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

    let csv = 'Rank,Player Name,FIDE ID,Federation,Club,Initial Rating,Score,Wins,Draws,Losses,BH-Cut1,Buchholz,Sonneborn-Berger,Perf Rating\n';
    for (const s of standings) {
      csv += `${s.rank},"${s.name}","${s.fideId || ''}","${s.federation || ''}","${s.club || ''}",${s.rating},${s.score},${s.wins},${s.draws},${s.losses},${s.buchholzCut1},${s.buchholz},${s.sonnebornBerger},${s.performanceRating}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${tournament.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Standings.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStandings,
  exportStandingsCsv
};

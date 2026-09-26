const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const playerController = require('../controllers/playerController');
const roundController = require('../controllers/roundController');
const standingsController = require('../controllers/standingsController');

// Tournament CRUD
router.post('/', tournamentController.createTournament);
router.get('/', tournamentController.listTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.delete('/:id', tournamentController.deleteTournament);
router.post('/:id/start', tournamentController.startTournament);
router.post('/:id/finish', tournamentController.finishTournament);
router.get('/:id/podium', tournamentController.getPodium);

// Player Sub-routes for Tournament
router.post('/:tournamentId/players', playerController.addPlayer);
router.get('/:tournamentId/players', playerController.getTournamentPlayers);
router.post('/:tournamentId/sample-players', playerController.loadSamplePlayers);
router.delete('/:tournamentId/players/:playerId', playerController.removePlayer);
router.get('/:tournamentId/players/:playerId/profile', playerController.getPlayerProfile);

// Round Sub-routes for Tournament
router.get('/:tournamentId/rounds', roundController.getRounds);
router.post('/:tournamentId/rounds/next', roundController.generateNextRound);

// Standings Sub-routes for Tournament
router.get('/:tournamentId/standings', standingsController.getStandings);
router.get('/:tournamentId/standings/export', standingsController.exportStandingsCsv);

module.exports = router;

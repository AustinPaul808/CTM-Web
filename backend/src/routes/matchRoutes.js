const express = require('express');
const router = express.Router();
const roundController = require('../controllers/roundController');

// Match Result update
router.put('/:matchId/result', roundController.updateMatchResult);

module.exports = router;

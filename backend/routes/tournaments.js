const express = require('express');
const router = express.Router();
const {
  createTournament,
  joinTournament,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament
} = require('../handlers/tournamentHandlers');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, getTournaments);
router.get('/:id', authenticateToken, getTournamentById);

router.post('/join', authenticateToken, joinTournament);
router.post('/', authenticateToken, authorizeRoles('admin', 'scorer', 'player'), createTournament);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'scorer', 'player'), updateTournament);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'scorer', 'player'), deleteTournament);

module.exports = router;

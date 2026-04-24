const express = require("express");
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  createMatchHandler,
  getMatchByCodeHandler,
  startMatchHandler,
  getLiveMatchSummaryHandler,
  getAllMatchesHandler
} = require('../handlers/matchHandlers');

// Public routes (no auth required for viewing)
router.get("/", getAllMatchesHandler);
router.get("/code/:matchCode", getMatchByCodeHandler);
router.get("/:match_id/summary", getLiveMatchSummaryHandler);

// Protected routes (require authentication)
router.post("/", authenticateToken, createMatchHandler);
router.post("/:match_id/start", authenticateToken, startMatchHandler);

module.exports = router;
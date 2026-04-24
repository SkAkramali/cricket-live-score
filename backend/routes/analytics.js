const express = require("express");
const router = express.Router();
const { cacheMiddleware } = require('../config/redis');
const {
  getPlayerMatchStatsHandler,
  getPlayerCareerStatsHandler,
  getTopBatsmenHandler,
  getTopBowlersHandler,
  getMatchScorecardHandler,
  getPartnershipsHandler,
  getBallByBallCommentaryHandler,
  getMatchAnalyticsHandler
} = require('../handlers/analyticsHandlers');

// Player statistics
router.get("/player/:player_id/match/:match_id", cacheMiddleware(300), getPlayerMatchStatsHandler);
router.get("/player/:player_id/career", cacheMiddleware(3600), getPlayerCareerStatsHandler);

// Match statistics and analytics
router.get("/match/:match_id/scorecard", cacheMiddleware(300), getMatchScorecardHandler);
router.get("/match/:match_id/top-batsmen", getTopBatsmenHandler);
router.get("/match/:match_id/top-bowlers", getTopBowlersHandler);
router.get("/match/:match_id/analytics", cacheMiddleware(300), getMatchAnalyticsHandler);

// Innings specific
router.get("/innings/:innings_id/partnerships", getPartnershipsHandler);
router.get("/innings/:innings_id/commentary", getBallByBallCommentaryHandler);

module.exports = router;

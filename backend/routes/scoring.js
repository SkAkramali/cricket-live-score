const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  recordBallHandler,
  startInningsHandler,
  changeBatsmanHandler,
  changeBowlerHandler,
  endInningsHandler
} = require('../handlers/scoringHandlers');

// All scoring routes require authentication
// Allow player role too — it's their own match being scored
router.use(authenticateToken);
router.use(authorizeRoles('player', 'scorer', 'admin'));

// Live scoring routes
router.post("/ball", recordBallHandler);
router.post("/innings/:innings_id/start", startInningsHandler);
router.post("/innings/:innings_id/batsman/change", changeBatsmanHandler);
router.post("/innings/:innings_id/bowler/change", changeBowlerHandler);
router.post("/innings/:innings_id/end", endInningsHandler);

module.exports = router;

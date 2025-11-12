const express = require("express");
const router = express.Router();
const db = require("../database");

// Function to insert player
const addPlayer = async (data) => {
  const result = await db.execute(
    "INSERT INTO players (player_name, team_id, role, batting_style, bowling_style) VALUES (?, ?, ?, ?, ?)",
    [data.playerName, data.teamId, data.role, data.battingStyle, data.bowlingStyle]
  );
  return result;
};

// Middleware to validate player data
const validatePlayer = (req, res, next) => {
  const { playerName, teamId, role, battingStyle } = req.body;
  if (!playerName || !teamId || !role || !battingStyle) {
    return res.status(400).json({
      message: "Insufficient data provided",
    });
  }
  next();
};

// POST /player - add a player
router.post("/", validatePlayer, async (req, res) => {
  try {
    const result = await addPlayer(req.body);
    if (result) {
      res.status(200).json({
        message: "Player added successfully",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// Function to get player details
const getPlayerDetails = async (playerId) => {
  const [result] = await db.execute("SELECT * FROM players WHERE player_id = ?", [playerId]);
  return result;
};

// GET /player/:playerId - get details
router.get("/:playerId", async (req, res) => {
  const playerId = req.params.playerId;
  try {
    const PlayerDetails = await getPlayerDetails(playerId);
    if (PlayerDetails.length > 0) {
      res.status(200).json({ data: PlayerDetails });
    } else {
      res.status(404).json({ message: "Player not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;

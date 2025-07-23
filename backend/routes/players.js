const express = require("express");
const router = express.Router();
const db = require("../database");
const addPlayer = async(data) => {
  const result = await db.execute("insert into players (player_name, team_id, role, batting_style, bowling_style) values (?, ?, ?, ?, ?)", [data.playerName, data.teamId, data.role, data.battingStyle, data.bowlingStyle]);
  return result;
}
const validatePlayer = (req, res, next) => {
  if(!req.body) {
    res.status(404).json({
      message: "Sufficient Data Is Not Provided"
    });
  }
  next();
}

router.post("/",  validatePlayer, async(req, res) => {
  try{
    const result = await addPlayer(req.body);
    if(result) {
      res.status(200).json({
        message: "player added successfully"
      })
    }  
  } catch(err) {
    res.status(404).json({
      message: err.message
    });
  }
});

const getPlayerDetails = async(playerId) => {
  const result = await db.execute("select * from players where player_id = ?", [playerId]);
  return result;
}

router.get("/:playerId", async(req, res)=>{
  const playerId = req.params.playerId;
  try{
    const [PlayerDetails] = getPlayerDetails(playerId);
    if(PlayerDetails){
      res.status(200).json({
        data: PlayerDetails
      });
    }
  } catch(err) {
    res.status(401).json({
      message: err.message
    });
  }
});

module.exports = router;
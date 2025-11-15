const express = require("express");
const router = express.Router();
const db = require('../database');

/* CREATE TABLE matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    team1_id INT,
    team2_id INT,
    match_date DATE,
    venue VARCHAR(100),
    status ENUM('Scheduled', 'Live', 'Completed'),
    toss_winner INT,
    toss_decision ENUM('Bat', 'Bowl'),
    result VARCHAR(255),
    FOREIGN KEY (team1_id) REFERENCES teams(team_id),
    FOREIGN KEY (team2_id) REFERENCES teams(team_id),
    FOREIGN KEY (toss_winner) REFERENCES teams(team_id)
);*/

router.get("/", async (req, res) => {
  try {
    const [data] = await db.execute("SELECT * FROM matches");
    console.log(data);

    if (data.length > 0) {
      return res.status(200).json(data);
    } else {
      return res.status(404).json({ message: "No matches found" });
    }

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res)=>{
  try{
    const matchId = req.params.id;
    const [data] = await db.execute("select * from matches where match_id =?", [matchId]);
    return res.status(200).json(data);

  }catch(err){
    return res.status(404).json({message: err});
  }
});

router.post("/", async(req, res) => {
  const inp = req.body;
  try {
    const result = await db.execute(
      "insert into matches (team1_id, team2_id, match_date, venue, status, toss_winner, toss_decision, result) values (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        inp.team1_id,
        inp.team2_id,
        inp.match_date,
        inp.venue,
        inp.status,
        inp.toss_winner,
        inp.toss_decision,
        inp.result
      ]
    );

    return res.status(201).json({message: "match scheduled successfully"});

  } catch (err) {
    return res.status(404).json({ message: err.message || err });
  }
});


 

module.exports = router;
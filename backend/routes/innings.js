const express = require("express");
const router = express.Router();
const db = require("../database");

router.get("/:inningsId", async(req, res)=>{
  const inningsId = req.params.inningsId;
  try{
    const result = await db.execute("select * from innings where innings_id = ?", [inningsId]);
    console.log(result);
    if(result.length> 0){
      return res.status(200).json({data: result});
    } else{
      return res.status(404).json({message: "no innings found to given id"});
    }
  } catch(err){
    return res.status(404).json({message: "Something went wrong"});
  }
});


router.put("/updateScore/:inningsId", async(req, res)=> {
  const score = req.body.score;
  try{
    const result  = await db.execute("update innings set score = score+? where innings_id = ?", [score, req.params.inningsId]);
    return res.status(200).json({message: "Score updated successfully"});
  } catch(err){
    return res.status(404).json({message: "Something went wrong"});
  }
});

 

router.post("/", async(req, res)=>{
  const data = res.body;
  try{

    db.execute("insert into innings (match_id, bowling_team_id, batting_team_id, innings_number, total_runs, total_wickets, overs) values (?, ?, ?,?,?,?,?)",[data.match_id, data.bowling_team_id, data.batting_team_id, data.innings_number, data.total_runs, data.total_wickets, data.overs]);
    return res.status(200).json({message: succfully});
  } catch(err){
    return res.status(404).json({message: err});
  }
});


module.exports = router;
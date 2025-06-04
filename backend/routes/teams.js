const express = require("express");
const router = express.Router();
const db = require("../database");
const registerTeam = require("../handlers/teamsHandlers");

router.get("/", async(req, res)=>{
  try{
    const [data] = await db.execute("select * from teams");
    res.json(data);
  } catch(err){
    res.status(500).json({errorMessage: err});
  }

});

router.post("/", async(req, res) =>{
  try{
    const result = await registerTeam(req.body);
    console.log(result);
    res.status(201).json({message: "Team Has Registerd"});
  } catch(err){
    res.status(400).json({error: err});
  }
})

module.exports = router;

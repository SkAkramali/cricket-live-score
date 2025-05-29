const express = require("express");
const router = express.Router();
const db = require("../database");

router.get("/teams", async(req, res)=>{
  try{
    const [data] = await db.execute("select * from teams");
    res.json(data);
  } catch(err){
    res.status(500).json({errorMessage: err});
  }

})
module.exports = router;

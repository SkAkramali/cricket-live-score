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

module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", async(req, res)=> {
  try{
    const data = req.body;
    const query = "insert into logininfo (username, password, email) values(?, ?, ?)";
    const result = await db.execute(query, [data.userName, data.password, data.email]);
    res.status(201).json({
      message: "Successfully registered",
    });
  } catch (err){
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
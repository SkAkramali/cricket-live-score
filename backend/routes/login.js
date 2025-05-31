const express = require("express");
const router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt")

router.post("/", async(req, res)=> {
  try{
    const data = req.body;
    const hashedPassword = await bcrypt.hash(data.password, 6);
    console.log(hashedPassword);
    const query = "insert into logininfo (username, password, email) values(?, ?, ?)";
    const result = await db.execute(query, [data.userName, hashedPassword, data.email]);
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
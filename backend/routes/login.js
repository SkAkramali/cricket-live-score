const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", async(req, res)=> {
  try{
    const data = req.body;
    const query = "insert into logininfo (username, password, email) values(?, ?, ?)";
    const result = await db.execute(query, [req.body.name, req.body.password, req.body.email]);
    res.status(200).json({
      message: "sucessfully logined"
    });
    console.log(data);
  } catch (err){
    res.status(500).json({
      error: err
    });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt")

router.post("/login", async(req, res) => {
  try{
    const loginInformation = req.body;
    const data = await db.execute("select * from logininfo where email = ?", [loginInformation.email]);
    const result = await bcrypt.compare(loginInformation.password, data.password)
    if (result) {
      res.status(200).json({
        message: "authenticated"
      })
    } else {
      res.status(500).json({
        message: "passwored not machted"
      })
    }

  } catch (err){
    res.status(500).json({
      error:err.message
    })
  }
})

router.post("/", async(req, res)=> {
  try{
    const data = req.body;
    const hashedPassword = await bcrypt.hash(data.password, 6);
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
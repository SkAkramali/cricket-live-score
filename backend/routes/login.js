const express = require("express");
const router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt");
const {validatePassword, getLoginInfo} = require("../handlers/aouthHandlers")



const validateLogin = (req, res, next) => { // middleware for checking data is given by the user or not
  const data = req.body;
  if(!data.password || !data.email) {
    return res.status(400).json({error:"username and password are required"});
  }
  next();
}

router.post("/signin", validateLogin, async(req, res) => {
  try{
    const loginInformation = req.body;
    const [data] = await getLoginInfo(loginInformation);
    if (data.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const result = await validatePassword(loginInformation, data);
    if (result) {
      res.status(200).json({
        message: "authenticated"
      })
    } else {
      res.status(401).json({
        message: "Password Not Matched"
      })
    }

  } catch (err){
    res.status(500).json({
      error:err.message
    })
  }
});

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
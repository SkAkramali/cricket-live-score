const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", (req, res)=> {
  const data = req.body;
  console.log(data);
});

module.exports = router;
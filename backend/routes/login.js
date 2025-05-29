const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", async(req, res)=> {
  const data =  await req.body;
  console.log(data);
});

module.exports = router;
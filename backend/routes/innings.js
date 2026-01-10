const express = require("express");
const router = express.Router();
const db = require("../database");
const { getIningsById, updateInningsScore, registerInnings } = require("../handlers/innings");

router.get("/:inningsId", getIningsById);

router.put("/updateScore/:inningsId", updateInningsScore);

router.post("/", registerInnings);


module.exports = router;
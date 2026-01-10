const express = require("express");
const router = express.Router();
const db = require("../database");
const {registerTeam, getTeamsData, registerTeamHandler, getTeamByIdHandler} = require("../handlers/teamsHandlers");

router.get("/", getTeamsData);

router.post("/", registerTeamHandler);

router.get("/:id", getTeamByIdHandler);

module.exports = router;

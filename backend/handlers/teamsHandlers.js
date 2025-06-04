const db = require("../database");

const registerTeam = async(data) => {
  const  result= await db.execute("insert into teams (team_name, coach_name, home_ground) values (?, ?, ?)", [data.team_name, data.coach_name, data.home_ground]); 
  return result;
}

module.exports = registerTeam;
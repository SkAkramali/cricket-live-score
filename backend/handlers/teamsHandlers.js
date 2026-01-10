const db = require("../database");

const registerTeam = async(data) => {
  const  result= await db.execute("insert into teams (team_name, coach_name, home_ground) values (?, ?, ?)", [data.team_name, data.coach_name, data.home_ground]); 
  return result;
}

const getTeamsData = async(req, res)=>{
  try{
    const [data] = await db.execute("select * from teams");
    res.json(data);
  } catch(err){
    res.status(500).json({errorMessage: err});
  }
}

const registerTeamHandler = async(req, res) =>{
  try{
    const result = await registerTeam(req.body);
    console.log(result);
    res.status(201).json({message: "Team Has Registerd"});
  } catch(err){
    res.status(400).json({error: err});
  }
}

const getTeamByIdHandler = async(req, res)=>{
  const id = req.params.id;
   try{
    const [data] = await db.execute("select * from teams where team_id = ?", [id]);
    return res.status(200).json(data);
  } catch(err){
    return res.status(500).json({errorMessage: err});
  }
}

module.exports = {registerTeam, getTeamsData, registerTeamHandler, getTeamByIdHandler};
const db = require("../database");

const getIningsById = async(req, res)=>{
  const inningsId = req.params.inningsId;
  try{
    const result = await db.execute("select * from innings where innings_id = ?", [inningsId]);
    console.log(result);
    if(result.length> 0){
      return res.status(200).json({data: result[0][0]});
    } else{
      return res.status(404).json({message: "no innings found to given id"});
    }
  } catch(err){
    return res.status(404).json({message: err});
  }
}

module.exports = {getIningsById}
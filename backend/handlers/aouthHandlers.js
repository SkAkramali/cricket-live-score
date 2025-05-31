const bcrypt = require("bcrypt");
const db = require("../database");


const validatePassword = async(loginInformation, data) => {
  const status = await bcrypt.compare(loginInformation.password, data[0].password);
  return status;
}

const getLoginInfo = async(loginInformation) => {
  const data = await db.execute("select * from logininfo where email = ?", [loginInformation.email]); 
  return data;
}

module.exports = {validatePassword, getLoginInfo};

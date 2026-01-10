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

const issigninedHandler = async (req, res) => {
  if (req.session && req.session.user) {
    return res.status(200).json({
      islogined: true,
      user: req.session.user,
    });
  } else {
    return res.status(401).json({
      islogined: false,
      message: "user not logined"
    });
  }
}

const signupHandler = async (req, res) => {
  try {
    const data = req.body;
    const hashedPassword = await bcrypt.hash(data.password, 6);
    const query = "insert into logininfo (username, password, email) values(?, ?, ?)";
    await db.execute(query, [data.userName, hashedPassword, data.email]);
    res.status(201).json({
      message: "Successfully registered",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}

const logoutHandler = (req, res) => {
  req.session = null;
  return res.status(200).json({
    message: "logout successful !"
  });
}

module.exports = {validatePassword, getLoginInfo, issigninedHandler, signupHandler, logoutHandler};
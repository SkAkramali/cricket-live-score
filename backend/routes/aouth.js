const express = require("express");
const router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt");
const { validatePassword, getLoginInfo } = require("../handlers/aouthHandlers");
const cookieSession = require("cookie-session");

// ---------------- Middleware ----------------
const validateLogin = (req, res, next) => {
  const data = req.body;
  if (!data.password || !data.email) {
    return res.status(400).json({ error: "username and password are required" });
  }
  next();
};

router.use(cookieSession({
  name: "session",
  keys: ["dskasdfk2", "dkaskdflfks3", "fskdfdlfj47"],
  maxAge: 24 * 60 * 60 * 1000
}));

 

// ---------------- Routes ----------------

router.get("/issignined", (req, res) => {
  console.log(req.session);

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
});

router.post("/signin", validateLogin, async (req, res) => {
  try {
    const loginInformation = req.body;
    console.log(loginInformation);
    const [data] = await getLoginInfo(loginInformation);
    if (data.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const result = await validatePassword(loginInformation, data);
    if (result) {
      req.session.user = req.body.email;
      res.status(200).json({
        message: "authenticated",
        status: true
      });
    } else {
      res.status(401).json({
        message: "Password Not Matched"
      });
    }

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

router.post("/signup", async (req, res) => {
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
});

router.get("/logout", (req, res) => {
  req.session = null;
  return res.status(200).json({
    message: "logout successful !"
  });
});

module.exports = router;

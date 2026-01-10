const express = require("express");
const router = express.Router();
const db = require("../database");
const bcrypt = require("bcrypt");
const { validatePassword, getLoginInfo, issigninedHandler, signupHandler, logoutHandler } = require("../handlers/aouthHandlers");
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

router.get("/issignined", issigninedHandler);

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

router.post("/signup", signupHandler);

router.get("/logout", logoutHandler);

module.exports = router;

const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
// Middleware to parse JSON body (important for POST requests)
app.use(express.json());

const userRouter = require("./routes/teams");
const loginInfo = require("./routes/aouth");

// Route handlers
app.use("/teams", userRouter);
app.use("/aouth", loginInfo);

app.use(cookieSession({
  name: "seesion",
  keys: ["dskasdfk2", "dkaskdflfks3", "fskdfdlfj47"],
  maxAge: 24 * 60 * 60 * 1000
}));

app.listen(5000, () => {
  console.log("Server started on port 5000");
  console.log(` Teams/get api: \x1b[36mhttp://localhost:${5000}\\ipl\\teams\x1b[0m`);
});

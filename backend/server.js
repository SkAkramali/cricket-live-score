// ---------------- Imports ----------------
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,              
  })
);

app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2", "key3"],
    maxAge: 24 * 60 * 60 * 1000, 
    secure: false,               
    httpOnly: true,
    sameSite: "lax",
  })
);

const userRouter = require("./routes/teams");
const loginInfo = require("./routes/aouth");
const player = require("./routes/players");
const matchs = require("./routes/matchs");

app.use("/teams", userRouter);
app.use("/aouth", loginInfo);
app.use("/player", player);
app.use("/matchs", matchs);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LIVE CRICKET SCORE API'S",
      version: "1.0.0",
      description: "APIs for IPL teams, players, and authentication",
    },
  },
  apis: ["./apiDoc.yaml"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/test-session", (req, res) => {
  req.session.count = (req.session.count || 0) + 1;
  res.json({
    message: "Session is working!",
    count: req.session.count,
    session: req.session,
  });
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
  console.log("Swagger UI: http://localhost:5000/api-docs");
});

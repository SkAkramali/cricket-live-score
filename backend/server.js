const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2", "key3"],
  maxAge: 24 * 60 * 60 * 1000
}));

// Routers
const userRouter = require("./routes/teams");
const loginInfo = require("./routes/aouth");
const player = require("./routes/players");

app.use("/teams", userRouter);
app.use("/aouth", loginInfo);
app.use("/player", player);

// ---------------- Swagger Setup ----------------
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LIVE CRICKET SCORE API'S",
      version: "1.0.0",
      description: "APIs for IPL teams, players, and authentication",
    },
  },
  apis: ["./apiDoc.yaml"], // Swagger will read comments in all route files
};


const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// ---------------- Start Server ----------------
app.listen(5000, () => {
  console.log("Server started on port 5000");
  console.log("Swagger UI: http://localhost:5000/api-docs");
});

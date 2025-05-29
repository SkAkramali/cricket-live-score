const express = require("express");
const app = express();

app.listen(80, (req, res) =>{
  console.log("server started");
});

const userRouter = require("./routes/teams");

app.use("/ipl", userRouter);

const express = require("express");

const connectDB = require("./config/db");

const app = express();

const cors = require("cors");

// To Parse JSON File From Express
app.use(express.json());
app.use(cors());

connectDB();

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.send(`Server Is Working Correctly`);
});

app.use("/api/users", require("./routes/users"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/posts", require("./routes/posts"));

const PORT = process.env.PORT || 4000;

// Start Application
app.listen(PORT, () => {
  console.log(`Server Started On PORT : ${PORT}`);
});

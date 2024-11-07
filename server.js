const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send(`Server Is Working Correctly`);
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server Started On PORT : ${PORT}`);
});

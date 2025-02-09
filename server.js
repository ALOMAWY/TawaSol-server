require("dotenv").config();

const express = require("express");

const connectDB = require("./config/db");

const app = express();

const cors = require("cors");

const session = require("express-session");

const cookieParser = require("cookie-parser");

const passport = require("passport")

const passportSetup = require("./passport");

// To Parse JSON File From Express
app.use(express.json());

app.use(
  session({
    secret: "sessionSecret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  cors({
    origin: "https://tawasol-vite-application.vercel.app", // السماح للنطاق الأمامي
    credentials: true, // تمكين الكوكيز عبر النطاقات
  })
);
app.use(cookieParser());

connectDB();

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.send(`Server Is Working Correctly`);
});


app.use(passport.initialize());
app.use(passport.session());

app.use("/api/users", require("./routes/users"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 4000;

// Start Application

app.listen(PORT, () => {
  console.log(`Server Started On PORT : ${PORT}`);
});

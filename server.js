require("dotenv").config();

const express = require("express");

const connectDB = require("./config/db");

const app = express();

const cors = require("cors");

const passport = require("passport");

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const session = require("express-session");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// To Parse JSON File From Express
app.use(express.json());
app.use(cors());

connectDB();

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.send(`Server Is Working Correctly`);
});

//  Google Auth
app.use(
  session({
    secret: GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://tawasol-server-nf3x.onrender.com/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

// Seialize And Desertalize User
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use("/api/users", require("./routes/users"));
app.use("/api/profiles", require("./routes/profiles"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 4000;

// Start Application
app.listen(PORT, () => {
  console.log(`Server Started On PORT : ${PORT}`);
});

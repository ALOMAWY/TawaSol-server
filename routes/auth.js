const express = require("express");

const passport = require("passport");

const router = express.Router();

// Google Authintication Route

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.send("Login Succssfully!");
  }
);

module.exports = router;

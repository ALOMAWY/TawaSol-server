const express = require("express");

const passport = require("passport");

const { check, validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");

const JWT = require("jsonwebtoken");

const config = require("config");

const User = require("../models/User"); // Adjust the path based on your folder structure

const router = express.Router();

// Google Authintication Route

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback Route

router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/home",
    failureRedirect: "/",
  }),
  async (req, res) => {
    const { id, name, email } = req.user._json; // Get user info from Google profile

    try {
      // Call the helper function to register the user
      const { error, token, user } = await registerUser({
        name,
        email,
        googleId: id, // Pass the Google ID
      });

      if (error) {
        console.error(error);
        return res.redirect(`/error?message=${encodeURIComponent(error)}`);
      }

      // Save the JWT in cookies or return it
      res.cookie("token", token, { httpOnly: true });
      res.redirect("http://localhost:5173/home"); // Redirect on success
    } catch (err) {
      console.error(err.message);
      res.redirect(`/error?message=${encodeURIComponent("Server error")}`);
    }
  }
);

module.exports = router;

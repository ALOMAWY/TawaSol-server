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
    try {
      // Extract user information from Google profile
      const { name, email, id } = req.user._json;

      console.log(req.user._json);

      // Check if the user already exists in the DB
      let user = await User.findOne({ email });

      if (!user) {
        // If user doesn't exist, create a new one
        user = new User({
          name,
          email,
          googleId: id, // Store Google ID to prevent duplicate registration
        });

        // Optionally, generate a JWT or handle login in another way
        const payload = {
          user: {
            id: user.id,
          },
        };

        JWT.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: "5d" },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );

        // Save the new user to the DB
        await user.save();
      } else {
        // User already exists
        const payload = {
          user: {
            id: user.id,
          },
        };

        JWT.sign(
          payload,
          config.get("jwtSecret"),
          { expiresIn: "5d" },
          (err, token) => {
            if (err) throw err;
            res.json({ token });
          }
        );
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;

const express = require("express");

const router = express.Router();

const { check, validationResult } = require("express-validator");

const User = require("../models/User");

const bcrypt = require("bcryptjs");

const JWT = require("jsonwebtoken");

const config = require("config");

const { auth } = require("../utils");

/*
  - Get the request body
  - Validate the request body
  - Check if user exists, if yes, return error
  - Encrypt password
  - Save data in DB
  - Using JWT create token contains user id, return token.
*/

/*
Path: POST "/api/users/register"
Desc: Register A new user
Public
*/

router.post(
  "/register",
  check("name", "Name Is Required").notEmpty(),
  check("email", "email Is Not Valid").isEmail(),
  check(
    "password",
    "please chosse a password with at least 7 charecters"
  ).isLength({ min: 7, max: 30 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({
          errors: [{ msg: "User Already Exists" }],
        });
      }

      user = new User({ name, email, password });
      // Bcrypt Password Before Sending Data To DB

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      // Sending Data To DB

      await user.save();

      // Get JWT

      const payload = {
        user: {
          id: user.id,
        },
      };

      JWT.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 Days" },
        (err, token) => {
          if (err) throw err;
          else res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);

      res.status(500).send(error.message);
    }
  }
);

/*

Path: POST "/api/users/register"
Desc: logins an existing user
Public

*/

router.post(
  "/login",
  check("email", "email Is Not Valid").isEmail(),
  check(
    "password",
    "please chosse a password with at least 7 charecters"
  ).isLength({ min: 7, max: 20 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials Email" }] });
      }

      // Bcrypt Password Before Sending Data To DB

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials Password" }] });
      }

      // Sending Data To DB

      await user.save();

      // Get JWT

      const payload = {
        user: {
          id: user.id,
        },
      };

      JWT.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 Days" },
        (err, token) => {
          if (err) throw err;
          else res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);

      res.status(500).send(error.message);
    }
  }
);

/*
Path: GET "/api/users"
Desc: Register A new user
Privete
*/

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;

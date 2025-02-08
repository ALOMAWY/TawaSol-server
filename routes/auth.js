const express = require("express");

const passport = require("passport");

const { registerUser } = require("../utils");

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
    failureRedirect: "/",
  }),
  async (req, res) => {
    console.log("Google Profile Data:", req.user._json);

    const { id, name, email } = req.user._json; // Get user info from Google profile

    console.log("Google Profile Data:", req.user._json);

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
      res.cookie("token", token, {
        httpOnly: false, // Prevent JavaScript access for security
        // secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.redirect(
        `https://fatawasol-server-fufp.onrender.com/api/auth/facebook/callback`
      ); // Redirect on success
    } catch (err) {
      console.error(err.message);
      res.redirect(`/error?message=${encodeURIComponent("Server error")}`);
    }
  }
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  async (req, res) => {
    let user = req.user;

    try {
      if (!user) {
        console.error("missing required fields from Facebook Profile", user);
      }
      const { token, error } = await registerUser({
        name: user.displayName,
        email: user.emails[0].value,
        googleId: user.id,
      });

      if (error) {
        console.error(error);
        res.redirect(`/error?message=${encodeURIComponent("Server error")} `);
      }

      res.cookie("token", token, {
        httpOnly: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect(`https://tawasol-vite-application.vercel.app/`); // Redirect on success
    } catch (error) {
      console.error(error);
    }
    console.log("Facebook Auth Profile " + req.user.emails[0].value);
    console.log("Facebook Auth Profile " + req.user.displayName);
  }
);

router.get("/token", async (req, res) => {
  const myCookie = req.cookies["token"];

  if (!myCookie) {
    return res.status(401).send({ errors: [{ msg: "Token Not Found" }] });
  }
  console.log(`Token Is : ${myCookie}`);

  res.send({ token: myCookie });
});

router.delete("/token", async (req, res) => {
  try {
    res.clearCookie("token", { path: "/" }); // Specify the cookie name and path if needed
    res.status(200).send("Cookie deleted and user logged out");
  } catch (error) {
    console.error("Cant Delete Token");
  }
});

module.exports = router;

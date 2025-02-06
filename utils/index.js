const JWT = require("jsonwebtoken");

const config = require("config");

const bcrypt = require("bcryptjs");

const User = require("../models/User");

const multer = require("multer");

// Cloudinary
const cloudinary = require("cloudinary").v2;

const { CloudinaryStorage } = require("multer-storage-cloudinary");
// Cloudinary

const auth = (req, res, next) => {
  // Get The Token From The Requset Header

  const token = req.header("x-auth-token");

  if (!token) {
    return res
      .status(401)
      .json({ msg: "Token Is Not Available, Authorization Denied." });
  }

  try {
    JWT.verify(token, config.get("jwtSecret"), (error, decoded) => {
      if (error) {
        return res
          .status(401)
          .json({ msg: "Token Is Not Valid, Authorization Denied." });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
};

// Cloudinary Config
cloudinary.config({
  cloud_name: "dlfqbefjg",
  api_key: "816765676831465",
  api_secret: "1EXOoeU0nxescL_V5qWpTjDIW8A",
});
// Cloudinary Config

// Cloudinary Use
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    format: async (req, file) => "jpeg",
    public_id: (req, file) => `${req.user.id}`,
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("file");

async function registerUser({ name, email, password, googleId }) {
  try {
    // Check if the user already exists in the database
    let user = await User.findOne({ email });

    if (user) {
      const payload = {
        user: {
          id: user.id,
        },
      };

      const token = JWT.sign(payload, config.get("jwtSecret"), {
        expiresIn: "5d",
      });
      return { error: null, token: token };
    }

    // Create a new user
    user = new User({
      name: name,
      email: email,
      password: password, // This will be empty for Google users
      googleId: googleId, // Save the Google ID if they log in via Google
    });

    // Hash the password only if provided (not for Google users)
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Save the user to the database
    await user.save();

    // Create a JWT token for the new user
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = JWT.sign(payload, config.get("jwtSecret"), {
      expiresIn: "5d",
    });

    return { error: null, token, user }; // Return success
  } catch (err) {
    console.error(err.message);
    throw new Error("Server error");
  }
}

module.exports = { auth, upload, registerUser };

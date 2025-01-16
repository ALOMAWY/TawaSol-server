const JWT = require("jsonwebtoken");

const config = require("config");

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

// Cloudinary Use

// Old Use

// // const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/images/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${req.user.id}`);
//   },
// });

// Old Use

const upload = multer({
  storage: storage,
  // limits: { fileSize: 2 * 1024 * 1024 },
}).single("file");

// Old Use

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 2 * 1024 * 1024,
//   },
// }).single("file");

// Old Use

module.exports = { auth, upload };

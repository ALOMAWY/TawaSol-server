const JWT = require("jsonwebtoken");

const config = require("config");

const multer = require("multer");

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
}).single("file");

module.exports = { auth, upload };

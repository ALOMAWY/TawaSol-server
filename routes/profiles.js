const express = require("express");

const router = express.Router();

const { auth, upload } = require("../utils");

const { check, validationResult } = require("express-validator");

const normalize = require("normalize-url");

const Profile = require("../models/Profile");

const User = require("../models/User");

const Post = require("../models/Post");

/*
    POST /profiles                               // يُستخدم لإنشاء ملف تعريف جديد

    GET /profiles                                // يُستخدم للحصول على جميع ملفات التعريف

    GET /profiles/user/:user_id                  // يُستخدم للحصول على ملف تعريف مستخدم معين باستخدام معرفه

    DELETE /profiles                             // يُستخدم لحذف ملف تعريف

    POST /profiles/upload                        // يُستخدم لرفع ملفات معينة مرتبطة بملف التعريف

    PUT /profiles/experience                     // يُستخدم لتحديث تجربة العمل في ملف التعريف

    DELETE /profiles/experience/:exp_id          // يُستخدم لحذف تجربة عمل معينة باستخدام معرف التجربة

    PUT /profiles/education                      // يُستخدم لتحديث بيانات التعليم في ملف التعريف
    
    DELETE /profiles/education/:edu_id           // يُستخدم لحذف بيانات تعليمية معينة باستخدام معرف التعليم
*/

router.post(
  "/",
  auth,
  check("status", "Status Is Required").notEmpty(),
  check("skills", "Skills Is Required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      website,
      skills,
      youtube,
      twitter,
      instagram,
      location,
      linkedin,
      facebook,
      github,
      bio,
      ...rest
    } = req.body;

    const profile = {
      user: req.user.id,
      website:
        website && website !== ""
          ? normalize(website, { forceHttps: true })
          : "",
      skills: Array.isArray(skills)
        ? skills
        : skills
            .split(",")
            .filter((skill) => skill !== "")
            .map((skill) => skill.trim()),
      location,
      bio,
      ...rest,
    };

    const socialFileds = {
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      github,
    };

    for (let key in socialFileds) {
      const value = socialFileds[key];

      if (value && value !== "")
        socialFileds[key] = normalize(socialFileds[key], {
          forceHttps: true,
        });
    }

    profile.social = socialFileds;

    try {
      let profileObject = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profile },
        { new: true, upsert: true }
      );

      return res.json(profileObject);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

// Get My Profile

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name"]);

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

// Get All Profiles

router.get("/", auth, async (req, res) => {
  try {
    let profiles = await Profile.find().populate("user", ["name"]);

    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// Get Spefisc Profile

router.get("/user/:user_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name"]);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for the given user" });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

// Delete User

router.delete("/", auth, async (req, res) => {
  try {
    // remove  posts, profile, user
    await Promise.all([
      Post.deleteMany({ user: req.user.id }),
      Profile.findOneAndDelete({ user: req.user.id }),
      User.findOneAndDelete(req.user.id),
    ]);

    res.json({ msg: "User Information Deleted Successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// upload user picture

router.post("/upload", auth, async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        res.status(500).send(`Server Error: ${err}`);
      }
      const imageUrl = req.file.path;
      res
        .status(200)
        .json({ msg: "File Uploaded Successfully", imageUrl: imageUrl });
      // else {
      //   res.status(200).send(`${req.user.id}`);
      // }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

router.put(
  "/experience",
  auth,
  check("title", "Title is required").notEmpty(),
  check("company", "Company is required").notEmpty(),
  check("from", "From date is required")
    .notEmpty()
    .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(req.body);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.experience = profile.experience.filter((exp) => {
      return exp._id.toString() !== req.params.exp_id;
    });

    await profile.save();

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

router.put(
  "/education",
  auth,
  check("school", "School is required").notEmpty(),
  check("degree", "Degree is required").notEmpty(),
  check("fieldofstudy", "Field is required").notEmpty(),
  check("from", "from date is required")
    .notEmpty()
    .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(req.body);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    profile.education = profile.education.filter((edu) => {
      return edu._id.toString() !== req.params.edu_id;
    });

    await profile.save();

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;

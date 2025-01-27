const express = require("express");

const router = express.Router();

const { auth } = require("../utils");

const Post = require("../models/Post");

const User = require("../models/User");

const { check, validationResult } = require("express-validator");
const c = require("config");

/*
1. POST   /posts
2. GET    /posts
3. GET    /posts/:id
4. DELETE /posts/:id
5. PUT    /posts/like/:id
6. PUT    /posts/unlike/:id
7. POST   /posts/comment/:id
8. DELETE /posts/comment/:id/:comment_id
*/

router.post(
  "/",
  auth,
  check("text", "text is required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findById(req.user.id).select("-password");

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

router.get("/", auth, async (req, res) => {
  try {
    let posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    return res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// Like Api With Id

router.put("/like/:id", auth, async (req, res) => {
  try {
    const targetPost = await Post.findById(req.params.id);

    if (!targetPost) return res.status(404).json({ msg: "Post Not Found" });

    if (targetPost.likes.some((like) => like.user.toString() === req.user.id))
      return res.status(400).json({ msg: "Post Already Liked" });

    targetPost.likes.unshift({ user: req.user.id });

    await targetPost.save();

    return res.json(targetPost.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// Unlike Api With Id

router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const targetPost = await Post.findById(req.params.id);

    if (!targetPost) return res.status(404).json({ msg: "Post Not Found" });

    targetPost.likes = targetPost.likes.filter(
      (like) => like.user.toString() !== req.user.id
    );

    await targetPost.save();

    return res.json(targetPost.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// Add Comment API

router.post(
  "/comment/:id",
  auth,
  check("text", "text is required").notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id).select("-password");

      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      return res.json(post.comments);
    } catch (err) {
      console.error(err.message);

      res.status(500).send(err.message);
    }
  }
);

router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    if (!comment)
      return res.status(404).json({ msg: "Comment Dose Not Exist" });

    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "User Is Not Authorized" });

    post.comments = post.comments.filter(
      (comment) => comment.id !== req.params.comment_id
    );
    await post.save();

    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "post not found" });

    if (post.user.toString() !== req.user.id)
      return res
        .status(401)
        .json({ msg: "User Is Not Authorized To Remove This Post " });

    await Post.findByIdAndDelete(req.params.id);

    return res.json({ msg: "Post is removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});
module.exports = router;

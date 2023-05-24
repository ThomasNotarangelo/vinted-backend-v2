const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/encBase64");

const User = require("../models/User");

router.post("/user/signup", (req, res) => {
  try {
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);
    const { username, email, password, newsletter } = req.body;
    const newUser = new User({
      email,
      account: { username, avatar },
      password,
      newsletter,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

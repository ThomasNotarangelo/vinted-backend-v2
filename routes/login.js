const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-Base64");

const User = require("../models/User");

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(email, password);
    const user = await User.findOne({ email: email });
    // console.log(user);
    const salt = user.salt;
    // console.log(salt);
    const hash = user.hash;
    // console.log(hash);
    const newHash = SHA256(password + salt).toString(encBase64);
    // console.log(newHash);
    if (newHash === hash) {
    } else {
      res.status(400).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

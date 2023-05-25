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
    if (user) {
      const salt = user.salt;
      // console.log(salt);
      const hash = user.hash;
      // console.log(hash);
      const newHash = SHA256(password + salt).toString(encBase64);
      // console.log(newHash);
      const response = {
        id: user._id,
        token: user.token,
        account: user.account,
      };
      // console.log(response);

      if (newHash === hash) {
        res.status(200).json(response);
      } else {
        res.status(400).json({ message: "Unauthorized" });
      }
    } else {
      res.status(400).json({ message: "No user found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

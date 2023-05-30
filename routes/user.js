const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");

const User = require("../models/User");
const convertToBase64 = require("../utils/convertToBase64");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    let avatar = null;

    if (req.files?.picture) {
      const picture = req.files.picture;
      avatar = await cloudinary.uploader.upload(convertToBase64(picture), {
        folder: "/vinted-v2/users-avatars",
      });
    }
    const { username, email, password, newsletter } = req.body;
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(16);
    const userEmail = await User.findOne({ email: email });
    if (!userEmail) {
      if (username) {
        const newUser = new User({
          email,
          account: { username },
          password,
          newsletter,
          token,
          hash,
          salt,
        });

        if (avatar) {
          newUser.account.avatar = avatar;
        }
        await newUser.save();
        const response = {
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        };
        res.status(200).json(response);
      } else {
        res.status(400).json({ message: "Username missing" });
      }
    } else {
      res.status(400).json({ message: "This email is already used" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      const salt = user.salt;
      const hash = user.hash;
      const newHash = SHA256(password + salt).toString(encBase64);
      const response = {
        id: user._id,
        token: user.token,
        account: user.account,
      };
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

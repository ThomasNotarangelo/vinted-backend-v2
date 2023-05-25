const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-Base64");

const Offer = require("../models/Offer");

router.post("/offer/publish", (req, res) => {
  try {
    console.log("OK");
    console.log(req.body);
    res.status(200).json({ message: "OK" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

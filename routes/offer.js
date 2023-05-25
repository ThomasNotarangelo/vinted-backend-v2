const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");

router.post("/offer/publish", fileUpload(), (req, res) => {
  try {
    console.log(req.files);
    res.status(200).json({ message: "OK" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

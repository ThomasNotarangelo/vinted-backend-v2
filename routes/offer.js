const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const Offer = require("../models/Offer");
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/offer/publish", fileUpload(), async (req, res) => {
  try {
    // console.log(req.files);
    // console.log(convertToBase64(req.files.picture));
    const result = await cloudinary.uploader.upload(
      convertToBase64(req.files.picture)
    );
    // console.log(result);
    const { title, description, price, condition, city, brand, size, color } =
      req.body;
    // console.log(title, description, price, condition, city, brand, size, color);
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [condition, city, brand, size, color],
      product_image: result,
    });
    console.log(newOffer);
    // await newOffer.save();
    res.status(200).json({ message: "OK" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

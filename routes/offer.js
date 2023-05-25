const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");
const User = require("../models/User");
const Offer = require("../models/Offer");
const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
// console.log(convertToBase64(req.files.picture));

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log(req.user);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // console.log(title, description, price, condition, city, brand, size, color);
      const { picture } = req.files;
      // console.log(picture);
      if (!title || !description || !picture) {
        return res.status(400).json({ message: "Missing parameters" });
      }

      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );
      // console.log(result);

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
            TAILLE: size,
            ETAT: condition,
            COULEUR: color,
            EMPLACEMENT: city,
          },
        ],
        product_image: result,
        owner: req.user,
      });
      // console.log(newOffer);
      await newOffer.save();
      res.status(201).json({ message: "OK" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;

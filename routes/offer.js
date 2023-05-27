const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");

// console.log(convertToBase64(req.files.picture));

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.user);
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      // console.log(title, description, price, condition, city, brand, size, color);
      const picture = req.files.picture;
      // console.log(picture);
      if (!title || !description || !picture) {
        return res.status(400).json({ message: "Missing parameters" });
      }

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
        // product_image: result, Ne pas mettre cette clé
        owner: req.user,
      });
      const result = await cloudinary.uploader.upload(
        convertToBase64(picture),
        {
          folder: `/vinted-v2/offers/${newOffer._id}`,
        }
      );
      // console.log(result);
      newOffer.product_image = result;
      // console.log(newOffer);
      await newOffer.save();

      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put("/offer/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    // console.log("route: /offer/update"); // OK

    const {
      id,
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.body;
    console.log(req.body); // OK

    const offerToUpdate = await Offer.findById(id);
    // console.log(offerToUpdate); // OK
    // console.log(title); // OK
    if (title) {
      offerToUpdate.product_name = title;
    }
    if (description) {
      offerToUpdate.product_description = description;
    }
    if (price) {
      offerToUpdate.product_price = price;
    }
    if (brand) {
      offerToUpdate.product_details[0].MARQUE = brand;
    }
    if (size) {
      offerToUpdate.product_details[0].TAILLE = size;
    }
    // console.log(offerToUpdate.product_details[0].ETAT); // OK
    // console.log(condition); //OK
    if (condition) {
      offerToUpdate.product_details[0].ETAT = condition;
    }
    // console.log(color); // OK
    // console.log(offerToUpdate.product_details[0].COULEUR); // OK
    if (color) {
      offerToUpdate.product_details[0].COULEUR = color;
    }
    if (city) {
      offerToUpdate.product_details[0].EMPLACEMENT = city;
    }
    if (req.files && req.files.picture) {
      const picture = req.files.picture;
      if (picture) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(picture),
          {
            folder: `/vinted-v2/offers/${offerToUpdate._id}`,
          }
        );
        offerToUpdate.product_image = result;
      }
    }

    offerToUpdate.markModified("product_details");
    await offerToUpdate.save();
    res.status(200).json(offerToUpdate);
    // console.log(offerToUpdate); // OK
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete(
  "/offer/delete/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.params.id); // OK
      const id = req.params.id;
      // console.log(id); // OK
      const offer = await Offer.findById(id);
      // console.log(offer); // OK
      // console.log(offer.product_image.public_id); // OK
      const publicId = offer.product_image.public_id;
      // console.log(publicId); // OK
      const imageToDelete = await cloudinary.uploader.destroy(publicId);
      console.log(imageToDelete);
      const folderPath = `vinted-v2/offers/${id}`;
      // console.log(folderPath);
      const folderToDelete = await cloudinary.api.delete_folder(folderPath);
      console.log(folderToDelete);
      await Offer.findByIdAndDelete(id);
      res.status(200).json({ message: "Offer deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;

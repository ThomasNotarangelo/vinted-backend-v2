const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = require("../utils/convertToBase64");
const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      if (
        (title && title.length > 50) ||
        (description && description.length > 500)
      ) {
        return res
          .status(400)
          .json({ message: "Title or description too long" });
      }
      if (price > 10000) {
        return res.status(400).json({ message: "Price is too high" });
      }
      if (!title || !description || !req.files.picture) {
        return res.status(400).json({ message: "Missing parameters" });
      }

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        // product_image: result, Ne pas mettre cette clé
        owner: req.user,
      });
      // Si on ne reçoit qu'une image : req.files.picture n'est pas un tableau
      if (!Array.isArray(req.files.picture)) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          {
            folder: `/vinted-v2/offers/${newOffer._id}`,
          }
        );
        // Ajout de l'image dans newOffer
        newOffer.product_image = result;
        // Ajout de l'image à la clé product_pictures
        newOffer.product_pictures.push(result);
      } else {
        for (let i = 0; i < req.files.picture.length; i++) {
          const picture = req.files.picture[i];

          // Si je suis sur la première image du tableau
          if (i === 0) {
            const result = await cloudinary.uploader.upload(
              convertToBase64(picture),
              {
                folder: `/vinted-v2/offers/${newOffer._id}`,
              }
            );
            // Ajout de l'image dans newOffer
            newOffer.product_image = result;
            // Ajout de l'image à la clé product_pictures
            newOffer.product_pictures.push(result);
          } else {
            // Si il s'agit des images suivantes je les ajoutes
            const result = await cloudinary.uploader.upload(
              convertToBase64(picture),
              {
                folder: `/vinted-v2/offers/${newOffer._id}`,
              }
            );
            newOffer.product_pictures.push(result);
          }
        }
      }
      await newOffer.save();
      res.status(201).json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put("/offer/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
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
      pictureToDelete,
    } = req.body;

    const offerToUpdate = await Offer.findById(id);

    if (!offerToUpdate) {
      return res.status(400).json({ message: "Offer not found" });
    }
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
      offerToUpdate.product_details[1].TAILLE = size;
    }
    if (condition) {
      offerToUpdate.product_details[2].ETAT = condition;
    }
    if (color) {
      offerToUpdate.product_details[3].COULEUR = color;
    }
    if (city) {
      offerToUpdate.product_details[4].EMPLACEMENT = city;
    }
    if (pictureToDelete) {
      //  Supprimer l'image dans cloudinary en fonction du public_id reçu dans la requête
      await cloudinary.uploader.destroy(pictureToDelete);

      // Retirer l'image supprimée du tableau product_pictures
      offerToUpdate.product_pictures = offerToUpdate.product_pictures.filter(
        (picture) => picture.public_id !== pictureToDelete
      );
    }
    if (req.files?.picture) {
      const picture = req.files.picture;
      if (picture) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(picture),
          {
            folder: `/vinted-v2/offers/${offerToUpdate._id}`,
          }
        );
        // Ajouter la nouvelle image au tableau product_pictures
        offerToUpdate.product_pictures.push(result);
      }
    }
    // Pour empêcher le bug de save() causé par la modification d'un élément qui n'est pas explicitement prévu dans le modèle newOffer
    offerToUpdate.markModified("product_details");
    await offerToUpdate.save();
    res.status(200).json(offerToUpdate);
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
      const id = req.params.id;
      const offer = await Offer.findById(id);
      if (!offer) {
        return res.status(400).json({ message: "Offer not found" });
      }
      await cloudinary.api.delete_resources_by_prefix(`vinted-v2/offers/${id}`);
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

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    const sortElements = {};
    const { title, priceMin, priceMax, sort } = req.query;
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = {
        $gte: priceMin,
      };
    }
    if (priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = {
          $lte: priceMax,
        };
      }
    }
    if (sort === "price-desc") {
      sortElements.product_price = "desc";
    } else if (sort === "price-asc") {
      sortElements.product_price = "asc";
    }
    let limit = 5;
    if (req.query.limit) {
      limit = req.query.limit;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const skip = (page - 1) * limit;

    const numberOfOffers = await Offer.countDocuments();
    const result = await Offer.find(filters)
      .sort(sortElements)
      .skip(skip)
      .limit(limit);
    // .select("product_name product_price");  // Pour n'afficher que product_name et product_price lors de mes test postman
    res.status(200).json({ count: numberOfOffers, offers: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate("owner", "account");
    res.status(200).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

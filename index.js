const express = require("express");
const app = express();
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/vinted-v2");

const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ message: "page not found" });
});

app.listen(3000, () => {
  console.log("Server Started 🚀");
});

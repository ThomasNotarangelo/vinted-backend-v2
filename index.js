const express = require("express");
const app = express();
app.use(express.json());

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/vinted-v2");

const signupRoutes = require("./routes/signup");
app.use(signupRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ message: "page not found" });
});

app.listen(3000, () => {
  console.log("Server Started 🚀");
});

const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //   console.log("on rentre dans le middleware");
  //   console.log(req.headers.authorization.replace("Bearer ", ""));
  const token = req.headers.authorization.replace("Bearer ", "");
  const user = await User.findOne({ token: token });
  //   console.log(user);
  if (user) {
    req.user = user;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;

const jwt = require("jsonwebtoken");

const auth = (email) => {
  const token = jwt.sign({ email }, process.env.JWT_SECRET);
  return token;
};

module.exports = auth;

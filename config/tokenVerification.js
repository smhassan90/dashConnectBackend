const jwt = require('jsonwebtoken');

const tokenVerification = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .send({ message: "Access denied, no token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userIdFromToken = decoded.id; // Change email to user ID
    next();
  } catch (err) {
    return res.status(400).send({ message: "Invalid token." });
  }
};


module.exports = tokenVerification;

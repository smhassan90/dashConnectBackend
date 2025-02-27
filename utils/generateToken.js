import jwt from "jsonwebtoken";

export const generateToken = async (user) => {
  const token = await jwt.sign(
    { id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" }
  );
  return token;
};

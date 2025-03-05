import UserModel from "../../models/User.js"

export const deleteUsers = async (req, res) => {
    try {
      await UserModel.deleteMany({});
      res.status(200).json({ message: "All users have been deleted." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

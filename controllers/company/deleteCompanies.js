import companyModal from "../../models/Company.js";

export const deleteCompanies = async (req, res) => {
    try {
      await companyModal.deleteMany({});
      res.status(200).json({ message: "All companies have been deleted." });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

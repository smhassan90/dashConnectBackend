export const signUp = async(req,res) =>{
    try {
        const { firstName, lastName, email, companyName,  password , confirmPassword ,Status} = req.body;
    
        const company = await Company.create({
          companyName,
          updateDate,
          Status,
        });
    
        const hashedPassword = bcrypt.hashSync(password, 10);
    
        const user = await User.create({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          company: company,
        });
    
        res.status(201).json({ user });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
}
import mongoose from "mongoose";
import chalk from "chalk";

export const dbConnect = async () => {
  mongoose.connect(process.env.MONGOURI, {
    serverSelectionTimeoutMS: 30000,
  });

  const db = mongoose.connection;

  db.on("connected", () => {
    console.log(chalk.green("MongoDB successfully connected! 🚀"));
  });

  db.on("error", (err) => {
    console.log(chalk.red("MongoDB connection error:", err));
  });

  db.on("disconnected", () => {
    console.log(chalk.yellow("MongoDB disconnected!"));
  });
};

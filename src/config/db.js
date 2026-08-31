const mongoose = require("mongoose");

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected sucessfully..");
  } catch (error) {
    console.error("Database connection failed", error);
    process.exit(1);
  }
}

module.exports = connectDb;

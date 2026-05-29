const mongoose = require("mongoose");
require("dotenv").config();

const mongoUri = process.env.DB_URL || process.env.MONGO_URI;

async function dbConnect() {
  if (!mongoUri) {
    throw new Error("Missing MongoDB connection string. Add DB_URL=... to your .env file.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.log("Unable to connect to MongoDB Atlas!");
    console.error(error.message);
    throw error;
  }
}

module.exports = dbConnect;

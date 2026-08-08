const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vote_db');
    console.log(`[Vote Service] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Vote Service] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI,{
      family: 4
    });
    // this is for find error
    // console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("--- DETAILED MONGO ERROR START ---");
    console.dir(error, { depth: null }); // Prints the entire hidden error object
    console.error("--- DETAILED MONGO ERROR END ---");
    
    process.exit(1);
  }
};
module.exports = connectDB; // 
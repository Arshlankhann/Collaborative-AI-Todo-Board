const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://arshlank894:gjsFE78W7Sf9PIvk@cluster0.l9ouqim.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB Connected...');
  } catch (err) {
    console.error('❌ MongoDB connection error: ', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI as string;
let isConnected = false;

const DBConn = async () => {
  if (isConnected) {
    return;
  }

  if (!mongoURI) {
    return console.error('No MONGODB_URI found in env file.');
  }

  try {
    await mongoose.connect(mongoURI);
    isConnected = true;
    console.log('Connected to DB.');
  } catch (error) {
    console.error('Error connecting to DB', error);
  }
};

export default DBConn;

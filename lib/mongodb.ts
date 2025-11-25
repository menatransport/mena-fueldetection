import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI IN ENV");
}

let isConnected = false; 

export async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    isConnected = db.connection.readyState === 1;
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

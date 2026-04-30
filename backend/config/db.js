import mongoose from "mongoose"

const connectDb = async () => {
    const mongoUrl = process.env.MONGODB_URL

    if (!mongoUrl) {
        throw new Error("MONGODB_URL is missing from backend/.env")
    }

    try {
        await mongoose.connect(mongoUrl)
        console.log("db connected")
    } catch (error) {
        console.error("MongoDB connection failed:", error.message)
        throw error
    }
}

export default connectDb

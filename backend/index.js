
import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import geminiResponse from "./gemini.js"


const app = express()
const allowedOriginPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/
]

app.use(cors({
    origin: (origin, callback) => {
        const allowedFrontend = process.env.FRONTEND_URL;
        const isAllowed = !origin || 
                          (allowedFrontend && origin === allowedFrontend) ||
                          allowedOriginPatterns.some((pattern) => pattern.test(origin));

        if (isAllowed) {
            return callback(null, true)
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true
}))
const port = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)

try {
    await connectDb()
    app.listen(port, () => {
        console.log(`server started on port ${port}`)
    })
} catch (error) {
    process.exit(1)
}


import express from "express"
import { askToAssistant, clearAssistantMemory, clearUserHistory, getCurrentUser, updateAssistant, updateAssistantMode } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import geminiRateLimiter from "../middlewares/geminiRateLimiter.js"
import upload from "../middlewares/multer.js"

const userRouter=express.Router()

userRouter.get("/current",isAuth,getCurrentUser)
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant)
userRouter.patch("/mode",isAuth,updateAssistantMode)
userRouter.delete("/history",isAuth,clearUserHistory)
userRouter.delete("/memory",isAuth,clearAssistantMemory)
userRouter.post("/asktoassistant",isAuth,geminiRateLimiter(30),askToAssistant)

export default userRouter

import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const getAuthCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production"

    return {
        httpOnly: true,
        maxAge: AUTH_COOKIE_MAX_AGE,
        sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
        secure: isProduction
    }
}

const sanitizeUser = (user) => {
    if (!user) {
        return null
    }

    const userObject = typeof user.toObject === "function" ? user.toObject() : user
    const { password, ...safeUser } = userObject
    return safeUser
}

export const signUp=async (req,res)=>{
try {
    const {name,email,password}=req.body

    const existEmail=await User.findOne({email})
    if(existEmail){
        return res.status(400).json({message:"email already exists !"})
    }
    if(password.length<6){
        return res.status(400).json({message:"password must be at least 6 characters !"})
    }

    const hashedPassword=await bcrypt.hash(password,10)

    const user=await User.create({
        name,password:hashedPassword,email
    })

    const token=await genToken(user._id)

    res.cookie("token",token,getAuthCookieOptions())

    return res.status(201).json(sanitizeUser(user))

} catch (error) {
       return res.status(500).json({message:`sign up error ${error}`})
}
}

export const Login=async (req,res)=>{
try {
    const {email,password}=req.body

    const user=await User.findOne({email})
    if(!user){
        return res.status(400).json({message:"email does not exists !"})
    }
   const isMatch=await bcrypt.compare(password,user.password)

   if(!isMatch){
   return res.status(400).json({message:"incorrect password"})
   }

    const token=await genToken(user._id)

    res.cookie("token",token,getAuthCookieOptions())

    return res.status(200).json(sanitizeUser(user))

} catch (error) {
       return res.status(500).json({message:`login error ${error}`})
}
}

export const logOut=async (req,res)=>{
    try {
        const { httpOnly, sameSite, secure } = getAuthCookieOptions()
        res.clearCookie("token",{ httpOnly, sameSite, secure })
         return res.status(200).json({message:"log out successfully"})
    } catch (error) {
         return res.status(500).json({message:`logout error ${error}`})
    }
}
        

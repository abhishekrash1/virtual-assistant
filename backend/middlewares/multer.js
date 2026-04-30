import fs from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import multer from "multer"

const uploadDirectory = "./public"
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"])

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,uploadDirectory)
    },
    filename:(req,file,cb)=>{
        const extension = path.extname(file.originalname).toLowerCase()
        cb(null,`${randomUUID()}${extension}`)
    }
})

const upload=multer({
    storage,
    limits:{
        fileSize:5*1024*1024
    },
    fileFilter:(req,file,cb)=>{
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, and WEBP images are allowed"))
        }

        cb(null,true)
    }
})
export default upload

import mongoose from "mongoose";

const conversationEntrySchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { _id: false, timestamps: false })

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    assistantName:{
        type:String
    },
    assistantMode: {
        type: String,
        enum: ["general", "student", "pathfinder"],
        default: "general"
    },
     assistantImage:{
        type:String
    },
    history:[
        {type:String}
    ],
    conversationHistory: {
        type: [conversationEntrySchema],
        default: []
    },
    assistantMemory: {
        profile: {
            preferredName: {
                type: String,
                default: ""
            },
            location: {
                type: String,
                default: ""
            },
            profession: {
                type: String,
                default: ""
            },
            education: {
                type: String,
                default: ""
            }
        },
        preferences: {
            language: {
                type: String,
                default: ""
            },
            responseStyle: {
                type: String,
                default: ""
            }
        },
        likes: {
            type: [String],
            default: []
        },
        dislikes: {
            type: [String],
            default: []
        },
        goals: {
            type: [String],
            default: []
        },
        notes: {
            type: [String],
            default: []
        },
        updatedAt: {
            type: Date,
            default: null
        }
    }

},{timestamps:true})

const User=mongoose.model("User",userSchema)
export default User

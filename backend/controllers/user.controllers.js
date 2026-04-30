import uploadOnCloudinary from "../config/cloudinary.js"
import { normalizeAssistantMode } from "../assistantModes.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"
import { mergeAssistantMemory, extractAssistantMemoryUpdates } from "../assistantMemory.js"
import { appendConversationTurn, getRecentConversation } from "../conversationMemory.js"

const buildNaturalResponse = (type, userInput, response) => ({
   type,
   userInput,
   response
})
 export const getCurrentUser=async (req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
return res.status(400).json({message:"user not found"})
        }

   return res.status(200).json(user)     
    } catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }
}

export const updateAssistant=async (req,res)=>{
   try {
      const {assistantName,imageUrl}=req.body
      let assistantImage;
if(req.file){
   assistantImage=await uploadOnCloudinary(req.file.path)
}else{
   assistantImage=imageUrl
}

const user=await User.findByIdAndUpdate(req.userId,{
   assistantName,assistantImage
},{new:true}).select("-password")
return res.status(200).json(user)

      
   } catch (error) {
       return res.status(400).json({message:"updateAssistantError user error"}) 
   }
}

export const clearUserHistory = async (req, res) => {
   try {
      const user = await User.findByIdAndUpdate(
         req.userId,
         { history: [], conversationHistory: [] },
         { new: true }
      ).select("-password")

      if (!user) {
         return res.status(404).json({ message: "user not found" })
      }

      return res.status(200).json(user)
   } catch (error) {
      return res.status(400).json({ message: "clear history error" })
   }
}

export const updateAssistantMode = async (req, res) => {
   try {
      const assistantMode = normalizeAssistantMode(req.body?.assistantMode)

      const user = await User.findByIdAndUpdate(
         req.userId,
         { assistantMode },
         { new: true }
      ).select("-password")

      if (!user) {
         return res.status(404).json({ message: "user not found" })
      }

      return res.status(200).json(user)
   } catch (error) {
      return res.status(400).json({ message: "update assistant mode error" })
   }
}

export const clearAssistantMemory = async (req, res) => {
   try {
      const user = await User.findByIdAndUpdate(
         req.userId,
         {
            assistantMemory: {
               profile: {
                  preferredName: "",
                  location: "",
                  profession: "",
                  education: ""
               },
               preferences: {
                  language: "",
                  responseStyle: ""
               },
               likes: [],
               dislikes: [],
               goals: [],
               notes: [],
               updatedAt: null
            }
         },
         { new: true }
      ).select("-password")

      if (!user) {
         return res.status(404).json({ message: "user not found" })
      }

      return res.status(200).json(user)
   } catch (error) {
      return res.status(400).json({ message: "clear assistant memory error" })
   }
}


export const askToAssistant=async (req,res)=>{
   try {
      const command = typeof req.body?.command === "string" ? req.body.command.trim() : ""

      if (!command) {
         return res.status(400).json({ type: "general", response: "Please koi command likho ya bolo.", userInput: "" })
      }
      
      const user=await User.findById(req.userId);
      if (!user) {
         return res.status(404).json({message:"user not found"})
      }

      user.history.push(command)
      await user.save()
      const userName=user.name
      const assistantName=user.assistantName
      const assistantMode = user.assistantMode || "general"
      const result=await geminiResponse(command,assistantName,userName,user._id.toString(),{
         assistantMode,
         recentConversation: getRecentConversation({ conversationHistory: user.conversationHistory }),
         userMemory: user.assistantMemory
      })
      const sendAssistantReply = async (payload) => {
         try {
            user.conversationHistory = appendConversationTurn({
               conversationHistory: user.conversationHistory,
               userInput: command,
               assistantResponse: payload.response
            })

            const { memory, hasChanges } = mergeAssistantMemory(
               user.assistantMemory,
               extractAssistantMemoryUpdates(command)
            )

            if (hasChanges) {
               user.assistantMemory = memory
            }

            await user.save()
         } catch (persistError) {
            console.error("assistant context persistence error:", persistError.message)
         }

         return res.json(payload)
       }

       if (!result) {
          return sendAssistantReply({type: "general", response:"Main abhi us request ko process nahi kar paya. Ek baar phir bolo.", userInput: command})
       }

      // Try to extract JSON from the result
       const jsonMatch=result.match(/\{[\s\S]*\}/)
       if(!jsonMatch){
          console.error("No JSON found in provider response")
          return sendAssistantReply({type: "general", response:"Main abhi us baat ko theek se samajh nahi paya. Ek baar aur bol do.", userInput: command})
       }
       
       let gemResult;
       try {
          gemResult=JSON.parse(jsonMatch[0])
       } catch (parseError) {
          console.error("Provider JSON parse error:", parseError.message)
          return sendAssistantReply({type: "general", response:"Reply ko samajhne me thodi dikkat aa gayi. Dobara bol do.", userInput: command})
       }

       const type=gemResult.type

      switch(type){
         case 'get-date' :
            return sendAssistantReply(buildNaturalResponse(
               type,
               gemResult.userInput,
               `Aaj ki date ${moment().format("DD MMMM YYYY")} hai.`
            ));
            case 'get-time':
                return sendAssistantReply(buildNaturalResponse(
               type,
               gemResult.userInput,
               `Abhi ${moment().format("hh:mm A")} ho rahe hain.`
            ));
             case 'get-day':
                return sendAssistantReply(buildNaturalResponse(
               type,
               gemResult.userInput,
               `Aaj ${moment().format("dddd")} hai.`
            ));
            case 'get-month':
                return sendAssistantReply(buildNaturalResponse(
               type,
               gemResult.userInput,
               `Abhi ${moment().format("MMMM")} chal raha hai.`
            ));
      case 'google-search':
      case 'youtube-search':
      case 'youtube-play':
      case 'general':
      case  "calculator-open":
      case "instagram-open": 
       case "facebook-open": 
       case "weather-show" :
         return sendAssistantReply({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response,
         });

         default:
            return sendAssistantReply({type: "general", response: "Main us command ko action me convert nahi kar paya. Thoda aur clear bolo.", userInput: command})
      }
     

   } catch (error) {
  console.error("askToAssistant error:", error.message)
  return res.json({ type: "general", response: "Abhi thodi technical dikkat aa gayi. Ek second baad phir bolo.", userInput: req.body?.command || "" })
   }
}

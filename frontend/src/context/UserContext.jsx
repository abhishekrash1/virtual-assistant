import axios from 'axios'
import React, { createContext, useEffect, useState } from 'react'
export const userDataContext=createContext()
function UserContext({children}) {
    const serverUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
    const [userData,setUserData]=useState(null)
    const [frontendImage,setFrontendImage]=useState(null)
     const [backendImage,setBackendImage]=useState(null)
     const [selectedImage,setSelectedImage]=useState(null)
     const [isRequestInProgress, setIsRequestInProgress] = useState(false)
     const [lastRequestTime, setLastRequestTime] = useState(0)
     const [requestCount, setRequestCount] = useState(0)
     const [dailyUsage, setDailyUsage] = useState(() => {
        const stored = localStorage.getItem('gemini_daily_usage')
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                if (parsed.date === new Date().toDateString()) {
                    return parsed.count
                }
            } catch (e) {}
        }
        return 0
     })

     const incrementUsage = () => {
         setDailyUsage(prev => {
             const newCount = prev + 1
             localStorage.setItem('gemini_daily_usage', JSON.stringify({
                 date: new Date().toDateString(),
                 count: newCount
             }))
             return newCount
         })
     }
     
    const handleCurrentUser=async ()=>{
        try {
            const result=await axios.get(`${serverUrl}/api/user/current`,{withCredentials:true})
            setUserData(result.data)
        } catch (error) {
            if (error.response?.status === 401) {
              setUserData(null)
            }
        }
    }

    const getGeminiResponse=async (command)=>{
      // Prevent rapid successive requests
      if (isRequestInProgress) {
        console.warn("[Frontend] Request already in progress. Ignoring duplicate request.")
        return { type: "error", response: "Ek baar meri baat sun lo! I'm still processing. Please wait.", userInput: command };
      }

      // Check if user is spamming requests (more than 3 per 10 seconds)
      const now = Date.now()
      if (now - lastRequestTime < 3000) { // Minimum 3 seconds between requests
        console.warn("[Frontend] Too many requests. Please wait.", requestCount)
        return { type: "error", response: "Thoda slow karo! Requests bohot barni ho rahe ho. Wait a moment please.", userInput: command };
      }

      try {
        setIsRequestInProgress(true)
        setLastRequestTime(now)
        setRequestCount(prev => prev + 1)

        const result = await axios.post(`${serverUrl}/api/user/asktoassistant`, {command}, {withCredentials:true, timeout: 90000})
        
        if (result.data && result.data.type !== "error") {
            incrementUsage()
            handleCurrentUser().catch(() => {})
        }
        
        return result.data
      } catch (error) {
        console.error("[Frontend] Error:", error.message, error.response?.status)
        
        if (error.response?.status === 429) {
          const fallbackMessage = error.response?.data?.response || error.response?.data?.message || "Thoda wait karo! Mujhe break chahiye. Please try after 1 minute."
          return { 
            type: "rate-limit", 
            response: fallbackMessage, 
            userInput: command 
          };
        }

        if (error.response?.status === 401) {
          setUserData(null)
          return {
            type: "auth-error",
            response: "Session expire ho gayi hai. Please dubara sign in karo.",
            userInput: command
          }
        }
        
        if (error.response && error.response.data) {
           return error.response.data;
        }
        return { type: "error", response: "Sorry, I am facing some technical issues.", userInput: command };
      } finally {
        setIsRequestInProgress(false)
      }
    }

    useEffect(()=>{
      handleCurrentUser()
    },[])
    
    const value={
      serverUrl,userData,setUserData,backendImage,setBackendImage,frontendImage,setFrontendImage,selectedImage,setSelectedImage,getGeminiResponse,dailyUsage
    }
  return (
    <div>
    <userDataContext.Provider value={value}>
      {children}
      </userDataContext.Provider>
    </div>
  )
}

export default UserContext

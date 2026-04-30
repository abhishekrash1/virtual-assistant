import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
import HomeCodeWallpaper from '../components/HomeCodeWallpaper';
import AssistantModeToggle from '../components/AssistantModeToggle';
import PathFinderPanel from '../components/PathFinderPanel';
import { sanitizeAssistantDisplayText, sanitizeAssistantSpeechText } from '../utils/assistantText';

const buildRememberedFacts = (assistantMemory) => {
  if (!assistantMemory) {
    return []
  }

  const facts = []

  if (assistantMemory?.profile?.preferredName) {
    facts.push(`Calls you ${assistantMemory.profile.preferredName}`)
  }

  if (assistantMemory?.profile?.location) {
    facts.push(`Knows you're from ${assistantMemory.profile.location}`)
  }

  if (assistantMemory?.profile?.profession) {
    facts.push(`Remembers your work: ${assistantMemory.profile.profession}`)
  }

  if (assistantMemory?.preferences?.language) {
    facts.push(`Prefers ${assistantMemory.preferences.language} replies`)
  }

  if (assistantMemory?.likes?.length) {
    facts.push(`Likes ${assistantMemory.likes[0]}`)
  }

  if (assistantMemory?.goals?.length) {
    facts.push(`Goal: ${assistantMemory.goals[0]}`)
  }

  if (assistantMemory?.notes?.length) {
    facts.push(`Note: ${assistantMemory.notes[0]}`)
  }

  return facts.slice(0, 4)
}

function Home() {
  const {userData, serverUrl, setUserData, getGeminiResponse, dailyUsage} = useContext(userDataContext)
  const navigate = useNavigate()
  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [modeLoading, setModeLoading] = useState(false)
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const isProcessingRef = useRef(false)
  const synth = window.speechSynthesis
  const speechSessionRef = useRef(0)
  const speechTimeoutRef = useRef(null)
  const recognitionRestartTimeoutRef = useRef(null)
  const micBlockedUntilRef = useRef(0)
  const lastAssistantSpeechRef = useRef("")
  const lastSpeechFinishedAtRef = useRef(0)
  const isMountedRef = useRef(false)
  const listeningStartedAtRef = useRef(0)
  const heardSpeechDuringSessionRef = useRef(false)
  const rememberedFacts = buildRememberedFacts(userData?.assistantMemory)
  const assistantMode = userData?.assistantMode || "general"
  const isPathFinderMode = assistantMode === "pathfinder"

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {withCredentials: true})
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const handleClearMemory = async () => {
    try {
      const result = await axios.delete(`${serverUrl}/api/user/memory`, { withCredentials: true })
      setUserData(result.data)
    } catch (error) {
      console.log(error)
    }
  }

  const handleModeChange = async (nextMode) => {
    if (!userData || modeLoading || nextMode === assistantMode) {
      return
    }

    setModeLoading(true)
    try {
      const result = await axios.patch(
        `${serverUrl}/api/user/mode`,
        { assistantMode: nextMode },
        { withCredentials: true }
      )
      setUserText("")
      setAiText("")
      setUserData(result.data)
    } catch (error) {
      console.log(error)
    } finally {
      setModeLoading(false)
    }
  }

  const clearSpeechTimeout = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }
  }

  const clearRecognitionRestart = () => {
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current)
      recognitionRestartTimeoutRef.current = null
    }
  }

  const estimateSpeechDuration = (text = "") => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    return Math.max(5000, wordCount * 480 + 2500)
  }

  const buildSpeechChunks = (text, maxChunkLength = 220) => {
    const normalizedText = text.replace(/\s+/g, ' ').trim()
    if (!normalizedText) {
      return []
    }

    const chunks = []
    let currentChunk = ""

    const pushChunk = (value) => {
      const trimmedValue = value.trim()
      if (trimmedValue) {
        chunks.push(trimmedValue)
      }
    }

    const appendPiece = (piece) => {
      const trimmedPiece = piece.trim()
      if (!trimmedPiece) {
        return
      }

      if (trimmedPiece.length > maxChunkLength) {
        const words = trimmedPiece.split(/\s+/).filter(Boolean)
        for (const word of words) {
          const candidate = currentChunk ? `${currentChunk} ${word}` : word
          if (candidate.length <= maxChunkLength) {
            currentChunk = candidate
          } else {
            pushChunk(currentChunk)
            currentChunk = word
          }
        }
        return
      }

      const candidate = currentChunk ? `${currentChunk} ${trimmedPiece}` : trimmedPiece
      if (candidate.length <= maxChunkLength) {
        currentChunk = candidate
        return
      }

      pushChunk(currentChunk)
      currentChunk = trimmedPiece
    }

    const sentencePieces = normalizedText
      .split(/(?<=[.!?\u0964])\s+/u)
      .flatMap((sentence) => sentence.split(/(?<=[,;:])\s+/u))

    sentencePieces.forEach(appendPiece)
    pushChunk(currentChunk)

    return chunks
  }

  const canStartRecognition = () => {
    return (
      !isRecognizingRef.current &&
      !isProcessingRef.current &&
      !isSpeakingRef.current &&
      !synth.speaking &&
      !synth.pending &&
      Date.now() >= micBlockedUntilRef.current
    )
  }

  const scheduleRecognitionStart = (delay = 1500, retries = 8) => {
    clearRecognitionRestart()
    recognitionRestartTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return

      if (!canStartRecognition()) {
        if (retries > 0) {
          scheduleRecognitionStart(700, retries - 1)
        }
        return
      }

      try {
        recognitionRef.current?.start()
        console.log("Recognition requested to start")
      } catch (error) {
        if (error.name === "InvalidStateError" && retries > 0) {
          scheduleRecognitionStart(700, retries - 1)
        } else if (error.name !== "InvalidStateError") {
          console.error("Start error:", error)
        }
      }
    }, delay)
  }

  const startRecognition = ({ force = false } = {}) => {
    if (force) {
      clearRecognitionRestart()
      clearSpeechTimeout()
      speechSessionRef.current += 1
      micBlockedUntilRef.current = 0
      synth.cancel()
      isSpeakingRef.current = false
      isProcessingRef.current = false
    }

    if (!canStartRecognition()) {
      if (force) {
        scheduleRecognitionStart(300, 10)
      }
      return
    }

    try {
      recognitionRef.current?.start()
      console.log("Recognition requested to start")
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Start error:", error)
      }
    }
  }

  const handleManualWake = () => {
    startRecognition({ force: true })
  }

  const getMaleVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    const maleHindi = voices.find(v =>
      (v.lang === 'hi-IN' || v.lang === 'hi_IN') &&
      (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') || v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('karan'))
    )
    if (maleHindi) return { voice: maleHindi, lang: 'hi-IN' }

    const anyHindi = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi_IN')
    if (anyHindi) return { voice: anyHindi, lang: 'hi-IN' }

    const maleEn = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') ||
       v.name.toLowerCase().includes('mark') || v.name.toLowerCase().includes('james') ||
       v.name.toLowerCase().includes('guy') || v.name.toLowerCase().includes('richard'))
    )
    if (maleEn) return { voice: maleEn, lang: 'en-US' }

    const anyEn = voices.find(v => v.lang.startsWith('en'))
    if (anyEn) return { voice: anyEn, lang: 'en-US' }

    return { voice: null, lang: 'en-US' }
  }

  const speak = (text) => {
    if (!text) return
    const speechChunks = buildSpeechChunks(text)
    if (!speechChunks.length) return

    clearRecognitionRestart()
    clearSpeechTimeout()
    speechSessionRef.current += 1
    const currentSpeechSession = speechSessionRef.current
    lastAssistantSpeechRef.current = text
    micBlockedUntilRef.current = 0

    if (isRecognizingRef.current) {
      try {
        recognitionRef.current?.stop()
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.error("Recognition stop error:", error)
        }
      }
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.resume()
    
    const voices = window.speechSynthesis.getVoices()
    
    const trySpeak = () => {
      const { voice, lang } = getMaleVoice()
      isSpeakingRef.current = true

      const finalizeSpeech = () => {
        if (speechSessionRef.current !== currentSpeechSession) return

        clearSpeechTimeout()
        isSpeakingRef.current = false
        lastSpeechFinishedAtRef.current = Date.now()
        micBlockedUntilRef.current = Date.now() + 1400
        if (!isPathFinderMode) {
          setAiText("")
        }
        if (!isProcessingRef.current) {
          scheduleRecognitionStart(1400, 10)
        }
      }

      const speakChunk = (chunkIndex) => {
        if (speechSessionRef.current !== currentSpeechSession) return

        const chunkText = speechChunks[chunkIndex]
        if (!chunkText) {
          finalizeSpeech()
          return
        }

        const utterance = new SpeechSynthesisUtterance(chunkText)
        if (voice) {
          utterance.voice = voice
          utterance.lang = lang
        } else {
          utterance.lang = 'en-US'
        }

        utterance.onend = () => {
          if (speechSessionRef.current !== currentSpeechSession) return
          clearSpeechTimeout()

          if (chunkIndex === speechChunks.length - 1) {
            finalizeSpeech()
            return
          }

          setTimeout(() => {
            speakChunk(chunkIndex + 1)
          }, 80)
        }

        utterance.onerror = (event) => {
          console.error("SpeechSynthesisUtterance error", event)
          if (speechSessionRef.current !== currentSpeechSession) return
          window.speechSynthesis.cancel()
          setTimeout(finalizeSpeech, 100)
        }

        clearSpeechTimeout()
        speechTimeoutRef.current = setTimeout(() => {
          if (speechSessionRef.current !== currentSpeechSession) return
          console.warn("Speech chunk watchdog timeout reached")
          window.speechSynthesis.cancel()
          setTimeout(finalizeSpeech, 100)
        }, estimateSpeechDuration(chunkText) + 6000)

        window.speechSynthesis.resume()
        window.speechSynthesis.speak(utterance)
      }
      
      setTimeout(() => {
        if (speechSessionRef.current !== currentSpeechSession) return
        speakChunk(0)
      }, 100)
    }

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        trySpeak()
      }
    } else {
      trySpeak()
    }
  }

  const handleCommand = (data) => {
    if (!data) return
    const {type, userInput, response} = data
    const cleanResponse = sanitizeAssistantSpeechText(response)
    if (cleanResponse) speak(cleanResponse)

    if (type === 'google-search') {
      const query = encodeURIComponent(userInput || "")
      setTimeout(() => window.open(`https://www.google.com/search?q=${query}`, '_blank'), 500)
    }
    if (type === 'calculator-open') {
      setTimeout(() => window.open(`https://www.google.com/search?q=calculator`, '_blank'), 500)
    }
    if (type === "instagram-open") {
      setTimeout(() => window.open(`https://www.instagram.com/`, '_blank'), 500)
    }
    if (type === "facebook-open") {
      setTimeout(() => window.open(`https://www.facebook.com/`, '_blank'), 500)
    }
    if (type === "weather-show") {
      setTimeout(() => window.open(`https://www.google.com/search?q=weather`, '_blank'), 500)
    }
    if (type === 'youtube-search' || type === 'youtube-play') {
      const query = encodeURIComponent(userInput || "")
      setTimeout(() => window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank'), 500)
    }
  }

  useEffect(() => {
    if (!userData) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error("SpeechRecognition not supported in this browser")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'hi-IN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognitionRef.current = recognition
    isMountedRef.current = true

    const normalizeForEchoCheck = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
    const isAssistantEcho = (transcript) => {
      const timeSinceSpeechFinished = Date.now() - lastSpeechFinishedAtRef.current
      if (timeSinceSpeechFinished > 2500) return false

      const normalizedTranscript = normalizeForEchoCheck(transcript)
      const normalizedAssistantSpeech = normalizeForEchoCheck(lastAssistantSpeechRef.current)

      if (!normalizedTranscript || normalizedTranscript.length < 8 || !normalizedAssistantSpeech) {
        return false
      }

      if (normalizedAssistantSpeech.includes(normalizedTranscript) || normalizedTranscript.includes(normalizedAssistantSpeech)) {
        return true
      }

      const transcriptWords = normalizedTranscript.split(' ').filter(Boolean)
      const assistantWords = new Set(normalizedAssistantSpeech.split(' ').filter(Boolean))
      const matchingWords = transcriptWords.filter((word) => assistantWords.has(word)).length

      return transcriptWords.length >= 3 && matchingWords / transcriptWords.length >= 0.7
    }

    recognition.onstart = () => {
      isRecognizingRef.current = true
      listeningStartedAtRef.current = Date.now()
      heardSpeechDuringSessionRef.current = false
      setListening(true)
      console.log("Mic is listening...")
    }

    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      console.log("Recognition ended")
      const sessionDuration = Date.now() - listeningStartedAtRef.current
      const quickRestartDelay = !heardSpeechDuringSessionRef.current && sessionDuration < 2500 ? 250 : 700

      if (isMountedRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
        scheduleRecognitionStart(quickRestartDelay, 12)
      }
    }

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error)
      isRecognizingRef.current = false
      setListening(false)
      
      const restartErrors = ["no-speech", "network", "audio-capture"]
      
      if ((restartErrors.includes(event.error) || event.error !== "aborted") && isMountedRef.current && !isSpeakingRef.current) {
        const quickRestartDelay = event.error === "no-speech" ? 300 : 900
        scheduleRecognitionStart(quickRestartDelay, 10)
      }
    }

    recognition.onresult = async (e) => {
      let transcript = ""

      for (let index = e.resultIndex; index < e.results.length; index += 1) {
        const result = e.results[index]
        const spokenText = result[0]?.transcript?.trim()

        if (spokenText) {
          heardSpeechDuringSessionRef.current = true
        }

        if (result.isFinal && spokenText) {
          transcript = spokenText
        }
      }

      if (!transcript) {
        return
      }

      if (isAssistantEcho(transcript)) {
        console.log("Ignored assistant echo:", transcript)
        setUserText("")
        try {
          recognition.stop()
        } catch (error) {
          if (error.name !== "InvalidStateError") {
            console.error("Recognition stop error:", error)
          }
        }
        scheduleRecognitionStart(1800, 8)
        return
      }

      console.log("Heard:", transcript)
      setUserText(transcript)

      if (transcript.length > 0) {
        setAiText("")
        recognition.stop()
        isRecognizingRef.current = false
        setListening(false)
        isProcessingRef.current = true

        const data = await getGeminiResponse(transcript)
        isProcessingRef.current = false

        if (data) {
          setAiText(sanitizeAssistantDisplayText(data.response || ""))
          setUserText("")
          handleCommand(data)
        } else {
          setUserText("")
          speak("Sorry, I couldn't process that. Please try again.")
        }
      }
    }

    const playGreeting = () => {
      const greetText = assistantMode === "pathfinder"
        ? `Hello ${userData.name}, PathFinder Mode is active. Tell me your goal, interests, and current skills, and I will build your career roadmap.`
        : `Hello ${userData.name}, I am ${userData.assistantName}. What can I help you with?`
      const greeting = new SpeechSynthesisUtterance(greetText)

      const { voice, lang } = getMaleVoice()
      if (voice) {
        greeting.voice = voice
        greeting.lang = lang
      } else {
        greeting.lang = 'en-US'
      }

      isSpeakingRef.current = true
      greeting.onend = () => {
        isSpeakingRef.current = false
        lastSpeechFinishedAtRef.current = Date.now()
        micBlockedUntilRef.current = Date.now() + 1200
        if (isMountedRef.current) scheduleRecognitionStart(1200, 10)
      }
      greeting.onerror = () => {
        isSpeakingRef.current = false
        lastSpeechFinishedAtRef.current = Date.now()
        micBlockedUntilRef.current = Date.now() + 1200
        if (isMountedRef.current) scheduleRecognitionStart(1200, 10)
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(greeting)
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      playGreeting()
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null
        playGreeting()
      }
      setTimeout(() => {
        if (isMountedRef.current && isSpeakingRef.current === false && !isRecognizingRef.current) {
          playGreeting()
        }
      }, 1500)
    }

    return () => {
      isMountedRef.current = false
      clearRecognitionRestart()
      clearSpeechTimeout()
      speechSessionRef.current += 1
      if (recognitionRef.current) recognitionRef.current.stop()
      window.speechSynthesis.cancel()
      setListening(false)
      isRecognizingRef.current = false
      isSpeakingRef.current = false
      isProcessingRef.current = false
    }
  }, [userData?._id, userData?.name, userData?.assistantName, assistantMode])

  return (
    <div className='w-full h-[100vh] bg-transparent flex justify-center items-center flex-col gap-[15px] overflow-hidden relative isolate'>
      <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <HomeCodeWallpaper />
      </div>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] z-10' onClick={() => setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full overflow-y-auto bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)}/>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] px-[20px] py-[10px]' onClick={() => navigate("/customize")}>Customize your Assistant</button>
        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>
        <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
          {userData?.history?.map((his, i) => (
            <div key={i} className='text-gray-200 text-[18px] w-full h-[30px]'>{his}</div>
          ))}
        </div>
        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>Memory</h1>
        <div className='w-full flex flex-col gap-3'>
          {rememberedFacts.length ? rememberedFacts.map((fact, index) => (
            <div key={index} className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200'>
              {fact}
            </div>
          )) : (
            <div className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300'>
              Assistant abhi tak koi personal fact remember nahi kar raha.
            </div>
          )}
          <button
            className='min-w-[150px] h-[48px] text-black font-semibold bg-white rounded-full cursor-pointer text-[16px] disabled:cursor-not-allowed disabled:opacity-50'
            onClick={handleClearMemory}
            disabled={!rememberedFacts.length}
          >
            Clear Memory
          </button>
        </div>
      </div>

      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block' onClick={() => navigate("/customize")}>Customize your Assistant</button>
      <div className='absolute top-[20px] left-[20px] flex items-center gap-2'>
        <div className={`w-3 h-3 rounded-full ${listening || isProcessingRef.current ? 'bg-green-400 animate-pulse' : isSpeakingRef.current ? 'bg-blue-400' : 'bg-gray-500'}`}></div>
        <span className='text-gray-300 text-sm'>
          {isProcessingRef.current ? 'Thinking...' : listening ? 'Listening...' : isSpeakingRef.current ? 'Speaking...' : 'Idle'}
        </span>
        <button 
          onClick={handleManualWake}
          className='ml-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[12px] rounded-full border border-white/20 transition-all'
        >
          {listening ? "Restart" : "Wake Up"}
        </button>
      </div>

      <div className={`flex justify-center items-center overflow-hidden rounded-4xl shadow-lg ${isPathFinderMode ? 'h-[280px] w-[220px] sm:h-[340px] sm:w-[260px]' : 'h-[400px] w-[300px]'}`}>
        <img src={userData?.assistantImage} alt="" className='w-full h-full object-cover object-top'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      <AssistantModeToggle
        assistantMode={assistantMode}
        modeLoading={modeLoading}
        onModeChange={handleModeChange}
      />
      {!isPathFinderMode && !aiText && <img src={userImg} alt="" className='w-[200px]'/>}
      {!isPathFinderMode && aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
      {!isPathFinderMode && (
        <h1 className='text-white text-[18px] font-semibold text-wrap text-center px-4 whitespace-pre-line'>
          {userText ? userText : aiText ? aiText : null}
        </h1>
      )}
      {isPathFinderMode && <PathFinderPanel userText={userText} aiText={aiText} />}

      <div className='absolute bottom-4 left-0 w-full flex justify-center px-4'>
        <div className='bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex gap-4 items-center'>
            <div className='flex items-center gap-2'>
                <div className={`w-2 h-2 rounded-full ${listening ? 'bg-green-400 animate-ping' : isProcessingRef.current ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className='text-[12px] text-gray-300 font-medium uppercase tracking-wider'>
                    {isProcessingRef.current ? 'Thinking...' : listening ? 'Hearing...' : isSpeakingRef.current ? 'Speaking...' : 'Ready'}
                </span>
            </div>
            {userText && <div className='h-4 w-[1px] bg-white/20'></div>}
            {userText && (
                <span className='text-[12px] text-white/60 italic truncate max-w-[200px]'>
                    Heard: "{userText}"
                </span>
            )}
        </div>
      </div>

      <div className='absolute bottom-[20px] right-[20px] bg-black/40 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg flex flex-col items-end'>
        <span className='text-[10px] text-gray-400 uppercase tracking-wider mb-1'>Today's API Usage</span>
        <div className='flex items-end gap-1'>
            <span className='text-xl text-green-400 font-bold leading-none'>{dailyUsage || 0}</span>
            <span className='text-sm text-gray-400 leading-none'>/ 20</span>
        </div>
      </div>
    </div>
  )
}

export default Home

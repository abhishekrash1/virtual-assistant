import React, { useContext, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import axios from 'axios'
import { MdKeyboardBackspace } from "react-icons/md";
import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiSparkling2Line } from "react-icons/ri";
import AnimatedBackground from '../components/AnimatedBackground';
function Customize2() {
    const {userData,backendImage,frontendImage,selectedImage,serverUrl,setUserData}=useContext(userDataContext)
    const [assistantName,setAssistantName]=useState(userData?.assistantName || "")
    const [loading,setLoading]=useState(false)
    const navigate=useNavigate()
    const selectedPreview = frontendImage || selectedImage

    const handleUpdateAssistant=async ()=>{
        setLoading(true)
        try {
            let formData=new FormData()
            formData.append("assistantName",assistantName)
            if(backendImage){
                 formData.append("assistantImage",backendImage)
            }else{
                formData.append("imageUrl",selectedImage)
            }
            const result=await axios.post(`${serverUrl}/api/user/update`,formData,{withCredentials:true})
setLoading(false)
            console.log(result.data)
            setUserData(result.data)
            navigate("/")
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

  return (
    <div className='relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8'>
        <AnimatedBackground variant="setup" />
        <div className='relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6'>
          <div className='flex items-center justify-between'>
            <button className='inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-white/10' onClick={()=>navigate("/customize")}>
              <MdKeyboardBackspace className='h-5 w-5' />
              Back
            </button>
            <div className='hidden rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 sm:inline-flex'>
              Step 2 of 2
            </div>
          </div>

          <div className='grid gap-6 lg:grid-cols-[0.85fr_1.15fr]'>
            <aside className='glass-panel glow-border relative overflow-hidden rounded-[32px] px-5 py-6 sm:px-6 sm:py-8'>
              <div className='absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-500/10' />
              <div className='relative z-10 flex h-full flex-col gap-5'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Preview</p>
                  <h2 className='mt-2 text-2xl font-semibold'>Assistant identity</h2>
                  <p className='mt-3 text-sm leading-7 text-slate-300'>
                    Final step: give your assistant a memorable name before entering the live voice experience.
                  </p>
                </div>

                <div className='glass-panel relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[28px] p-4'>
                  <div className='assistant-halo' />
                  <div className='assistant-halo assistant-halo--secondary' />
                  {selectedPreview ? (
                    <img src={selectedPreview} alt="Assistant preview" className='relative z-10 h-[320px] w-full rounded-[24px] object-cover object-top' />
                  ) : (
                    <div className='relative z-10 flex h-full w-full items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-white/5 text-slate-400'>
                      No image selected
                    </div>
                  )}
                </div>
              </div>
            </aside>

            <section className='glass-panel glow-border relative overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-8'>
              <div className='absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-cyan-400/10' />
              <div className='relative z-10 flex h-full flex-col justify-between gap-6'>
                <div className='space-y-4'>
                  <div className='inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100'>
                    <RiSparkling2Line />
                    Naming your assistant
                  </div>
                  <div>
                    <h1 className='text-3xl font-semibold sm:text-4xl'>Enter your assistant name</h1>
                    <p className='mt-3 max-w-2xl text-sm leading-7 text-slate-300'>
                      Choose a name that sounds memorable on stage and feels natural when the assistant greets you back.
                    </p>
                  </div>
                </div>

                <div className='space-y-5'>
                  <label className='space-y-2'>
                    <span className='text-sm font-medium text-slate-200'>Assistant name</span>
                    <input type="text" placeholder='Eg. Nova, Shifra, Astra' className='w-full rounded-2xl border border-white/12 bg-white/6 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/60 focus:bg-white/10' required onChange={(e)=>setAssistantName(e.target.value)} value={assistantName}/>
                  </label>

                  <div className='rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4 text-sm leading-6 text-slate-300'>
                    Demo tip: short names like <span className='font-semibold text-cyan-200'>Nova</span>, <span className='font-semibold text-cyan-200'>Aira</span>, or <span className='font-semibold text-cyan-200'>Shifra</span> usually sound better in voice responses.
                  </div>
                </div>

                {assistantName &&  <button className='inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 text-base font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70' disabled={loading} onClick={()=>{
                  handleUpdateAssistant()
                }} >{!loading?"Finally Create Your Assistant":"Loading..."} {!loading && <RiArrowRightLine className='text-lg' />}</button>}
              </div>
            </section>
          </div>
        </div>
    </div>
  )
}

export default Customize2

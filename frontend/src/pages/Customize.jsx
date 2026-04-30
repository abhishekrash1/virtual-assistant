import React, { useContext, useRef, useState } from 'react'
import Card from '../components/Card'
import image1 from "../assets/image1.png"
import image2 from "../assets/image2.jpg"
import image3 from "../assets/authBg.png"
import image4 from "../assets/image4.png"
import image5 from "../assets/image5.png"
import image6 from "../assets/image6.jpeg"
import image7 from "../assets/image7.jpeg"
import { RiImageAddLine } from "react-icons/ri";
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { MdKeyboardBackspace } from "react-icons/md";
import { RiArrowRightLine, RiSparkling2Line } from "react-icons/ri";
import AnimatedBackground from '../components/AnimatedBackground';
function Customize() {
  const {serverUrl,userData,setUserData,backendImage,setBackendImage,frontendImage,setFrontendImage,selectedImage,setSelectedImage}=useContext(userDataContext)
  const navigate=useNavigate()
     const inputImage=useRef()

     const handleImage=(e)=>{
const file=e.target.files[0]
setBackendImage(file)
setFrontendImage(URL.createObjectURL(file))
     }
  const selectedPreview = frontendImage || selectedImage
  return (
    <div className='relative min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8'>
        <AnimatedBackground variant="setup" />
        <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6'>
          <div className='flex items-center justify-between'>
            <button className='inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition hover:bg-white/10' onClick={()=>navigate("/")}>
              <MdKeyboardBackspace className='h-5 w-5' />
              Back
            </button>
            <div className='hidden rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 sm:inline-flex'>
              Step 1 of 2
            </div>
          </div>

          <div className='grid gap-6 xl:grid-cols-[1.3fr_0.7fr]'>
            <section className='glass-panel glow-border relative rounded-[32px] px-5 py-6 sm:px-8 sm:py-8'>
              <div className='absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-500/10' />
              <div className='relative z-10'>
                <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200'>Customize assistant</p>
                    <h1 className='mt-2 text-3xl font-semibold sm:text-4xl'>Select your assistant image</h1>
                    <p className='mt-3 max-w-2xl text-sm leading-7 text-slate-300'>
                      Pick a ready-made avatar or upload your own image to create a more personalized demo experience.
                    </p>
                  </div>
                  <div className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/35 px-4 py-2 text-sm text-slate-200'>
                    <RiSparkling2Line className='text-cyan-300' />
                    Final look starts here
                  </div>
                </div>

                <div className='flex flex-wrap justify-center gap-4 lg:justify-start'>
                  <Card image={image1}/>
                  <Card image={image2}/>
                  <Card image={image3}/>
                  <Card image={image4}/>
                  <Card image={image5}/>
                  <Card image={image6}/>
                  <Card image={image7}/>
                  <div className={`group relative flex h-[152px] w-[88px] items-center justify-center overflow-hidden rounded-[28px] border bg-slate-950/60 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/70 hover:shadow-[0_28px_60px_rgba(6,182,212,0.2)] sm:h-[200px] sm:w-[118px] lg:h-[270px] lg:w-[160px] ${selectedImage=="input"?"border-cyan-300 shadow-[0_28px_60px_rgba(6,182,212,0.28)]":"border-white/10"}` } onClick={()=>{
        inputImage.current.click()
        setSelectedImage("input")
     }}>
                    {!frontendImage && (
                      <div className='flex flex-col items-center gap-3 text-center'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200'>
                          <RiImageAddLine className='h-6 w-6' />
                        </div>
                        <span className='px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300'>Upload</span>
                      </div>
                    )}
                    {frontendImage && <img src={frontendImage} className='h-full w-full object-cover object-top'/>}
                    <div className='absolute inset-x-0 bottom-0 p-3'>
                      <div className='rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-200 backdrop-blur-md'>
                        Custom image
                      </div>
                    </div>
                  </div>
                  <input type="file" accept='image/*' ref={inputImage} hidden onChange={handleImage}/>
                </div>
              </div>
            </section>

            <aside className='glass-panel glow-border relative rounded-[32px] px-5 py-6 sm:px-6 sm:py-8'>
              <div className='absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-cyan-400/10' />
              <div className='relative z-10 flex h-full flex-col gap-6'>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-[0.28em] text-slate-400'>Live preview</p>
                  <h2 className='mt-2 text-2xl font-semibold'>Your assistant style</h2>
                  <p className='mt-3 text-sm leading-7 text-slate-300'>
                    {selectedPreview ? "Nice choice — this look will be used as the assistant preview on the home screen." : "Choose any avatar to unlock the next step and set the assistant name."}
                  </p>
                </div>

                <div className='glass-panel relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] p-5'>
                  <div className='assistant-halo' />
                  <div className='assistant-halo assistant-halo--secondary' />
                  {selectedPreview ? (
                    <img src={selectedPreview} alt="Selected assistant preview" className='relative z-10 h-[300px] w-full rounded-[24px] object-cover object-top' />
                  ) : (
                    <div className='relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-white/15 bg-white/5 text-center text-slate-400'>
                      <RiImageAddLine className='h-10 w-10 text-cyan-300' />
                      <p className='max-w-[220px] text-sm leading-6'>Select an image to preview how your assistant will look in the demo.</p>
                    </div>
                  )}
                </div>

                {selectedImage && (
                  <button className='inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 text-base font-semibold text-slate-950 transition hover:scale-[1.01]' onClick={()=>navigate("/customize2")}>
                    Continue
                    <RiArrowRightLine className='text-lg' />
                  </button>
                )}
              </div>
            </aside>
          </div>
        </div>
    </div>
  )
}

export default Customize

import React, { useContext } from 'react'
import { userDataContext } from '../context/UserContext'
import { IoCheckmarkCircle } from "react-icons/io5";

function Card({image}) {
      const { setBackendImage, setFrontendImage, selectedImage, setSelectedImage } = useContext(userDataContext)
      const isSelected = selectedImage === image
  return (
    <div
      className={`group relative w-[88px] h-[152px] sm:w-[118px] sm:h-[200px] lg:w-[160px] lg:h-[270px] overflow-hidden rounded-[28px] border bg-slate-950/60 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/70 hover:shadow-[0_28px_60px_rgba(6,182,212,0.2)] ${isSelected ? "border-cyan-300 shadow-[0_28px_60px_rgba(6,182,212,0.28)]" : "border-white/10"}`}
      onClick={()=>{
        setSelectedImage(image)
        setBackendImage(null)
        setFrontendImage(null)
        }}
    >
      <img src={image} alt="assistant option" className='h-full w-full object-cover object-top transition duration-500 group-hover:scale-105' />
      <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-80' />
      <div className='absolute inset-x-0 bottom-0 p-3'>
        <div className='rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-200 backdrop-blur-md'>
          Voice look
        </div>
      </div>
      <div className={`absolute right-3 top-3 transition ${isSelected ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"}`}>
        <IoCheckmarkCircle className='h-8 w-8 text-cyan-300 drop-shadow-[0_0_18px_rgba(103,232,249,0.7)]' />
      </div>
    </div>
  )
}

export default Card

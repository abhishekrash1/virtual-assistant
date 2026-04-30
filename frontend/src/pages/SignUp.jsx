import React, { useContext, useState } from 'react'
import { IoEye, IoEyeOff } from "react-icons/io5";
import { RiArrowRightLine, RiSparkling2Line } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import { userDataContext } from '../context/UserContext';
import axios from "axios"
import CodeBackdrop from '../components/CodeBackdrop';

function SignUp() {
  const [showPassword,setShowPassword]=useState(false)
  const {serverUrl,setUserData}=useContext(userDataContext)
  const navigate=useNavigate()
  const [name,setName]=useState("")
  const [email,setEmail]=useState("")
    const [loading,setLoading]=useState(false)
    const [password,setPassword]=useState("")
const [err,setErr]=useState("")
  const handleSignUp=async (e)=>{
    e.preventDefault()
    setErr("")
    setLoading(true)
try {
  let result=await axios.post(`${serverUrl}/api/auth/signup`,{
    name,email,password
  },{withCredentials:true} )
 setUserData(result.data)
  setLoading(false)
  navigate("/customize")
} catch (error) {
  console.log(error)
  setUserData(null)
  setLoading(false)
  setErr(
    error.response?.data?.message ||
    error.message ||
    "Sign up failed. Make sure backend is running on http://localhost:8000."
  )
}
    }
  return (
    <div className='relative min-h-screen overflow-hidden text-white'>
      <CodeBackdrop />

      <div className='relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6'>
        <form className='glass-panel glow-border relative flex w-full max-w-[460px] flex-col gap-5 overflow-hidden rounded-[32px] px-6 py-7 sm:px-8 sm:py-8' onSubmit={handleSignUp}>
          <div className='absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-blue-500/10' />

          <div className='relative z-10 flex flex-col gap-5'>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/10 text-cyan-100'>
                <RiSparkling2Line className='text-xl' />
              </div>
              <div>
                <p className='text-xs uppercase tracking-[0.28em] text-slate-400'>Virtual Assistant</p>
                <h1 className='mt-1 text-3xl font-semibold text-white'>Sign Up</h1>
              </div>
            </div>

            <label className='space-y-2'>
              <span className='text-sm font-medium text-slate-200'>Name</span>
              <input
                type="text"
                placeholder='Enter your name'
                className='w-full rounded-2xl border border-white/12 bg-white/6 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/60 focus:bg-white/10'
                required
                onChange={(e)=>setName(e.target.value)}
                value={name}
              />
            </label>

            <label className='space-y-2'>
              <span className='text-sm font-medium text-slate-200'>Email</span>
              <input
                type="email"
                placeholder='Enter your email'
                className='w-full rounded-2xl border border-white/12 bg-white/6 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/60 focus:bg-white/10'
                required
                onChange={(e)=>setEmail(e.target.value)}
                value={email}
              />
            </label>

            <label className='space-y-2'>
              <span className='text-sm font-medium text-slate-200'>Password</span>
              <div className='relative rounded-2xl border border-white/12 bg-white/6 transition focus-within:border-cyan-300/60 focus-within:bg-white/10'>
                <input
                  type={showPassword?"text":"password"}
                  placeholder='Create a password'
                  className='w-full rounded-2xl bg-transparent px-5 py-4 pr-14 text-base text-white outline-none placeholder:text-slate-400'
                  required
                  onChange={(e)=>setPassword(e.target.value)}
                  value={password}
                />
                {!showPassword && <IoEye className='absolute top-1/2 right-5 h-6 w-6 -translate-y-1/2 text-white/80 cursor-pointer' onClick={()=>setShowPassword(true)}/>}
                {showPassword && <IoEyeOff className='absolute top-1/2 right-5 h-6 w-6 -translate-y-1/2 text-white/80 cursor-pointer' onClick={()=>setShowPassword(false)}/>}
              </div>
            </label>

            {err.length>0 && (
              <p className='rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
                {err}
              </p>
            )}

            <button
              className='mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 text-base font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70'
              disabled={loading}
            >
              <RiSparkling2Line className='text-lg' />
              {loading?"Loading...":"Sign Up"}
              {!loading && <RiArrowRightLine className='text-lg' />}
            </button>

            <p className='text-center text-sm text-slate-300'>
              Already have an account?{" "}
              <button className='font-semibold text-cyan-300 transition hover:text-cyan-200' onClick={()=>navigate("/signin")} type="button">
                Sign In
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUp

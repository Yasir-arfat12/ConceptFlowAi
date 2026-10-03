import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Eye, EyeOff, MapPin, Calendar, Hash, Command } from 'lucide-react';

import { useApp } from '../store/AppStore';

// --- Starfall Canvas Background (Shooting Upwards) ---
function StarfallCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = 0;
    let height = 0;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReduced = mediaQuery.matches;

    const particles = [];
    const particleCount = window.innerWidth < 768 ? 180 : 500; // fewer gradients per frame on phones

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: Math.random() * 120 + 60, // 60px to 180px long
          speed: Math.random() * 1.5 + 0.8, // 0.8 to 2.3 speed (decreased)
          opacity: Math.random() * 0.35 + 0.15, // 15% to 50% opacity
          isStatic: Math.random() > 0.7 // 70% streaks, 30% twinkling points
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        if (p.isStatic) {
          // Static point
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fill();
        } else {
          // Upward streak (head is at y, tail goes down to y + length)
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.length);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1.5; // Slightly thinner
          ctx.stroke();

          if (!isReduced) {
            p.y -= p.speed; // Move UP
            if (p.y + p.length < 0) { // Off screen top
              // Recycle to bottom
              p.y = height + Math.random() * 100;
              p.x = Math.random() * width;
            }
          }
        }
      });

      if (!isReduced) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', resize);
    resize();
    initParticles();

    if (isReduced) {
      draw(); // Draw static frame once
    } else {
      draw(); // Start loop
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={-1}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}

export default function AuthPage({ navigateTo }) {
  const { dispatch } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);
  const submitTimer = useRef(null);
  useEffect(() => () => clearTimeout(submitTimer.current), []);

  const handleToggle = () => {
    setAnimating(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setError('');
      setAnimating(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const f = new FormData(e.currentTarget);
    const data = Object.fromEntries(f.entries());

    if (!isLogin) {
      if (data.password.length < 8) return setError('Password must be at least 8 characters.');
      if (data.password !== data.confirm) return setError('Passwords do not match.');
      const age = Number(data.age);
      if (data.age && (age < 5 || age > 120)) return setError('Please enter a valid age.');
      data.name = `${data.firstName} ${data.lastName}`.trim();
    }
    setError('');
    setSubmitting(true);
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Authentication failed');
      }

      if (!isLogin) {
        // Switch to login view after successful signup
        setIsLogin(true);
        setSubmitting(false);
        return;
      }

      const { user } = await res.json();
      dispatch({ type: 'user/login', name: user.name });
      navigateTo('dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const socialSignIn = () => setError('Social sign-in is not configured yet. Use email and password.');

  return (
    <div className="relative min-h-dvh bg-black flex items-center justify-center overflow-x-hidden overflow-y-auto px-4 py-8 font-sans text-white">
      {/* Upward Shooting Star Background */}
      <StarfallCanvas />

      {/* Auth Container (Transparent Card) */}
      <div className="relative z-10 w-full max-w-[440px] p-6 sm:p-10 bg-transparent border border-white/10 rounded-3xl shadow-2xl">

        <div className={`transition-opacity duration-300 ${animating ? 'opacity-0' : 'opacity-100'}`}>
          {/* Header */}
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Command className="w-6 h-6 text-black" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
              {isLogin ? 'Welcome Back!' : 'Create an Account'}
            </h1>
            <p className="text-white/50 text-[15px]">
              {isLogin ? 'Log in to continue your adventure.' : 'Sign up to start your journey.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {!isLogin && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="auth-firstName" className="block text-sm font-medium text-white/90 mb-2">First Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                      <input id="auth-firstName" name="firstName" 
                        type="text"
                        placeholder="John"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="auth-lastName" className="block text-sm font-medium text-white/90 mb-2">Last Name</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                      <input id="auth-lastName" name="lastName" 
                        type="text"
                        placeholder="Doe"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="auth-age" className="block text-sm font-medium text-white/90 mb-2">Age</label>
                    <div className="relative flex items-center">
                      <Hash className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                      <input id="auth-age" name="age" 
                        type="number"
                        placeholder="18"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex-[2]">
                    <label htmlFor="auth-dob" className="block text-sm font-medium text-white/90 mb-2">Date of Birth</label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                      <input id="auth-dob" name="dob" 
                        type="date"
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&::-webkit-calendar-picker-indicator]:invert-[0.7]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-address" className="block text-sm font-medium text-white/90 mb-2">Address</label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                    <input id="auth-address" name="address" 
                      type="text"
                      placeholder="123 Main St, City, Country"
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                <input id="auth-email" name="email" autoComplete="email" 
                  type="email"
                  placeholder="yourmail@gmail.com"
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#0A0A0A] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-white/90 mb-2">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                <input id="auth-password" name="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="•••••••••••"
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#0A0A0A] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 text-white/40 hover:text-white transition-colors outline-none focus:outline-none border-none bg-transparent"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input (Only for Sign Up) */}
            {!isLogin && (
              <div>
                <label htmlFor="auth-confirm" className="block text-sm font-medium text-white/90 mb-2">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-5 h-5 text-white/40" aria-hidden="true" />
                  <input id="auth-confirm" name="confirm" 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="•••••••••••"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#0A0A0A] [&:-webkit-autofill]:[-webkit-text-fill-color:white]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-4 text-white/40 hover:text-white transition-colors outline-none focus:outline-none border-none bg-transparent"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            )}

            {/* Options */}
            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="sr-only peer" />
                  <div className="w-4 h-4 rounded border border-white/20 bg-transparent flex items-center justify-center group-hover:border-white/40 peer-checked:bg-white peer-checked:border-white peer-focus-visible:ring-2 peer-focus-visible:ring-white/50 transition-colors"></div>
                  <span className="text-white/60 group-hover:text-white transition-colors">Remember me</span>
                </label>
                <button type="button" onClick={() => setError('Password reset is not available yet. Contact support to reset your password.')} className="text-white/60 hover:text-white transition-colors font-medium bg-transparent border-none">
                  Forgot Password?
                </button>
              </div>
            )}

            {error && <p role="alert" className="text-sm text-[#F43F5E]">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white hover:bg-gray-200 disabled:opacity-60 disabled:cursor-wait font-medium rounded-xl py-3.5 mt-2 transition-colors cursor-pointer text-[15px] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              style={{ color: '#000000' }}
            >
              {submitting ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
            </button>

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 py-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-sm text-white/40">Or continue with</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* Social Logins */}
            <div className="flex gap-4">
              <button type="button" onClick={socialSignIn} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#0A0A0A] hover:bg-[#121212] border border-white/10 rounded-xl transition-colors font-medium text-[15px] text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button type="button" onClick={socialSignIn} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#0A0A0A] hover:bg-[#121212] border border-white/10 rounded-xl transition-colors font-medium text-[15px] text-white">
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.09 2.88.68 3.73 1.95-3.29 1.83-2.73 6.01.4 7.23-.74 1.77-1.68 3.41-2.8 4.75zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-white/50 mt-10">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={handleToggle}
              className="text-white hover:underline font-medium cursor-pointer bg-transparent border-none p-0 m-0"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}

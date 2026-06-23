import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import { AppView } from "../types";

interface AuthScreenProps {
  onSuccess: (fullName: string) => void;
  onNavigate: (view: AppView) => void;
}

export default function AuthScreen({ onSuccess, onNavigate }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (isSignUp && !fullName) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      const name = isSignUp ? fullName : "Career Professional";
      onSuccess(name);
      onNavigate("overview");
    }, 1200);
  };

  return (
    <div className="login-canvas w-full min-h-screen grid grid-cols-1 md:grid-cols-[1.2fr_1fr] bg-[#fbf9f9] text-[#1b1c1c] font-sans selection:bg-[#beead1] selection:text-[#436b58]">
      {/* Visual Anchor Column (Desktop Only) */}
      <div className="hidden md:flex relative flex-col justify-between p-12 overflow-hidden bg-[#efeded]">
        <div className="z-10">
          <h1 className="font-serif text-2xl font-bold text-[#000000] mb-2">
            ResumeTailor
          </h1>
          <p className="font-sans text-lg text-[#444748] max-w-sm">
            Pristine resume alignment powered by Gemini.
          </p>
        </div>

        {/* Abstract Graphic / Image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <div 
            className="w-full h-full bg-cover bg-center opacity-65 mix-blend-multiply transition-transform duration-[12000ms] scale-100 animate-pulse"
            style={{ 
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDvfUwgOqAxxNt_utUZNxZUQDqhzxLH6ry6emUke4CzVKEW8QXqVPfBe_8EhQDIbqz1OAaZm8IcLzCRddjBacUU_Z_UYW_tZYtwVvsCuaKL_ahfuDpL-xSedBhn579B8KyVMAubXX32TvT3g7LxqdXAF0MzpqppThb2NoLs6DAu3I2S51iEmit2JC1W02p6yB_WvvdjNk9Lr8OPh4rILbI7PJ8q6oH1tbUQf3tfCcVeZRJj6f-p21EgbnfwwZYSA-Zy77U-Q_c9X3T-')" 
            }}
          />
        </div>

        <div className="z-10 mt-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-[2px] bg-[#3f6653]"></div>
            <p className="font-sans text-xs uppercase tracking-widest text-[#3f6653] font-bold">
              Est. 2024
            </p>
          </div>
        </div>
      </div>

      {/* Auth Form Column */}
      <div className="flex flex-col justify-center items-center px-6 md:px-12 py-10 bg-[#fbf9f9]">
        <div className="w-full max-w-[400px]">
          {/* Branding Mobile Title */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-serif text-2xl font-bold text-[#000000] tracking-tight">
              ResumeTailor
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1b1c1c] mb-2 leading-tight">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="font-sans text-sm text-[#444748]">
              {isSignUp ? "Set up your credentials to get started." : "Please enter your details to continue."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="flex flex-col">
                <label className="font-sans text-xs font-bold text-[#444748] mb-1 uppercase tracking-wider" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Career Professional"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-transparent py-2 font-sans text-base text-[#1b1c1c] placeholder:text-[#c4c7c7] border-b border-[#c4c7c7] focus:outline-none focus:border-[#3f6653] transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col">
              <label className="font-sans text-xs font-bold text-[#444748] mb-1 uppercase tracking-wider" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent py-2 font-sans text-base text-[#1b1c1c] placeholder:text-[#c4c7c7] border-b border-[#c4c7c7] focus:outline-none focus:border-[#3f6653] transition-colors"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <label className="font-sans text-xs font-bold text-[#444748] uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                {!isSignUp && (
                  <button 
                    type="button"
                    className="font-sans text-xs text-[#3f6653] hover:underline transition-all"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent py-2 pr-10 font-sans text-base text-[#1b1c1c] placeholder:text-[#c4c7c7] border-b border-[#c4c7c7] focus:outline-none focus:border-[#3f6653] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[#747878] hover:text-[#0d0d0d] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3f6653] text-[#ffffff] py-3 px-4 rounded font-sans text-sm font-semibold tracking-wider hover:bg-[#2d4a3c] transition-all active:scale-[0.98] duration-150 relative overflow-hidden flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-[#c4c7c7]"></div>
            <span className="px-4 font-sans text-[10px] text-[#747878] uppercase tracking-wider font-bold">
              or continue with
            </span>
            <div className="flex-grow border-t border-[#c4c7c7]"></div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => {
                onSuccess("Career Professional");
                onNavigate("overview");
              }}
              className="flex items-center justify-center gap-2 border border-[#c4c7c7] py-2 px-3 rounded text-xs font-sans font-medium text-[#1b1c1c] hover:bg-[#f5f3f3] transition-colors active:scale-[0.98] duration-150"
            >
              <LayoutGrid className="w-4 h-4 text-[#747878]" />
              Google
            </button>
            <button 
              type="button"
              onClick={() => {
                onSuccess("Career Professional");
                onNavigate("overview");
              }}
              className="flex items-center justify-center gap-2 border border-[#c4c7c7] py-2 px-3 rounded text-xs font-sans font-medium text-[#1b1c1c] hover:bg-[#f5f3f3] transition-colors active:scale-[0.98] duration-150"
            >
              <LayoutGrid className="w-4 h-4 text-[#747878]" />
              Apple
            </button>
          </div>

          {/* Toggle link */}
          <div className="mt-8 text-center text-sm">
            <p className="text-[#444748] font-sans">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setIsSignUp(!isSignUp);
                }}
                className="text-[#1b1c1c] font-bold hover:underline decoration-[#3f6653] decoration-2 underline-offset-4"
              >
                {isSignUp ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>

          {/* Subtle Legal */}
          <div className="mt-8 text-center">
            <p className="font-sans text-[10px] text-[#747878] leading-relaxed max-w-[280px] mx-auto opacity-75">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { motion } from "motion/react";
import { Info } from "lucide-react";
import { AppView } from "../types";

interface OnboardingScreenProps {
  onNavigate: (view: AppView) => void;
}

export default function OnboardingScreen({ onNavigate }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] flex flex-col justify-between font-sans selection:bg-[#beead1] selection:text-[#436b58]">
      {/* Header */}
      <header className="w-full sticky top-0 bg-[#fbf9f9] flex items-center justify-between px-6 md:px-12 h-16 z-50">
        <div className="font-serif text-lg md:text-xl font-bold tracking-tight text-[#000000]">
          ResumeTailor
        </div>
        <button 
          title="Info"
          className="hover:bg-[#f5f3f3] transition-colors p-2 rounded-full active:scale-95 duration-150"
        >
          <Info className="w-5 h-5 text-[#000000]" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 md:px-12 py-8">
        <div className="max-w-4xl w-full flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
          {/* Typography Column */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 flex flex-col text-center md:text-left pt-2 md:pt-12"
          >
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#000000] mb-6 leading-tight tracking-tight">
              Tailor your resume <br className="hidden md:block" /> with pristine accuracy.
            </h1>
            <p className="font-sans text-base md:text-lg text-[#444748] max-w-md mx-auto md:mx-0 mb-10 leading-relaxed opacity-90">
              A sleek, minimalist tool that tailors your resume to match specific job descriptions. We rephrase your achievements and spotlight vocabulary gaps—without fabricating your experience.
            </p>
            <div className="mt-auto hidden md:block">
              <button 
                onClick={() => onNavigate("auth")}
                className="bg-[#3f6653] text-[#ffffff] px-12 py-3 rounded font-sans text-sm tracking-wider font-semibold uppercase hover:bg-[#2d4a3c] transition-all active:scale-95 duration-150 shadow-sm"
              >
                Get Started
              </button>
            </div>
          </motion.div>

          {/* Visual Column */}
          <motion.div 
            initial={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
            transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
            className="flex-1 w-full max-w-sm md:max-w-none"
          >
            <div className="relative aspect-[3/4] w-full bg-[#efeded] overflow-hidden rounded-lg border border-[#c4c7c7] group">
              <img 
                referrerPolicy="no-referrer"
                alt="Minimalist architectural curve"
                className="w-full h-full object-cover grayscale brightness-[1.03] contrast-[1.08] transition-transform duration-700 ease-out group-hover:scale-105"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_3x0QFCvT4hK-g2Bf9KCjT6brC3vbGWndNtZBVJBT3KrRnOK1WeHUlHTag_VWL2nfltP86CSHxpDyhdtVd9t6LxQSCwdzyB3Sv5k3vF4oKjAnJq_aabZmqqt7dKGJlcP3HBIf6TdYzXtDAMSlzBkBZ5m9N2goB-tlb4m5mq_jUbMwhh4ucvM9yIv0OoCpwxnkvq-AnYrFNdbBtYpgnScvmT531NoO6YzQ8IqDAC5NP7S94lrj9-qMONmyobaOFNHK0jfHFf4Kbwqe"
              />
              <div className="absolute inset-0 border-[16px] md:border-[24px] border-[#ffffff]/10 pointer-events-none"></div>
            </div>
          </motion.div>

          {/* Mobile Only Button Position */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full md:hidden pt-4 pb-6"
          >
            <button 
              onClick={() => onNavigate("auth")}
              className="w-full bg-[#3f6653] text-[#ffffff] py-4 rounded font-sans text-sm tracking-wider font-semibold uppercase hover:bg-[#2d4a3c] transition-all active:scale-95 duration-150"
            >
              Get Started
            </button>
            <div className="mt-4 text-center">
              <button 
                onClick={() => onNavigate("auth")}
                className="font-sans text-xs tracking-wide text-[#444748] hover:text-[#000000] border-b border-transparent hover:border-[#444748] transition-colors"
              >
                Already have an account? Sign In
              </button>
            </div>
          </motion.div>
        </div>

        {/* Secondary Content Block / White Space Affirmation */}
        <div className="w-full max-w-4xl mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border-t border-[#c4c7c7]">
            <span className="font-sans text-xs font-bold text-[#3f6653] block mb-2 tracking-widest uppercase">01 / Rephrase</span>
            <p className="font-sans text-sm text-[#444748] leading-relaxed">
              We align your professional language with target job descriptions while retaining your exact metrics and achievements.
            </p>
          </div>
          <div className="p-6 border-t border-[#c4c7c7]">
            <span className="font-sans text-xs font-bold text-[#3f6653] block mb-2 tracking-widest uppercase">02 / Analyze</span>
            <p className="font-sans text-sm text-[#444748] leading-relaxed">
              Our semantic engine highlights vocabulary gaps and opportunities to improve ATS and human compatibility.
            </p>
          </div>
          <div className="p-6 border-t border-[#c4c7c7]">
            <span className="font-sans text-xs font-bold text-[#3f6653] block mb-2 tracking-widest uppercase">03 / Safeguard</span>
            <p className="font-sans text-sm text-[#444748] leading-relaxed">
              We never invent or fabricate details. Our built-in safeguards alert you to verify any numeric output changes.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between border-t border-[#efeded] text-[#444748]/70 text-xs">
        <div className="mb-4 md:mb-0">
          © {new Date().getFullYear()} ResumeTailor. All rights reserved.
        </div>
        <div className="flex gap-6">
          <a className="hover:text-[#000000] transition-colors" href="#privacy">Privacy</a>
          <a className="hover:text-[#000000] transition-colors" href="#terms">Terms</a>
          <a className="hover:text-[#000000] transition-colors" href="#contact">Contact</a>
        </div>
      </footer>
    </div>
  );
}

import React from "react";
import { motion } from "motion/react";
import { TrendingUp, Bolt, Cloud, BarChart2 } from "lucide-react";
import { TailoringSession } from "../types";

interface OverviewScreenProps {
  sessions: TailoringSession[];
  onNavigateToCustomizer: () => void;
}

export default function OverviewScreen({ sessions, onNavigateToCustomizer }: OverviewScreenProps) {
  // Format current date nicely
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("en-US", options).toUpperCase();
  };

  // Get dynamic session stats
  const totalCompleted = sessions.length;
  const goalPercentage = Math.min(100, Math.round((sessions.length / 5) * 100)); // target is 5 tailorings

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-[1120px] mx-auto px-6 md:px-12 py-6 mb-24 font-sans text-[#1b1c1c]"
    >
      {/* Top Hero Section */}
      <section className="mb-10 text-left">
        <p className="font-sans text-xs font-bold text-[#747878] tracking-widest uppercase mb-1">
          {getFormattedDate()}
        </p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#000000] tracking-tight">
          Overview
        </h2>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Main Line Chart Card */}
        <div className="md:col-span-8 bg-[#ffffff] border border-[#e5e5e5] rounded-lg p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#000000] mb-1">
                Active Productivity
              </h3>
              <p className="font-sans text-xs text-[#747878]">
                Performance metrics for the current cycle
              </p>
            </div>
            <span className="font-sans text-[10px] tracking-wider font-bold text-[#3f6653] bg-[#beead1] px-2 py-1 rounded">
              LIVE
            </span>
          </div>

          {/* Simple Minimalist Line Chart SVG */}
          <div className="flex-grow w-full py-4 flex flex-col justify-between">
            <svg className="w-full h-44" preserveAspectRatio="none" viewBox="0 0 400 120">
              <path 
                className="editorial-line-chart"
                d="M0,100 C50,90 80,110 120,70 C160,30 200,50 250,40 C300,30 350,10 400,20" 
                fill="none" 
                stroke="#3f6653" 
                strokeWidth="2"
              />
              <path 
                d="M0,100 C50,90 80,110 120,70 C160,30 200,50 250,40 C300,30 350,10 400,20 V120 H0 Z" 
                fill="url(#gradient-green)" 
                fillOpacity="0.05"
              />
              <defs>
                <linearGradient id="gradient-green" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#3f6653", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#3f6653", stopOpacity: 0 }} />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-between font-mono text-[10px] text-[#747878] mt-2">
              <span>08:00 AM</span>
              <span>12:00 PM</span>
              <span>04:00 PM</span>
              <span>08:00 PM</span>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Daily Goal card */}
          <div className="bg-[#f5f3f3] border border-[#e5e5e5] rounded-lg p-6 flex flex-col justify-between hover:border-[#3f6653] transition-colors">
            <div className="flex justify-between items-center mb-4">
              <span className="font-sans text-[10px] font-bold text-[#747878] tracking-widest uppercase">
                TAILOR GOAL
              </span>
              <TrendingUp className="w-4 h-4 text-[#3f6653]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-[#000000]">
                {goalPercentage}%
              </span>
              <span className="font-sans text-xs text-[#3f6653] font-semibold">
                {totalCompleted} / 5 done
              </span>
            </div>
          </div>

          {/* Focus Session card */}
          <div className="bg-[#ffffff] border border-[#e5e5e5] rounded-lg p-6 overflow-hidden relative group h-full flex flex-col justify-between shadow-sm">
            <div 
              className="absolute inset-0 opacity-15 grayscale group-hover:grayscale-0 transition-all duration-700 bg-cover bg-center" 
              style={{ 
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCZaQ3UqIu8tEYKd4YYdkZD-yv6b1-IxMsezfYsb_tLSIX7ctUp_PPkkuDMp3NRNkPnL_p8W5tWqgmcdB3NLgBmZ9kN1I_KRbLE4Was7jKo5S-MO4YRwL5fKmn6_5QggtDnI6rGes5fYs6NUlGJg3ZyvfWIoKkA6_0xbBmFfMk9CvE1cZmBBLCYbQ2mS1M3m0mC-Kk017k6qSVZ_8GKawY43Ul1Oayb2I7DpLxpcFrXST4MeO-bRbVxkIHDh-w6Mtvy8AG8EOfJSrFD')" 
              }}
            />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <span className="font-sans text-[10px] font-bold text-[#747878] tracking-widest uppercase mb-4 block">
                  FOCUS ENGINE
                </span>
                <h4 className="font-serif text-lg font-bold text-[#000000] mb-1">
                  Modern Flow
                </h4>
                <p className="font-sans text-xs text-[#747878]">
                  Tailor, copy, and apply.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#efeded]/60">
                <button
                  onClick={onNavigateToCustomizer}
                  className="w-full text-center py-2 bg-[#3f6653] text-[#ffffff] font-sans text-xs rounded hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider font-semibold"
                >
                  Start New Session
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Wide Content Row: Recent Insights */}
      <div className="mt-12 text-left">
        <h3 className="font-serif text-xl font-bold text-[#000000] mb-6">
          Recent Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Insight Card 1 */}
          <div className="bg-[#ffffff] border border-[#e5e5e5] p-6 rounded-lg hover:border-[#3f6653] transition-colors cursor-pointer group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#beead1] flex items-center justify-center text-[#3f6653]">
                  <Bolt className="w-5 h-5" />
                </div>
                <span className="font-sans text-[10px] font-bold text-[#747878] tracking-widest uppercase">
                  EFFICIENCY
                </span>
              </div>
              <p className="font-sans text-sm text-[#1b1c1c] leading-relaxed mb-4">
                Structured keywords alignment reduces job application prep time by over 75% on average.
              </p>
            </div>
            <div className="h-[2px] w-0 group-hover:w-full bg-[#3f6653] transition-all duration-300"></div>
          </div>

          {/* Insight Card 2 */}
          <div className="bg-[#ffffff] border border-[#e5e5e5] p-6 rounded-lg hover:border-[#3f6653] transition-colors cursor-pointer group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#efeded] flex items-center justify-center text-[#1b1c1c]">
                  <Cloud className="w-5 h-5" />
                </div>
                <span className="font-sans text-[10px] font-bold text-[#747878] tracking-widest uppercase">
                  WELLNESS
                </span>
              </div>
              <p className="font-sans text-sm text-[#1b1c1c] leading-relaxed mb-4">
                By automating formatting and keyword checks, you save 30 minutes of cognitive fatigue per submission.
              </p>
            </div>
            <div className="h-[2px] w-0 group-hover:w-full bg-[#3f6653] transition-all duration-300"></div>
          </div>

          {/* Insight Card 3 */}
          <div className="bg-[#ffffff] border border-[#e5e5e5] p-6 rounded-lg hover:border-[#3f6653] transition-colors cursor-pointer group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#e3e2e2] flex items-center justify-center text-[#444748]">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <span className="font-sans text-[10px] font-bold text-[#747878] tracking-widest uppercase">
                  FORECAST
                </span>
              </div>
              <p className="font-sans text-sm text-[#1b1c1c] leading-relaxed mb-4">
                Clean formatting and accurate jargon matching trigger higher initial response indices in active cycles.
              </p>
            </div>
            <div className="h-[2px] w-0 group-hover:w-full bg-[#3f6653] transition-all duration-300"></div>
          </div>

        </div>
      </div>

      {/* Atmospheric Visual Element */}
      <div className="mt-16 flex flex-col items-center">
        <div className="w-12 h-[1px] bg-[#e5e5e5] mb-4"></div>
        <p className="font-sans text-[10px] text-[#747878] tracking-widest uppercase font-bold">
          System Synchronized
        </p>
      </div>

    </motion.div>
  );
}

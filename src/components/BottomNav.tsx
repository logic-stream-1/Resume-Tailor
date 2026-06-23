import React from "react";
import { Home, Search, History, User } from "lucide-react";
import { AppView } from "../types";

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export default function BottomNav({ currentView, onNavigate }: BottomNavProps) {
  const getNavClass = (view: AppView) => {
    const isActive = currentView === view;
    return `flex flex-col items-center justify-center pt-2 w-16 h-full transition-all active:opacity-80 duration-150 relative ${
      isActive 
        ? "text-[#3f6653] font-bold" 
        : "text-[#444748] hover:text-[#3f6653]"
    }`;
  };

  const getIndicatorLine = (view: AppView) => {
    if (currentView === view) {
      return <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#3f6653]" />;
    }
    return null;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#fbf9f9] border-t border-[#c4c7c7] flex justify-around items-center h-16 pb-safe select-none shadow-sm">
      
      {/* Home tab (Overview) */}
      <button 
        onClick={() => onNavigate("overview")}
        className={getNavClass("overview")}
      >
        {getIndicatorLine("overview")}
        <Home className="w-5 h-5 mb-0.5" />
        <span className="font-sans text-[10px] tracking-wide">Home</span>
      </button>

      {/* Search / Customizer tab */}
      <button 
        onClick={() => onNavigate("tailor")}
        className={getNavClass("tailor")}
      >
        {getIndicatorLine("tailor")}
        <Search className="w-5 h-5 mb-0.5" />
        <span className="font-sans text-[10px] tracking-wide font-medium">Tailor</span>
      </button>

      {/* Alerts / History tab */}
      <button 
        onClick={() => onNavigate("history")}
        className={getNavClass("history")}
      >
        {getIndicatorLine("history")}
        <History className="w-5 h-5 mb-0.5" />
        <span className="font-sans text-[10px] tracking-wide">History</span>
      </button>

      {/* Profile tab */}
      <button 
        onClick={() => onNavigate("profile")}
        className={getNavClass("profile")}
      >
        {getIndicatorLine("profile")}
        <User className="w-5 h-5 mb-0.5" />
        <span className="font-sans text-[10px] tracking-wide">Profile</span>
      </button>

    </nav>
  );
}

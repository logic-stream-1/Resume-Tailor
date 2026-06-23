import React, { useState, useEffect } from "react";
import { ArrowLeft, Settings, HelpCircle } from "lucide-react";
import OnboardingScreen from "./components/OnboardingScreen";
import AuthScreen from "./components/AuthScreen";
import OverviewScreen from "./components/OverviewScreen";
import TailorScreen from "./components/TailorScreen";
import HistoryScreen from "./components/HistoryScreen";
import ProfileScreen from "./components/ProfileScreen";
import BottomNav from "./components/BottomNav";
import { AppView, TailoringSession } from "./types";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("onboarding");
  const [fullName, setFullName] = useState("");
  const [savedResume, setSavedResume] = useState("");
  const [sessions, setSessions] = useState<TailoringSession[]>([]);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Load state from localStorage on init
  useEffect(() => {
    try {
      const storedName = localStorage.getItem("app_user_fullname");
      const storedResume = localStorage.getItem("app_base_resume");
      const storedHistory = localStorage.getItem("app_tailoring_history");

      if (storedName) {
        setFullName(storedName);
        setCurrentView("overview"); // auto login if credentials exist
      }
      if (storedResume) {
        setSavedResume(storedResume);
      }
      if (storedHistory) {
        try {
          setSessions(JSON.parse(storedHistory));
        } catch (e) {
          console.error("Error parsing history, resetting logs", e);
        }
      }
    } catch (err) {
      console.warn("localStorage is not accessible in this context", err);
    }
  }, []);

  // Handlers
  const handleLoginSuccess = (name: string) => {
    setFullName(name);
    try {
      localStorage.setItem("app_user_fullname", name);
    } catch (err) {
      console.warn("Could not save to localStorage", err);
    }
  };

  const handleLogout = () => {
    setFullName("");
    try {
      localStorage.removeItem("app_user_fullname");
    } catch (err) {
      console.warn("Could not remove from localStorage", err);
    }
    setCurrentView("auth");
  };

  const handleSaveResume = (resumeText: string) => {
    setSavedResume(resumeText);
    try {
      localStorage.setItem("app_base_resume", resumeText);
    } catch (err) {
      console.warn("Could not save resume to localStorage", err);
    }
  };

  const handleClearSavedResume = () => {
    setSavedResume("");
    try {
      localStorage.removeItem("app_base_resume");
    } catch (err) {
      console.warn("Could not clear resume from localStorage", err);
    }
  };

  const handleAddSession = (session: TailoringSession) => {
    const updated = [session, ...sessions].slice(0, 10); // store last 10 entries
    setSessions(updated);
    try {
      localStorage.setItem("app_tailoring_history", JSON.stringify(updated));
    } catch (err) {
      console.warn("Could not save history to localStorage", err);
    }
  };

  const navigateBack = () => {
    if (currentView === "profile" || currentView === "history" || currentView === "tailor") {
      setCurrentView("overview");
    } else if (currentView === "auth") {
      setCurrentView("onboarding");
    }
  };

  const handleSyncComplete = (mergedSessions: TailoringSession[], syncedFullName: string, syncedResume: string) => {
    setSessions(mergedSessions);
    setFullName(syncedFullName);
    setSavedResume(syncedResume);
    try {
      localStorage.setItem("app_tailoring_history", JSON.stringify(mergedSessions));
      localStorage.setItem("app_user_fullname", syncedFullName);
      localStorage.setItem("app_base_resume", syncedResume);
    } catch (e) {
      console.warn("Could not write to localStorage on sync", e);
    }
  };

  // Render view
  const renderView = () => {
    switch (currentView) {
      case "onboarding":
        return <OnboardingScreen onNavigate={setCurrentView} />;
      case "auth":
        return <AuthScreen onSuccess={handleLoginSuccess} onNavigate={setCurrentView} />;
      case "overview":
        return (
          <OverviewScreen 
            sessions={sessions} 
            onNavigateToCustomizer={() => setCurrentView("tailor")} 
          />
        );
      case "tailor":
        return (
          <TailorScreen 
            savedResume={savedResume} 
            onSaveResume={handleSaveResume}
            onAddSession={handleAddSession}
          />
        );
      case "history":
        return <HistoryScreen sessions={sessions} />;
      case "profile":
        return (
          <ProfileScreen 
            fullName={fullName || "Career Professional"} 
            onClearSavedResume={handleClearSavedResume}
            onLogout={handleLogout}
            savedResume={savedResume}
            onSaveResume={handleSaveResume}
            sessions={sessions}
            onSyncComplete={handleSyncComplete}
          />
        );
      default:
        return <OnboardingScreen onNavigate={setCurrentView} />;
    }
  };

  // Determine if we should show top bar header & bottom bar navigation
  const showNav = currentView !== "onboarding" && currentView !== "auth";

  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] flex flex-col font-sans transition-colors duration-300">
      
      {/* Persisted Header across App Screens */}
      {showNav && (
        <header className="w-full sticky top-0 bg-[#fbf9f9]/90 backdrop-blur-md border-b border-[#efeded] h-16 flex items-center justify-between px-6 md:px-12 z-50 select-none">
          <div className="flex items-center gap-2">
            {currentView !== "overview" && (
              <button 
                onClick={navigateBack}
                title="Go back"
                className="hover:bg-[#f5f3f3] transition-colors p-2 rounded-full active:scale-95 duration-150 text-[#1b1c1c]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="font-serif text-lg font-bold tracking-tight text-[#000000]">
              ResumeTailor
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSettingsDrawer(true)}
              title="Quick info and settings"
              className="hover:bg-[#f5f3f3] transition-colors p-2 rounded-full active:scale-95 duration-150 text-[#1b1c1c]"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* Main viewport */}
      <main className="flex-grow">
        {renderView()}
      </main>

      {/* Persistent Bottom navigation */}
      {showNav && (
        <BottomNav currentView={currentView} onNavigate={setCurrentView} />
      )}

      {/* Modal Slideover Settings/Info Panel */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-[100] flex justify-end font-sans">
          {/* Overlay background */}
          <div 
            onClick={() => setShowSettingsDrawer(false)}
            className="absolute inset-0 bg-[#0d0d0d]/60 transition-opacity"
          />
          {/* Drawer side */}
          <div className="relative w-full max-w-sm h-full bg-[#fbf9f9] p-8 shadow-2xl flex flex-col justify-between border-l border-[#c4c7c7] overflow-y-auto">
            <div>
              <div className="flex justify-between items-center mb-8 border-b border-[#efeded] pb-4">
                <h3 className="font-serif text-lg font-bold text-[#000000]">
                  App Settings
                </h3>
                <button 
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-sm font-bold text-[#747878] hover:text-[#000000] p-1 font-sans"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-sans text-xs font-bold text-[#747878] uppercase tracking-wider mb-2">
                    About App Customizer
                  </h4>
                  <p className="font-sans text-xs text-[#444748] leading-relaxed">
                    Designed around the principles of <b>Modern Minimalism</b>, this application offers a high-fidelity interface to rephrase, align, and custom-tailor your resumes to targeted job listings. Powered securely by Gemini 3.5 Flash.
                  </p>
                </div>

                <div>
                  <h4 className="font-sans text-xs font-bold text-[#747878] uppercase tracking-wider mb-2">
                    Features implemented
                  </h4>
                  <ul className="text-xs text-[#444748] space-y-2 list-disc list-inside">
                    <li>Minimalist Ethos theme pairing</li>
                    <li>Secure server-side API call proxying</li>
                    <li>Summary and Bullets rephrasing engines</li>
                    <li>Authentic local storage persistence</li>
                    <li>Strict facts-only generation validation</li>
                    <li>Visual numerical fabrication warnings</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center font-mono text-[9px] text-[#747878] border-t border-[#efeded] pt-4 mt-8">
              Resume Customizer v1.0.0 · © 2026
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Edit2, Share2, Shield, User, Bell, Palette, Globe, LogOut, Trash2, Check, ChevronRight,
  Database, RefreshCw, CheckCircle2, AlertTriangle, Copy, ExternalLink, Lock, Server
} from "lucide-react";
import { UserProfile } from "../types";

interface ProfileScreenProps {
  fullName: string;
  onClearSavedResume: () => void;
  onLogout: () => void;
  savedResume: string;
  onSaveResume: (val: string) => void;
  sessions: any[];
  onSyncComplete: (sessions: any[], fullName: string, baseResume: string) => void;
}

export default function ProfileScreen({ 
  fullName, 
  onClearSavedResume, 
  onLogout,
  savedResume,
  onSaveResume,
  sessions,
  onSyncComplete
}: ProfileScreenProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [profileCleared, setProfileCleared] = useState(false);

  const handleShare = () => {
    const text = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          })
          .catch((err) => {
            console.error("Share copy failed: ", err);
            fallbackCopyShare(text);
          });
      } else {
        fallbackCopyShare(text);
      }
    } catch (e) {
      console.error("Share copy exception: ", e);
      fallbackCopyShare(text);
    }
  };

  const fallbackCopyShare = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (err) {
      console.error("Fallback copy share failed", err);
    }
  };

  // Supabase states
  const [syncStatus, setSyncStatus] = useState<{
    configured: boolean;
    connected: boolean;
    tablesExist: boolean;
    profileTableExists: boolean;
    sessionTableExists: boolean;
    error: string | null;
    url: string | null;
  } | null>(null);

  const [loadingStatus, setLoadingStatus] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [customUserId, setCustomUserId] = useState("");
  const [showUserIdEdit, setShowUserIdEdit] = useState(false);

  // Load user id
  const [userId, setUserId] = useState(() => {
    try {
      let uid = localStorage.getItem("app_user_id");
      if (!uid) {
        uid = "rt_usr_" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("app_user_id", uid);
      }
      return uid;
    } catch {
      return "rt_usr_fallback";
    }
  });

  useEffect(() => {
    setCustomUserId(userId);
  }, [userId]);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/supabase/status");
      const data = await res.json();
      setSyncStatus(data);
    } catch (err) {
      console.error("Failed to fetch Supabase status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);
    try {
      const res = await fetch("/api/supabase/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName,
          baseResume: savedResume,
          sessions
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync with Supabase.");
      }
      if (data.success) {
        setSyncSuccess(true);
        if (data.profile) {
          onSaveResume(data.profile.baseResume);
        }
        onSyncComplete(data.sessions, data.profile?.fullName || fullName, data.profile?.baseResume || savedResume);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (err: any) {
      setSyncError(err.message || "An error occurred during syncing.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCustomUserId = () => {
    if (!customUserId.trim()) return;
    try {
      localStorage.setItem("app_user_id", customUserId.trim());
      setUserId(customUserId.trim());
      setShowUserIdEdit(false);
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const sqlCode = `-- 1. CREATE DEDICATED SCHEMA FOR THIS PROJECT
CREATE SCHEMA IF NOT EXISTS resume_tailor;

-- 2. GRANT GATEWAY USAGE TO THE API ROLE
GRANT USAGE ON SCHEMA resume_tailor TO anon, authenticated, service_role;

-- 3. CREATE PROFILES TABLE IN DEDICATED SCHEMA
CREATE TABLE IF NOT EXISTS resume_tailor.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  base_resume TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE SESSIONS TABLE IN DEDICATED SCHEMA
CREATE TABLE IF NOT EXISTS resume_tailor.sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  job_description TEXT NOT NULL,
  resume TEXT NOT NULL,
  summary TEXT NOT NULL,
  bullets TEXT NOT NULL,
  keyword_gaps TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  match_score INTEGER DEFAULT 75 NOT NULL,
  job_title TEXT DEFAULT 'Target Role' NOT NULL,
  company_name TEXT DEFAULT 'Not specified' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE ROW-LEVEL SECURITY
ALTER TABLE resume_tailor.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_tailor.sessions ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES FOR SYNC ENGINE ACCESS
CREATE POLICY "Allow public select on profiles" ON resume_tailor.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON resume_tailor.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON resume_tailor.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select on sessions" ON resume_tailor.sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on sessions" ON resume_tailor.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sessions" ON resume_tailor.sessions FOR UPDATE USING (true);

-- 7. GRANT PERMISSIONS ON ALL TABLES IN SCHEMAS
GRANT ALL ON ALL TABLES IN SCHEMA resume_tailor TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA resume_tailor GRANT ALL ON TABLES TO anon, authenticated, service_role;`;

  const copySqlToClipboard = () => {
    try {
      navigator.clipboard.writeText(sqlCode).then(() => {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearResume = () => {
    onClearSavedResume();
    setProfileCleared(true);
    setTimeout(() => setProfileCleared(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-[1120px] mx-auto px-6 md:px-12 py-6 mb-24 font-sans text-[#1b1c1c] text-left"
    >
      {/* Profile Header Block */}
      <section className="w-full flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        {/* Profile Image & Overlaid Edit state */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border border-[#c4c7c7] bg-[#efeded] shadow-sm">
            <img 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" 
              alt="Career professional avatar portrait"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD7uJmHc-NhZrt0xrcG4QOjoJmrtl1Lp2J2Ifbycx1LfJ1l3fDCuK9hEbmv2vJHNQeW8Ey0bDDQpcD2Vr2-CpDLsY4bBd_JtfmkHTgm5_3-QyQFsQOEqVFpH3TH3KY6XNWIsx3nAIARs7heh5LVXytZ9vB0ThPaDvofIq1n6wXZgcHYZn0EsspVXa-mJV3ruPQHA4jROLgnyKUX06zLJ8avCkrOBKfe9nj_6iPH5_O0gjti0uijsioZBi83eBEYuDMuB2w2ISL4Oxb"
            />
          </div>
          <button 
            title="Edit avatar"
            className="absolute bottom-1 right-1 bg-[#1b1c1c] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#3f6653] transition-colors duration-150 border-2 border-[#fbf9f9]"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bio, metadata and buttons */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1 flex-grow">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#000000] tracking-tight">
            {fullName}
          </h2>
          <p className="font-sans text-sm text-[#444748] max-w-sm leading-relaxed mt-1">
            Dedicated professional optimizing career trajectories. Tailoring resumes with pristine accuracy and focus.
          </p>
          
          <div className="flex gap-4 mt-4 w-full justify-center md:justify-start">
            <button className="bg-[#3f6653] text-[#ffffff] px-6 py-2 rounded font-sans text-xs font-semibold tracking-wider hover:opacity-90 transition-opacity active:scale-[0.98]">
              Edit Profile
            </button>
            <button 
              onClick={handleShare}
              className="border border-[#1b1c1c] text-[#1b1c1c] px-6 py-2 rounded font-sans text-xs font-semibold tracking-wider hover:bg-[#f5f3f3] transition-colors active:scale-[0.98] flex items-center gap-2"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? "Link Copied" : "Share"}
            </button>
          </div>
        </div>
      </section>

      {/* Bento Stats Grid */}
      <section className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-[#f5f3f3] p-6 flex flex-col gap-1 rounded-lg border border-[#c4c7c7] text-left">
          <span className="font-sans text-[10px] text-[#444748] uppercase tracking-widest font-bold">
            Tailorings
          </span>
          <span className="font-serif text-2xl font-bold text-[#000000]">
            24
          </span>
        </div>
        <div className="bg-[#f5f3f3] p-6 flex flex-col gap-1 rounded-lg border border-[#c4c7c7] text-left">
          <span className="font-sans text-[10px] text-[#444748] uppercase tracking-widest font-bold">
            Averages
          </span>
          <span className="font-serif text-2xl font-bold text-[#000000]">
            92% Match
          </span>
        </div>
        <div className="bg-[#f5f3f3] p-6 flex flex-col gap-1 rounded-lg border border-[#c4c7c7] text-left">
          <span className="font-sans text-[10px] text-[#444748] uppercase tracking-widest font-bold">
            Time Saved
          </span>
          <span className="font-serif text-2xl font-bold text-[#000000]">
            12.5 hrs
          </span>
        </div>
        <div className="bg-[#f5f3f3] p-6 flex flex-col gap-1 rounded-lg border border-[#c4c7c7] text-left">
          <span className="font-sans text-[10px] text-[#444748] uppercase tracking-widest font-bold">
            Base Resumes
          </span>
          <span className="font-serif text-2xl font-bold text-[#000000]">
            01 Active
          </span>
        </div>
      </section>

      {/* Settings list lists */}
      <section className="w-full flex flex-col gap-10">
        
        {/* Supabase Cloud Sync Panel */}
        <div className="bg-white border border-[#c4c7c7] rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#eff5f1] p-2 rounded-lg text-[#3f6653]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#000000]">
                  Supabase Cloud Sync
                </h3>
                <p className="font-sans text-xs text-[#444748]">
                  Persist and merge your tailored profiles securely in your own database
                </p>
              </div>
            </div>
            
            {loadingStatus ? (
              <RefreshCw className="w-4 h-4 text-[#747878] animate-spin" />
            ) : (
              <button 
                onClick={fetchStatus}
                title="Refresh Status"
                className="p-1 text-[#747878] hover:text-[#000000] hover:bg-[#f5f3f3] rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sync Status Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {!syncStatus ? (
              <span className="font-sans text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Checking Status...
              </span>
            ) : !syncStatus.configured ? (
              <span className="font-sans text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Not Configured
              </span>
            ) : !syncStatus.connected ? (
              <span className="font-sans text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Connection Failed
              </span>
            ) : !syncStatus.tablesExist ? (
              <>
                <span className="font-sans text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> API Connected
                </span>
                <span className="font-sans text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Missing Database Tables
                </span>
              </>
            ) : (
              <span className="font-sans text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sync Active & Ready
              </span>
            )}
            
            {syncStatus?.url && (
              <span className="font-mono text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">
                {syncStatus.url}
              </span>
            )}
          </div>

          {/* Setup Instructions if Not Configured */}
          {syncStatus && !syncStatus.configured && (
            <div className="bg-[#fcfbfb] border border-[#efeded] rounded-lg p-4 mb-6">
              <h4 className="font-sans text-xs font-bold text-[#1b1c1c] mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#3f6653]" /> Secrets Configuration Required
              </h4>
              <p className="font-sans text-xs text-[#444748] leading-relaxed mb-3">
                To connect your own instance of Supabase, open the <b>Secrets panel</b> inside Google AI Studio and configure the following credentials:
              </p>
              <div className="font-mono text-[10px] bg-[#f5f3f3] border border-[#c4c7c7] rounded p-2.5 space-y-1 text-[#1b1c1c] select-all">
                <div>SUPABASE_URL="https://your-project.supabase.co"</div>
                <div>SUPABASE_ANON_KEY="your-anon-key"</div>
              </div>
              <p className="font-sans text-[10px] text-[#747878] mt-3 leading-relaxed">
                Once variables are set, restart the application. You will then need to execute the SQL setup script to create the necessary tables.
              </p>
            </div>
          )}

          {/* Connection Error Message */}
          {syncStatus && syncStatus.configured && syncStatus.error && (
            <div className="bg-red-50/50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-sans text-xs font-bold text-red-800 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Connection Error
              </h4>
              <p className="font-sans text-xs text-red-700 leading-relaxed">
                {syncStatus.error}
              </p>
            </div>
          )}

          {/* Table warning action */}
          {syncStatus && syncStatus.configured && !syncStatus.tablesExist && (
            <div className="bg-amber-50/30 border border-amber-200 rounded-lg p-4 mb-6">
              <h4 className="font-sans text-xs font-bold text-amber-900 mb-1">
                Database Tables Missing
              </h4>
              <p className="font-sans text-xs text-amber-800 leading-relaxed mb-3">
                Your database is connected, but the tables <b>profiles</b> and <b>sessions</b> are missing inside the <b>resume_tailor</b> schema. Please run our schema SQL script in your Supabase SQL Editor.
              </p>
              <button
                type="button"
                onClick={() => setShowSql(!showSql)}
                className="font-sans text-xs font-bold text-[#3f6653] hover:underline flex items-center gap-1"
              >
                {showSql ? "Hide SQL Script" : "Show SQL Setup Script"}
              </button>
            </div>
          )}

          {/* Toggleable SQL Script Area */}
          {(showSql || (syncStatus && !syncStatus.configured)) && (
            <div className="border border-[#c4c7c7] rounded-lg overflow-hidden mb-6 bg-stone-900 text-stone-100">
              <div className="bg-stone-800 px-4 py-2 border-b border-stone-700 flex justify-between items-center">
                <span className="font-mono text-[10px] text-stone-400 font-bold">supabase_schema.sql</span>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="font-sans text-[10px] bg-stone-700 hover:bg-stone-600 text-white px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedSql ? "Copied" : "Copy Schema"}
                </button>
              </div>
              <pre className="p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
                <code>{sqlCode}</code>
              </pre>
            </div>
          )}

          {/* Sync controls and Device ID mapping */}
          {syncStatus && syncStatus.configured && (
            <div className="space-y-4">
              {/* Sync Button */}
              {syncStatus.tablesExist && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSync}
                    className="w-full bg-[#3f6653] hover:bg-[#2e4d3e] text-white py-2.5 rounded-lg font-sans text-xs font-semibold tracking-wider transition-colors active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? "Syncing with Cloud..." : "Sync & Merge Data"}
                  </button>
                  
                  {syncSuccess && (
                    <p className="font-sans text-xs font-semibold text-green-700 text-center animate-fade-in">
                      ✓ Data synchronized and merged successfully!
                    </p>
                  )}
                  {syncError && (
                    <p className="font-sans text-xs font-medium text-red-600 text-center">
                      ⚠ Sync error: {syncError}
                    </p>
                  )}
                </div>
              )}

              {/* User ID Section */}
              <div className="border-t border-[#efeded] pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-sans text-[10px] text-[#747878] uppercase font-bold tracking-wider block">
                      Device Sync Key
                    </span>
                    {showUserIdEdit ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={customUserId}
                          onChange={(e) => setCustomUserId(e.target.value)}
                          className="border border-[#c4c7c7] px-2 py-1 rounded font-mono text-xs text-[#1b1c1c] focus:outline-none focus:border-[#3f6653]"
                          placeholder="Enter sync key"
                        />
                        <button
                          type="button"
                          onClick={handleSaveCustomUserId}
                          className="bg-[#3f6653] text-white px-2 py-1 rounded font-sans text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserIdEdit(false);
                            setCustomUserId(userId);
                          }}
                          className="text-[#747878] hover:text-black font-sans text-xs px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-bold text-[#1b1c1c]">
                        {userId}
                      </span>
                    )}
                  </div>
                  
                  {!showUserIdEdit && (
                    <button
                      type="button"
                      onClick={() => setShowUserIdEdit(true)}
                      className="font-sans text-xs font-semibold text-[#3f6653] hover:underline"
                    >
                      Change Key
                    </button>
                  )}
                </div>
                <p className="font-sans text-[10px] text-[#747878] leading-relaxed mt-2">
                  Use this sync key across other browsers or devices to download and sync your data seamlessly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Account settings */}
        <div>
          <h3 className="font-sans text-xs font-bold text-[#838484] uppercase tracking-widest mb-4 px-1">
            Account Settings
          </h3>
          <div className="flex flex-col border-t border-[#c4c7c7]">
            <div className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-[#ffffff] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#444748] group-hover:text-[#000000] transition-colors" />
                <span className="font-sans text-sm text-[#1b1c1c] font-medium">Personal Information</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c4c7c7]" />
            </div>
            <div className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-[#ffffff] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-[#444748] group-hover:text-[#000000] transition-colors" />
                <span className="font-sans text-sm text-[#1b1c1c] font-medium">Security & Password</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c4c7c7]" />
            </div>
            <div className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-[#ffffff] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#444748] group-hover:text-[#000000] transition-colors" />
                <span className="font-sans text-sm text-[#1b1c1c] font-medium">Notification Preferences</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#c4c7c7]" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="font-sans text-xs font-bold text-[#838484] uppercase tracking-widest mb-4 px-1">
            Preferences
          </h3>
          <div className="flex flex-col border-t border-[#c4c7c7]">
            <div className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-[#ffffff] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-[#444748]" />
                <span className="font-sans text-sm text-[#1b1c1c] font-medium">Appearance & Theme</span>
              </div>
              <span className="font-sans text-xs text-[#444748] bg-[#f5f3f3] px-2.5 py-0.5 rounded font-bold">
                Light
              </span>
            </div>
            <div className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-[#ffffff] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#444748]" />
                <span className="font-sans text-sm text-[#1b1c1c] font-medium">Language</span>
              </div>
              <span className="font-sans text-xs text-[#444748] bg-[#f5f3f3] px-2.5 py-0.5 rounded font-bold">
                English (US)
              </span>
            </div>
          </div>
        </div>

        {/* Customizer management tools */}
        <div>
          <h3 className="font-sans text-xs font-bold text-amber-700 uppercase tracking-widest mb-4 px-1">
            Customizer Management
          </h3>
          <div className="flex flex-col border-t border-[#c4c7c7]">
            <div 
              onClick={handleClearResume}
              className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-[#fffbeb] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-amber-800">
                <Trash2 className="w-4 h-4 text-amber-700" />
                <span className="font-sans text-sm font-semibold">Clear saved resume base string</span>
              </div>
              <div>
                {profileCleared ? (
                  <span className="font-sans text-xs font-bold text-green-700 uppercase tracking-wider px-2 py-0.5 bg-green-50 rounded">
                    Cleared!
                  </span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-amber-300" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone logouts */}
        <div>
          <h3 className="font-sans text-xs font-bold text-red-600 uppercase tracking-widest mb-4 px-1">
            Danger Zone
          </h3>
          <div className="flex flex-col border-t border-[#c4c7c7]">
            <div 
              onClick={onLogout}
              className="flex items-center justify-between py-4 px-1 border-b border-[#efeded] hover:bg-red-50 hover:bg-opacity-40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-red-700">
                <LogOut className="w-4 h-4 text-red-600" />
                <span className="font-sans text-sm font-semibold">Logout</span>
              </div>
              <LogOut className="w-4 h-4 text-red-400 opacity-60" />
            </div>
          </div>
        </div>

      </section>
    </motion.div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Copy, Check, Download, AlertTriangle, FileText, ChevronRight, 
  Upload, Trash2, Edit2, CheckCircle2, Award, ShieldCheck, 
  Eye, Settings2, FileSignature, Sparkles, RefreshCw, Layers, Clipboard
} from "lucide-react";
import { KeywordGap, TailoringSession } from "../types";

interface TailorScreenProps {
  savedResume: string;
  onSaveResume: (resume: string) => void;
  onAddSession: (session: TailoringSession) => void;
}

type ExportTemplate = "minimalist" | "serif" | "executive";

export default function TailorScreen({ savedResume, onSaveResume, onAddSession }: TailorScreenProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState(savedResume || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // File Upload State
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Results State
  const [results, setResults] = useState<{
    summary: string;
    bullets: string;
    keywordGaps: string;
    matchScore: number;
    jobTitle: string;
    companyName: string;
    timeMs: number;
  } | null>(null);

  // Editing States
  const [editedSummary, setEditedSummary] = useState("");
  const [editedBullets, setEditedBullets] = useState("");

  // Style Export Template
  const [activeTemplate, setActiveTemplate] = useState<ExportTemplate>("minimalist");

  // Interactive Checklist states
  const [resolvedGaps, setResolvedGaps] = useState<Record<string, boolean>>({});
  const [bulletDraftInput, setBulletDraftInput] = useState("");
  const [draftingForGap, setDraftingForGap] = useState<string | null>(null);
  const [draftedBulletOutput, setDraftedBulletOutput] = useState("");
  const [draftingLoading, setDraftingLoading] = useState(false);

  // Success indicators
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedBullets, setCopiedBullets] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedTemplateText, setCopiedTemplateText] = useState(false);

  // Synchronize base resume changes
  useEffect(() => {
    if (savedResume && !resume) {
      setResume(savedResume);
    }
  }, [savedResume]);

  // Sync edits when results load
  useEffect(() => {
    if (results) {
      setEditedSummary(results.summary);
      setEditedBullets(results.bullets);
      setResolvedGaps({});
    }
  }, [results]);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'txt' && fileType !== 'md' && fileType !== 'json') {
      setError("Please upload only standard Plain Text (.txt) or Markdown (.md) files.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setResume(text);
        setUploadedFileName(file.name);
        setError("");
      }
    };
    reader.readAsText(file);
  };

  const clearUploadedFile = () => {
    setUploadedFileName("");
    setResume("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!resume.trim()) return;
    onSaveResume(resume);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTailor = async () => {
    setError("");
    setResults(null);

    if (!jobDescription.trim() || !resume.trim()) {
      setError("Please fill out both the Job Description and your Resume.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError("Job Description must be at least 50 characters long.");
      return;
    }

    if (resume.trim().length < 100) {
      setError("Your original Resume must be at least 100 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setResults(data);

      // Add to session history
      onAddSession({
        id: Math.random().toString(36).substring(2, 9),
        date: new Date().toISOString(),
        jobDescription,
        resume,
        summary: data.summary,
        bullets: data.bullets,
        keywordGaps: data.keywordGaps,
        matchScore: data.matchScore || 75,
        jobTitle: data.jobTitle || "Target Role",
        companyName: data.companyName || "Not specified",
        timeMs: data.timeMs
      });

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred during tailoring.");
    } finally {
      setLoading(false);
    }
  };

  // Draft a bullet using AI for selected keyword gap
  const handleDraftBullet = async (gapWord: string) => {
    if (!bulletDraftInput.trim()) return;
    setDraftingLoading(true);
    try {
      const response = await fetch("/api/draft-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          keyword: gapWord, 
          context: bulletDraftInput,
          resumeContext: resume.substring(0, 1000) 
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to draft bullet point.");
      }

      setDraftedBulletOutput(data.bullet);
    } catch (err: any) {
      console.error(err);
      setDraftedBulletOutput(`• Successfully utilized ${gapWord} to implement solutions matching: ${bulletDraftInput}`);
    } finally {
      setDraftingLoading(false);
    }
  };

  const applyDraftedBullet = () => {
    if (!draftedBulletOutput) return;
    setEditedBullets(prev => prev ? `${prev}\n${draftedBulletOutput}` : draftedBulletOutput);
    
    if (draftingForGap) {
      setResolvedGaps(prev => ({ ...prev, [draftingForGap]: true }));
    }
    
    // reset draft fields
    setBulletDraftInput("");
    setDraftedBulletOutput("");
    setDraftingForGap(null);
  };

  const copyToClipboard = (text: string, setTrigger: (val: boolean) => void) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setTrigger(true);
            setTimeout(() => setTrigger(false), 2000);
          })
          .catch(() => fallbackCopyToClipboard(text, setTrigger));
      } else {
        fallbackCopyToClipboard(text, setTrigger);
      }
    } catch (e) {
      fallbackCopyToClipboard(text, setTrigger);
    }
  };

  const fallbackCopyToClipboard = (text: string, setTrigger: (val: boolean) => void) => {
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
        setTrigger(true);
        setTimeout(() => setTrigger(false), 2000);
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
  };

  const handleCopyAll = () => {
    const combined = `PROFESSIONAL SUMMARY\n${editedSummary}\n\nREWRITTEN EXPERIENCE BULLETS\n${editedBullets}`;
    copyToClipboard(combined, setCopiedAll);
  };

  const handleDownloadTxt = () => {
    if (!results) return;
    const content = `=== TAILORED SUMMARY ===\n${editedSummary}\n\n=== TAILORED EXPERIENCE BULLETS ===\n${editedBullets}\n\n=== VERIFIED MATCH SCORE ===\nATS Score: ${results.matchScore}%\nTarget Position: ${results.jobTitle} at ${results.companyName}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tailored_Resume_${results.jobTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseKeywordGaps = (rawGaps: string): KeywordGap[] => {
    const list: KeywordGap[] = [];
    const lines = rawGaps.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const cleanLine = line.replace(/^[•\s\d.-]*/, "").trim();
      if (cleanLine.includes("[GENUINE GAP]")) {
        list.push({
          word: cleanLine.replace(/\[GENUINE GAP\]\s*[—-]?\s*/i, "").trim(),
          type: "GENUINE GAP"
        });
      } else if (cleanLine.includes("[REPHRASE OPPORTUNITY]")) {
        list.push({
          word: cleanLine.replace(/\[REPHRASE OPPORTUNITY\]\s*[—-]?\s*/i, "").trim(),
          type: "REPHRASE OPPORTUNITY"
        });
      } else {
        const isGenuine = cleanLine.toLowerCase().includes("gap") || cleanLine.toLowerCase().includes("lacks");
        list.push({
          word: cleanLine.replace(/\[.*?\]/g, "").trim(),
          type: isGenuine ? "GENUINE GAP" : "REPHRASE OPPORTUNITY"
        });
      }
    }
    return list.slice(0, 5);
  };

  // Fact-Checking scanner logic (looks for numerical data)
  const scanNumbers = () => {
    if (!results) return [];
    const combinedOutputText = `${editedSummary} ${editedBullets}`;
    const numberMatches = combinedOutputText.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
    const uniqueNumbers = Array.from(new Set(numberMatches));
    return uniqueNumbers.map(num => {
      const cleanNum = num.replace('%', '');
      const verified = resume.includes(cleanNum);
      return {
        number: num,
        verified
      };
    });
  };

  const activeNumbersScan = scanNumbers();
  const unverifiedFacts = activeNumbersScan.filter(item => !item.verified);
  const totalVerifiedRatio = activeNumbersScan.length > 0 
    ? Math.round(((activeNumbersScan.length - unverifiedFacts.length) / activeNumbersScan.length) * 100)
    : 100;

  // Formatting strings for the template visual frames
  const getFormattedTemplateText = () => {
    return `========================================
${results?.jobTitle ? results.jobTitle.toUpperCase() : "TARGET ROLE"} CANDIDATE
========================================

PROFESSIONAL SUMMARY:
${editedSummary}

KEY EXPERIENCES & REPHRASED ACHIEVEMENTS:
${editedBullets}

----------------------------------------
Tailored securely in ResumeTailor (Integrity Fact-Checked)`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-[1200px] mx-auto px-6 md:px-12 py-6 mb-24 font-sans text-[#1b1c1c] text-left selection:bg-[#beead1] selection:text-[#436b58]"
    >
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-[#000000]">
            Resume Customizer
          </h2>
          <p className="font-sans text-xs text-[#747878] mt-1">
            Rephrase your resume metrics and structure directly to match required ATS dimensions.
          </p>
        </div>
        
        {/* Verification Seals */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2.5 py-1 text-[10px] text-green-700 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            Facts Only Engine
          </div>
          <div className="flex items-center gap-1 bg-[#beead1] border border-[#a2d4ba] rounded px-2.5 py-1 text-[10px] text-[#2d4a3c] font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            Vetted Integrity
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Inputs Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-6">
        
        {/* Job Description card */}
        <div className="flex flex-col bg-white border border-[#e5e5e5] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-sans text-xs font-bold text-[#747878] uppercase tracking-widest">
              Job Description
            </span>
            <span className="font-mono text-[10px] text-[#747878] bg-[#f5f3f3] px-1.5 py-0.5 rounded">
              Min. 50 chars
            </span>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the target job description or role details here..."
            className="w-full flex-grow min-h-[220px] p-4 font-sans text-xs bg-[#fbf9f9] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#3f6653] transition-colors resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-[#747878]">
            <span>{jobDescription.length < 50 ? "⚠️ Length insufficient" : "✅ Length valid"}</span>
            <span>{jobDescription.length} characters</span>
          </div>
        </div>

        {/* Original Resume & Drag and Drop File zone card */}
        <div className="flex flex-col bg-white border border-[#e5e5e5] rounded-lg p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-sans text-xs font-bold text-[#747878] uppercase tracking-widest">
              My Base Resume
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!resume.trim()}
                className="text-xs font-bold text-[#3f6653] hover:text-[#2d4a3c] transition-colors disabled:opacity-50 active:scale-95 duration-150"
              >
                {isSaved ? "Saved!" : "Save to Profile"}
              </button>
            </div>
          </div>

          {/* Drag & Drop zone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative flex-grow flex flex-col justify-between transition-all duration-200 border-2 border-dashed rounded p-4 ${
              dragActive ? "border-[#3f6653] bg-green-50/40" : "border-[#e5e5e5] bg-[#fbf9f9]"
            }`}
          >
            {uploadedFileName ? (
              <div className="flex items-center justify-between bg-white border border-[#efeded] p-3 rounded mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-5 h-5 text-[#3f6653] flex-shrink-0" />
                  <span className="font-sans text-xs font-bold truncate text-[#1b1c1c]">
                    {uploadedFileName}
                  </span>
                </div>
                <button 
                  onClick={clearUploadedFile}
                  title="Remove uploaded file"
                  className="p-1 hover:bg-[#f5f3f3] rounded text-red-600 active:scale-90 transition-transform"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-[#747878]">
                <Upload className="w-8 h-8 mb-2 text-[#747878]/60" />
                <p className="font-sans text-xs font-bold mb-1">Drag and drop resume here</p>
                <p className="font-sans text-[10px] text-[#747878]/70 mb-3">Only .txt or .md files supported</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept=".txt,.md"
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#ffffff] border border-[#c4c7c7] hover:bg-[#f5f3f3] text-[#1b1c1c] font-sans text-[10px] font-semibold uppercase px-4 py-1.5 rounded transition-colors active:scale-95"
                >
                  Browse Files
                </button>
              </div>
            )}

            <textarea
              value={resume}
              onChange={(e) => {
                setResume(e.target.value);
                if (uploadedFileName) setUploadedFileName("");
              }}
              placeholder="Or paste your plain text resume here directly..."
              className="w-full flex-grow min-h-[140px] p-2 font-sans text-xs bg-transparent border-0 focus:outline-none resize-none leading-relaxed text-[#1b1c1c]"
            />
          </div>

          <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-[#747878]">
            <span>{resume.length < 100 ? "⚠️ Length insufficient" : "✅ Profile pre-loaded"}</span>
            <span>{resume.length} characters</span>
          </div>
        </div>
      </div>

      {/* Processing bar */}
      <div className="flex flex-col items-center justify-center p-5 border border-[#e5e5e5] rounded-lg bg-[#f5f3f3]/60 mb-10 text-center shadow-inner">
        <p className="font-sans text-xs text-[#747878] mb-4 max-w-xl italic">
          "Your career integrity is preserved. ResumeTailor strictly matches terminology and reorders statements to fit ATS filters. It will never fabricate achievements, metrics, or years."
        </p>
        <button
          onClick={handleTailor}
          disabled={loading}
          className="bg-[#3f6653] text-[#ffffff] px-16 py-3 rounded font-sans text-xs tracking-wider font-semibold uppercase hover:bg-[#2d4a3c] transition-all active:scale-[0.98] duration-150 w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing & Rephrasing with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#ffffff]" />
              <span>Tailor Resume Now</span>
            </>
          )}
        </button>
      </div>

      {/* Loading state placeholders */}
      {loading && (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#3f6653] border-t-transparent rounded-full animate-spin"></div>
          <p className="font-sans text-sm font-semibold text-[#3f6653] animate-pulse">
            Analyzing job description required skills and rephrasing achievements...
          </p>
          <span className="font-mono text-[10px] text-[#747878]">This typically takes 2-4 seconds.</span>
        </div>
      )}

      {/* Results Workspace */}
      {results && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="w-full h-[1px] bg-[#e5e5e5]"></div>

          {/* Target Role summary header bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border border-[#e5e5e5] rounded-lg bg-white shadow-sm gap-4">
            <div>
              <span className="font-sans text-[10px] font-bold text-[#3f6653] uppercase tracking-widest bg-[#beead1] px-2 py-0.5 rounded">
                Optimized Target Role
              </span>
              <h3 className="font-serif text-xl font-bold text-[#000000] mt-2 leading-none">
                {results.jobTitle}
              </h3>
              <p className="font-sans text-xs text-[#747878] mt-1">
                Aligned with {results.companyName} specifications.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#747878]">
                Matched in {results.timeMs}ms
              </span>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 border border-[#c4c7c7] hover:bg-[#f5f3f3] text-[#1b1c1c] font-sans text-[10px] font-bold uppercase px-3.5 py-1.5 rounded active:scale-95 duration-150 tracking-wider"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Raw
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 bg-[#3f6653] hover:bg-[#2d4a3c] text-white font-sans text-[10px] font-bold uppercase px-3.5 py-1.5 rounded active:scale-95 duration-150 tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>

          {/* Dashboard Metrics Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* ATS Score Circular Progress Gauge */}
            <div className="md:col-span-4 bg-white border border-[#e5e5e5] rounded-lg p-5 flex flex-col justify-between shadow-sm relative">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-sans text-[10px] font-bold text-[#747878] uppercase tracking-widest">
                    ATS Match Score
                  </span>
                  <Award className="w-4 h-4 text-[#3f6653]" />
                </div>
                
                {/* SVG Gauge */}
                <div className="flex flex-col items-center justify-center my-4">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        stroke="#efeded" 
                        strokeWidth="8" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        stroke={results.matchScore >= 80 ? "#3f6653" : results.matchScore >= 60 ? "#d97706" : "#dc2626"} 
                        strokeWidth="8" 
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - results.matchScore / 100)}
                        strokeLinecap="round"
                        fill="transparent" 
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="font-serif text-2xl font-bold text-[#000000]">
                        {results.matchScore}%
                      </span>
                      <span className="font-sans text-[9px] font-bold text-[#747878] uppercase tracking-wide">
                        MATCH INDEX
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#efeded] pt-3 mt-3">
                <div className="flex justify-between text-[10px] text-[#747878]">
                  <span>Optimized elements:</span>
                  <span className="font-bold text-[#1b1c1c]">Vocabulary, Summaries</span>
                </div>
              </div>
            </div>

            {/* Fact-Checking & Fabrication Integrity Indicator */}
            <div className="md:col-span-4 bg-white border border-[#e5e5e5] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-sans text-[10px] font-bold text-[#747878] uppercase tracking-widest">
                    Fabrication Integrity Guard
                  </span>
                  <ShieldCheck className="w-4 h-4 text-[#3f6653]" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-xs text-[#444748]">Fact-check score:</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      totalVerifiedRatio === 100 ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {totalVerifiedRatio}% Secure
                    </span>
                  </div>

                  {unverifiedFacts.length > 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded text-left">
                      <p className="font-sans text-[11px] font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                        Verify Hallucination Risk:
                      </p>
                      <p className="font-sans text-[10px] text-amber-700 leading-normal">
                        We detected numbers in your tailored text not found in your original resume profile:
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {unverifiedFacts.map((fact, idx) => (
                          <span 
                            key={idx} 
                            className="bg-amber-100 border border-amber-200 text-amber-800 font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded cursor-default"
                            title="Not present in original resume text"
                          >
                            {fact.number}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-100 rounded text-left flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-sans text-[11px] font-bold text-green-800">
                          100% Fact Accuracy Vetted
                        </p>
                        <p className="font-sans text-[10px] text-green-700 leading-normal">
                          All numerical values and percentages matched original data. No fabrication detected.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#efeded] pt-3 mt-3">
                <p className="font-sans text-[9px] text-[#747878] leading-tight">
                  Fabrication Guard actively matches and safeguards numbers, dates, titles to block artificial content.
                </p>
              </div>
            </div>

            {/* Keyword gaps and suggestions list checklist */}
            <div className="md:col-span-4 bg-white border border-[#e5e5e5] rounded-lg p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-sans text-[10px] font-bold text-[#747878] uppercase tracking-widest">
                    Vocabulary Checklist
                  </span>
                  <Layers className="w-4 h-4 text-[#3f6653]" />
                </div>
                <p className="font-sans text-[10px] text-[#747878] mb-4">
                  Identify and check off keywords to ensure complete match overlap:
                </p>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {parseKeywordGaps(results.keywordGaps).map((gap, index) => {
                    const isResolved = !!resolvedGaps[gap.word];
                    return (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-2 rounded border text-left transition-colors ${
                          isResolved ? "bg-green-50 border-green-200" : "bg-[#fbf9f9] border-[#efeded]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={isResolved}
                            onChange={(e) => setResolvedGaps(prev => ({ ...prev, [gap.word]: e.target.checked }))}
                            className="rounded border-[#c4c7c7] text-[#3f6653] focus:ring-[#3f6653] h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className={`font-sans text-xs truncate ${isResolved ? "line-through text-green-700/70" : "text-[#1b1c1c] font-medium"}`}>
                            {gap.word}
                          </span>
                        </div>
                        
                        {!isResolved && (
                          <button
                            onClick={() => {
                              setDraftingForGap(gap.word);
                              setBulletDraftInput("");
                              setDraftedBulletOutput("");
                            }}
                            className="font-sans text-[9px] font-bold uppercase tracking-wide text-[#3f6653] bg-white border border-[#3f6653] hover:bg-[#3f6653]/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            Draft Bullet
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[#efeded] pt-3 mt-3">
                <div className="flex justify-between text-[10px] text-[#747878] font-mono">
                  <span>Match Coverage:</span>
                  <span>
                    {Object.values(resolvedGaps).filter(Boolean).length} / {parseKeywordGaps(results.keywordGaps).length} resolved
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Bullet drafting box */}
          <AnimatePresence>
            {draftingForGap && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-[#3f6653]/30 rounded-lg p-5 shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-start mb-3 pb-3 border-b border-[#efeded]">
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#000000] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#3f6653]" />
                      Integrate Keyword: <span className="text-[#3f6653] underline font-sans">{draftingForGap}</span>
                    </h4>
                    <p className="font-sans text-[10px] text-[#747878] mt-1">
                      Describe what you did with this skill, and Gemini will format an authentic achievement bullet matching this keyword!
                    </p>
                  </div>
                  <button 
                    onClick={() => setDraftingForGap(null)}
                    className="text-xs font-bold text-[#747878] hover:text-[#0d0d0d]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-sans text-[9px] font-bold text-[#747878] uppercase tracking-wider mb-1 block">
                      Brief Experience Details (Facts, context, or what you did)
                    </label>
                    <textarea 
                      value={bulletDraftInput}
                      onChange={(e) => setBulletDraftInput(e.target.value)}
                      placeholder="e.g., Developed the onboarding page with React and TypeScript, improving registration click rates by 12%."
                      className="w-full p-3 font-sans text-xs bg-[#fbf9f9] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#3f6653] h-16 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleDraftBullet(draftingForGap)}
                      disabled={draftingLoading || !bulletDraftInput.trim()}
                      className="bg-[#3f6653] hover:bg-[#2d4a3c] text-white text-[10px] font-bold uppercase px-4 py-2 rounded active:scale-95 transition-all disabled:opacity-50"
                    >
                      {draftingLoading ? "Drafting..." : "Generate Optimized Achievement Bullet"}
                    </button>
                  </div>

                  {draftedBulletOutput && (
                    <div className="bg-[#f5f3f3] p-4 rounded border border-[#e5e5e5] mt-2">
                      <p className="font-sans text-[9px] font-bold text-[#747878] uppercase tracking-wider mb-1.5">
                        Generated Bullet (Verify metrics before applying)
                      </p>
                      <p className="font-sans text-xs text-[#1b1c1c] leading-relaxed bg-white border border-[#efeded] p-3 rounded italic">
                        {draftedBulletOutput}
                      </p>
                      <div className="flex justify-end gap-3 mt-3">
                        <button
                          onClick={applyDraftedBullet}
                          className="bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold uppercase px-4 py-1.5 rounded active:scale-95 transition-all"
                        >
                          Apply and Append to Achievements
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Side by Side Editable Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Col matching summary & experience bullets editor */}
            <div className="md:col-span-8 space-y-6 flex flex-col justify-between">
              
              {/* Summary panel */}
              <div className="border border-[#e5e5e5] p-5 rounded-lg bg-white relative flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-[#efeded] pb-2">
                  <h3 className="font-serif text-sm font-bold text-[#000000] flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-[#3f6653]" />
                    Optimized Professional Summary
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(editedSummary, setCopiedSummary)}
                      className="p-1 hover:bg-[#f5f3f3] rounded transition-colors text-[#747878] hover:text-[#0d0d0d]"
                      title="Copy Summary"
                    >
                      {copiedSummary ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                
                <textarea 
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="w-full p-3 font-sans text-xs bg-[#fbf9f9] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#3f6653] h-28 resize-y leading-relaxed text-[#444748]"
                />
                <div className="text-right mt-1 font-mono text-[9px] text-[#747878]">
                  {editedSummary.length} characters
                </div>
              </div>

              {/* Bullet list points panel */}
              <div className="border border-[#e5e5e5] p-5 rounded-lg bg-white relative flex flex-col justify-between shadow-sm">
                <div className="flex justify-between items-center mb-3 border-b border-[#efeded] pb-2">
                  <h3 className="font-serif text-sm font-bold text-[#000000] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#3f6653]" />
                    Optimized Experience Achievements
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(editedBullets, setCopiedBullets)}
                      className="p-1 hover:bg-[#f5f3f3] rounded transition-colors text-[#747878] hover:text-[#0d0d0d]"
                      title="Copy Bullet Points"
                    >
                      {copiedBullets ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                
                <textarea 
                  value={editedBullets}
                  onChange={(e) => setEditedBullets(e.target.value)}
                  className="w-full p-3 font-mono text-[11px] bg-[#fbf9f9] border border-[#e5e5e5] rounded focus:outline-none focus:border-[#3f6653] h-56 resize-y leading-relaxed text-[#444748]"
                />
                <div className="text-right mt-1 font-mono text-[9px] text-[#747878]">
                  {editedBullets.split("\n").filter(l => l.trim()).length} achievements · {editedBullets.length} characters
                </div>
              </div>

            </div>

            {/* Right Column: Aesthetic Export Studio */}
            <div className="md:col-span-4 flex flex-col h-full">
              <div className="border border-[#e5e5e5] p-5 rounded-lg bg-white flex flex-col justify-between h-full shadow-sm">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 border-b border-[#efeded] pb-2">
                    <Settings2 className="w-4 h-4 text-[#3f6653]" />
                    <h3 className="font-serif text-sm font-bold text-[#000000]">
                      Export Design Studio
                    </h3>
                  </div>
                  <p className="font-sans text-[10px] text-[#747878] mb-4">
                    Choose an aesthetic design template to format and preview your custom tailored resume statements:
                  </p>

                  {/* Style selectors */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTemplate("minimalist")}
                      className={`text-[9px] uppercase tracking-wider font-bold py-1.5 rounded transition-all border ${
                        activeTemplate === "minimalist" 
                          ? "bg-[#3f6653] text-white border-[#3f6653]" 
                          : "bg-white text-[#747878] border-[#efeded] hover:bg-[#f5f3f3]"
                      }`}
                    >
                      Slate
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTemplate("serif")}
                      className={`text-[9px] uppercase tracking-wider font-bold py-1.5 rounded transition-all border ${
                        activeTemplate === "serif" 
                          ? "bg-[#3f6653] text-white border-[#3f6653]" 
                          : "bg-white text-[#747878] border-[#efeded] hover:bg-[#f5f3f3]"
                      }`}
                    >
                      Serif
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTemplate("executive")}
                      className={`text-[9px] uppercase tracking-wider font-bold py-1.5 rounded transition-all border ${
                        activeTemplate === "executive" 
                          ? "bg-[#3f6653] text-white border-[#3f6653]" 
                          : "bg-white text-[#747878] border-[#efeded] hover:bg-[#f5f3f3]"
                      }`}
                    >
                      Executive
                    </button>
                  </div>

                  {/* Preview Frame */}
                  <div className={`p-4 rounded border overflow-y-auto h-52 text-left shadow-inner select-none ${
                    activeTemplate === "minimalist" 
                      ? "bg-slate-50 border-slate-200 font-sans text-[10px] text-slate-800"
                      : activeTemplate === "serif"
                      ? "bg-[#fdfcf7] border-[#ebe7db] font-serif text-[10px] text-[#2c2c2c]"
                      : "bg-[#fbf9f9] border-[#efeded] font-mono text-[9px] text-slate-900"
                  }`}>
                    <div className="border-b border-[#efeded] pb-2 mb-2 text-center uppercase tracking-widest font-bold text-xs">
                      {results.jobTitle || "TARGET CANDIDATE"}
                    </div>
                    
                    <p className="font-bold uppercase text-[9px] mb-1 tracking-wider">Professional Summary</p>
                    <p className="leading-relaxed mb-3 italic opacity-90">{editedSummary}</p>
                    
                    <p className="font-bold uppercase text-[9px] mb-1 tracking-wider">Achievements & Contributions</p>
                    <div className="whitespace-pre-line leading-relaxed text-[10px] opacity-90">
                      {editedBullets}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#efeded]">
                  <button
                    onClick={() => copyToClipboard(getFormattedTemplateText(), setCopiedTemplateText)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-850 text-white font-sans text-[10px] font-bold uppercase rounded active:scale-95 duration-150 tracking-widest"
                  >
                    {copiedTemplateText ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                    Copy Formatted Resume
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

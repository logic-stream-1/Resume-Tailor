import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { History, Calendar, Clock, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { TailoringSession } from "../types";

interface HistoryScreenProps {
  sessions: TailoringSession[];
}

export default function HistoryScreen({ sessions }: HistoryScreenProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const getFormatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleSelect = (id: string) => {
    if (selectedSessionId === id) {
      setSelectedSessionId(null);
    } else {
      setSelectedSessionId(id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-[1120px] mx-auto px-6 md:px-12 py-6 mb-24 font-sans text-[#1b1c1c] text-left"
    >
      <header className="mb-8">
        <h2 className="font-serif text-2xl md:text-4xl font-bold tracking-tight text-[#000000]">
          Session History
        </h2>
        <p className="font-sans text-xs text-[#747878] mt-1">
          Review your last 10 local tailoring cycles and performance telemetry.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#c4c7c7] rounded-lg text-center bg-white">
          <History className="w-10 h-10 text-[#747878] opacity-50 mb-4" />
          <p className="font-sans text-sm text-[#747878] font-medium mb-1">
            No history found
          </p>
          <p className="font-sans text-xs text-[#747878]/70 max-w-sm">
            Your tailored sessions will automatically register here. Start customizing to see listings.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.slice(0, 10).map((session, index) => {
            const isSelected = selectedSessionId === session.id;
            return (
              <div 
                key={session.id}
                className="border border-[#e5e5e5] rounded-lg bg-white overflow-hidden transition-all shadow-sm hover:shadow"
              >
                {/* Header Summary Row */}
                <div 
                  onClick={() => toggleSelect(session.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-6 cursor-pointer hover:bg-[#fbf9f9] gap-4 transition-colors select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-serif text-sm font-bold text-[#3f6653] uppercase tracking-widest bg-[#beead1] px-2 py-0.5 rounded text-[10px]">
                        CYCLE {sessions.length - index}
                      </span>
                      <span className="font-mono text-[10px] text-[#747878] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getFormatDate(session.date)}
                      </span>
                    </div>

                    <h4 className="font-sans text-sm font-semibold truncate text-[#1b1c1c] max-w-xl">
                      {session.jobTitle ? `${session.jobTitle} at ${session.companyName}` : `${session.jobDescription.substring(0, 80)}...`}
                    </h4>
                    <p className="font-sans text-xs text-[#747878] truncate max-w-xl mt-1">
                      {session.summary.substring(0, 90)}...
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {session.matchScore !== undefined && (
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        session.matchScore >= 80 ? "bg-green-50 text-green-700" : session.matchScore >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      }`}>
                        {session.matchScore}% Score
                      </span>
                    )}
                    <div className="flex items-center gap-1 font-mono text-xs text-[#747878] bg-[#f5f3f3] px-2 py-1 rounded">
                      <Clock className="w-3.5 h-3.5" />
                      {session.timeMs}ms
                    </div>
                    {isSelected ? (
                      <ChevronDown className="w-5 h-5 text-[#747878]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#747878]" />
                    )}
                  </div>
                </div>

                {/* Animated Expanded Details Panel */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="border-t border-[#efeded] bg-[#fbf9f9]"
                    >
                      <div className="p-6 space-y-6 text-sm leading-relaxed text-[#444748] font-sans">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-sans text-xs font-bold text-[#747878] uppercase tracking-widest mb-2">
                              Job Description (Snippet)
                            </h5>
                            <div className="bg-white border border-[#e5e5e5] p-4 rounded text-xs max-h-40 overflow-y-auto whitespace-pre-line leading-relaxed">
                              {session.jobDescription}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-sans text-xs font-bold text-[#747878] uppercase tracking-widest mb-2">
                              Rewritten Summary (Archived Output)
                            </h5>
                            <div className="bg-white border border-[#e5e5e5] p-4 rounded text-xs max-h-40 overflow-y-auto whitespace-pre-line leading-relaxed italic">
                              {session.summary}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-sans text-xs font-bold text-[#747878] uppercase tracking-widest mb-2">
                            Vocabulary Gap Logs
                          </h5>
                          <div className="bg-white border border-[#e5e5e5] p-4 rounded text-xs max-h-40 overflow-y-auto whitespace-pre-line font-mono text-[#1b1c1c]">
                            {session.keywordGaps}
                          </div>
                        </div>

                        <div className="text-right text-[10px] font-mono text-[#747878]">
                          Session unique identification checksum: {session.id}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

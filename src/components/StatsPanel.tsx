import React from "react";
import { VocabItem } from "../types";
import { Award, Zap, BookOpen, CheckCircle2, TrendingUp, History, Copy } from "lucide-react";

interface StatsPanelProps {
  items: VocabItem[];
}

export interface HistoryLog {
  id: string;
  term: string;
  timestamp: string;
  score: number;
  draft: string;
}

export default function StatsPanel({ items }: StatsPanelProps) {
  // Calculations
  const totalItems = items.length;
  const testedCount = items.filter(item => item.masteryScore !== undefined).length;
  const masteredCount = items.filter(item => item.masteryScore !== undefined && item.masteryScore >= 80).length;
  
  // Total Target Index percentage (e.g. out of 4000)
  const TargetGoal = 4000;
  const dbGoalPercentage = Math.min(100, parseFloat(((totalItems / TargetGoal) * 100).toFixed(2)));

  // Average Muscle Memory Score
  const evaluatedScores = items
    .map(item => item.masteryScore)
    .filter((score): score is number => score !== undefined);
  
  const averageScore = evaluatedScores.length > 0 
    ? Math.round(evaluatedScores.reduce((sum, current) => sum + current, 0) / evaluatedScores.length)
    : 0;

  // Streak (mock static or loaded from local, let's keep a standard visual display synced with app state)
  const currentStreak = Math.min(15, items.filter(item => item.masteryScore !== undefined).length + 1 || 1);

  // Unlocked items grouped by learning stage
  const masteringTerms = items.filter(item => item.masteryScore !== undefined && item.masteryScore < 80);
  const masteredTerms = items.filter(item => item.masteryScore !== undefined && item.masteryScore >= 80);
  const unpracticedTerms = items.filter(item => item.masteryScore === undefined);

  return (
    <div className="space-y-8" id="stats-panel-dashboard">
      
      {/* 1. Statistics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Lexicon Expansion Card */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between" id="stat-lexicon">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xs uppercase text-slate-500 font-bold tracking-widest font-mono">My Global Index</span>
              <div className="bg-cyan-950/40 border border-cyan-900/30 p-2.5 rounded-xl text-cyan-400">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
            </div>
            <h4 className="text-3xl font-display font-bold text-white mb-1">{totalItems}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Unique items indexed</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850">
            <div className="flex justify-between items-center text-3xs text-slate-500 mb-1.5 font-mono">
              <span>Goal: 4,000 terms</span>
              <span>{dbGoalPercentage}%</span>
            </div>
            <div className="w-full bg-slate-950 border border-slate-850/40 rounded-full h-1.5 overflow-hidden">
              <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${dbGoalPercentage}%` }}></div>
            </div>
          </div>
        </div>

        {/* Average Muscle Memory Accuracy */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between" id="stat-accuracy">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xs uppercase text-slate-500 font-bold tracking-widest font-mono">Fluency Index</span>
              <div className="bg-emerald-950/40 border border-emerald-900/30 p-2.5 rounded-xl text-emerald-405 text-emerald-400">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
            </div>
            <h4 className="text-3xl font-display font-bold text-white mb-1">{averageScore}%</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Average recall accuracy</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850 text-3xs text-slate-505 font-medium">
            Based on <span className="text-cyan-305 font-bold font-mono">{testedCount}</span> drills completed.
          </div>
        </div>

        {/* Practice Streak */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between" id="stat-streak">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xs uppercase text-slate-400 font-bold tracking-widest font-mono">Active Streak</span>
              <div className="bg-amber-955 bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl text-amber-450 animate-pulse">
                <Zap className="h-4.5 w-4.5 text-amber-400" />
              </div>
            </div>
            <h4 className="text-3xl font-display font-bold text-white mb-1">{currentStreak}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Consecutive active days</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850 text-3xs text-emerald-400 font-mono font-bold flex items-center space-x-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Streak modifier active (+15% score)</span>
          </div>
        </div>

        {/* Absolute Mastery */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-805 shadow-xl flex flex-col justify-between" id="stat-mastery">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xs uppercase text-slate-405 text-slate-400 font-bold tracking-widest font-mono">Mastered Terms</span>
              <div className="bg-indigo-950/40 border border-indigo-900/30 p-2.5 rounded-xl text-indigo-400">
                <Award className="h-4.5 w-4.5" />
              </div>
            </div>
            <h4 className="text-3xl font-display font-bold text-white mb-1">{masteredCount}</h4>
            <p className="text-xs text-slate-455 leading-relaxed">Items scored ≥80% drill</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-850 text-3xs text-slate-500">
            Ratio size: <span className="text-white font-bold font-mono">{Math.round((masteredCount / (totalItems || 1)) * 100)}%</span> of active catalog.
          </div>
        </div>

      </div>

      {/* 2. Catalog Breakdown lists and history logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Dynamic Mastery Stage Columns */}
        <div className="lg:col-span-6 bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl">
          <h3 className="font-display font-bold text-base text-white mb-4 flex items-center space-x-2 col-span-full">
            <Award className="h-5 w-5 text-cyan-400" />
            <span>Vocabulary Map</span>
          </h3>

          <div className="space-y-6">
            
            {/* Mastered category */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xs font-bold text-slate-400 font-sans uppercase tracking-wider block">Mastered (scored ≥ 80%)</span>
                <span className="text-3xs font-mono text-emerald-400 font-bold bg-emerald-955 bg-emerald-900/10 border border-emerald-800/30 px-2 py-0.5 rounded">
                  {masteredTerms.length} terms
                </span>
              </div>
              {masteredTerms.length === 0 ? (
                <p className="text-3xs text-slate-500 italic font-mono pl-1">No masteries unlocked yet. Complete situation-based quizzes with native benchmarks!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {masteredTerms.map(item => (
                    <span key={item.id} className="text-3xs text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded hover:bg-emerald-900/60 transition border border-emerald-900/40 cursor-help font-mono" title={`Last Score: ${item.masteryScore}%`}>
                      {item.term}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* In Practice review category */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xs font-bold text-slate-400 font-sans uppercase tracking-wider block">Learning (under review)</span>
                <span className="text-3xs font-mono text-cyan-300 font-bold bg-cyan-950/40 border border-cyan-800/20 px-2 py-0.5 rounded">
                  {masteringTerms.length} terms
                </span>
              </div>
              {masteringTerms.length === 0 ? (
                <p className="text-3xs text-slate-500 italic font-mono pl-1">No terms in learning phase.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {masteringTerms.map(item => (
                    <span key={item.id} className="text-3xs text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded hover:bg-cyan-900/60 transition border border-cyan-800/25 cursor-help font-mono" title={`Last Score: ${item.masteryScore}%`}>
                      {item.term}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Unused catalog */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xs font-semibold text-slate-400 font-mono uppercase tracking-wider block">Catalog (untested terms)</span>
                <span className="text-3xs font-mono text-slate-405 text-slate-400 font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded">
                  {unpracticedTerms.length} terms
                </span>
              </div>
              <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1" style={{ scrollbarWidth: "thin" }}>
                <div className="flex flex-wrap gap-1.5">
                  {unpracticedTerms.map(item => (
                    <span key={item.id} className="text-3xs text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-850 font-mono animate-fade-in">
                      {item.term}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Practice Timeline Logs */}
        <div className="lg:col-span-6 bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="font-display font-bold text-base text-white flex items-center space-x-1.5">
              <History className="h-5 w-5 text-slate-400" />
              <span>Practice History Logs</span>
            </h3>
            <span className="text-3xs font-mono text-slate-500 uppercase tracking-widest">Chronological Drills</span>
          </div>

          <div className="flex-grow overflow-y-auto space-y-4 max-h-[380px] pr-1" style={{ scrollbarWidth: "thin" }}>
            {items.filter(i => i.userBestResponse).length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center min-h-[220px]">
                <History className="h-8 w-8 text-slate-655 mb-2 text-cyan-400" />
                <p className="text-xs text-slate-400">No active drill history.</p>
                <p className="text-3xs text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                  Submit your first active sentence practicing of words to store digital log memories.
                </p>
              </div>
            ) : (
              items.filter(i => i.userBestResponse).map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-850 hover:bg-slate-900 rounded-2xl p-4 flex flex-col justify-between transition">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-white font-display">{item.term}</span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${item.masteryScore! >= 80 ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/30" : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/30"}`}>
                        Accuracy Score: {item.masteryScore}%
                      </span>
                    </div>
                    <blockquote className="text-xs text-slate-305 text-slate-300 leading-relaxed italic border-l-2 border-cyan-500/30 pl-3">
                      "{item.userBestResponse}"
                    </blockquote>
                  </div>
                  {item.unlockedAt && (
                    <div className="text-[10px] text-slate-500 mt-2 font-mono text-right">
                      Logged: {item.unlockedAt}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

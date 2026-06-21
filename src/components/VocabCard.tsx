import React, { useState } from "react";
import { VocabItem, EvaluationResult } from "../types";
import { Volume2, Sparkles, CheckCircle2, AlertCircle, ArrowRight, BookOpen, Clock, Lightbulb } from "lucide-react";

interface VocabCardProps {
  key?: string;
  item: VocabItem;
  dayNum: number;
  onUpdateMastery: (id: string, score: number, userResponse: string) => void;
}

export default function VocabCard({ item, dayNum, onUpdateMastery }: VocabCardProps) {
  const [userSentence, setUserSentence] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Play audio of the term using Web Speech API
  const handleListen = (textToSpeak: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.9; // slightly slower for language learners
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in your browser.");
    }
  };

  // Submit response for AI evaluation
  const handleEvaluate = async () => {
    if (!userSentence.trim()) {
      setErrorMsg("Please write a sentence first to test your muscle memory!");
      return;
    }
    setErrorMsg(null);
    setIsEvaluating(true);

    try {
      const response = await fetch("/api/evaluate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: item.term,
          userResponse: userSentence,
          scenarioInfo: `Practicing the muscle memory prompt: "${item.muscle_memory_prompt}"`
        })
      });

      if (!response.ok) {
        throw new Error("Evaluation endpoint error");
      }

      const data: EvaluationResult = await response.json();
      setFeedback(data);
      onUpdateMastery(item.id, data.score, userSentence);
    } catch (err: any) {
      console.error(err);
      // Fallback evaluation locally
      const hasTerm = userSentence.toLowerCase().includes(item.term.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ""));
      const fallbackScore = hasTerm ? 85 : 45;
      const fallbackResult: EvaluationResult = {
        score: fallbackScore,
        feedback: hasTerm 
          ? "Terrific draft! You used the term accurately. Keep writing longer, more descriptively to cement this."
          : `Make sure to incorporate the exact phrase "${item.term}" inside your sentence!`,
        corrections: hasTerm ? userSentence : `E.g., "I wanted to splurge on that beautiful purse, but I decided to save."`,
        muscleMemoryBooster: "Pronounce: " + item.pronunciation_respelling.toUpperCase() + ". Click the speaker to practice speaking along!",
        rating: fallbackScore >= 80 ? "Fluent" : "Novice"
      };
      setFeedback(fallbackResult);
      onUpdateMastery(item.id, fallbackScore, userSentence);
    } finally {
      setIsEvaluating(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "idiom":
        return "bg-emerald-950/40 text-emerald-300 border-emerald-800/60";
      case "phrase":
        return "bg-teal-950/40 text-teal-300 border-teal-800/60";
      default:
        return "bg-cyan-950/40 text-cyan-300 border-cyan-800/60";
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500 text-stone-950";
    if (score >= 70) return "bg-cyan-500 text-stone-950";
    return "bg-slate-850 border border-slate-700 text-slate-300";
  };

  const isIdiomOrPhrase = item.type === "idiom" || item.type === "phrase";
  const themeColorClass = isIdiomOrPhrase ? "emerald" : "cyan";

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl hover:shadow-cyan-950/20 transition-all duration-300 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden" id={`vocab-card-${item.id}`}>
      {/* Decorative Index background numeral */}
      <div className="absolute -right-4 -top-6 text-9xl font-black text-slate-800/10 pointer-events-none select-none">
        {dayNum < 10 ? `0${dayNum}` : dayNum}
      </div>

      {/* Upper info section */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-3 py-1 rounded-full border font-mono font-bold uppercase tracking-wider ${getTypeColor(item.type)}`}>
              [{item.type}]
            </span>
            <span className="text-slate-500 text-xs font-mono">Day {dayNum} Drop</span>
          </div>
          {item.masteryScore !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-mono">Mastery:</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${getScoreBadgeColor(item.masteryScore)}`}>
                {item.masteryScore}%
              </span>
            </div>
          )}
        </div>

        {/* Head term */}
        <div className="flex items-center space-x-3 mb-2">
          <h2 className="text-3xl md:text-4xl font-display font-medium text-white tracking-tight">{item.term}</h2>
          <button 
            onClick={() => handleListen(item.term)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-full transition-all duration-200"
            title="Hear Pronunciation"
            id={`listen-btn-${item.id}`}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>

        {/* Phonetic key */}
        <div className="text-xs text-cyan-400 font-mono tracking-widest bg-cyan-950/20 border border-cyan-800/30 inline-block px-3 py-1 rounded-lg mb-4 uppercase italic">
          {item.pronunciation_respelling}
        </div>

        {/* Definition */}
        <div className="bg-slate-800/30 rounded-2xl p-4 mb-5 border border-slate-800/80">
          <div className="flex items-start space-x-2.5">
            <BookOpen className="h-4.5 w-4.5 text-slate-500 mt-1 flex-shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-1">Accessibility Definition</span>
              <p className="text-slate-200 text-sm leading-snug font-medium">
                {item.definition}
              </p>
            </div>
          </div>
        </div>

        {/* High-yield synonyms */}
        <div className="mb-5">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2 font-mono">High-yield Synonyms</span>
          <div className="flex flex-wrap gap-2">
            {item.synonyms.map((syn, idx) => (
              <span 
                key={idx} 
                className="text-xs text-cyan-300 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 px-3 py-1 rounded-full transition-all cursor-pointer font-mono"
                onClick={() => handleListen(syn)}
                title="Click to hear"
              >
                {syn}
              </span>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div className="mb-6">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-2 font-mono">Vivid Context Examples</span>
          <div className="space-y-3">
            {item.examples.map((example, idx) => (
              <div key={idx} className="flex gap-3 bg-slate-800/10 p-3 rounded-xl border border-slate-800/50 transition-colors hover:bg-slate-800/20">
                <div className={`w-1 h-auto ${isIdiomOrPhrase ? "bg-emerald-500" : "bg-cyan-500"} rounded-full flex-shrink-0`}></div>
                <p className="text-slate-300 text-sm italic leading-relaxed flex-grow">
                  "{example}"
                </p>
                <button 
                  onClick={() => handleListen(example)}
                  className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 p-1 rounded-lg transition-colors flex-shrink-0 self-start"
                  title="Hear example sentence"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Muscle memory booster practice pad themed beautifully according to active type */}
      <div className="border-t border-slate-800 pt-5 mt-auto relative z-10">
        <div className={`rounded-3xl p-5 border-2 ${isIdiomOrPhrase ? "bg-emerald-950/20 border-emerald-500/30" : "bg-cyan-950/20 border-cyan-500/30"}`}>
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 ${isIdiomOrPhrase ? "bg-emerald-400" : "bg-cyan-400"} rounded-full`}></div>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${isIdiomOrPhrase ? "text-emerald-400" : "text-cyan-400"} font-mono`}>
              {isIdiomOrPhrase ? "Muscle Memory Builder" : "Active Recall Prompt"}
            </span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed mb-3 select-all selection:bg-slate-800 decoration-slate-900 font-medium">
            {item.muscle_memory_prompt}
          </p>

          <textarea
            value={userSentence}
            onChange={(e) => {
              setUserSentence(e.target.value);
              setErrorMsg(null);
            }}
            placeholder={`Practice here... Make sure to include "${item.term}" naturally.`}
            className="w-full text-xs px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:border-slate-700 focus:outline-none transition-all resize-none h-18 shadow-inner placeholder-slate-600 font-sans"
            id={`textarea-${item.id}`}
          />

          {errorMsg && (
            <div className="flex items-center space-x-1.5 text-rose-400 text-xs mt-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex justify-end mt-3">
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className={`w-full ${isIdiomOrPhrase ? "bg-emerald-600 hover:bg-emerald-500" : "bg-cyan-600 hover:bg-cyan-500"} text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-colors flex items-center justify-center space-x-1 shadow-lg ${isEvaluating ? "opacity-50 cursor-not-allowed" : ""}`}
              id={`eval-btn-${item.id}`}
            >
              {isEvaluating ? (
                <span>Coaching...</span>
              ) : (
                <>
                  <span>Activate Muscle Memory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* AI Evaluation feedback block */}
          {feedback && (
            <div className="mt-4 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 shadow-xl animate-fade-in relative overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-slate-900 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-2xs uppercase tracking-wider">Coach Diagnostics</span>
                </span>
                <span className={`text-[10px] font-bold font-mono uppercase px-2.5 py-0.5 rounded ${feedback.score >= 80 ? "bg-emerald-950 text-emerald-400 border border-emerald-900" : "bg-cyan-950 text-cyan-400 border border-cyan-900"}`}>
                  {feedback.rating} ({feedback.score} pts)
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-3 font-sans selection:bg-slate-800">
                {feedback.feedback}
              </p>

              {feedback.corrections && feedback.corrections !== userSentence && (
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/65 mb-3">
                  <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest block mb-1 font-mono">Polished Benchmark Quote:</span>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-100 text-xs italic flex-grow">"{feedback.corrections}"</p>
                    <button 
                      onClick={() => handleListen(feedback.corrections!)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Listen to correction"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-2 text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <Lightbulb className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-sans text-slate-300">
                  <span className="font-bold text-cyan-300">Booster:</span> {feedback.muscleMemoryBooster}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

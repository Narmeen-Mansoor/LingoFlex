import React, { useState, useEffect } from "react";
import { VocabItem, QuizSituation, EvaluationResult } from "../types";
import { Sparkles, Send, Volume2, Bookmark, CheckCircle2, Award, FileText, ArrowRight, RefreshCw, MessageSquare, AlertCircle } from "lucide-react";

interface QuizPanelProps {
  vocabList: VocabItem[];
  onUpdateScore: (id: string, score: number) => void;
  initialItem?: VocabItem | null;
}

export default function QuizPanel({ vocabList, onUpdateScore, initialItem }: QuizPanelProps) {
  const [selectedItem, setSelectedItem] = useState<VocabItem | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizSituation, setQuizSituation] = useState<QuizSituation | null>(null);
  
  const [userResponse, setUserResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize with initialItem or first item of the list
  useEffect(() => {
    if (initialItem) {
      setSelectedItem(initialItem);
    } else if (vocabList.length > 0 && !selectedItem) {
      setSelectedItem(vocabList[0]);
    }
  }, [vocabList, selectedItem, initialItem]);

  // Handle speaker audio using Web Speech synthesis
  const handleTTS = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sentence = new SpeechSynthesisUtterance(text);
      sentence.lang = "en-US";
      sentence.rate = 0.95;
      window.speechSynthesis.speak(sentence);
    }
  };

  // Trigger scenario generation
  const handleGenerateQuiz = async (item: VocabItem) => {
    setLoadingQuiz(true);
    setResult(null);
    setUserResponse("");
    setQuizSituation(null);
    setErrorMessage(null);

    try {
      const resp = await fetch("/api/generate-situation-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: item.term, type: item.type })
      });

      if (!resp.ok) {
        throw new Error("Quiz creation API failure");
      }

      const data: QuizSituation = await resp.json();
      setQuizSituation(data);
    } catch (err) {
      console.error(err);
      // Local fallback situation setup
      const fallback: QuizSituation = {
        term: item.term,
        type: item.type,
        scenario: `You are in a lively team scrum or dinner conversation and need to state exactly how some pending challenges are now perfectly sorted out and functioning correctly.`,
        roleplayPrompt: `Address your skeptical manager or colleague. Reassure them that everything is resolved using the term '${item.term}'.`,
        vividContext: `"So, are there still outstanding blockers, or is the team feeling ready for the product demo tomorrow?"`,
        suggestedHelperWords: ["demo", "smoothly", "progress", "resolved"]
      };
      setQuizSituation(fallback);
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Submit response for grading
  const handleSubmitGrading = async () => {
    if (!userResponse.trim()) {
      setErrorMessage("Please type a response first to evaluate your response!");
      return;
    }
    if (!quizSituation) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/evaluate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: quizSituation.term,
          userResponse: userResponse,
          scenarioInfo: `Situation Context: ${quizSituation.scenario}. Dialogue quote: ${quizSituation.vividContext}`
        })
      });

      if (!resp.ok) {
        throw new Error("Grading logic failed");
      }

      const data: EvaluationResult = await resp.json();
      setResult(data);
      if (selectedItem) {
        onUpdateScore(selectedItem.id, data.score);
      }
    } catch (err) {
      console.error(err);
      const containsTerm = userResponse.toLowerCase().includes(quizSituation.term.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ""));
      const fallbackScore = containsTerm ? 88 : 50;
      const fallbackEvaluation: EvaluationResult = {
        score: fallbackScore,
        feedback: containsTerm 
          ? "Great syntactic structure! Doing fantastic. For your next attempt, try integrating longer transition phrases." 
          : "Your grammar is clear, but remember that the active target term must be used inside your response to unlock mastery!",
        corrections: containsTerm ? userResponse : `Actually: "Don't worry, the setup is pristine and everything is ${quizSituation.term}."`,
        muscleMemoryBooster: "Focus on voice flow! Try saying your sentence out loud twice to cement the muscle memory.",
        rating: fallbackScore >= 80 ? "Fluent" : "Novice"
      };
      setResult(fallbackEvaluation);
      if (selectedItem) {
        onUpdateScore(selectedItem.id, fallbackScore);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="quiz-builder">
      {/* Sidebar: Term Selector */}
      <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[520px]">
        <h3 className="font-display font-bold text-lg text-white mb-2 flex items-center space-x-2">
          <Bookmark className="h-5 w-5 text-cyan-400" />
          <span>Practice Lab</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4 font-sans">
          Select any term below to generate an interactive life context scenario.
        </p>

        {/* Scroll list */}
        <div className="overflow-y-auto flex-grow space-y-2 pr-1" style={{ scrollbarWidth: "thin" }}>
          {vocabList.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isIdiom = item.type === "idiom" || item.type === "phrase";
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between ${isSelected ? "bg-slate-850 border-cyan-500/30 text-white font-bold shadow-inner" : "bg-slate-950/20 border-slate-850 text-slate-300 hover:border-slate-850 hover:bg-slate-900/30"}`}
                id={`sidebar-item-${item.id}`}
              >
                <div className="flex flex-col space-y-1">
                  <span className="font-display text-sm tracking-tight text-white">{item.term}</span>
                  <span className={`text-[10px] uppercase tracking-widest font-mono font-bold ${isIdiom ? "text-emerald-400" : "text-cyan-400"}`}>{item.type}</span>
                </div>
                {item.masteryScore !== undefined && (
                  <span className="text-2xs px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                    {item.masteryScore}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedItem && (
          <button
            onClick={() => handleGenerateQuiz(selectedItem)}
            disabled={loadingQuiz}
            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs py-3 rounded-2xl shadow transition-all flex items-center justify-center space-x-2 uppercase tracking-wider"
            id="start-quiz-btn"
          >
            {loadingQuiz ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-stone-950" />
                <span>Simulating Scenario...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-stone-950" />
                <span>Simulate Lifelike Scenario</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Panel: Interactive Coach Simulator */}
      <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl overflow-hidden min-h-[520px]">
        {!quizSituation && !loadingQuiz ? (
          <div className="p-12 flex flex-col items-center justify-center text-center h-[520px]">
            <div className="bg-cyan-950/20 p-4 rounded-full mb-4 border border-cyan-800/20">
              <MessageSquare className="h-10 w-10 text-cyan-450 animate-pulse" />
            </div>
            <h4 className="text-xl font-display font-bold text-white mb-2">Initialize Situational Roleplay</h4>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
              Language muscle memory is built when you actively formulate answers in a given context, rather than completing passive worksheets. Focus on the situation!
            </p>
            {selectedItem && (
              <button
                onClick={() => handleGenerateQuiz(selectedItem)}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 hover:scale-102 transform font-bold text-stone-950 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-md"
                id="init-quiz-btn"
              >
                Simulate Scenario for "{selectedItem.term}"
              </button>
            )}
          </div>
        ) : loadingQuiz ? (
          <div className="p-12 flex flex-col items-center justify-center text-center h-[520px]">
            <div className="relative mb-6">
              <div className="rounded-full bg-cyan-950/20 p-10 animate-ping absolute inset-0 opacity-20"></div>
              <div className="relative rounded-full bg-slate-950 border border-slate-850 p-8">
                <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
              </div>
            </div>
            <h4 className="text-lg font-display font-medium text-white mb-2">Analyzing vocabulary contexts...</h4>
            <p className="text-slate-400 text-xs max-w-md italic animate-pulse">
              Gemini is weaving a real-world scenario so you can practice using "{selectedItem?.term}" in context...
            </p>
          </div>
        ) : (
          <div className="p-6 md:p-8 flex flex-col justify-between min-h-[520px] animate-fade-in" id="active-quiz-frame">
            <div>
              {/* Scenario Header */}
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-2xs uppercase tracking-widest font-mono font-bold text-cyan-400">Active Lab Simulation</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-850 text-2xs text-slate-305 font-mono">
                    Target: "{quizSituation?.term}"
                  </span>
                </div>
                <button 
                  onClick={() => handleGenerateQuiz(selectedItem!)}
                  className="text-xs text-cyan-400 font-bold font-mono flex items-center space-x-1 hover:text-cyan-300 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Regen Scenario</span>
                </button>
              </div>

              {/* Story Scenario */}
              <div className="mb-5 bg-slate-800/10 rounded-2xl p-4 border border-slate-805">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest block mb-1.5 font-mono">Scenario Setup</span>
                <p className="text-slate-205 text-sm leading-relaxed font-sans select-all selection:bg-slate-850 text-slate-200">
                  {quizSituation?.scenario}
                </p>
              </div>

              {/* Characters interaction box */}
              <div className="mb-5 bg-cyan-950/20 rounded-2xl p-4 border border-cyan-800/30 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest font-mono">Dialogue cue in play:</span>
                  <button 
                    onClick={() => handleTTS(quizSituation!.vividContext)}
                    className="p-1 rounded-full text-cyan-400 hover:text-white hover:bg-slate-800 transition-all shadow-sm"
                    title="Speak dialog cue out loud"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
                <blockquote className="text-slate-200 font-mono text-xs italic pl-3 border-l-2 border-cyan-400">
                  "{quizSituation?.vividContext}"
                </blockquote>
              </div>

              {/* Active Prompt Instructions */}
              <div className="mb-5">
                <span className="text-slate-500 text-[10px] uppercase tracking-widest font-mono block mb-1.5">Instruction</span>
                <p className="text-white font-bold text-sm leading-relaxed">
                  {quizSituation?.roleplayPrompt}
                </p>
              </div>

              {/* Helper words */}
              {quizSituation?.suggestedHelperWords && quizSituation.suggestedHelperWords.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2 items-center">
                  <span className="text-slate-500 text-[10px] font-bold block uppercase font-mono">Utility vocabulary:</span>
                  {quizSituation.suggestedHelperWords.map((word, idx) => (
                    <span 
                      key={idx} 
                      className="text-xs font-mono text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full hover:border-cyan-500/30 transition-all cursor-pointer"
                      onClick={() => handleTTS(word)}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Input & grades */}
            <div className="border-t border-slate-800 pt-5 mt-4">
              <div className="flex flex-col space-y-2 mb-3">
                <label className="text-slate-500 text-[10px] font-mono tracking-widest font-bold uppercase">Synthesize Your Response Sentence:</label>
                <div className="relative">
                  <textarea
                    value={userResponse}
                    onChange={(e) => {
                      setUserResponse(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={`Write your response. Make sure to embed "${quizSituation?.term}" naturally!`}
                    className="w-full text-xs px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-slate-700 focus:outline-none transition-all resize-none h-18 text-white rounded-2xl shadow-inner placeholder-slate-605"
                    id="user-quiz-text"
                  />
                  {userResponse && (
                    <button 
                      onClick={() => handleTTS(userResponse)}
                      className="absolute right-3.5 bottom-3.5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      title="Hear your answer"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-450 font-medium mb-3 flex items-center space-x-1.5 text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{errorMessage}</span>
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSubmitGrading}
                  disabled={isSubmitting}
                  className={`w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-stone-950 font-bold text-xs rounded-2xl transition-colors tracking-widest uppercase shadow-lg flex items-center justify-center space-x-2 ${isSubmitting ? "opacity-50" : ""}`}
                  id="submit-quiz-grading"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Evaluating your English syntax...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5 text-stone-950" />
                      <span>Request LingoFlex Grade</span>
                    </>
                  )}
                </button>
              </div>

              {/* grading results panel */}
              {result && (
                <div className="mt-6 bg-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl animate-fade-in flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-900">
                    <div className="flex items-center space-x-2.5 mb-2 sm:mb-0">
                      <div className="bg-cyan-950 border border-cyan-800/30 p-2.5 rounded-xl text-cyan-400">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="font-display font-medium text-sm text-white">Muscle Memory Diagnostics</h5>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Expert Coach feedback</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-500 font-mono">Lingo rating:</span>
                      <span className={`text-2xs font-bold uppercase px-3 py-1 rounded-full font-mono ${result.score >= 90 ? "bg-emerald-500 text-stone-950" : result.score >= 70 ? "bg-cyan-500 text-stone-950" : "bg-slate-800 border border-slate-705 text-slate-300"}`}>
                        {result.rating} ({result.score} / 100)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-905 border border-slate-850 p-4 rounded-xl relative">
                    <span className="text-slate-500 text-[9px] uppercase tracking-widest absolute -top-2 left-3 px-1.5 bg-slate-900 border border-slate-850 rounded font-mono">Coaches Commentary</span>
                    <p className="selection:bg-slate-800 font-medium text-slate-300">{result.feedback}</p>
                  </div>

                  {result.corrections && result.corrections !== userResponse && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-850">
                      <span className="text-cyan-400 font-bold text-[9px] uppercase tracking-widest block mb-1 font-mono">Fluency Benchmark correction:</span>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs italic text-slate-205 leading-relaxed flex-grow">"{result.corrections}"</p>
                        <button 
                          onClick={() => handleTTS(result.corrections!)}
                          className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full bg-slate-950 border border-slate-800 shadow-sm flex-shrink-0"
                          title="Speak corrected benchmark sentence"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2.5 text-slate-300 bg-cyan-950/20 border border-cyan-800/30 p-3 rounded-xl">
                    <Sparkles className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <p className="text-xs leading-relaxed">
                      <span className="font-bold underline text-cyan-300 font-mono">Booster:</span> {result.muscleMemoryBooster}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

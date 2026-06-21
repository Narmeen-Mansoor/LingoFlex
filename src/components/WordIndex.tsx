import React, { useState } from "react";
import { VocabItem, DayDrop } from "../types";
import { Search, Filter, BookOpen, Volume2, Sparkles, RefreshCw, AlertCircle, PlayCircle, HelpCircle, UserCheck } from "lucide-react";

interface WordIndexProps {
  items: VocabItem[];
  onStartQuiz: (item: VocabItem) => void;
  onGenerateCustomDrop: (theme: string) => Promise<void>;
  isGeneratingDrop: boolean;
}

export default function WordIndex({ items, onStartQuiz, onGenerateCustomDrop, isGeneratingDrop }: WordIndexProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "word" | "idiom" | "phrase">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "learning" | "mastered">("all");
  const [customThemeInput, setCustomThemeInput] = useState("");
  const [expansionError, setExpansionError] = useState<string | null>(null);
  const [expansionSuccess, setExpansionSuccess] = useState(false);

  // Selected item modal/drawer details
  const [inspectedItem, setInspectedItem] = useState<VocabItem | null>(null);

  // TTS audio playback
  const handleTTS = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sentence = new SpeechSynthesisUtterance(text);
      sentence.lang = "en-US";
      sentence.rate = 0.95;
      window.speechSynthesis.speak(sentence);
    }
  };

  // Filter logic
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "all" || item.type === selectedType;
    
    let matchesStatus = true;
    if (selectedStatus === "mastered") {
      matchesStatus = (item.masteryScore !== undefined && item.masteryScore >= 80);
    } else if (selectedStatus === "learning") {
      matchesStatus = (item.masteryScore === undefined || item.masteryScore < 80);
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCustomDropdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customThemeInput.trim()) {
      setExpansionError("Please enter a theme or interest (e.g. Space, Cooking, Software) first!");
      return;
    }
    setExpansionError(null);
    setExpansionSuccess(false);

    try {
      await onGenerateCustomDrop(customThemeInput.trim());
      setExpansionSuccess(true);
      setCustomThemeInput("");
      setTimeout(() => setExpansionSuccess(false), 5000); // clear banner
    } catch (err: any) {
      setExpansionError(err.message || "An error occurred during index expansion.");
    }
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case "idiom": return "bg-emerald-950/40 text-emerald-300 border-emerald-900/30";
      case "phrase": return "bg-emerald-950/40 text-emerald-300 border-emerald-900/30";
      default: return "bg-cyan-950/40 text-cyan-300 border-cyan-900/30";
    }
  };

  return (
    <div className="space-y-8" id="word-index-container">
      
      {/* 1. Dynamic Lexical Index Expansion Banner (To reach 4,000+ over time) */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
        {/* Glow circles and grids */}
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(ellipse_200%_150%_at_40%_120%,rgba(6,182,212,0.1),transparent_60%)] pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-cyan-950/40 px-2.5 py-1 rounded-full text-cyan-300 border border-cyan-800/30 text-2xs uppercase tracking-widest font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Lexical Extension Engine</span>
            </div>
            <h3 className="text-xl md:text-2xl font-display font-bold leading-tight tracking-tight">
              Expand Your Cumulative Dictionary Index
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg select-none">
              LingoFlex is configured to target an active memory index of 4,000+ unique lexical items over time. Dynamically generate tailored word/idiom drops based on real-world domains.
            </p>
          </div>

          <div className="md:col-span-5">
            <form onSubmit={handleCustomDropdownSubmit} className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex flex-col space-y-2.5">
              <label className="text-3xs uppercase text-slate-500 font-bold tracking-wider font-mono block">
                Describe a scenario, hobby or industry style:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customThemeInput}
                  onChange={(e) => setCustomThemeInput(e.target.value)}
                  placeholder="e.g. aviation pilot, baking sourdough, tech startups..."
                  className="flex-grow bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-cyan-500 transition"
                  id="custom-theme-input"
                  disabled={isGeneratingDrop}
                />
                <button
                  type="submit"
                  disabled={isGeneratingDrop}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-stone-950 hover:text-white rounded-xl text-xs font-semibold shadow transition-all flex items-center space-x-1"
                  id="submit-expansion-btn"
                >
                  {isGeneratingDrop ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-stone-950" />
                  ) : (
                    <span className="font-mono text-xs uppercase tracking-widest">Extend</span>
                  )}
                </button>
              </div>

              {expansionError && (
                <div className="flex items-center space-x-1 text-rose-400 text-2xs mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{expansionError}</span>
                </div>
              )}

              {expansionSuccess && (
                <div className="bg-emerald-900/20 border border-emerald-800/30 text-emerald-400 p-2 rounded-xl text-2xs">
                  ✨ Vocabulary added successfully! Check your list & Day Drop slots.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search and Filters Bento Grid */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl shadow-xl p-4 md:p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Search Input */}
        <div className="sm:col-span-6 relative">
          <label className="sr-only">Search vocabulary</label>
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-cyan-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms, synonyms, or definitions..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl leading-5 text-xs text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 transition"
            id="dictionary-search"
          />
        </div>

        {/* Filter Selection: Type */}
        <div className="sm:col-span-3 flex items-center space-x-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-widest font-mono">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="flex-grow bg-slate-950 border border-slate-800 text-3xs font-mono py-1.5 px-2 rounded-lg text-slate-350 outline-none focus:border-cyan-500 transition"
            id="type-filter-select"
          >
            <option value="all">All Types</option>
            <option value="word">Words</option>
            <option value="idiom">Idioms</option>
            <option value="phrase">Phrases</option>
          </select>
        </div>

        {/* Filter Selection: Mastery Status */}
        <div className="sm:col-span-3 flex items-center space-x-2">
          <UserCheck className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-3xs font-bold text-slate-500 uppercase tracking-widest font-mono">Grade:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="flex-grow bg-slate-950 border border-slate-800 text-3xs font-mono py-1.5 px-2 rounded-lg text-slate-350 outline-none focus:border-cyan-500 transition"
            id="status-filter-select"
          >
            <option value="all">All Status</option>
            <option value="learning">Under Review</option>
            <option value="mastered">Mastered (≥80%)</option>
          </select>
        </div>
      </div>

      {/* 3. Word Matrix List & Selected Item Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Core Matrix Grid */}
        <div className="lg:col-span-7 space-y-3 max-h-[700px] overflow-y-auto pr-2" style={{ scrollbarWidth: "thin" }}>
          {filteredItems.length === 0 ? (
            <div className="bg-slate-900/50 rounded-3xl p-12 text-center border border-slate-800 shadow-xl flex flex-col items-center">
              <BookOpen className="h-8 w-8 text-slate-600 mb-2" />
              <h5 className="font-semibold text-slate-400 text-sm">No lexical matches</h5>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Try modifying your filter categories or typing a different search query. Or use the Extension engine to inject fresh vocabulary drops!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const isMastered = item.masteryScore !== undefined && item.masteryScore >= 80;
                return (
                  <div
                    key={item.id}
                    onClick={() => setInspectedItem(item)}
                    className="p-5 bg-slate-900/40 border border-slate-850 hover:border-cyan-550 rounded-3xl cursor-pointer transition shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between hover:bg-slate-850/40"
                    id={`matrix-item-${item.id}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest border px-2 py-0.5 rounded ${getBadgeClass(item.type)}`}>
                          {item.type}
                        </span>
                        {item.masteryScore !== undefined && (
                          <span className={`text-3xs font-mono font-bold px-2.5 py-0.5 rounded-full ${isMastered ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/20" : "bg-cyan-950/60 text-cyan-300 border border-cyan-800/20"}`}>
                            {item.masteryScore}%
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-display font-bold text-base text-white tracking-tight mb-1">
                        {item.term}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                        {item.definition}
                      </p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-850 pt-3 mt-3">
                      <span className="text-3xs font-mono text-cyan-400">
                        {item.pronunciation_respelling}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTTS(item.term);
                        }}
                        className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Lexical Item Detailed Sandbox Panel */}
        <div className="lg:col-span-5 h-[700px]">
          {inspectedItem ? (
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 shadow-xl p-6 md:p-8 flex flex-col justify-between h-full relative" id="lexical-detail-sandbox">
              <div className="space-y-5">
                <span className="text-3xs font-bold uppercase text-slate-500 block tracking-widest font-mono">Lexical Dossier</span>
                
                <div className="flex items-center space-x-3">
                  <h3 className="text-2xl font-display font-bold text-white leading-tight">{inspectedItem.term}</h3>
                  <button 
                    onClick={() => handleTTS(inspectedItem.term)}
                    className="p-1.5 text-cyan-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 transition"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-3xs text-cyan-400 font-mono tracking-wider bg-slate-950 inline-block px-3 py-1 rounded border border-slate-850">
                  Phonetics: <span className="font-bold text-white">{inspectedItem.pronunciation_respelling}</span>
                </div>

                <div className="space-y-4">
                  {/* Definition */}
                  <div>
                    <span className="text-3xs uppercase font-bold text-slate-500 block mb-1.5 font-mono">Accessibility Definition</span>
                    <p className="text-slate-205 text-xs leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850 text-slate-300">
                      {inspectedItem.definition}
                    </p>
                  </div>

                  {/* Synonyms */}
                  <div>
                    <span className="text-3xs uppercase font-bold text-slate-500 block mb-1.5 font-mono">High-Yield Synonyms</span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedItem.synonyms.map((s, idx) => (
                        <span key={idx} className="text-xs font-mono text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <span className="text-3xs uppercase font-bold text-slate-500 block mb-1.5 font-mono">Exemplar Conversations</span>
                    <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1" style={{ scrollbarWidth: "none" }}>
                      {inspectedItem.examples.map((ex, idx) => (
                        <div key={idx} className="flex items-start space-x-2 bg-slate-955 bg-slate-950 p-3 rounded-xl text-3xs italic text-slate-300 border border-slate-850">
                          <span className="font-bold font-mono text-cyan-400 flex-shrink-0">Ex {idx+1}:</span>
                          <span className="leading-relaxed font-sans">{ex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Muscle memory booster prompt */}
                  <div className="bg-cyan-950/20 p-4 rounded-xl border border-cyan-900/30">
                    <span className="text-cyan-400 font-bold block text-3xs uppercase tracking-wider mb-1 font-mono">Muscle memory prompt:</span>
                    <p className="text-slate-300 font-medium text-xs leading-relaxed">
                      {inspectedItem.muscle_memory_prompt}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-850 mt-6 flex justify-end">
                <button
                  onClick={() => onStartQuiz(inspectedItem)}
                  className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-505 text-stone-950 hover:text-white font-bold text-xs rounded-xl shadow transition duration-200 uppercase tracking-widest flex items-center justify-center space-x-2"
                  id="inspect-start-quiz"
                >
                  <PlayCircle className="h-4.5 w-4.5" />
                  <span>Practice Interactive Quiz</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 shadow-xl p-8 text-center h-full flex flex-col items-center justify-center">
              <div className="bg-slate-950 p-4 rounded-full mb-3 text-slate-600 border border-slate-850">
                <HelpCircle className="h-8 w-8 text-cyan-400" />
              </div>
              <h4 className="font-display font-medium text-white mb-1.5">No Dossier Inspected</h4>
              <p className="text-slate-500 text-xs max-w-xs leading-relaxed">
                Select any word or idiom from the lexical matrix grid to inspect live phonetics, conversation dialogues, or start targeted roleplay simulation instantly.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

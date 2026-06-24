import React, { useState, useEffect } from "react";
import { VocabItem } from "../types";
import { fullLexicon } from "../lexicon";
import { 
  Search, Filter, BookOpen, Volume2, Sparkles, RefreshCw, 
  AlertCircle, PlayCircle, HelpCircle, UserCheck, Plus, CheckCircle, Info, X 
} from "lucide-react";

interface WordIndexProps {
  items: VocabItem[];
  onStartQuiz: (item: VocabItem) => void;
  onGenerateCustomDrop: (theme: string) => Promise<void>;
  isGeneratingDrop: boolean;
  onAddTermToStudyList: (item: VocabItem) => void;
}

export default function WordIndex({ 
  items, 
  onStartQuiz, 
  onGenerateCustomDrop, 
  isGeneratingDrop,
  onAddTermToStudyList
}: WordIndexProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "word" | "idiom" | "phrase">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "learning" | "mastered" | "unlocked">("all");
  const [customThemeInput, setCustomThemeInput] = useState("");
  const [expansionError, setExpansionError] = useState<string | null>(null);
  const [expansionSuccess, setExpansionSuccess] = useState(false);

  // Performance - chunk rendering pagination
  const [visibleCount, setVisibleCount] = useState(40);

  // Selected item modal details
  const [inspectedItem, setInspectedItem] = useState<VocabItem | null>(null);

  // Reset pagination on filter or search parameter modifications
  useEffect(() => {
    setVisibleCount(40);
  }, [searchQuery, selectedType, selectedStatus]);

  // Merge the original/baseline list with the global 4,000+ Lexicon
  const mergedItems = React.useMemo(() => {
    return fullLexicon.map((lexItem) => {
      const activeItem = items.find((i) => i.term.toLowerCase() === lexItem.term.toLowerCase());
      return {
        id: activeItem?.id || `lex-${lexItem.term.replace(/\s+/g, "-").toLowerCase()}`,
        type: lexItem.type,
        term: lexItem.term,
        pronunciation_respelling: lexItem.pronunciation_respelling,
        definition: lexItem.definition,
        synonyms: lexItem.synonyms,
        examples: lexItem.examples,
        muscle_memory_prompt: lexItem.muscle_memory_prompt,
        masteryScore: activeItem?.masteryScore,
        unlockedAt: activeItem?.unlockedAt,
        userBestResponse: activeItem?.userBestResponse,
        status: activeItem?.status
      } as VocabItem;
    });
  }, [items]);

  // TTS audio playback engine supporting standard and slow speeds
  const handleTTS = (text: string, slow: boolean = false) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const sentence = new SpeechSynthesisUtterance(text);
      sentence.lang = "en-US";
      sentence.rate = slow ? 0.62 : 0.95;
      window.speechSynthesis.speak(sentence);
    }
  };

  // Searching & Filtering logic across over 4,000 terms
  const filteredItems = React.useMemo(() => {
    return mergedItems.filter((item) => {
      const matchesSearch = 
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === "all" || item.type === selectedType;
      
      const isActivelyStudying = items.some(i => i.term.toLowerCase() === item.term.toLowerCase());
      
      let matchesStatus = true;
      if (selectedStatus === "mastered") {
        matchesStatus = isActivelyStudying && (item.masteryScore !== undefined && item.masteryScore >= 80);
      } else if (selectedStatus === "learning") {
        matchesStatus = isActivelyStudying && (item.masteryScore === undefined || item.masteryScore < 80);
      } else if (selectedStatus === "unlocked") {
        matchesStatus = isActivelyStudying;
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [mergedItems, searchQuery, selectedType, selectedStatus, items]);

  const displayedItems = filteredItems.slice(0, visibleCount);

  const handleCustomDropdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customThemeInput.trim()) {
      setExpansionError("Describe an interest first!");
      return;
    }
    setExpansionError(null);
    setExpansionSuccess(false);

    try {
      await onGenerateCustomDrop(customThemeInput.trim());
      setExpansionSuccess(true);
      setCustomThemeInput("");
      setTimeout(() => setExpansionSuccess(false), 4000);
    } catch (err: any) {
      setExpansionError(err.message || "An error occurred during list expansion.");
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
    <div className="space-y-4 px-1" id="word-index-container">
      
      {/* Lexical Engine Extender Banner (Ductile visual layout size for mobile) */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 text-white relative overflow-hidden shadow">
        <div className="absolute inset-x-0 bottom-0 top-0 bg-[radial-gradient(ellipse_160%_120%_at_40%_120%,rgba(6,182,212,0.08),transparent_60%)] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1 bg-cyan-950/65 px-2 py-0.5 rounded-full text-cyan-300 border border-cyan-900/30 text-[9px] uppercase tracking-wider font-mono">
              <Sparkles className="h-3 w-3" />
              <span>Wordbook Extension Engine</span>
            </div>
            <h3 className="text-sm font-display font-extrabold tracking-tight text-white">
              Syllabus Custom Generator
            </h3>
            <p className="text-slate-400 text-[10px] leading-relaxed select-none">
              Generate themed word or idiom drops for specialized scenarios (e.g., flight simulator, sourdough baking, corporate finance) immediately using AI.
            </p>
          </div>

          <form onSubmit={handleCustomDropdownSubmit} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-850 flex flex-col gap-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customThemeInput}
                onChange={(e) => setCustomThemeInput(e.target.value)}
                placeholder="e.g. aviation pilot, kitchen setup..."
                className="flex-grow bg-slate-900 border border-slate-800 text-[11px] px-2.5 py-2 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-cyan-550 transition"
                id="custom-theme-input"
                disabled={isGeneratingDrop}
              />
              <button
                type="submit"
                disabled={isGeneratingDrop}
                className="px-3 bg-cyan-550 text-slate-950 rounded-lg text-[11px] font-bold hover:bg-cyan-500 transition-all flex items-center justify-center min-w-[70px]"
                id="submit-expansion-btn"
              >
                {isGeneratingDrop ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <span>Inject</span>
                )}
              </button>
            </div>

            {expansionError && (
              <div className="flex items-center space-x-1 text-rose-450 text-[9px] mt-0.5">
                <AlertCircle className="h-3 w-3" />
                <span>{expansionError}</span>
              </div>
            )}

            {expansionSuccess && (
              <div className="text-emerald-400 text-[9px] font-mono">
                ✨ Successfully added. Check your listings and daily drop!
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modern Search/Filter row fitted beautifully for a phone viewport */}
      <div className="bg-slate-900/30 border border-slate-850 p-3 rounded-2xl shadow-xl space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-cyan-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 1,000+ native expressions..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500 transition"
            id="dictionary-search"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center space-x-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-slate-850/60">
            <span className="text-[10px] text-slate-500 font-mono">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="bg-transparent text-[10px] font-mono text-slate-350 outline-none w-full"
              id="type-filter-select"
            >
              <option value="all">Any</option>
              <option value="word">Words</option>
              <option value="idiom">Idioms</option>
              <option value="phrase">Phrases</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-slate-850/60">
            <span className="text-[10px] text-slate-500 font-mono">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-transparent text-[10px] font-mono text-slate-350 outline-none w-full"
              id="status-filter-select"
            >
              <option value="all">Complete Lib</option>
              <option value="unlocked">My Syllabus</option>
              <option value="learning">Under Review</option>
              <option value="mastered">Mastered (≥80%)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 font-mono flex justify-between items-center px-1">
        <span>Wordbook matches: <b>{filteredItems.length}</b></span>
        {filteredItems.length > visibleCount && (
          <span>Showing 1 - {visibleCount}</span>
        )}
      </div>

      {/* Lexical items list stack */}
      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 select-none" style={{ scrollbarWidth: "none" }}>
        {displayedItems.length === 0 ? (
          <div className="bg-slate-900/20 rounded-2xl p-8 text-center border border-slate-850/80">
            <BookOpen className="h-6 w-6 text-slate-650 mx-auto mb-2" />
            <h5 className="font-semibold text-slate-400 text-xs">No entries found</h5>
            <p className="text-[10px] text-slate-500 max-w-xs mt-1 mx-auto">
              Refine your search constraints or custom-generate terms.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isActivelyStudying = items.some(i => i.term.toLowerCase() === item.term.toLowerCase());
            const isMastered = item.masteryScore !== undefined && item.masteryScore >= 80;
            const score = item.masteryScore !== undefined ? item.masteryScore : 0;
            return (
              <div
                key={item.term}
                onClick={() => setInspectedItem(item)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  inspectedItem?.term === item.term 
                    ? "bg-slate-850 border-cyan-550/40" 
                    : isActivelyStudying 
                      ? "bg-slate-900/60 border-slate-800/80" 
                      : "bg-slate-950/40 border-slate-900/50"
                } hover:bg-slate-900/40`}
                id={`matrix-item-${item.term}`}
              >
                <div className="space-y-1 pr-2 max-w-[80%]">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="font-display font-black text-xs text-slate-100 tracking-tight">
                      {item.term}
                    </span>
                    <span className={`text-[8px] font-mono px-1 rounded uppercase tracking-wide leading-3 ${getBadgeClass(item.type)}`}>
                      {item.type}
                    </span>
                    {isActivelyStudying && (
                      <span className={`text-[8px] font-mono font-bold px-1 rounded-sm ${
                        isMastered ? "bg-emerald-950/60 text-emerald-400" : "bg-cyan-950/60 text-cyan-400"
                      }`}>
                        {item.masteryScore !== undefined ? `${item.masteryScore}%` : "In Syllabus"}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-450 text-[10px] line-clamp-1 leading-relaxed text-slate-400">
                    {item.definition}
                  </p>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {isActivelyStudying && (
                    <div 
                      className="relative flex items-center justify-center cursor-help" 
                      title={item.masteryScore !== undefined ? `Mastery Level: ${item.masteryScore}%` : "Added to Study List - Not yet practiced"}
                    >
                      <svg className="h-8 w-8 transform -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          className="stroke-slate-800/80"
                          strokeWidth="2"
                          fill="transparent"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          className={`transition-all duration-500 ${
                            isMastered ? "stroke-emerald-400" : "stroke-cyan-400"
                          }`}
                          strokeWidth="2.2"
                          fill="transparent"
                          strokeDasharray={56.54}
                          strokeDashoffset={56.54 - (score / 100) * 56.54}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[8px] font-mono font-black text-slate-300">
                        {score}
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTTS(item.term);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-800 transition"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Load More Trigger */}
        {filteredItems.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(prev => prev + 40)}
            className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-cyan-400 border border-slate-800 rounded-xl text-[10px] font-semibold transition"
          >
            Load More Expressions ({filteredItems.length - visibleCount} hidden)
          </button>
        )}
      </div>

      {/* Selected Lexical Item Detailed Sheet/Modal overlay */}
      {inspectedItem && (
        <div className="fixed inset-0 min-h-screen bg-slate-950/80 z-[60] flex items-end p-2 sm:p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl rounded-b-xl shadow-2xl p-5 space-y-4 max-h-[90%] overflow-y-auto animate-slide-up" style={{ scrollbarWidth: "none" }}>
            
            {/* Header row */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-[10px] font-bold uppercase text-slate-500 font-mono tracking-widest">
                Term Dossier Inspection
              </span>
              <button 
                onClick={() => setInspectedItem(null)}
                className="p-1 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Title & Phonetics card */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex justify-between items-start">
              <div className="space-y-1">
                <span className={`text-[8px] font-mono px-1 rounded uppercase tracking-wide text-cyan-300 bg-cyan-950/30 border border-cyan-800/10`}>
                  {inspectedItem.type}
                </span>
                <h4 className="font-display font-black text-base text-white tracking-tight">
                  {inspectedItem.term}
                </h4>
                <p className="text-[10px] font-mono text-cyan-400">
                  Phonetics: <span className="font-bold text-slate-300">{inspectedItem.pronunciation_respelling}</span>
                </p>
              </div>

              {/* Advanced audio suite inside sheet */}
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => handleTTS(inspectedItem.term, false)}
                  className="p-1.5 text-cyan-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition flex items-center space-x-1"
                  title="Standard Native Speed"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-mono">Norm</span>
                </button>
                <button 
                  onClick={() => handleTTS(inspectedItem.term, true)}
                  className="p-1.5 text-amber-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 transition flex items-center space-x-1"
                  title="Slow Pronunciation Speed"
                >
                  <Volume2 className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[9px] font-mono">Slow</span>
                </button>
              </div>
            </div>

            {/* Content items */}
            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-1">ESL Accessible Definition</span>
                <p className="text-slate-300 text-2xs leading-relaxed bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg select-text selection:bg-slate-800">
                  {inspectedItem.definition}
                </p>
              </div>

              {inspectedItem.synonyms.length > 0 && (
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-1">High-Yield Synonyms</span>
                  <div className="flex flex-wrap gap-1">
                    {inspectedItem.synonyms.map((s, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => handleTTS(s)}
                        className="text-[10px] font-mono text-cyan-330 text-cyan-300 bg-slate-950 border border-slate-850 hover:border-cyan-500/20 px-2 py-0.5 rounded-lg transition-all"
                        title="Click to hear synonym pronunciation"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {inspectedItem.examples.length > 0 && (
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-1">Conversational Examples</span>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {inspectedItem.examples.map((ex, idx) => (
                      <div key={idx} className="bg-slate-950/65 p-2 rounded-lg border border-slate-850 flex justify-between items-start gap-1">
                        <p className="text-[10px] text-slate-300 leading-normal italic select-text selection:bg-slate-800">
                          {ex}
                        </p>
                        <button 
                          onClick={() => handleTTS(ex)}
                          className="text-slate-500 hover:text-white p-0.5 bg-slate-900 border border-slate-850 rounded hover:bg-slate-800 flex-shrink-0"
                          title="Speak whole sentence out loud"
                        >
                          <Volume2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-cyan-950/15 border border-cyan-900/20 p-3 rounded-xl">
                <span className="text-cyan-400 font-bold block text-[8px] uppercase tracking-wider font-mono mb-1">Interactive challenge prompt:</span>
                <p className="text-slate-330 text-slate-300 text-[11px] leading-relaxed select-text font-medium">
                  {inspectedItem.muscle_memory_prompt}
                </p>
              </div>
            </div>

            {/* Action drawers */}
            <div className="flex gap-2 pt-2 border-t border-slate-850">
              {items.some(i => i.term.toLowerCase() === inspectedItem.term.toLowerCase()) ? (
                <button
                  onClick={() => {
                    setInspectedItem(null);
                    onStartQuiz(inspectedItem);
                  }}
                  className="flex-grow py-2.5 bg-cyan-600 hover:bg-cyan-550 text-stone-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Interactive Practice</span>
                </button>
              ) : (
                <div className="flex flex-col w-full gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-sans px-1">
                    <Info className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <span>Must be added to active Study Syllabus to trigger exercises.</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onAddTermToStudyList(inspectedItem);
                        // show temporary UI indicators
                      }}
                      className="flex-grow py-2.5 bg-emerald-600 hover:bg-emerald-550 text-stone-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add to Study Syllabus</span>
                    </button>
                    <button
                      onClick={() => {
                        // Automatically add to study syllabus and fast launch quiz
                        onAddTermToStudyList(inspectedItem);
                        setTimeout(() => {
                          setInspectedItem(null);
                          onStartQuiz(inspectedItem);
                        }, 120);
                      }}
                      className="py-2.5 px-3 bg-cyan-600 text-stone-950 hover:bg-cyan-550 rounded-xl text-xs font-black"
                      title="Quick Unlock and Start Practising"
                    >
                      <PlayCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

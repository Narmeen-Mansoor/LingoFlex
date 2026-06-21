import React, { useState, useEffect } from "react";
import { VocabItem, DayDrop } from "./types";
import { baselineDrops, baselineVocab } from "./data";
import VocabCard from "./components/VocabCard";
import QuizPanel from "./components/QuizPanel";
import WordIndex from "./components/WordIndex";
import StatsPanel from "./components/StatsPanel";
import { BookOpen, Sparkles, Award, MessageSquare, TrendingUp, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, PlayCircle, Plus } from "lucide-react";

type ActiveTab = "drop" | "quiz" | "library" | "stats";

export default function App() {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>("drop");
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [dayDrops, setDayDrops] = useState<DayDrop[]>([]);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [interests, setInterests] = useState<string>("");
  const [isLoadingDrop, setIsLoadingDrop] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preselected item when shifting from WordIndex database to the Quiz simulator
  const [preselectedQuizItem, setPreselectedQuizItem] = useState<VocabItem | null>(null);

  // ─── LOCAL STORAGE LIFE CYCLES ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const storedVocab = localStorage.getItem("lingoflex_vocab_items");
      const storedDrops = localStorage.getItem("lingoflex_drops");
      const storedDay = localStorage.getItem("lingoflex_active_day");

      if (storedVocab && storedDrops) {
        setVocabList(JSON.parse(storedVocab));
        setDayDrops(JSON.parse(storedDrops));
      } else {
        // Hydrate with baseline 14 items
        setVocabList(baselineVocab);
        setDayDrops(baselineDrops);
        localStorage.setItem("lingoflex_vocab_items", JSON.stringify(baselineVocab));
        localStorage.setItem("lingoflex_drops", JSON.stringify(baselineDrops));
      }

      if (storedDay) {
        setActiveDay(parseInt(storedDay));
      } else {
        setActiveDay(1);
      }
    } catch (e) {
      console.error("Local storage restoration failure", e);
      setVocabList(baselineVocab);
      setDayDrops(baselineDrops);
    }
  }, []);

  // Save changes wrapper
  const saveStateToStorage = (updatedVocab: VocabItem[], updatedDrops: DayDrop[]) => {
    localStorage.setItem("lingoflex_vocab_items", JSON.stringify(updatedVocab));
    localStorage.setItem("lingoflex_drops", JSON.stringify(updatedDrops));
    setVocabList(updatedVocab);
    setDayDrops(updatedDrops);
  };

  // ─── VOCAB METRIC UPDATE TRIGGERS ────────────────────────────────────────
  const updateItemMasteryScore = (id: string, score: number, userResponse: string) => {
    const updatedVocab = vocabList.map((item) => {
      if (item.id === id) {
        const prevBest = item.masteryScore || 0;
        return {
          ...item,
          masteryScore: Math.max(prevBest, score),
          userBestResponse: userResponse,
          status: score >= 80 ? ("mastered" as const) : ("review" as const),
          unlockedAt: item.unlockedAt || new Date().toLocaleDateString()
        };
      }
      return item;
    });

    // Mirror updates inside the specific drops list
    const updatedDrops = dayDrops.map((drop) => ({
      ...drop,
      items: drop.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            masteryScore: Math.max(item.masteryScore || 0, score),
            userBestResponse: userResponse
          };
        }
        return item;
      })
    }));

    saveStateToStorage(updatedVocab, updatedDrops);
  };

  const updateItemScoreOnly = (id: string, score: number) => {
    const updatedVocab = vocabList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          masteryScore: Math.max(item.masteryScore || 0, score),
          status: score >= 80 ? ("mastered" as const) : ("review" as const)
        };
      }
      return item;
    });

    const updatedDrops = dayDrops.map((drop) => ({
      ...drop,
      items: drop.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            masteryScore: Math.max(item.masteryScore || 0, score)
          };
        }
        return item;
      })
    }));

    saveStateToStorage(updatedVocab, updatedDrops);
  };

  // ─── DROP GENERATION CALL DETAILS ──────────────────────────────────────────
  const requestNextDayDrop = async (nextDayNum: number, specificInterests?: string) => {
    setIsLoadingDrop(true);
    setErrorMsg(null);

    try {
      const bannedTerms = vocabList.map((i) => i.term);
      
      const response = await fetch("/api/generate-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day: nextDayNum,
          userInterests: specificInterests || interests,
          bannedTerms
        })
      });

      if (!response.ok) {
        throw new Error("Unable to fetch new generated drop from LingoFlex Server.");
      }

      const rawData = await response.json();
      
      // Inject unique IDs for newly generated drop items
      const enrichedItems: VocabItem[] = rawData.items.map((item: any, idx: number) => ({
        ...item,
        id: `gensm-${nextDayNum}-${idx}-${Date.now()}`,
        unlockedAt: new Date().toLocaleDateString()
      }));

      const newDrop: DayDrop = {
        day: nextDayNum,
        items: enrichedItems,
        isCustom: true
      };

      const updatedVocab = [...vocabList, ...enrichedItems];
      const updatedDrops = [...dayDrops, newDrop];

      saveStateToStorage(updatedVocab, updatedDrops);
      setActiveDay(nextDayNum);
      localStorage.setItem("lingoflex_active_day", nextDayNum.toString());
      setInterests(""); // reset entry
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to contact Gemini engine. Check network or local configurations.");
    } finally {
      setIsLoadingDrop(false);
    }
  };

  const handleDayNavigation = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (activeDay > 1) {
        const prev = activeDay - 1;
        setActiveDay(prev);
        localStorage.setItem("lingoflex_active_day", prev.toString());
      }
    } else {
      const next = activeDay + 1;
      const cachedDrop = dayDrops.find((d) => d.day === next);
      if (cachedDrop) {
        setActiveDay(next);
        localStorage.setItem("lingoflex_active_day", next.toString());
      } else {
        // Drop doesn't exist, generate a custom day drop
        requestNextDayDrop(next);
      }
    }
  };

  // Handle immediate navigation to active drills from individual indexes
  const handleStartQuizFromDictionary = (item: VocabItem) => {
    setPreselectedQuizItem(item);
    setActiveTab("quiz");
  };

  const handleGenerateCustomThemedDrop = async (theme: string) => {
    const nextDayNum = dayDrops.length + 1;
    await requestNextDayDrop(nextDayNum, theme);
  };

  // Extract current active drop item elements
  const currentDrop = dayDrops.find((d) => d.day === activeDay);

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col justify-between" id="lingoflex-root">
      
      {/* ─── HEADER / NAVIGATION ─────────────────────────────────────────────── */}
      <header className="bg-[#05070a]/80 backdrop-blur-md border-b border-slate-850 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand Title */}
          <div className="flex items-center space-x-3 select-none">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-405 bg-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 font-display font-extrabold text-lg select-none">
              LF
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                LingoFlex 
                <span className="text-3xs uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 font-mono font-bold select-none leading-none">
                  Core Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 select-none">Intermediate-Advanced ESL Muscle Memory</p>
            </div>
          </div>

          {/* Nav Activities Menus */}
          <nav className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-850">
            <button
              onClick={() => setActiveTab("drop")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 ${activeTab === "drop" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              id="tab-btn-drop"
            >
              <Sparkles className="h-4 w-4" />
              <span>Daily Drop</span>
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 ${activeTab === "quiz" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              id="tab-btn-quiz"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Practice Arena</span>
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 ${activeTab === "library" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              id="tab-btn-library"
            >
              <BookOpen className="h-4 w-4" />
              <span>Lexicon Matrix</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center space-x-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all duration-300 ${activeTab === "stats" ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-400 hover:text-white"}`}
              id="tab-btn-stats"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Fluency Lab</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ─── MAIN PORTAL CONTENT ──────────────────────────────────────────────── */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. Daily Drop Panel */}
        {activeTab === "drop" && (
          <div className="space-y-6 animate-fade-in" id="daily-drop-viewport">
            
            {/* Day Selector and customized interests filter */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-3xl shadow-xl">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDayNavigation("prev")}
                  disabled={activeDay === 1 || isLoadingDrop}
                  className="p-3 bg-slate-950 hover:bg-slate-900 rounded-2xl text-slate-400 disabled:opacity-30 disabled:hover:bg-slate-950 transition-all cursor-pointer shadow-sm border border-slate-850"
                  id="prev-day-navigation"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center md:text-left min-w-[130px]">
                  <h3 className="font-display font-bold text-lg text-white leading-tight">Word Drop Day {activeDay}</h3>
                  <p className="text-2xs text-cyan-400 font-semibold uppercase tracking-wider font-mono">
                    {currentDrop?.isCustom ? "Custom AI Generated" : "Universal Syllabus"}
                  </p>
                </div>
                <button
                  onClick={() => handleDayNavigation("next")}
                  disabled={isLoadingDrop}
                  className="p-3 bg-slate-950 hover:bg-slate-900 rounded-2xl text-slate-400 disabled:opacity-30 disabled:hover:bg-slate-950 transition-all cursor-pointer shadow-sm border border-slate-850"
                  id="next-day-navigation"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Interests prompt entry */}
              <div className="flex-grow max-w-md flex flex-col md:flex-row items-stretch md:items-center gap-2">
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="Themed Drop (e.g. airport scenario, tech meeting)..."
                  className="flex-grow bg-slate-950 border border-slate-850 text-xs px-4 py-2.5 rounded-xl text-white placeholder-slate-550 focus:bg-slate-900 focus:outline-none focus:border-cyan-500 transition"
                  id="interests-drop-input"
                  disabled={isLoadingDrop}
                />
                <button
                  onClick={() => requestNextDayDrop(dayDrops.length + 1)}
                  disabled={isLoadingDrop}
                  className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-450 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center space-x-1.5 cursor-pointer"
                  id="themed-drop-trigger"
                >
                  {isLoadingDrop ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Custom Drop</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading Cover */}
            {isLoadingDrop ? (
              <div className="bg-slate-900/50 rounded-3xl border border-slate-800 shadow-2xl p-16 flex flex-col items-center justify-center text-center h-[460px]">
                <div className="relative mb-6">
                  <div className="rounded-full bg-cyan-950/20 p-10 animate-ping absolute inset-0 opacity-20"></div>
                  <div className="relative rounded-full bg-cyan-950/40 border border-cyan-905 border-cyan-900/20 p-8">
                    <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
                  </div>
                </div>
                <h4 className="text-xl font-display font-semibold text-white mb-2">Generating Bespoke Lexical Drop...</h4>
                <p className="text-slate-400 text-xs italic max-w-sm leading-relaxed">
                  LingoFlex is constructing semantic structures. Selecting high-yield ESL phrasal verbs, idioms, and vocabulary elements with rich native samples...
                </p>
              </div>
            ) : errorMsg ? (
              <div className="bg-slate-900/50 rounded-3xl border border-rose-950/40 p-12 text-center shadow-xl flex flex-col items-center justify-center">
                <div className="text-rose-450 bg-rose-950/30 p-3.5 rounded-full mb-4 border border-rose-900/40">
                  <AlertCircle className="h-8 w-8 text-rose-400" />
                </div>
                <h4 className="text-white font-display font-bold text-lg mb-1">Interactive Engine Timeout</h4>
                <p className="text-slate-400 text-xs max-w-md leading-relaxed mb-6">
                  {errorMsg}
                </p>
                <button
                  onClick={() => requestNextDayDrop(activeDay)}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/15 cursor-pointer"
                >
                  Retry Drop Request
                </button>
              </div>
            ) : currentDrop ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id={`day-${activeDay}-items-container`}>
                {currentDrop.items.map((item) => (
                  <VocabCard
                    key={item.id}
                    item={item}
                    dayNum={activeDay}
                    onUpdateMastery={updateItemMasteryScore}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 rounded-3xl p-16 text-center border border-slate-800 select-none flex flex-col items-center">
                <BookOpen className="h-10 w-10 text-slate-600 mb-2 animate-bounce" />
                <h5 className="font-semibold text-white text-sm">No items in drop slot</h5>
                <p className="text-slate-550 text-slate-400 text-xs max-w-xs mt-1">This slot does not exist yet in the local active memory indices.</p>
                <button
                  onClick={() => requestNextDayDrop(activeDay)}
                  className="mt-4 px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Initialize Day {activeDay} Drop
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. Live Practice Arena */}
        {activeTab === "quiz" && (
          <div className="animate-fade-in" id="practice-viewport">
            <QuizPanel
              vocabList={vocabList}
              onUpdateScore={updateItemScoreOnly}
            />
          </div>
        )}

        {/* 3. Global Dictionary Matrix */}
        {activeTab === "library" && (
          <div className="animate-fade-in" id="library-viewport">
            <WordIndex
              items={vocabList}
              onStartQuiz={handleStartQuizFromDictionary}
              onGenerateCustomDrop={handleGenerateCustomThemedDrop}
              isGeneratingDrop={isLoadingDrop}
            />
          </div>
        )}

        {/* 4. Fluency Dashboard */}
        {activeTab === "stats" && (
          <div className="animate-fade-in" id="stats-viewport">
            <StatsPanel items={vocabList} />
          </div>
        )}

      </main>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#05070a] border-t border-slate-850/80 py-6 mt-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 font-mono tracking-tight flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; LingoFlex Inc. Powering active English communication.</span>
          <span>Index Capacity: <b>4,000+ total unique lexical items</b> target</span>
        </div>
      </footer>

    </div>
  );
}

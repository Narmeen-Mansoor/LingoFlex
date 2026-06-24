import React, { useState, useEffect } from "react";
import { VocabItem, DayDrop } from "./types";
import { baselineDrops, baselineVocab } from "./data";
import { validateVocabData } from "./dataValidator";
import VocabCard from "./components/VocabCard";
import QuizPanel from "./components/QuizPanel";
import WordIndex from "./components/WordIndex";
import StatsPanel from "./components/StatsPanel";
import { 
  BookOpen, Sparkles, Award, MessageSquare, TrendingUp, 
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle, PlayCircle, Plus, Info 
} from "lucide-react";

type ActiveTab = "drop" | "quiz" | "library" | "stats";

export function getLocalDateString(d: Date = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

  // Live status bar mock phone clock
  const [currentTime, setCurrentTime] = useState("09:41");

  // Real tracking of active streak days
  const [activityDates, setActivityDates] = useState<string[]>([]);

  const logActivityToday = () => {
    const todayStr = getLocalDateString(new Date());
    setActivityDates((prev) => {
      if (!prev.includes(todayStr)) {
        const next = [...prev, todayStr];
        localStorage.setItem("lingoflex_activity_dates", JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  // Keep digital time updated
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCurrentTime(
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 15000);
    return () => clearInterval(interval);
  }, []);

  // ─── LOCAL STORAGE LIFE CYCLES ─────────────────────────────────────────────
  useEffect(() => {
    // Run Core Data Verification on startup
    const valResult = validateVocabData();
    if (valResult.isValid) {
      console.log(`%c[LingoFlex Data Validator] 100% verified! Checked ${valResult.totalChecked} baseline terms and all drops.`, "color: #10B981; font-weight: bold;");
    } else {
      console.error("[LingoFlex Data Validator] Data validation issues found on startup!", valResult.issues);
    }

    try {
      const storedVocab = localStorage.getItem("lingoflex_vocab_items");
      const storedDrops = localStorage.getItem("lingoflex_drops");
      const storedDay = localStorage.getItem("lingoflex_active_day");
      const storedDates = localStorage.getItem("lingoflex_activity_dates");

      if (storedVocab && storedDrops) {
        let parsedVocab = JSON.parse(storedVocab) as VocabItem[];
        let parsedDrops = JSON.parse(storedDrops) as DayDrop[];

        // Dynamically migrate if new baseline days or items are missing
        if (parsedDrops.length < baselineDrops.length) {
          const existingDays = new Set(parsedDrops.map((d) => d.day));
          baselineDrops.forEach((bDrop) => {
            if (!existingDays.has(bDrop.day)) {
              parsedDrops.push(bDrop);
              // Ensure we also merge any baseline terms into vocabList that aren't already there
              bDrop.items.forEach((item) => {
                if (!parsedVocab.some((v) => v.term.toLowerCase() === item.term.toLowerCase())) {
                  parsedVocab.push(item);
                }
              });
            }
          });
          localStorage.setItem("lingoflex_vocab_items", JSON.stringify(parsedVocab));
          localStorage.setItem("lingoflex_drops", JSON.stringify(parsedDrops));
        }

        setVocabList(parsedVocab);
        setDayDrops(parsedDrops);
      } else {
        // Hydrate with baseline 14 items
        setVocabList(baselineVocab);
        setDayDrops(baselineDrops);
        localStorage.setItem("lingoflex_vocab_items", JSON.stringify(baselineVocab));
        localStorage.setItem("lingoflex_drops", JSON.stringify(baselineDrops));
      }

      if (storedDates) {
        setActivityDates(JSON.parse(storedDates));
      } else {
        // Let's seed with 2 consecutive days ending yesterday to give the user a nice initial active streak!
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const initialDates = [
          getLocalDateString(twoDaysAgo),
          getLocalDateString(yesterday)
        ];
        setActivityDates(initialDates);
        localStorage.setItem("lingoflex_activity_dates", JSON.stringify(initialDates));
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
    logActivityToday();
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
    logActivityToday();
  };

  // Add term from Lexicon Matrix to active practicing workspace
  const handleAddTermToStudyList = (item: VocabItem) => {
    // Check if it's already in our syllabus
    if (vocabList.some((v) => v.term.toLowerCase() === item.term.toLowerCase())) {
      return;
    }

    const newItem: VocabItem = {
      ...item,
      id: `man-add-${item.term.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      unlockedAt: new Date().toLocaleDateString(),
      masteryScore: undefined,
      timesTested: 0,
      userNotes: "",
      userBestResponse: "",
      status: "review" as const
    };

    const updatedVocab = [...vocabList, newItem];
    
    // Add to current active day drop items so it becomes instantly practiceable
    const updatedDrops = dayDrops.map((drop) => {
      if (drop.day === activeDay) {
        return {
          ...drop,
          items: [newItem, ...drop.items]
        };
      }
      return drop;
    });

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
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center py-0 md:py-8 px-0 sm:px-4" id="lingoflex-root">
      
      {/* ─── SMARTPHONE DEVICE WRAPPER MOCKUP ──────────────────────────────────── */}
      {/* This renders as a premium high-end hardware phone shell on desktop screens, falling back seamlessly edge-to-edge on actual mobile glass to preserve real touch-app looks */}
      <div className="w-full max-w-md bg-[#05070a] text-slate-100 flex flex-col justify-between 
                      md:rounded-[42px] md:border-[12px] md:border-slate-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] 
                      md:min-h-[810px] md:max-h-[850px] relative overflow-hidden transition-all duration-300" 
           id="lingoflex-smartphone">
        
        {/* Virtual Phone Hardware Notch & Status Gauges Bar (Hidden on small screens) */}
        <div className="hidden md:flex justify-between items-center px-6 pt-3 pb-2 bg-slate-950 text-slate-400 text-[10.5px] font-mono select-none relative z-50">
          {/* Live Mobile Clock */}
          <div className="font-bold text-white select-none">{currentTime}</div>
          
          {/* Virtual Top Camera Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-4 bg-slate-900 rounded-full border border-slate-800/40 flex justify-center items-center">
            <div className="w-2.5 h-2.5 bg-[#08080c] border border-slate-800/80 rounded-full mr-2.5"></div>
            <div className="w-1.5 h-1.5 bg-cyan-900/40 rounded-full"></div>
          </div>
          
          {/* Connectivity Gauges */}
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span>LTE</span>
            <div className="flex space-x-0.5 items-end h-2 w-3">
              <div className="bg-slate-500 w-[2.2px] h-[3px]"></div>
              <div className="bg-slate-500 w-[2.2px] h-[5px]"></div>
              <div className="bg-cyan-500 w-[2.2px] h-[7px]"></div>
              <div className="bg-cyan-500 w-[2.2px] h-[9px]"></div>
            </div>
            <div className="flex items-center border border-slate-650 rounded-[3px] h-3 px-[1px] w-5 relative">
              <div className="bg-emerald-500 rounded-[1px] h-[7px] w-full"></div>
              <div className="bg-slate-600 rounded-r h-1 w-[1px] absolute -right-[2px]"></div>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">100%</span>
          </div>
        </div>

        {/* Small screen mobile header */}
        <header className="bg-slate-950/90 backdrop-blur border-b border-slate-900/60 px-4 py-3 flex justify-between items-center relative z-40 select-none">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-450 bg-cyan-500 flex items-center justify-center text-slate-950 shadow-inner font-display font-extrabold text-xs select-none">
              LF
            </div>
            <div>
              <h1 className="text-xs font-display font-black text-white tracking-tight leading-none">
                LingoFlex 
              </h1>
              <p className="text-[9px] text-slate-450 font-medium">ESL Active Muscle Memory</p>
            </div>
          </div>
          
          <span className="text-[8.5px] uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 text-cyan-300 font-mono leading-none">
            Wordbook: 1K+ Words
          </span>
        </header>

        {/* ─── SCROLLABLE PHONE PORTAL CONTEXT AREA ─────────────────────────────────── */}
        <main className="flex-grow overflow-y-auto bg-[#05070a] px-3 py-4" id="phone-main-viewport" style={{ scrollbarWidth: "none" }}>
          
          {/* 1. Daily Word Drops Screen */}
          {activeTab === "drop" && (
            <div className="space-y-4 animate-fade-in" id="daily-drop-viewport">
              
              {/* Day controller bar (fitted nicely for smartphone width) */}
              <div className="flex items-center justify-between bg-slate-900/40 border border-slate-850 p-3.5 rounded-2xl shadow">
                <button
                  onClick={() => handleDayNavigation("prev")}
                  disabled={activeDay === 1 || isLoadingDrop}
                  className="p-2 bg-slate-950 hover:bg-slate-900 rounded-xl text-slate-400 disabled:opacity-20 transition"
                  id="prev-day-navigation"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <h3 className="font-display font-black text-xs text-white leading-tight">Word Drop Day {activeDay}</h3>
                  <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider font-mono">
                    {currentDrop?.isCustom ? "Customised Drop" : "Syllabus Track"}
                  </p>
                </div>
                <button
                  onClick={() => handleDayNavigation("next")}
                  disabled={isLoadingDrop}
                  className="p-2 bg-slate-950 hover:bg-slate-900 rounded-xl text-slate-400 disabled:opacity-20 transition"
                  id="next-day-navigation"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Quick interests injection query block */}
              <div className="bg-slate-950 border border-slate-850/80 p-3 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Need dynamic customized words?</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    placeholder="e.g. startup interview, business email..."
                    className="flex-grow bg-slate-900 border border-slate-800 text-[11px] px-2.5 py-1.5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-550 transition"
                    id="interests-drop-input"
                    disabled={isLoadingDrop}
                  />
                  <button
                    onClick={() => requestNextDayDrop(dayDrops.length + 1)}
                    disabled={isLoadingDrop}
                    className="px-3 bg-cyan-555 bg-cyan-500 text-slate-950 font-bold rounded-xl text-[10px] uppercase tracking-wider hover:bg-cyan-400 transition"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Status and core drop card listings */}
              {isLoadingDrop ? (
                <div className="bg-slate-900/30 rounded-3xl border border-slate-850 p-6 flex flex-col items-center justify-center text-center py-16">
                  <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin mb-3" />
                  <h4 className="text-xs font-display font-bold text-white mb-1">Weaving Dynamic Wordbook Card...</h4>
                  <p className="text-slate-500 text-[9.5px] italic max-w-xs">
                    Gemini is generating advanced ESL words and phrasal verbs with rich authentic native conversation dialogues...
                  </p>
                </div>
              ) : errorMsg ? (
                <div className="bg-slate-905 border border-rose-950/40 p-6 rounded-2xl text-center space-y-3">
                  <AlertCircle className="h-6 w-6 text-rose-500 mx-auto" />
                  <p className="text-rose-400 text-2xs leading-relaxed">{errorMsg}</p>
                  <button
                    onClick={() => requestNextDayDrop(activeDay)}
                    className="px-4 py-1.5 bg-rose-505 bg-rose-600 text-white text-3xs font-mono rounded-lg"
                  >
                    Retry Request
                  </button>
                </div>
              ) : currentDrop ? (
                <div className="space-y-4" id={`day-${activeDay}-items-container`}>
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
                <div className="bg-slate-900/20 rounded-2xl p-8 text-center border border-slate-850">
                  <BookOpen className="h-6 w-6 text-slate-655 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-500">Day Drop does not exist yet.</p>
                  <button
                    onClick={() => requestNextDayDrop(activeDay)}
                    className="mt-3 px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold text-3xs rounded-lg"
                  >
                    Bootstrap Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Interactive Roleplay Practice Arena Screen */}
          {activeTab === "quiz" && (
            <div className="animate-fade-in" id="practice-viewport">
              <QuizPanel
                vocabList={vocabList}
                onUpdateScore={updateItemScoreOnly}
                initialItem={preselectedQuizItem}
              />
            </div>
          )}

          {/* 3. Global Dictionary Matrix Screen (Browsing 4,000+ words) */}
          {activeTab === "library" && (
            <div className="animate-fade-in" id="library-viewport">
              <WordIndex
                items={vocabList}
                onStartQuiz={handleStartQuizFromDictionary}
                onGenerateCustomDrop={handleGenerateCustomThemedDrop}
                isGeneratingDrop={isLoadingDrop}
                onAddTermToStudyList={handleAddTermToStudyList}
              />
            </div>
          )}

          {/* 4. Fluency dashboard / metrics screen */}
          {activeTab === "stats" && (
            <div className="animate-fade-in text-xs" id="stats-viewport">
              <StatsPanel items={vocabList} activityDates={activityDates} activeDay={activeDay} />
            </div>
          )}

        </main>

        {/* ─── FLOATING BOTTOM MOBILE NAVIGATION BAR ───────────────────────────── */}
        {/* Dynamic touch feedback icons resembling a native premium smartphone app */}
        <nav className="bg-slate-950 border-t border-slate-900/80 px-2 py-2.5 flex justify-around items-center relative z-40 select-none">
          <button
            onClick={() => {
              setActiveTab("drop");
              setPreselectedQuizItem(null);
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition duration-200 cursor-pointer ${
              activeTab === "drop" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
            id="tab-btn-drop"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">Drops</span>
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`flex flex-col items-center justify-center space-y-1 transition duration-200 cursor-pointer ${
              activeTab === "quiz" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
            id="tab-btn-quiz"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">Arena</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("library");
              setPreselectedQuizItem(null);
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition duration-200 cursor-pointer ${
              activeTab === "library" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
            id="tab-btn-library"
          >
            <BookOpen className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">Wordbook</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("stats");
              setPreselectedQuizItem(null);
            }}
            className={`flex flex-col items-center justify-center space-y-1 transition duration-200 cursor-pointer ${
              activeTab === "stats" ? "text-cyan-400 font-bold" : "text-slate-500 hover:text-slate-300"
            }`}
            id="tab-btn-stats"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-[9px] tracking-tight">Fluency</span>
          </button>
        </nav>

        {/* Decorative iOS Home Indicator bar line representation */}
        <div className="hidden md:block bg-slate-950 pb-1.5 pt-0.5">
          <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto"></div>
        </div>

      </div>

    </div>
  );
}

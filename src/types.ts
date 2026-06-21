/**
 * LingoFlex TypeScript type definitions
 */

export type LexicalType = "word" | "idiom" | "phrase";

export interface VocabItem {
  id: string; // unique ID
  type: LexicalType;
  term: string;
  pronunciation_respelling: string;
  definition: string;
  synonyms: string[];
  examples: string[];
  muscle_memory_prompt: string;
  
  // Progress tracking attributes
  unlockedAt?: string;
  masteryScore?: number; // 0 - 100%
  timesTested?: number;
  status?: "learned" | "review" | "mastered";
  userNotes?: string;
  userBestResponse?: string;
}

export interface DayDrop {
  day: number;
  items: VocabItem[];
  isCustom?: boolean;
}

export interface QuizSituation {
  term: string;
  type: LexicalType;
  scenario: string; // The situation prompt
  roleplayPrompt: string; // Instructions e.g., "Respond to your landlord saying..."
  vividContext: string; // Additional setup
  suggestedHelperWords: string[];
}

export interface EvaluationResult {
  score: number; // 0 - 100
  feedback: string; // Formatted analysis of syntax, naturalness, correctness
  corrections?: string; // Enhanced/more natural alternative sentence
  muscleMemoryBooster: string; // A follow-up tip or micro-challenge
  rating: "Novice" | "Fluent" | "Native-level";
}

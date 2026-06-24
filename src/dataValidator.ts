import { baselineVocab, baselineDrops } from "./data";
import { VocabItem } from "./types";

export interface ValidationIssue {
  id: string;
  term: string;
  field: string;
  value: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  totalChecked: number;
  issues: ValidationIssue[];
  vocabIssuesCount: number;
  dropsIssuesCount: number;
}

/**
 * Validates baselineVocab and baselineDrops for completeness, high quality,
 * and the absolute absence of template-based placeholder definitions, synonyms, or examples.
 */
export function validateVocabData(): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Validate baselineVocab
  baselineVocab.forEach((item, index) => {
    const id = item.id || `index-${index}`;
    const term = item.term || "UNKNOWN TERM";

    // Check basic field presence
    if (!item.id) {
      issues.push({ id, term, field: "id", value: "", message: "Missing unique id" });
    }
    if (!item.term || item.term.trim() === "") {
      issues.push({ id, term, field: "term", value: "", message: "Term is empty or missing" });
    }
    if (!item.type || !["word", "idiom", "phrase"].includes(item.type)) {
      issues.push({ id, term, field: "type", value: item.type || "", message: "Type must be 'word', 'idiom', or 'phrase'" });
    }
    if (!item.pronunciation_respelling || item.pronunciation_respelling.trim() === "") {
      issues.push({ id, term, field: "pronunciation_respelling", value: "", message: "Missing pronunciation respelling" });
    }

    // Check definition quality
    if (!item.definition || item.definition.trim() === "") {
      issues.push({ id, term, field: "definition", value: "", message: "Definition is empty" });
    } else {
      const def = item.definition.toLowerCase();
      if (
        def.includes("actively integrate") ||
        def.includes("apply, or express") ||
        def.includes("express the concept") ||
        def.includes("standard native english") ||
        def.includes("perform actions associated with") ||
        def.includes("to speak professionally, i believe we should utilize")
      ) {
        issues.push({
          id,
          term,
          field: "definition",
          value: item.definition,
          message: "Definition matches default placeholder pattern"
        });
      }
    }

    // Check synonyms quality
    if (!item.synonyms || !Array.isArray(item.synonyms) || item.synonyms.length < 2) {
      issues.push({
        id,
        term,
        field: "synonyms",
        value: JSON.stringify(item.synonyms),
        message: "Must have at least 2 synonyms for optimal learning"
      });
    } else {
      item.synonyms.forEach((syn) => {
        const lowerSyn = syn.toLowerCase();
        if (
          lowerSyn.includes("active ") ||
          lowerSyn.includes("standard ") ||
          lowerSyn.includes("practical equivalent") ||
          lowerSyn.includes("application")
        ) {
          issues.push({
            id,
            term,
            field: "synonyms",
            value: syn,
            message: "Synonym matches placeholder pattern (e.g. 'active...', 'standard...')"
          });
        }
      });
    }

    // Check examples quality
    if (!item.examples || !Array.isArray(item.examples) || item.examples.length < 2) {
      issues.push({
        id,
        term,
        field: "examples",
        value: JSON.stringify(item.examples),
        message: "Must have at least 2 usage examples for natural context"
      });
    } else {
      item.examples.forEach((ex) => {
        const lowerEx = ex.toLowerCase();
        if (
          lowerEx.includes("properly utilize") ||
          lowerEx.includes("cognitive fluency") ||
          lowerEx.includes("practiced incorporating") ||
          lowerEx.includes("decided to integrate") ||
          lowerEx.includes("correct spelling of")
        ) {
          issues.push({
            id,
            term,
            field: "examples",
            value: ex,
            message: "Usage example matches default placeholder pattern"
          });
        }
      });
    }

    // Check muscle memory prompt quality
    if (!item.muscle_memory_prompt || item.muscle_memory_prompt.trim() === "") {
      issues.push({ id, term, field: "muscle_memory_prompt", value: "", message: "Missing muscle memory prompt" });
    } else {
      const prompt = item.muscle_memory_prompt.toLowerCase();
      if (
        prompt.includes("encountered the word") &&
        prompt.includes("relative to...")
      ) {
        issues.push({
          id,
          term,
          field: "muscle_memory_prompt",
          value: item.muscle_memory_prompt,
          message: "Muscle memory prompt matches fallback pattern"
        });
      }
    }
  });

  const vocabIssuesCount = issues.length;

  // 2. Validate baselineDrops
  baselineDrops.forEach((drop) => {
    const dropId = `drop-day-${drop.day}`;
    if (!drop.day || typeof drop.day !== "number") {
      issues.push({ id: dropId, term: "DROP", field: "day", value: String(drop.day), message: "Invalid day number" });
    }
    if (!drop.items || !Array.isArray(drop.items) || drop.items.length === 0) {
      issues.push({ id: dropId, term: `Day ${drop.day}`, field: "items", value: "", message: "Drop contains no items" });
    } else {
      drop.items.forEach((dropItem, idx) => {
        // Ensure drop items match baselineVocab items
        const matchingVocab = baselineVocab.find((v) => v.id === dropItem.id);
        if (!matchingVocab) {
          issues.push({
            id: dropId,
            term: dropItem.term || "UNKNOWN",
            field: `items[${idx}]`,
            value: dropItem.id || "",
            message: "Drop item does not exist in baselineVocab"
          });
        }
      });
    }
  });

  const dropsIssuesCount = issues.length - vocabIssuesCount;

  return {
    isValid: issues.length === 0,
    totalChecked: baselineVocab.length,
    issues,
    vocabIssuesCount,
    dropsIssuesCount
  };
}

// If this file is executed directly (e.g. via tsx in Node)
const isRunningAsScript = typeof process !== "undefined" && 
  Array.isArray(process.argv) && 
  (process.argv[1]?.endsWith("dataValidator.ts") || import.meta.url === `file://${process.argv[1]}`);

if (isRunningAsScript) {
  console.log("\n🧪 RUNNING LINGOFLEX CORE DATA VALIDATION SCRIPT...");
  const result = validateVocabData();
  if (result.isValid) {
    console.log("✅ SUCCESS: All baseline vocabularies and daily drops are 100% validated.");
    console.log(`📊 Total verified items: ${result.totalChecked} terms and ${baselineDrops.length} drops.`);
    process.exit(0);
  } else {
    console.error("❌ FAILURE: Validation issues detected in LingoFlex data configuration!");
    console.error(`🚨 Found ${result.issues.length} issues (${result.vocabIssuesCount} in vocabularies, ${result.dropsIssuesCount} in drops):\n`);
    result.issues.forEach((issue) => {
      console.error(`   [${issue.term}] Field: "${issue.field}"`);
      console.error(`   Message: ${issue.message}`);
      console.error(`   Value:   "${issue.value}"\n`);
    });
    process.exit(1);
  }
}

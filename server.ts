import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ [LingoFlex SDK] GEMINI_API_KEY is not defined. Server will fall back to local interactive engines.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ─── API ENDPOINTS ──────────────────────────────────────────────────────────

// 1. Health Probe
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// 2. Generate a new Daily Word/Idiom Drop (Exactly 2 items)
app.post("/api/generate-drop", async (req, res) => {
  try {
    const { day, userInterests, bannedTerms = [] } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback response with simulated items
      return res.json({
        day: day || 8,
        isCustom: true,
        items: [
          {
            type: "phrase",
            term: "Weather the storm",
            pronunciation_respelling: "weth-er thuh storm",
            definition: "To successfully face and survive a highly difficult period, situation, or crisis.",
            synonyms: ["endure", "pull through", "survive", "stand firm"],
            examples: [
              "We lost a lot of clients last summer, but our small company managed to weather the storm.",
              "If we cut down unnecessary spendings, we can easily weather the storm."
            ],
            muscle_memory_prompt: "Tell us about a tough time in your career. Say out loud: 'We had to cut costs, but we eventually weathered the storm when...' "
          },
          {
            type: "word",
            term: "Fastidious",
            pronunciation_respelling: "fas-TID-ee-uhs",
            definition: "Very attentive, exact, and showing extreme care about minuscule details, cleanliness, or correctness.",
            synonyms: ["meticulous", "exacting", "particular", "detailed", "scrupulous"],
            examples: [
              "The design director was extremely fastidious about selecting color margins and font types.",
              "She kept a fastidious record of all her daily income streams."
            ],
            muscle_memory_prompt: "Are you fastidious about anything in your life (e.g., cleanliness, schedule, styling)? Start with: 'When it comes to... I am incredibly fastidious.'"
          }
        ]
      });
    }

    const interestsContext = userInterests ? `User interests/themes: "${userInterests}".` : "General advanced-intermediate high-utility English vocabulary, phrasal verbs, and idioms.";
    const skipList = bannedTerms.length > 0 ? `Do NOT generate any of these terms: [${bannedTerms.join(", ")}].` : "";

    const systemPrompt = `You are the master ESL vocabulary lexicographer of "LingoFlex", an advanced ESL platform. 
Your goal is to build long-term English "muscle memory" for intermediate to advanced learners.
Generate exactly 2 word drops conforming to the requested schema.
CRITICAL RULES:
1. Every daily drop MUST contain exactly 2 items.
2. The items should be useful for conversation (Tier 2/3 vocabulary words, high-yield idioms, or phrasal verbs).
3. The definitions MUST be simple and descriptive for ESL learners (do not use the target term in its own definition).
4. Provide exactly 2 vivid, real-world conversation examples per item.
5. Provide a constructive 'muscle_memory_prompt' that forces learners to construct personal sentences using their own real life context.
6. Target terms must be unique. ${skipList}`;

    const prompt = `Generate a Daily Word Drop for Day ${day || 8}.
Context parameter: ${interestsContext}
Ensure both terms are highly useful, unique, and natural in contemporary English.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER, description: "The day requested." },
            items: {
              type: Type.ARRAY,
              description: "Must contain exactly 2 items",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Must be 'word', 'idiom', or 'phrase'." },
                  term: { type: Type.STRING, description: "The vocabulary term." },
                  pronunciation_respelling: { type: Type.STRING, description: "English phonetic guidance, like: voh-SIF-er-uhs." },
                  definition: { type: Type.STRING, description: "Simple, highly accessible explanation for ESL. Do NOT include the word or target phrase in this definition." },
                  synonyms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3-4 high-yield, practical, accessible alternative synonyms."
                  },
                  examples: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 2 vivid, everyday situations demonstrating natural syntax."
                  },
                  muscle_memory_prompt: { type: Type.STRING, description: "Activating challenge question prompting the user to apply the term to their personal lives starting with a conversational sentence framework." }
                },
                required: ["type", "term", "pronunciation_respelling", "definition", "synonyms", "examples", "muscle_memory_prompt"]
              }
            }
          },
          required: ["day", "items"]
        }
      }
    });

    const body = response.text ? JSON.parse(response.text.trim()) : {};
    res.json(body);
  } catch (error: any) {
    console.error("Error in /api/generate-drop:", error);
    res.status(500).json({ error: error.message || "Failed to generate word drop" });
  }
});

// 3. Generate a customized scenario-based roleplay quiz for a specific term
app.post("/api/generate-situation-quiz", async (req, res) => {
  try {
    const { term, type } = req.body;
    if (!term) return res.status(400).json({ error: "Term is required" });

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response
      return res.json({
        term,
        type: type || "word",
        scenario: `You are in a lively coffee shop waiting to receive important news about your pending visa. Your friend is rambling about their coffee beans, but you want to politely tell them you need a quick break to focus.`,
        roleplayPrompt: `Respond to your rambling friend using '${term}' to explain either your distraction or your focus.`,
        vividContext: `"Hey, did you hear about this Ethiopian roast? They pick each bean under moonlight!"`,
        suggestedHelperWords: ["apologize", "focus", "wait", "patience"]
      });
    }

    const systemInstruction = `You are a creative ESL roleplay generator.
For any vocabulary term or idiom provided, generate an exciting, realistic, and highly relatable scenario (a situation/story) where a person would naturally want to use that term.
You must return a valid JSON object matching the requested schema.`;

    const prompt = `Generate a situational scenario-based roleplay quiz for:
Term: "${term}"
Type: "${type || "word"}"

Provide a direct dialogue context (vividContext) of what the other person in the scenario says, a clear scenario story setup, a helpful roleplay prompt instruction, and 3 high-yield helper words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            term: { type: Type.STRING },
            type: { type: Type.STRING },
            scenario: { type: Type.STRING, description: "A realistic setup, story, or conflict of 2-3 sentences." },
            roleplayPrompt: { type: Type.STRING, description: "The specific objective. Guide the user on who to address and how to utilize the target term." },
            vividContext: { type: Type.STRING, description: "A direct quote from another character or immediate visual prompt (e.g. 'Your boss sits down and says: ...')." },
            suggestedHelperWords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 helper words to assist in constructing the response."
            }
          },
          required: ["term", "type", "scenario", "roleplayPrompt", "vividContext", "suggestedHelperWords"]
        }
      }
    });

    const body = response.text ? JSON.parse(response.text.trim()) : {};
    res.json(body);
  } catch (error: any) {
    console.error("Error in /api/generate-situation-quiz:", error);
    res.status(500).json({ error: error.message || "Failed to generate situation quiz" });
  }
});

// 4. Evaluate ESL learner's spoken/written application sentence
app.post("/api/evaluate-response", async (req, res) => {
  try {
    const { term, userResponse, scenarioInfo } = req.body;
    if (!term || !userResponse) {
      return res.status(400).json({ error: "Term and userResponse are required." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback scoring mechanism
      const hasWord = userResponse.toLowerCase().includes(term.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ""));
      const score = hasWord ? (userResponse.length > 15 ? 92 : 80) : 40;
      return res.json({
        score,
        feedback: hasWord 
          ? "Great! You used the term correctly. To improve your ESL confidence, try expanding your details with custom examples."
          : `We noticed you didn't quite include the exact term '${term}' in your response. For maximum muscle memory, make sure the target term is spelled out naturally in your sentence!`,
        corrections: hasWord ? userResponse : `Actually, I should say: We settled our heated discussion in an amicable way.`,
        muscleMemoryBooster: "Focus on pronouncing each syllable steadily. Practice makes permanent!",
        rating: score >= 90 ? "Native-level" : score >= 70 ? "Fluent" : "Novice"
      });
    }

    const systemInstruction = `You are "LingoFlex Coach", an encouraging, highly professional ESL speech-and-writing tutor. Your mission is to evaluate a learner's interactive scenario response.
You will output a precise, motivational, diagnostic evaluation in JSON format containing:
- score: 0-100 gauge. Keep grading realistic but constructive.
- rating: "Novice", "Fluent", or "Native-level".
- feedback: direct feedback pointing out their syntactic execution, tone, and whether they used the target term accurately in context. Max 3 sentences, very friendly.
- corrections: a polished native-level alternative sentence starting from their draft, explaining in-context grammar or flow upgrades.
- muscleMemoryBooster: A 1-sentence tip on pronunciation respelling, vocal stress, or natural idiom substitution to build long-term retention.`;

    const prompt = `Evaluate the learner's response:
Target Term: "${term}"
Situation/Scenario Context: "${scenarioInfo || 'A conversational situation'}"
Learner's Draft Response: "${userResponse}"

Check if:
1. They used the term/idiom appropriately and grammatically.
2. The sentence is fluent.
Provide direct corrections if there are typos, tense mistakes, or syntactic friction.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "A realistic index evaluation score from 0 to 100." },
            feedback: { type: Type.STRING, description: "Motivational coaching feedback. Direct, clear, and focused on ESL improvement." },
            corrections: { type: Type.STRING, description: "An enhanced, super fluent, native-level rewrite of their sentence using the term correctly." },
            muscleMemoryBooster: { type: Type.STRING, description: "Spoken delivery or colloquial insight to help lock the term into conversational muscle memory." },
            rating: { type: Type.STRING, description: "Value must be one of: 'Novice', 'Fluent', 'Native-level'." }
          },
          required: ["score", "feedback", "corrections", "muscleMemoryBooster", "rating"]
        }
      }
    });

    const body = response.text ? JSON.parse(response.text.trim()) : {};
    res.json(body);
  } catch (error: any) {
    console.error("Error in /api/evaluate-response:", error);
    res.status(500).json({ error: error.message || "Failed to evaluate response" });
  }
});

// ─── VITE & STATIC HANDLING ──────────────────────────────────────────────────

async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Starting development environment with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("📦 Starting production mode. Serving static files from 'dist'...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`📡 [LingoFlex Server] running on http://0.0.0.0:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("❌ Failed to initialize LingoFlex server:", err);
});

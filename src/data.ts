import { VocabItem, DayDrop } from "./types";

/**
 * Static baseline vocabulary provided in the requirements.
 * These form the core 14 items (Days 1 to 7).
 */
export const baselineVocab: VocabItem[] = [
  {
    id: "baseline-1",
    type: "idiom",
    term: "Stop and smell the roses",
    pronunciation_respelling: "stop and smel thuh roh-ziz",
    definition: "To take time out of a busy schedule to enjoy or appreciate the beauty of life.",
    synonyms: ["slow down", "live in the moment", "pause", "take a breather"],
    examples: [
      "You've been working 80 hours a week; you need to stop and smell the roses.",
      "Vacations are a perfect reminder to stop and smell the roses."
    ],
    muscle_memory_prompt: "Think of one simple thing you enjoyed today. Say out loud: 'Today, I stopped and smelled the roses when I...'"
  },
  {
    id: "baseline-2",
    type: "idiom",
    term: "Motor mouth",
    pronunciation_respelling: "moh-ter mouth",
    definition: "An informal term for someone who talks incessantly or at an incredibly rapid pace.",
    synonyms: ["chatterbox", "babbler", "gabber", "talkative person"],
    examples: [
      "Don't ask her about her vacation unless you have time; she's a real motor mouth!",
      "I get a bit of a motor mouth when I'm nervous during interviews."
    ],
    muscle_memory_prompt: "Do you know a motor mouth in real life? Describe them using the phrase."
  },
  {
    id: "baseline-3",
    type: "idiom",
    term: "Worth their salt",
    pronunciation_respelling: "werth thair sawlt",
    definition: "Competent, capable, and deserving of their position, pay, or reputation.",
    synonyms: ["competent", "efficient", "deserving", "valuable", "capable"],
    examples: [
      "Any nurse worth their salt knows how to stay calm in an emergency.",
      "A mechanic worth their salt will tell you exactly what needs fixing without hidden fees."
    ],
    muscle_memory_prompt: "Complete this sentence out loud: 'Any teacher worth their salt should always...'"
  },
  {
    id: "baseline-4",
    type: "idiom",
    term: "Hunky-dory",
    pronunciation_respelling: "hung-kee-dor-ee",
    definition: "An informal phrase meaning everything is fine, going well, or perfectly okay.",
    synonyms: ["excellent", "fine", "satisfactory", "all right", "peachy"],
    examples: [
      "The project is hunky-dory and on schedule.",
      "Once we signed the contract, everything was hunky-dory again."
    ],
    muscle_memory_prompt: "Think of a problem you solved recently. How did you make everything hunky-dory again?"
  },
  {
    id: "baseline-5",
    type: "word",
    term: "Decoy",
    pronunciation_respelling: "dee-koy",
    definition: "Something or someone used to distract, mislead, or lure attention away from the real target.",
    synonyms: ["distraction", "bait", "lure", "camouflage", "trick"],
    examples: [
      "The hunters used a decoy duck to attract real ducks.",
      "The celebrity sent out a decoy car to fool the paparazzi while she left through the back door."
    ],
    muscle_memory_prompt: "When has someone or something used a distraction on you? Use the word 'decoy'."
  },
  {
    id: "baseline-6",
    type: "word",
    term: "Amicable",
    pronunciation_respelling: "am-ih-kuh-buhl",
    definition: "Friendly, peaceful, and characterized by goodwill; avoiding friction or conflict.",
    synonyms: ["peaceful", "cordial", "harmonious", "friendly", "civil"],
    examples: [
      "They reached an amicable agreement after a long discussion.",
      "Despite their differences, the business partners parted on amicable terms."
    ],
    muscle_memory_prompt: "Imagine resolving a small argument with a friend. Say out loud: 'We had a disagreement, but we settled it in an amicable way by...'"
  },
  {
    id: "baseline-7",
    type: "word",
    term: "Vociferous",
    pronunciation_respelling: "voh-sif-er-uhs",
    definition: "Expressing feelings, opinions, or complaints in a loud, forceful, and insistent manner.",
    synonyms: ["loud", "clamorous", "outspoken", "vehement", "vocal"],
    examples: [
      "The committee members were vociferous about the need for better classroom resources.",
      "He was a vociferous critic of the new city tax laws."
    ],
    muscle_memory_prompt: "What is an issue you feel very strongly about? Say: 'I am a vociferous supporter/critic of...'"
  },
  {
    id: "baseline-8",
    type: "word",
    term: "Gravitas",
    pronunciation_respelling: "grav-ih-tahs",
    definition: "A quality of substance, dignity, seriousness, and wisdom that commands immediate respect.",
    synonyms: ["dignity", "authority", "presence", "solemnity", "importance"],
    examples: [
      "She spoke with gravitas and confidence during the high-stakes meeting.",
      "His calm manner and inherent gravitas helped reassure the public during the crisis."
    ],
    muscle_memory_prompt: "Name a public figure or leader who possesses gravitas, and explain why you think so."
  },
  {
    id: "baseline-9",
    type: "word",
    term: "Splurge",
    pronunciation_respelling: "splerj",
    definition: "To extravagantly spend a significant amount of money on a luxury or treat.",
    synonyms: ["binge spend", "lavish", "indulge", "treat oneself", "squander"],
    examples: [
      "They splurged on a luxury five-star hotel during their brief vacation.",
      "I'm trying hard to save money this month, so absolutely no splurging!"
    ],
    muscle_memory_prompt: "If you were handed $1,000 right now to spend guilt-free, what would you splurge it on?"
  },
  {
    id: "baseline-10",
    type: "idiom",
    term: "Rose-tinted glasses",
    pronunciation_respelling: "rohz-tin-tid glas-iz",
    definition: "An optimistic viewpoint that causes someone to see things as better than they actually are, ignoring harsh realities.",
    synonyms: ["naive optimism", "idealism", "unrealistic view"],
    examples: [
      "He remembers his childhood through rose-tinted glasses and completely forgets the family's struggles.",
      "Investors shouldn't look at a highly volatile market through rose-tinted glasses."
    ],
    muscle_memory_prompt: "Give an example of a time when looking at a situation through rose-tinted glasses could be dangerous."
  },
  {
    id: "baseline-11",
    type: "idiom",
    term: "Push the envelope",
    pronunciation_respelling: "poosh thuh en-vuh-lohp",
    definition: "To approach or extend the local limits of what is possible, acceptable, or traditionally allowed.",
    synonyms: ["innovate", "break boundaries", "pioneer", "defy limits"],
    examples: [
      "The tech company is really pushing the envelope with its new generative AI architecture.",
      "The modern artist is widely known for pushing the envelope with her controversial exhibits."
    ],
    muscle_memory_prompt: "How can you push the envelope in your current job or study routine this week?"
  },
  {
    id: "baseline-12",
    type: "idiom",
    term: "Slow on the uptake",
    pronunciation_respelling: "sloh on thuh up-tayk",
    definition: "Taking a bit longer than average to fully grasp, comprehend, or learn a new concept.",
    synonyms: ["slow-witted", "obtuse", "delayed understanding", "uncomprehending"],
    examples: [
      "I'm sorry, I'm just a little slow on the uptake this morning—can you run through that math step one more time?",
      "He was initially slow on the uptake, but once the concept clicked, his performance was flawless."
    ],
    muscle_memory_prompt: "Use this phrase to politely explain to a colleague that you need instructions repeated."
  },
  {
    id: "baseline-13",
    type: "word",
    term: "Late bloomer",
    pronunciation_respelling: "layt bloo-mer",
    definition: "An individual who discovers their talents, hits success, or reaches maturity later in life than their peers.",
    synonyms: ["late developer", "delayed success"],
    examples: [
      "She was a late bloomer in grade school but went on to graduate top of her class in university.",
      "Many of history's most celebrated authors were late bloomers who didn't publish until their late 40s."
    ],
    muscle_memory_prompt: "Do you consider yourself an early achiever or a late bloomer in your career track?"
  },
  {
    id: "baseline-14",
    type: "word",
    term: "Liability",
    pronunciation_respelling: "ly-uh-bil-ih-tee",
    definition: "1. A legal, financial responsibility. 2. A person or issue that creates persistent problems or acts as a clear disadvantage.",
    synonyms: ["disadvantage", "burden", "hindrance", "obligation", "debt"],
    examples: [
      "The shipping corporation formally accepted full liability for the accidental spill.",
      "His total lack of punctuality and missing deadlines quickly made him a massive liability to our project team."
    ],
    muscle_memory_prompt: "Explain how an old, unpatched smartphone can become a security liability for a user."
  }
];

/**
 * Baseline drops chunked into 7 days with exactly 2 items each.
 */
export const baselineDrops: DayDrop[] = [
  {
    day: 1,
    items: [baselineVocab[0], baselineVocab[1]]
  },
  {
    day: 2,
    items: [baselineVocab[2], baselineVocab[3]]
  },
  {
    day: 3,
    items: [baselineVocab[4], baselineVocab[5]]
  },
  {
    day: 4,
    items: [baselineVocab[6], baselineVocab[7]]
  },
  {
    day: 5,
    items: [baselineVocab[8], baselineVocab[9]]
  },
  {
    day: 6,
    items: [baselineVocab[10], baselineVocab[11]]
  },
  {
    day: 7,
    items: [baselineVocab[12], baselineVocab[13]]
  }
];

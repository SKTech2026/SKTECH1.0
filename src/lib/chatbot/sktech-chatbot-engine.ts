import modelArtifact from "@/lib/chatbot/sktech-chatbot-model.generated.json";

type ChatIntentModel = {
  id: string;
  category: string;
  responses: string[];
  relatedTopics: string[];
  documentCount: number;
  tokenTotal: number;
  tokenCounts: Record<string, number>;
};

type ChatbotModel = {
  algorithm: string;
  alpha: number;
  fallbackThreshold: number;
  intents: ChatIntentModel[];
  vocabulary: string[];
  priors: Record<string, number>;
};

type ChatbotAnswer = {
  text: string;
  intent: string;
  suggestedTopics: string[];
};

const model = modelArtifact as unknown as ChatbotModel;
const vocabulary = new Set(model.vocabulary);
const fallbackAnswer =
  "I'm focused on SKTECH. I can help with registration, Digital ID, attendance, announcements, chat, or dashboard access.";

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(/\s+/u).filter((token) => token.length > 1);
}

function detectLanguageStyle(input: string) {
  const normalized = normalizeText(input);
  const tagalogMarkers = [
    "kumusta",
    "kamusta",
    "ano",
    "paano",
    "saan",
    "ang",
    "mga",
    "ako",
    "ba",
    "ng",
    "magandang",
    "salamat",
  ];
  return tagalogMarkers.some((marker) => normalized.split(" ").includes(marker))
    ? "taglish"
    : "english";
}

function scoreIntent(inputTokens: string[], intent: ChatIntentModel) {
  const vocabularySize = model.vocabulary.length;
  const denominator = intent.tokenTotal + model.alpha * vocabularySize;
  let score = Math.log(model.priors[intent.id] ?? 1 / model.intents.length);

  for (const token of inputTokens) {
    if (!vocabulary.has(token)) continue;
    const count = intent.tokenCounts[token] ?? 0;
    score += Math.log((count + model.alpha) / denominator);
  }

  return score;
}

function selectResponse(intent: ChatIntentModel, input: string) {
  if (intent.id === "greeting" && detectLanguageStyle(input) === "taglish") {
    return intent.responses[1] ?? intent.responses[0];
  }
  return intent.responses[0];
}

export function answerSktTechChat(input: string): ChatbotAnswer {
  const tokens = tokenize(input);
  const knownTokenCount = tokens.filter((token) => vocabulary.has(token)).length;
  if (tokens.length === 0) {
    return { text: fallbackAnswer, intent: "fallback", suggestedTopics: ["Registration", "Digital ID", "Attendance"] };
  }
  if (knownTokenCount === 0) {
    return {
      text: fallbackAnswer,
      intent: "fallback",
      suggestedTopics: ["Registration", "Digital ID", "Attendance", "Dashboard access"],
    };
  }

  const scored = model.intents
    .map((intent) => ({ intent, score: scoreIntent(tokens, intent) }))
    .sort((left, right) => right.score - left.score);
  const best = scored[0];
  const runnerUp = scored[1];
  const scoreGap = best && runnerUp ? best.score - runnerUp.score : 0;
  const confidence = best ? 1 / (1 + Math.exp(-scoreGap)) : 0;
  const selectedIntent = best && confidence >= model.fallbackThreshold ? best.intent : null;
  const intent = selectedIntent ?? model.intents.find((item) => item.id === "fallback");

  if (!selectedIntent || !intent) {
    return {
      text: fallbackAnswer,
      intent: "fallback",
      suggestedTopics: ["Registration", "Digital ID", "Attendance", "Dashboard access"],
    };
  }

  return {
    text: selectResponse(intent, input),
    intent: intent.id,
    suggestedTopics: intent.relatedTopics,
  };
}

export type { ChatbotAnswer };

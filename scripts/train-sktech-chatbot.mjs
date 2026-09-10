import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const datasetPath = resolve(projectRoot, "src/lib/chatbot/sktech-chatbot-dataset.json");
const modelPath = resolve(projectRoot, "src/lib/chatbot/sktech-chatbot-model.generated.json");
const alpha = 1;

function normalizeText(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(/\s+/u).filter((token) => token.length > 1);
}

const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
if (!Array.isArray(dataset) || dataset.length === 0) {
  throw new Error("The SKTECH chatbot dataset must contain at least one intent.");
}

const vocabulary = new Set();
const documentFrequency = new Map();
const intentModels = dataset.map((intent) => {
  const tokenCounts = new Map();
  let documentCount = 0;

  for (const example of intent.examples) {
    const tokens = new Set(tokenize(example));
    if (tokens.size === 0) continue;
    documentCount += 1;
    for (const token of tokens) {
      vocabulary.add(token);
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
    for (const token of tokenize(example)) {
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }
  }

  return {
    id: intent.id,
    category: intent.category,
    responses: intent.responses,
    relatedTopics: intent.relatedTopics ?? [],
    documentCount,
    tokenTotal: [...tokenCounts.values()].reduce((total, count) => total + count, 0),
    tokenCounts: Object.fromEntries(tokenCounts),
  };
});

const totalDocuments = intentModels.reduce((total, intent) => total + intent.documentCount, 0);
const model = {
  modelVersion: "1.0.0",
  trainedAt: new Date().toISOString(),
  algorithm: "multinomial-naive-bayes",
  alpha,
  fallbackThreshold: 0.05,
  intents: intentModels,
  vocabulary: [...vocabulary].sort(),
  documentFrequency: Object.fromEntries([...documentFrequency].sort(([left], [right]) => left.localeCompare(right))),
  priors: Object.fromEntries(
    intentModels.map((intent) => [intent.id, intent.documentCount / totalDocuments]),
  ),
  datasetSummary: {
    intentCount: intentModels.length,
    exampleCount: totalDocuments,
    vocabularySize: vocabulary.size,
  },
};

await writeFile(modelPath, `${JSON.stringify(model, null, 2)}\n`, "utf8");
console.log(`Trained ${model.algorithm} model with ${totalDocuments} examples across ${intentModels.length} intents.`);
console.log(`Vocabulary: ${model.vocabulary.length} tokens.`);
console.log(`Wrote ${modelPath}.`);

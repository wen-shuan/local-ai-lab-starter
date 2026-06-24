function readBoolean(value) {
  return value === "true";
}

function readText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getDefaultBaseUrl(provider) {
  if (provider === "openrouter") {
    return "https://openrouter.ai/api/v1";
  }

  return "https://generativelanguage.googleapis.com/v1beta/openai";
}

const OPENROUTER_ALLOWED_MODELS = [
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    label: "Llama 3.2 3B Instruct (free smoke test)",
    provider: "openrouter",
    enabled: true
  },
  {
    id: "qwen/qwen-2.5-7b-instruct",
    label: "Qwen2.5 7B Instruct (cheap paid fallback)",
    provider: "openrouter",
    enabled: true
  }
];

function buildAllowedModels({ provider, model }) {
  // Keep this as a curated server-side allowlist. Do not expose a full provider catalog.
  if (provider === "openrouter") {
    return OPENROUTER_ALLOWED_MODELS;
  }

  return [
    {
      id: model,
      label: model === "not-connected" ? "Not connected mock model" : model,
      provider,
      enabled: true
    }
  ];
}

const aiEnabled = readBoolean(process.env.AI_ENABLED);
const apiKey = readText(process.env.AI_API_KEY, "");
const provider = aiEnabled ? readText(process.env.AI_PROVIDER, "mock") : "mock";
const model = aiEnabled ? readText(process.env.AI_MODEL, "not-connected") : "not-connected";
const baseUrl = readText(process.env.AI_BASE_URL, getDefaultBaseUrl(provider));
const allowedModels = buildAllowedModels({ provider, model });
const defaultModelValid = allowedModels.some(
  (item) => item.enabled && item.id === model && item.provider === provider
);
const providerWarnings = provider === "openrouter"
  ? ["OpenRouter request path is available; use curated allowed models and fake data for live smoke tests."]
  : [];

const config = {
  ai: {
    enabled: aiEnabled,
    provider,
    model,
    baseUrl,
    apiKey,
    apiKeyPresent: Boolean(apiKey),
    maxOutputTokens: readNumber(process.env.AI_MAX_OUTPUT_TOKENS, 800),
    temperature: readNumber(process.env.AI_TEMPERATURE, 0.7),
    allowedModels,
    defaultModelValid,
    modelWarnings: [
      ...(defaultModelValid
        ? []
        : ["Default model is not in allowed models. Chat behavior is unchanged in this build."]),
      ...providerWarnings
    ],
    selectedModelSupported: true
  }
};

function normalizeSelectedModelId(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function getAllowedModelIds() {
  return config.ai.allowedModels.map((item) => item.id);
}

function findEnabledAllowedModelById(modelId) {
  const normalizedModelId = normalizeSelectedModelId(modelId);

  return (
    config.ai.allowedModels.find(
      (item) => item.id === normalizedModelId && item.enabled !== false
    ) || null
  );
}

function resolveModelSelection(selectedModelId) {
  const normalizedModelId = normalizeSelectedModelId(selectedModelId);
  const allowedModelIds = getAllowedModelIds();

  if (!normalizedModelId) {
    return {
      selectionValid: true,
      selectedModel: null,
      selectedModelId: null,
      actualModel: config.ai.model,
      actualProvider: config.ai.provider,
      modelSource: "default",
      allowedModelIds
    };
  }

  const allowedModel = findEnabledAllowedModelById(normalizedModelId);

  if (!allowedModel) {
    return {
      selectionValid: false,
      selectedModel: normalizedModelId,
      selectedModelId: normalizedModelId,
      actualModel: null,
      actualProvider: null,
      modelSource: "invalid",
      allowedModelIds
    };
  }

  return {
    selectionValid: true,
    selectedModel: allowedModel.id,
    selectedModelId: allowedModel.id,
    actualModel: allowedModel.id,
    actualProvider: allowedModel.provider,
    modelSource: "user-selected",
    allowedModelIds
  };
}

module.exports = {
  config,
  findEnabledAllowedModelById,
  getAllowedModelIds,
  resolveModelSelection
};

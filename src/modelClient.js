const { config } = require("./config");

function sanitizeErrorMessage(message) {
  const fallback = "AI provider request failed.";
  const value = typeof message === "string" && message.trim()
    ? message.trim().replace(/https?:\/\/\S+/g, "[redacted-url]")
    : fallback;

  return value.length > 240 ? `${value.slice(0, 237)}...` : value;
}

function buildSafeError(error, status = null) {
  return {
    status,
    message: sanitizeErrorMessage(error && error.message)
  };
}

function buildChatCompletionsUrl(baseUrl) {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function getActualAiConfig(modelSelection) {
  return {
    provider: modelSelection?.actualProvider || config.ai.provider,
    model: modelSelection?.actualModel || config.ai.model
  };
}

function buildChatCompletionsBody({ previewPayload, aiConfig }) {
  return {
    model: aiConfig.model,
    messages: previewPayload.messages,
    max_tokens: config.ai.maxOutputTokens,
    temperature: config.ai.temperature
  };
}

async function sendOpenAiCompatibleChatCompletion({ previewPayload, aiConfig }) {
  const response = await fetch(buildChatCompletionsUrl(config.ai.baseUrl), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.ai.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildChatCompletionsBody({ previewPayload, aiConfig }))
  });
  const data = await response.json().catch(() => ({}));

  return { response, data };
}

function buildMissingApiKeyResult({ aiConfig, reply }) {
  return {
    reply,
    provider: aiConfig.provider,
    model: aiConfig.model,
    enabledButNotImplemented: false,
    externalApiCalled: false,
    missingApiKey: true,
    usage: null
  };
}

function buildProviderErrorResult({ aiConfig, status, message, usage = null }) {
  return {
    reply: "AI provider request failed safely. No secret was exposed.",
    provider: aiConfig.provider,
    model: aiConfig.model,
    enabledButNotImplemented: false,
    externalApiCalled: true,
    usage,
    error: buildSafeError(new Error(message || "Provider returned an error."), status)
  };
}

function buildProviderSuccessResult({ aiConfig, data }) {
  return {
    reply: data.choices?.[0]?.message?.content || "",
    provider: aiConfig.provider,
    model: aiConfig.model,
    enabledButNotImplemented: false,
    externalApiCalled: true,
    usage: data.usage || null
  };
}

async function generateOpenAiCompatibleProviderReply({ previewPayload, aiConfig, missingKeyReply }) {
  if (!config.ai.apiKeyPresent) {
    return buildMissingApiKeyResult({
      aiConfig,
      reply: missingKeyReply
    });
  }

  try {
    const { response, data } = await sendOpenAiCompatibleChatCompletion({ previewPayload, aiConfig });

    if (!response.ok) {
      return buildProviderErrorResult({
        aiConfig,
        status: response.status,
        message: data.error && data.error.message ? data.error.message : "Provider returned an error.",
        usage: data.usage || null
      });
    }

    return buildProviderSuccessResult({ aiConfig, data });
  } catch (error) {
    return buildProviderErrorResult({
      aiConfig,
      status: null,
      message: error && error.message ? error.message : "AI provider request failed.",
      usage: null
    });
  }
}

async function generateGeminiOpenAiCompatibleReply({ previewPayload, aiConfig }) {
  return generateOpenAiCompatibleProviderReply({
    previewPayload,
    aiConfig,
    missingKeyReply: "Gemini OpenAI-compatible provider is enabled, but no API key is configured. This is a safe mock reply."
  });
}

async function generateOpenRouterReply({ previewPayload, aiConfig }) {
  return generateOpenAiCompatibleProviderReply({
    previewPayload,
    aiConfig,
    missingKeyReply: "OpenRouter API key missing. This is a safe mock reply."
  });
}

async function generateReply({ previewPayload, message, stickyNote, modelSelection }) {
  const aiConfig = getActualAiConfig(modelSelection);

  if (
    config.ai.enabled &&
    aiConfig.provider === "gemini-openai-compatible"
  ) {
    return generateGeminiOpenAiCompatibleReply({ previewPayload, message, stickyNote, aiConfig });
  }

  if (
    config.ai.enabled &&
    aiConfig.provider === "openrouter"
  ) {
    return generateOpenRouterReply({ previewPayload, message, stickyNote, aiConfig });
  }

  const enabledButNotImplemented = config.ai.enabled;
  const reply = enabledButNotImplemented
    ? "AI config is enabled, but external AI calls are not implemented in this build. This is still a mock reply."
    : "The local backend received the message. This is a mock modelClient reply; no AI API is connected.";

  return {
    reply,
    provider: aiConfig.provider,
    model: aiConfig.model,
    enabledButNotImplemented,
    externalApiCalled: false,
    usage: null
  };
}

module.exports = {
  generateReply
};

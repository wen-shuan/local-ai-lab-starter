const express = require("express");
const path = require("path");
const {
  addMessage,
  clearMessages,
  dbPath,
  getMessageCount,
  getRecentMessages,
  getStickyNote,
  getStickyNoteMetadata,
  getUsageEventCount,
  getUsageSummary,
  insertUsageEvent,
  saveStickyNote
} = require("./db");
const { buildChatPreviewPayload } = require("./promptBuilder");
const { config, resolveModelSelection } = require("./config");
const { generateReply } = require("./modelClient");

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, "..", "public");
const databasePath = path.relative(path.join(__dirname, ".."), dbPath);

app.use(express.json());
app.use(express.static(publicDir));

app.get("/api/sticky-note", (req, res) => {
  res.json(getStickyNote());
});

app.put("/api/sticky-note", (req, res) => {
  const content = typeof req.body.content === "string" ? req.body.content : "";
  res.json(saveStickyNote(content));
});

app.get("/api/debug/status", (req, res) => {
  res.json({
    mode: "local-only",
    aiApiConnected: false,
    ai: {
      enabled: config.ai.enabled,
      provider: config.ai.provider,
      model: config.ai.model,
      baseUrl: config.ai.baseUrl,
      apiKeyPresent: config.ai.apiKeyPresent,
      externalApiCalled: false,
      allowedModelCount: config.ai.allowedModels.length,
      defaultModelValid: config.ai.defaultModelValid,
      selectedModelSupported: config.ai.selectedModelSupported
    },
    messageCount: getMessageCount(),
    usage: {
      eventCount: getUsageEventCount()
    },
    stickyNote: getStickyNoteMetadata(),
    database: {
      path: databasePath
    }
  });
});

app.get("/api/models", (req, res) => {
  res.json({
    provider: config.ai.provider,
    defaultModel: config.ai.model,
    defaultModelValid: config.ai.defaultModelValid,
    allowedModels: config.ai.allowedModels,
    selectedModelSupported: config.ai.selectedModelSupported,
    warnings: config.ai.modelWarnings
  });
});

app.post("/api/debug/clear-messages", (req, res) => {
  if (!req.body || req.body.confirm !== "CLEAR_TEST_MESSAGES") {
    return res.status(400).json({
      error: "Invalid confirmation."
    });
  }

  const result = clearMessages();

  res.json({
    ok: true,
    deletedMessages: result.deletedMessages,
    remainingMessages: result.remainingMessages,
    stickyNotePreserved: true
  });
});

app.get("/api/usage/summary", (req, res) => {
  res.json(getUsageSummary());
});

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body.message === "string" ? req.body.message : "";
  const stickyNote = typeof req.body.stickyNote === "string" ? req.body.stickyNote : "";
  const selectedModelId =
    typeof req.body.selectedModelId === "string" && req.body.selectedModelId.trim()
      ? req.body.selectedModelId.trim()
      : null;

  if (!message.trim()) {
    return res.status(400).json({
      error: "Message is required.",
      debug: {
        receivedMessageLength: message.length,
        receivedStickyNoteLength: stickyNote.length,
        mode: "mock"
      }
    });
  }

  const modelSelection = resolveModelSelection(selectedModelId);

  if (!modelSelection.selectionValid) {
    return res.status(400).json({
      error: "Invalid selected model",
      selectedModelId: modelSelection.selectedModelId,
      allowedModelIds: modelSelection.allowedModelIds,
      debug: {
        receivedMessageLength: message.length,
        receivedStickyNoteLength: stickyNote.length,
        mode: "mock",
        selectedModel: modelSelection.selectedModel,
        actualModelUsed: null,
        modelSource: modelSelection.modelSource,
        selectionValid: false,
        externalApiCalled: false
      }
    });
  }

  const recentMessages = getRecentMessages(10);
  const previewPayload = buildChatPreviewPayload({
    message,
    stickyNote,
    recentMessages
  });
  previewPayload.model = modelSelection.actualModel;

  const userMessage = addMessage({
    role: "user",
    content: message
  });
  const modelResult = await generateReply({
    previewPayload,
    message,
    stickyNote,
    modelSelection
  });
  const reply = modelResult.reply;
  const responseMode = modelResult.externalApiCalled ? "api" : "mock";
  const usageEvent = insertUsageEvent({
    featureType: "chat",
    provider: modelResult.provider,
    model: modelResult.model,
    mode: responseMode,
    inputTextLength: message.length,
    stickyNoteLength: stickyNote.length,
    previewMessageCount: previewPayload.messages.length,
    replyLength: reply.length,
    usageJson: {
      mock: !modelResult.externalApiCalled,
      enabledButNotImplemented: modelResult.enabledButNotImplemented,
      externalApiCalled: modelResult.externalApiCalled,
      missingApiKey: modelResult.missingApiKey || false,
      selectedModel: modelSelection.selectedModel,
      actualModelUsed: modelSelection.actualModel,
      modelSource: modelSelection.modelSource,
      selectionValid: modelSelection.selectionValid,
      usage: modelResult.usage || null
    }
  });
  const assistantMessage = addMessage({
    role: "assistant",
    content: reply
  });

  res.json({
    reply,
    messageIds: {
      user: userMessage.id,
      assistant: assistantMessage.id
    },
    debug: {
      receivedMessageLength: message.length,
      receivedStickyNoteLength: stickyNote.length,
      mode: responseMode,
      provider: modelResult.provider,
      model: modelResult.model,
      enabledButNotImplemented: modelResult.enabledButNotImplemented,
      externalApiCalled: modelResult.externalApiCalled,
      missingApiKey: modelResult.missingApiKey,
      selectedModel: modelSelection.selectedModel,
      actualModelUsed: modelSelection.actualModel,
      modelSource: modelSelection.modelSource,
      selectionValid: modelSelection.selectionValid,
      error: modelResult.error,
      usage: modelResult.usage,
      usageLogId: usageEvent.id,
      previewPayload
    }
  });
});

app.get("/api/messages", (req, res) => {
  res.json(getRecentMessages());
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`local-ai-lab-starter listening locally on http://localhost:${port}`);
});

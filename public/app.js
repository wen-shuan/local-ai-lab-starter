const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const messageArea = document.querySelector("#messageArea");
const stickyNote = document.querySelector("#stickyNote");
const stickyStatus = document.querySelector("#stickyStatus");
const debugStatus = document.querySelector("#debugStatus");
const promptPreview = document.querySelector("#promptPreview");
const promptSystemPresent = document.querySelector("#promptSystemPresent");
const promptSystemPreview = document.querySelector("#promptSystemPreview");
const promptStickyIncluded = document.querySelector("#promptStickyIncluded");
const promptStickyPreview = document.querySelector("#promptStickyPreview");
const promptRecentCount = document.querySelector("#promptRecentCount");
const promptRecentList = document.querySelector("#promptRecentList");
const promptLatestIncluded = document.querySelector("#promptLatestIncluded");
const promptLatestPreview = document.querySelector("#promptLatestPreview");
const promptPayloadSummary = document.querySelector("#promptPayloadSummary");
const contextSummary = document.querySelector("#contextSummary");
const lastChatDebug = document.querySelector("#lastChatDebug");
const lastDebugSelectedModel = document.querySelector("#lastDebugSelectedModel");
const lastDebugActualModel = document.querySelector("#lastDebugActualModel");
const lastDebugModelSource = document.querySelector("#lastDebugModelSource");
const lastDebugSelectionValid = document.querySelector("#lastDebugSelectionValid");
const lastDebugExternalApiCalled = document.querySelector("#lastDebugExternalApiCalled");
const retryPanel = document.querySelector("#retryPanel");
const retryLastMessageButton = document.querySelector("#retryLastMessageButton");
const debugAiApi = document.querySelector("#debugAiApi");
const debugAiEnabled = document.querySelector("#debugAiEnabled");
const debugAiProvider = document.querySelector("#debugAiProvider");
const debugAiModel = document.querySelector("#debugAiModel");
const debugApiKeyPresent = document.querySelector("#debugApiKeyPresent");
const debugExternalApiCalled = document.querySelector("#debugExternalApiCalled");
const debugMessageCount = document.querySelector("#debugMessageCount");
const debugStickyState = document.querySelector("#debugStickyState");
const debugStickyUpdated = document.querySelector("#debugStickyUpdated");
const debugUsageEventCount = document.querySelector("#debugUsageEventCount");
const archiveMessageCount = document.querySelector("#archiveMessageCount");
const modelSwitchStatus = document.querySelector("#modelSwitchStatus");
const modelSelect = document.querySelector("#modelSelect");
const modelProvider = document.querySelector("#modelProvider");
const modelDefault = document.querySelector("#modelDefault");
const modelAllowedCount = document.querySelector("#modelAllowedCount");
const modelSelected = document.querySelector("#modelSelected");
const modelSelectedSupported = document.querySelector("#modelSelectedSupported");
const modelDefaultValid = document.querySelector("#modelDefaultValid");
const modelWarnings = document.querySelector("#modelWarnings");
const usageProvider = document.querySelector("#usageProvider");
const usageEventCount = document.querySelector("#usageEventCount");
const usageAiApi = document.querySelector("#usageAiApi");
const clearMessagesButton = document.querySelector("#clearMessagesButton");
const submitButton = chatForm.querySelector("button[type='submit']");
let stickySaveTimer;
let lastChatRequest = null;
let chatRequestInFlight = false;
let lastExternalCallStatus = "none yet";
let modelMetadata = null;
let selectedModelId = "";

const introMessage = "This is a local-first AI lab starter. Messages are handled according to the current server-side AI settings; use fake data while testing.";

function appendMessage(text, type) {
  const message = document.createElement("article");
  message.className = `message ${type}-message`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  message.append(paragraph);
  messageArea.append(message);
  messageArea.scrollTop = messageArea.scrollHeight;
}

function resetMessageArea() {
  messageArea.textContent = "";
  appendMessage(introMessage, "system");
}

function showPromptPreview(previewPayload) {
  if (!previewPayload) {
    promptPreview.textContent = "{}";
    showPromptRoom(null);
    showContextSummary(null);
    return;
  }

  promptPreview.textContent = JSON.stringify(previewPayload, null, 2);
  showPromptRoom(previewPayload);
  showContextSummary(previewPayload);
}

function showPromptRoom(previewPayload) {
  const messages = getPreviewMessages(previewPayload);
  const systemMessage = messages.find((message) => message.role === "system");
  const latestUserMessage = getLatestUserMessage(messages);
  const recentMessages = getRecentPreviewMessages(messages, systemMessage, latestUserMessage);
  const stickyNoteText = extractStickyNoteText(systemMessage && systemMessage.content);
  const roleCounts = getRoleCounts(messages);

  promptSystemPresent.textContent = String(Boolean(systemMessage));
  promptSystemPreview.textContent = systemMessage
    ? truncatePreview(getSystemInstructionPreview(systemMessage.content), 220)
    : "No system message in preview.";

  promptStickyIncluded.textContent = String(Boolean(stickyNoteText));
  promptStickyPreview.textContent = stickyNoteText
    ? truncatePreview(stickyNoteText, 180)
    : "No sticky note context in preview.";

  promptRecentCount.textContent = String(recentMessages.length);
  renderRecentPromptMessages(recentMessages);

  promptLatestIncluded.textContent = String(Boolean(latestUserMessage));
  promptLatestPreview.textContent = latestUserMessage
    ? truncatePreview(latestUserMessage.content, 220)
    : "No latest user message in preview.";

  renderPromptPayloadSummary(messages, roleCounts);
}

function getPreviewMessages(previewPayload) {
  return Array.isArray(previewPayload && previewPayload.messages) ? previewPayload.messages : [];
}

function getLatestUserMessage(messages) {
  const latestMessage = messages[messages.length - 1];
  return latestMessage && latestMessage.role === "user" ? latestMessage : null;
}

function getRecentPreviewMessages(messages, systemMessage, latestUserMessage) {
  return messages.filter((message) => message !== systemMessage && message !== latestUserMessage);
}

function extractStickyNoteText(systemContent) {
  if (!systemContent) {
    return "";
  }

  const marker = "Sticky Note:";
  const markerIndex = systemContent.indexOf(marker);

  if (markerIndex === -1) {
    return "";
  }

  return systemContent.slice(markerIndex + marker.length).trim();
}

function getSystemInstructionPreview(systemContent) {
  if (!systemContent) {
    return "";
  }

  const marker = "Sticky Note:";
  const markerIndex = systemContent.indexOf(marker);

  return markerIndex === -1 ? systemContent.trim() : systemContent.slice(0, markerIndex).trim();
}

function truncatePreview(text, maxLength) {
  const value = String(text || "").replace(/\s+/g, " ").trim();

  if (!value) {
    return "(empty)";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function getRoleCounts(messages) {
  return messages.reduce((counts, message) => {
    const role = message.role || "unknown";
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});
}

function renderRecentPromptMessages(recentMessages) {
  promptRecentList.textContent = "";

  if (!recentMessages.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "No recent messages in preview.";
    promptRecentList.append(emptyItem);
    return;
  }

  recentMessages.forEach((message) => {
    const item = document.createElement("li");
    const role = document.createElement("span");
    const content = document.createElement("span");

    role.className = "prompt-message-role";
    role.textContent = message.role || "unknown";
    content.textContent = truncatePreview(message.content, 140);

    item.append(role, content);
    promptRecentList.append(item);
  });
}

function renderPromptPayloadSummary(messages, roleCounts) {
  promptPayloadSummary.textContent = "";

  [
    ["Total Messages", String(messages.length)],
    ["system", String(roleCounts.system || 0)],
    ["user", String(roleCounts.user || 0)],
    ["assistant", String(roleCounts.assistant || 0)]
  ].forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");

    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    promptPayloadSummary.append(row);
  });
}

function showContextSummary(previewPayload) {
  const messages = getPreviewMessages(previewPayload);
  const systemMessage = messages.find((message) => message.role === "system");
  const latestMessage = getLatestUserMessage(messages);
  const stickyNoteIncluded = Boolean(extractStickyNoteText(systemMessage && systemMessage.content));
  const latestUserIncluded = Boolean(latestMessage);
  const recentMessageCount = Math.max(
    messages.length - (systemMessage ? 1 : 0) - (latestUserIncluded ? 1 : 0),
    0
  );

  contextSummary.innerHTML = "";

  [
    ["System Message", String(Boolean(systemMessage))],
    ["Sticky Note Included", String(stickyNoteIncluded)],
    ["Preview Messages", String(messages.length)],
    ["Recent Messages", String(recentMessageCount)],
    ["Latest User Message", String(latestUserIncluded)]
  ].forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");

    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    contextSummary.append(row);
  });
}

function showLastChatDebug(debug) {
  if (!debug) {
    lastChatDebug.textContent = "No debug payload returned.";
    renderLastModelValidationSummary(null);
    lastExternalCallStatus = "unknown";
    debugExternalApiCalled.textContent = lastExternalCallStatus;
    return;
  }

  const summary = {
    provider: debug.provider || null,
    model: debug.model || null,
    mode: debug.mode || null,
    selectedModel: debug.selectedModel || null,
    actualModelUsed: debug.actualModelUsed || null,
    modelSource: debug.modelSource || null,
    selectionValid: debug.selectionValid === true,
    externalApiCalled: debug.externalApiCalled === true,
    missingApiKey: debug.missingApiKey === true,
    enabledButNotImplemented: debug.enabledButNotImplemented === true,
    error: debug.error
      ? {
          status: debug.error.status || null,
          message: debug.error.message || "Provider error"
        }
      : null,
    previewMessageCount: Array.isArray(debug.previewPayload && debug.previewPayload.messages)
      ? debug.previewPayload.messages.length
      : 0
  };

  lastChatDebug.textContent = JSON.stringify(summary, null, 2);
  renderLastModelValidationSummary(summary);
  lastExternalCallStatus = getLastExternalCallStatus(debug);
  debugExternalApiCalled.textContent = lastExternalCallStatus;
}

function renderLastModelValidationSummary(summary) {
  lastDebugSelectedModel.textContent = summary?.selectedModel || "none";
  lastDebugActualModel.textContent = summary?.actualModelUsed || "none";
  lastDebugModelSource.textContent = summary?.modelSource || "none";
  lastDebugSelectionValid.textContent =
    typeof summary?.selectionValid === "boolean" ? String(summary.selectionValid) : "unknown";
  lastDebugExternalApiCalled.textContent =
    typeof summary?.externalApiCalled === "boolean" ? String(summary.externalApiCalled) : "unknown";
}

function getLastExternalCallStatus(debug) {
  if (!debug || debug.externalApiCalled !== true) {
    return "not called";
  }

  return debug.error ? "last call failed" : "last call succeeded";
}

function getProviderStatus(status) {
  if (!status.ai.enabled) {
    return "disabled";
  }

  if (!status.ai.apiKeyPresent && status.ai.provider !== "mock") {
    return "missing key";
  }

  return "configured";
}

function getTopStatusText(status) {
  if (!status.ai.enabled) {
    return "Local backend connected · AI disabled";
  }

  if (!status.ai.apiKeyPresent && status.ai.provider !== "mock") {
    return "Local backend connected · AI provider missing key";
  }

  if (status.ai.provider === "gemini-openai-compatible") {
    return "Local backend connected · Gemini provider configured";
  }

  return "Local backend connected · AI provider configured";
}

function isRetryableProviderError(debug) {
  return Boolean(debug && debug.error);
}

function setChatRequestInFlight(isInFlight) {
  chatRequestInFlight = isInFlight;
  submitButton.disabled = isInFlight;
  retryLastMessageButton.disabled = isInFlight;
}

function updateRetryPanel(debug) {
  const shouldShowRetry = Boolean(lastChatRequest && isRetryableProviderError(debug));
  retryPanel.hidden = !shouldShowRetry;
  retryLastMessageButton.disabled = chatRequestInFlight || !shouldShowRetry;
}

function setStickyStatus(text) {
  stickyStatus.textContent = text;
}

function renderDebugStatus(status) {
  debugStatus.textContent = getTopStatusText(status);
  debugAiApi.textContent = getProviderStatus(status);
  debugAiEnabled.textContent = String(status.ai.enabled);
  debugAiProvider.textContent = status.ai.provider;
  debugAiModel.textContent = status.ai.model;
  debugApiKeyPresent.textContent = String(status.ai.apiKeyPresent);
  debugExternalApiCalled.textContent = lastExternalCallStatus;
  debugMessageCount.textContent = String(status.messageCount);
  archiveMessageCount.textContent = String(status.messageCount);
  debugStickyState.textContent = status.stickyNote.exists
    ? `saved (${status.stickyNote.contentLength} chars)`
    : "empty";
  debugStickyUpdated.textContent = status.stickyNote.updated_at || "-";
  debugUsageEventCount.textContent = String(status.usage.eventCount);
}

function renderUsageSummary(summary) {
  const providerSummary = summary.byProvider
    .map((item) => `${item.provider}: ${item.count}`)
    .join(", ");

  usageProvider.textContent = providerSummary || "mock: 0";
  usageEventCount.textContent = String(summary.totalEvents);
  usageAiApi.textContent = "External calls tracked by usage events";
}

function renderModelStatus(metadata) {
  const allowedModels = Array.isArray(metadata.allowedModels) ? metadata.allowedModels : [];
  const warnings = Array.isArray(metadata.warnings) ? metadata.warnings : [];
  const defaultModel = metadata.defaultModel || "";
  const defaultSelection = allowedModels.find((model) => model.id === defaultModel) || allowedModels[0];

  modelMetadata = metadata;
  selectedModelId = selectedModelId || (defaultSelection && defaultSelection.id) || "";

  modelSelect.textContent = "";

  if (!allowedModels.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No models available";
    modelSelect.append(option);
    modelSelect.disabled = true;
  } else {
    allowedModels.forEach((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.label || model.id;
      option.disabled = model.enabled === false;
      modelSelect.append(option);
    });
    modelSelect.disabled = false;
  }

  if (selectedModelId) {
    modelSelect.value = selectedModelId;
  }

  modelSwitchStatus.textContent = metadata.selectedModelSupported
    ? "Selected models are validated server-side before chat."
    : "Model selection is display-only in this build.";
  modelProvider.textContent = metadata.provider || "unknown";
  modelDefault.textContent = defaultModel || "none";
  modelAllowedCount.textContent = String(allowedModels.length);
  modelSelected.textContent = selectedModelId || "none";
  modelSelectedSupported.textContent = String(Boolean(metadata.selectedModelSupported));
  modelDefaultValid.textContent = String(Boolean(metadata.defaultModelValid));
  modelWarnings.textContent = warnings.length ? warnings.join(" | ") : "No model warnings";
}

function renderModelStatusUnavailable() {
  modelMetadata = null;
  selectedModelId = "";
  modelSwitchStatus.textContent = "Model list unavailable";
  modelSelect.textContent = "";

  const option = document.createElement("option");
  option.value = "";
  option.textContent = "Model list unavailable";
  modelSelect.append(option);
  modelSelect.disabled = true;

  modelProvider.textContent = "unavailable";
  modelDefault.textContent = "unavailable";
  modelAllowedCount.textContent = "?";
  modelSelected.textContent = "none";
  modelSelectedSupported.textContent = "false";
  modelDefaultValid.textContent = "unknown";
  modelWarnings.textContent = "Model list unavailable";
}

async function loadModels() {
  try {
    const response = await fetch("/api/models");
    const metadata = await response.json();

    if (!response.ok) {
      throw new Error("Unable to load model list.");
    }

    renderModelStatus(metadata);
    return metadata;
  } catch (error) {
    renderModelStatusUnavailable();
    return null;
  }
}

async function loadDebugStatus() {
  try {
    const response = await fetch("/api/debug/status");
    const status = await response.json();

    if (!response.ok) {
      throw new Error("Unable to load debug status.");
    }

    renderDebugStatus(status);
    return status;
  } catch (error) {
    debugStatus.textContent = "Local backend unavailable";
    debugAiApi.textContent = "unavailable";
    debugAiEnabled.textContent = "false";
    debugAiProvider.textContent = "unavailable";
    debugAiModel.textContent = "unavailable";
    debugApiKeyPresent.textContent = "false";
    debugExternalApiCalled.textContent = lastExternalCallStatus;
    debugMessageCount.textContent = "?";
    archiveMessageCount.textContent = "?";
    debugStickyState.textContent = "unavailable";
    debugStickyUpdated.textContent = "-";
    debugUsageEventCount.textContent = "?";
    return null;
  }
}

async function loadUsageSummary() {
  try {
    const response = await fetch("/api/usage/summary");
    const summary = await response.json();

    if (!response.ok) {
      throw new Error("Unable to load usage summary.");
    }

    renderUsageSummary(summary);
    return summary;
  } catch (error) {
    usageProvider.textContent = "unavailable";
    usageEventCount.textContent = "?";
    usageAiApi.textContent = "Usage summary unavailable";
    return null;
  }
}

async function loadStickyNote() {
  try {
    const response = await fetch("/api/sticky-note");
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Unable to load sticky note.");
    }

    stickyNote.value = data.content || "";
    setStickyStatus(data.updated_at ? "Sticky Note loaded locally" : "Sticky Note ready");
  } catch (error) {
    setStickyStatus("Sticky Note could not load");
  }
}

async function saveStickyNote() {
  const content = stickyNote.value;
  setStickyStatus("Saving Sticky Note...");

  try {
    const response = await fetch("/api/sticky-note", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error("Unable to save sticky note.");
    }

    setStickyStatus("Sticky Note saved locally");
    debugStatus.textContent = "Sticky Note saved locally · Local backend connected";
    await loadDebugStatus();
    await loadUsageSummary();
    return data;
  } catch (error) {
    setStickyStatus("Sticky Note save failed");
    debugStatus.textContent = "Sticky Note save failed · Local backend connected";
    return null;
  }
}

function scheduleStickyNoteSave() {
  setStickyStatus("Sticky Note has local changes");
  window.clearTimeout(stickySaveTimer);
  stickySaveTimer = window.setTimeout(saveStickyNote, 500);
}

async function loadMessageHistory() {
  try {
    resetMessageArea();
    const response = await fetch("/api/messages");
    const messages = await response.json();

    if (!response.ok) {
      throw new Error("Unable to load message history.");
    }

    messages.forEach((message) => {
      appendMessage(message.content, message.role);
    });

    await loadDebugStatus();
  } catch (error) {
    appendMessage("Unable to load local message history.", "system");
    debugStatus.textContent = "Local backend unavailable";
  }
}

async function sendChatRequest({
  message,
  stickyNoteContent,
  selectedModelId: requestedSelectedModelId = selectedModelId || null,
  rememberRequest
}) {
  if (rememberRequest && message.trim()) {
    lastChatRequest = {
      message,
      stickyNote: stickyNoteContent,
      selectedModelId: requestedSelectedModelId || null
    };
  }

  if (message.trim()) {
    appendMessage(message, "user");
  }

  setChatRequestInFlight(true);
  debugStatus.textContent = "Local backend request running";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        stickyNote: stickyNoteContent,
        selectedModelId: requestedSelectedModelId || null
      })
    });

    const data = await response.json();
    showLastChatDebug(data.debug);
    updateRetryPanel(data.debug);

    if (!response.ok) {
      appendMessage(data.error || "The local backend returned an error.", "system");
      debugStatus.textContent = "Local backend returned an error";
      return;
    }

    appendMessage(data.reply, "assistant");
    showPromptPreview(data.debug && data.debug.previewPayload);
    await loadDebugStatus();
    await loadUsageSummary();
  } catch (error) {
    appendMessage("Unable to reach the local backend. Confirm the server is running.", "system");
    debugStatus.textContent = "Local backend unavailable";
    updateRetryPanel(null);
  } finally {
    setChatRequestInFlight(false);
    messageInput.focus();
  }
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = messageInput.value;
  const noteText = stickyNote.value;

  await sendChatRequest({
    message: text,
    stickyNoteContent: noteText,
    rememberRequest: true
  });

  messageInput.value = "";
});

retryLastMessageButton.addEventListener("click", async () => {
  if (!lastChatRequest || chatRequestInFlight) {
    return;
  }

  await sendChatRequest({
    message: lastChatRequest.message,
    stickyNoteContent: lastChatRequest.stickyNote,
    selectedModelId: lastChatRequest.selectedModelId,
    rememberRequest: false
  });
});

clearMessagesButton.addEventListener("click", async () => {
  const confirmed = window.confirm(
    "This will clear local test chat records and preserve the Sticky Note. Continue?"
  );

  if (!confirmed) {
    return;
  }

  clearMessagesButton.disabled = true;
  debugStatus.textContent = "Clearing local test messages · Sticky Note preserved";

  try {
    const response = await fetch("/api/debug/clear-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ confirm: "CLEAR_TEST_MESSAGES" })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to clear messages.");
    }

    resetMessageArea();
    showPromptPreview(null);
    lastChatDebug.textContent = "No chat response yet.";
    renderLastModelValidationSummary(null);
    lastChatRequest = null;
    updateRetryPanel(null);
    debugStatus.textContent = `Cleared ${data.deletedMessages} test messages · Sticky Note preserved`;
    await loadDebugStatus();
    await loadUsageSummary();
  } catch (error) {
    debugStatus.textContent = "Clear test messages failed";
  } finally {
    clearMessagesButton.disabled = false;
  }
});

modelSelect.addEventListener("change", () => {
  selectedModelId = modelSelect.value;
  modelSelected.textContent = selectedModelId || "none";

  if (modelMetadata && !modelMetadata.selectedModelSupported) {
    modelSwitchStatus.textContent = "Model selection is display-only in this build.";
  }
});

stickyNote.addEventListener("input", scheduleStickyNoteSave);

loadStickyNote();
loadModels();
loadMessageHistory();
loadDebugStatus();
loadUsageSummary();

const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "local-ai-lab-starter.sqlite");

fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    feature_type TEXT NOT NULL DEFAULT 'chat'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS usage_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_type TEXT NOT NULL DEFAULT 'chat',
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    mode TEXT NOT NULL,
    input_text_length INTEGER NOT NULL DEFAULT 0,
    sticky_note_length INTEGER NOT NULL DEFAULT 0,
    preview_message_count INTEGER NOT NULL DEFAULT 0,
    reply_length INTEGER NOT NULL DEFAULT 0,
    usage_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertMessageStatement = db.prepare(`
  INSERT INTO messages (role, content, feature_type)
  VALUES (?, ?, ?)
`);

const insertUsageEventStatement = db.prepare(`
  INSERT INTO usage_events (
    feature_type,
    provider,
    model,
    mode,
    input_text_length,
    sticky_note_length,
    preview_message_count,
    reply_length,
    usage_json
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const countMessagesStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM messages
`);

const countUsageEventsStatement = db.prepare(`
  SELECT COUNT(*) AS count
  FROM usage_events
`);

const usageTotalsStatement = db.prepare(`
  SELECT
    COALESCE(SUM(input_text_length), 0) AS inputTextLength,
    COALESCE(SUM(sticky_note_length), 0) AS stickyNoteLength,
    COALESCE(SUM(reply_length), 0) AS replyLength
  FROM usage_events
`);

const usageByProviderStatement = db.prepare(`
  SELECT provider, COUNT(*) AS count
  FROM usage_events
  GROUP BY provider
  ORDER BY count DESC, provider ASC
`);

const usageByFeatureTypeStatement = db.prepare(`
  SELECT feature_type, COUNT(*) AS count
  FROM usage_events
  GROUP BY feature_type
  ORDER BY count DESC, feature_type ASC
`);

const selectRecentUsageEventsStatement = db.prepare(`
  SELECT
    id,
    feature_type,
    provider,
    model,
    mode,
    input_text_length,
    sticky_note_length,
    preview_message_count,
    reply_length,
    usage_json,
    created_at
  FROM (
    SELECT
      id,
      feature_type,
      provider,
      model,
      mode,
      input_text_length,
      sticky_note_length,
      preview_message_count,
      reply_length,
      usage_json,
      created_at
    FROM usage_events
    ORDER BY id DESC
    LIMIT ?
  )
  ORDER BY id ASC
`);

const clearMessagesStatement = db.prepare(`
  DELETE FROM messages
`);

const selectRecentMessagesStatement = db.prepare(`
  SELECT id, role, content, created_at, feature_type
  FROM (
    SELECT id, role, content, created_at, feature_type
    FROM messages
    ORDER BY id DESC
    LIMIT ?
  )
  ORDER BY id ASC
`);

const selectAppStateStatement = db.prepare(`
  SELECT key, value, updated_at
  FROM app_state
  WHERE key = ?
`);

const upsertAppStateStatement = db.prepare(`
  INSERT INTO app_state (key, value, updated_at)
  VALUES (?, ?, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET
    value = excluded.value,
    updated_at = datetime('now')
`);

function addMessage({ role, content, featureType = "chat" }) {
  const result = insertMessageStatement.run(role, content, featureType);

  return {
    id: Number(result.lastInsertRowid),
    role,
    content,
    feature_type: featureType
  };
}

function getRecentMessages(limit = 100) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  return selectRecentMessagesStatement.all(normalizedLimit);
}

function getMessageCount() {
  return countMessagesStatement.get().count;
}

function getUsageEventCount() {
  return countUsageEventsStatement.get().count;
}

function normalizeUsageJson(usageJson) {
  if (usageJson === null || usageJson === undefined) {
    return null;
  }

  return typeof usageJson === "string" ? usageJson : JSON.stringify(usageJson);
}

function insertUsageEvent({
  featureType = "chat",
  provider,
  model,
  mode = "mock",
  inputTextLength = 0,
  stickyNoteLength = 0,
  previewMessageCount = 0,
  replyLength = 0,
  usageJson = null
}) {
  const result = insertUsageEventStatement.run(
    featureType,
    provider,
    model,
    mode,
    inputTextLength,
    stickyNoteLength,
    previewMessageCount,
    replyLength,
    normalizeUsageJson(usageJson)
  );

  return {
    id: Number(result.lastInsertRowid),
    feature_type: featureType,
    provider,
    model,
    mode
  };
}

function getUsageSummary() {
  const totals = usageTotalsStatement.get();

  return {
    mode: "local-only",
    aiApiConnected: false,
    totalEvents: getUsageEventCount(),
    byProvider: usageByProviderStatement.all().map((row) => ({
      provider: row.provider,
      count: row.count
    })),
    byFeatureType: usageByFeatureTypeStatement.all().map((row) => ({
      feature_type: row.feature_type,
      count: row.count
    })),
    totals: {
      inputTextLength: totals.inputTextLength,
      stickyNoteLength: totals.stickyNoteLength,
      replyLength: totals.replyLength
    }
  };
}

function getRecentUsageEvents(limit = 20) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  return selectRecentUsageEventsStatement.all(normalizedLimit);
}

function clearMessages() {
  const beforeCount = getMessageCount();
  clearMessagesStatement.run();
  const remainingMessages = getMessageCount();

  return {
    deletedMessages: beforeCount - remainingMessages,
    remainingMessages
  };
}

function getAppState(key) {
  return selectAppStateStatement.get(key) || null;
}

function setAppState(key, value) {
  upsertAppStateStatement.run(key, value);
  return getAppState(key);
}

function getStickyNote() {
  const row = getAppState("sticky-note");
  return {
    content: row ? row.value : "",
    updated_at: row ? row.updated_at : null
  };
}

function getStickyNoteMetadata() {
  const row = getAppState("sticky-note");
  const content = row ? row.value : "";

  return {
    exists: Boolean(content),
    contentLength: content.length,
    updated_at: row ? row.updated_at : null
  };
}

function saveStickyNote(content) {
  const row = setAppState("sticky-note", content);
  return {
    content: row.value,
    updated_at: row.updated_at
  };
}

module.exports = {
  addMessage,
  clearMessages,
  dbPath,
  getMessageCount,
  getRecentMessages,
  getRecentUsageEvents,
  getStickyNote,
  getStickyNoteMetadata,
  getUsageEventCount,
  getUsageSummary,
  insertUsageEvent,
  saveStickyNote
};

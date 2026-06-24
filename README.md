# local-ai-lab-starter

A local-first AI lab starter for learning provider integration, model switching, prompt/context/memory scaffolding, usage logging, and server-side API key safety.

## Project Summary

`local-ai-lab-starter` is a local-first and self-hostable AI lab starter for developers who want to understand the basic engineering shape of a small AI chat application. It focuses on the wiring between a browser UI, a Node / Express server, prompt construction, model-provider calls, local persistence, and safe debug tooling.

The goal is educational: this project helps you inspect how provider integration, model switching, prompt/context/memory scaffolding, usage logging, provider error handling, and server-side API key safety can fit together in a small codebase.

This is not a production SaaS and not a ChatGPT replacement. It is a readable starter for learning, experimentation, and adaptation.

The default path should be safe for local development: start in mock mode, use fake data, keep provider secrets server-side, and inspect sanitized debug output before connecting any real provider.

## Features

- Node / Express local server
- Static frontend served by the same server
- Mock provider mode for safe local testing
- OpenAI-compatible provider request shape
- OpenRouter-compatible provider example
- Server-side model allowlist
- Model switch validation
- Prompt / context / memory room scaffold
- Sticky note context and recent message context
- SQLite-backed message archive and app state
- Usage event logging
- Provider error guide
- Sanitized debug output
- Manual retry for provider errors
- Server-side API key boundary

## Repository Metadata

Recommended public repository metadata:

- Repository name: `local-ai-lab-starter`
- Description: A local-first AI lab starter for learning provider integration, model switching, prompt/context/memory scaffolding, usage logging, and server-side API key safety.
- Topics: `ai`, `llm`, `ai-chat`, `local-first`, `self-hosted`, `nodejs`, `express`, `sqlite`, `openrouter`, `prompt-engineering`, `model-switching`, `usage-logging`, `starter-template`, `learning-project`

## Architecture Overview

```text
Browser UI
-> Node / Express server
-> Prompt builder
-> Model client
-> AI provider
-> SQLite usage/archive storage
```

The browser can display provider and model status, but it must not hold API keys, tokens, or provider secrets. Provider configuration and actual provider requests belong on the server side.

The server validates model choices against a curated allowlist before using them. The browser may send a selected model id, but it should never send arbitrary provider credentials or free-form provider configuration.

SQLite is used as a small local persistence layer for messages, sticky note state, and usage events. If you deploy this starter remotely, make sure SQLite lives on persistent storage.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start the server with local environment variables:

```bash
node --env-file=.env src/server.js
```

Then open:

```text
http://localhost:3000
```

Do not commit `.env`. Do not put real API keys, tokens, credentials, or private data in public examples, screenshots, logs, or documentation.

## Environment Variables

| Name | Required? | Secret? | Purpose |
| --- | --- | --- | --- |
| `AI_ENABLED` | Yes | No | Enables or disables live provider paths. Use `false` for mock/local mode. |
| `AI_PROVIDER` | Yes | No | Selects the server-side provider mode, such as `mock` or `openrouter`. |
| `AI_MODEL` | Yes | No | Sets the server default model. It should be present in the server-side allowlist. |
| `AI_BASE_URL` | Provider-dependent | No | Base URL for an OpenAI-compatible provider endpoint. |
| `AI_API_KEY` | Live provider only | Yes | Provider API key. Store only in local `.env` or deployment platform secrets. |
| `AI_MAX_OUTPUT_TOKENS` | Recommended | No | Limits model output length. |
| `AI_TEMPERATURE` | Recommended | No | Controls sampling temperature. |
| `PORT` | Deployment-dependent | No | Server port. Local fallback can be `3000`; hosted platforms often inject this. |

`AI_API_KEY` must never be bundled into frontend code, returned in debug payloads, committed to Git, or copied into public docs.

## Provider Modes

### Mock / Disabled Mode

Mock mode is the safest starting point. It lets you test the browser UI, Express routes, prompt preview, SQLite archive, usage logging, and debug panels without calling an external provider.

### OpenAI-Compatible Provider Path

The model client is organized around an OpenAI-compatible chat completions shape:

```json
{
  "model": "example-model-id",
  "messages": [],
  "max_tokens": 800,
  "temperature": 0.7
}
```

Provider-specific code should stay inside the server-side model client. The `/api/chat` route should not directly embed provider-specific request logic.

### OpenRouter-Compatible Example

The starter includes an OpenRouter-style provider example to show how server-side provider configuration can be wired through a model client. Treat provider model lists as curated allowlists, not a full model marketplace.

### Provider Error Handling

Provider errors should be summarized safely. Debug output may show fields such as provider, model, status, and a short sanitized message. It must not show API keys, Authorization headers, raw `.env` content, raw request headers, or unfiltered provider responses.

## Prompt / Context / Memory Rooms

This starter separates AI inputs into conceptual rooms:

- **Prompt Room**: the final model-facing messages payload and prompt preview.
- **Context Room**: the sources selected for the current response, such as sticky note context, recent messages, and the latest user message.
- **Memory Room**: an experimental placeholder for future retrieval or memory work.
- **Archive**: stored chat records, which are not the same thing as a memory retrieval system.

The current memory room is scaffolded only. This project does not claim to provide a complete long-term memory framework, embeddings system, or retrieval engine.

## Usage Logging and Debug Safety

The starter can record usage events such as provider, model, mode, input length, sticky note length, preview message count, reply length, and provider usage metadata when returned.

Useful debug fields include:

- `provider`
- `model`
- `externalApiCalled`
- `selectedModel`
- `actualModelUsed`
- `modelSource`
- `selectionValid`
- sanitized provider error status / message

Debug output should be helpful for development without leaking secrets. API keys, tokens, Authorization headers, raw `.env` contents, and raw provider requests should never be displayed.

## Security Notes

- Never commit `.env`.
- Never expose API keys in the browser.
- Keep provider secrets server-side.
- Use curated model allowlists.
- Validate selected models on the server before use.
- Sanitize provider errors.
- Do not store private deployment secrets in public docs.
- Do not publish SQLite databases, chat archives, usage logs, or screenshots that contain private data.
- Use fake data for smoke tests.

## Deployment Notes

This project is local-first by default, but it can be adapted to remote Node hosting.

Before deploying:

- Configure provider secrets through the hosting platform secret manager.
- Make sure the server listens on the platform-provided port.
- Keep `/health` independent of provider calls.
- Put SQLite on persistent storage if you use SQLite remotely.
- Create a backup and restore plan.
- Add private access control before storing real personal data.

Platform-specific deployment should be configured carefully. Do not publish admin URLs, private routes, provider secrets, or raw deployment inventory in public docs.

## Roadmap

- Cleaner provider abstraction
- More provider examples
- Better prompt/context/memory guides
- Deployment guide
- Backup/restore guide
- Configurable SQLite data path
- Test suite
- Public-safe screenshots

## What This Project Is Not

- Not a production SaaS
- Not a hosted AI service
- Not a ChatGPT replacement
- Not a full memory framework yet
- Not a model marketplace
- Not a complete deployment security solution

## License

License: MIT.

## Application Blurb Draft

`local-ai-lab-starter` is a local-first AI app starter focused on helping developers learn provider integration, model switching, prompt/context/memory scaffolding, usage logging, provider error handling, and server-side API key safety.

It is designed as a readable, self-hostable learning project rather than a production SaaS. The starter emphasizes fake-data testing, sanitized debug output, and a clear separation between browser UI, server-side provider configuration, and local persistence.

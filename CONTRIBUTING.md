# Contributing

## Project Goal

`local-ai-lab-starter` is a learning-oriented starter for local-first AI app architecture, not a production SaaS or hosted AI service.

The project is meant to help developers understand how a small AI chat application can connect a browser UI, a Node / Express server, provider configuration, model selection, prompt/context/memory scaffolding, usage logging, and sanitized debug output.

## What Contributions Are Welcome

Good contribution areas include:

- provider examples
- prompt/context/memory guides
- security boundary improvements
- usage logging improvements
- provider error handling improvements
- deployment docs
- backup/restore docs
- tests
- public-safe screenshots
- documentation cleanup
- small UI clarity improvements

## What Is Out of Scope

Please avoid contributions that turn the starter into:

- a model marketplace
- a hosted AI service
- a production SaaS
- a system for collecting user secrets
- a full production auth system unless intentionally scoped
- a repository containing private deployment data
- a repository containing real provider credentials or private chat data

Large product changes should start with an issue or design discussion before implementation.

## Local Development

Install dependencies:

```bash
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env
```

Run the local server:

```bash
node --env-file=.env src/server.js
```

Use mock mode and fake data when developing or testing changes. Do not use private prompts, private chat logs, private deployment data, or real secrets in examples.

## Security Rules for Contributions

- Never commit `.env`.
- Never commit SQLite databases, archives, logs, or generated local data.
- Never include API keys, tokens, Authorization headers, or raw provider responses.
- Never expose provider secrets to browser code.
- Keep provider configuration server-side.
- Use curated model allowlists instead of free-form browser-submitted provider strings.
- Sanitize provider errors before showing them in UI or logs.
- Use fake data in tests, docs, examples, and screenshots.

## Pull Request Checklist

- [ ] No `.env` or secrets committed
- [ ] No SQLite database / logs / archives committed
- [ ] No API keys, tokens, Authorization headers, or raw provider responses
- [ ] Local syntax checks pass
- [ ] README / docs updated if behavior changes
- [ ] Security boundaries preserved
- [ ] Browser code does not receive provider secrets
- [ ] Examples and screenshots use fake data only

Suggested syntax checks:

```bash
node --check src/config.js
node --check src/server.js
node --check src/modelClient.js
node --check public/app.js
```

## Documentation Style

Documentation should be clear, practical, and public-safe.

Prefer:

- short examples
- fake data
- explicit security boundaries
- plain descriptions of current limitations
- guides that explain why a boundary exists

Avoid:

- private deployment details
- real domains or admin routes
- real usage logs or cost history
- real provider errors that include sensitive context
- claims that the starter is production-ready

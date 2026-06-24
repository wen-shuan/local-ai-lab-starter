# Security Policy

## Supported Versions

This project is a learning-oriented starter. Until releases are tagged, only the latest `main` branch should be considered supported.

## Reporting a Vulnerability

Please open a GitHub security advisory or contact the maintainer through the repository profile.

Do not include secrets, API keys, tokens, Authorization headers, raw provider responses, private prompts, private chat logs, or screenshots containing sensitive data in public issues.

## Secrets and Environment Variables

- Never commit `.env`.
- Never commit real API keys, tokens, passwords, credentials, or private deployment secrets.
- Keep `.env.example` limited to placeholders and safe defaults.
- Use local `.env` files for local experiments only.
- Use deployment platform secrets for hosted environments.

## Provider API Keys

Provider API keys must stay server-side.

The browser may display safe status such as `apiKeyPresent: true`, but it must never receive or render the key value. Provider request headers, Authorization values, and raw environment variables must not appear in frontend code, debug payloads, logs, screenshots, or documentation.

## Debug Output

Debug output should be useful but sanitized.

Allowed debug examples:

- provider name
- model id
- whether an external API call was attempted
- sanitized provider status code
- short sanitized provider error message

Disallowed debug examples:

- API keys
- tokens
- Authorization headers
- raw request headers
- raw `.env` contents
- unfiltered provider responses
- private prompts or private chat logs

## SQLite / Local Data

SQLite databases, local archives, usage logs, and generated local data should not be posted publicly.

Do not attach real database files to issues or pull requests. If a bug requires reproduction data, create a minimal fake-data example instead.

## Deployment Notes

When adapting this starter to remote hosting:

- Store provider secrets in the hosting platform's secret manager.
- Keep persistent data on a private persistent volume or managed database.
- Avoid printing secrets in server logs.
- Add private access control before storing real personal data.
- Do not publish admin URLs, private routes, or deployment inventory that could expose a private environment.

## Scope

This starter is not a production SaaS, hosted AI service, full authentication system, or complete deployment security solution.

Security contributions are welcome when they preserve the learning-oriented scope and improve safe defaults, documentation, validation, or secret-handling boundaries.

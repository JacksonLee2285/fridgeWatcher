# Extraction verification — October 4, 2026

Source: `JacksonLee2285/HomeAi@12f4e857ffe342ffa8d297783dbea2e437f8a9e1`, verified against GitHub commit metadata and the local September 4 checkout. That checkout contains uncommitted UI changes; extraction used committed blobs and left it untouched.

Passed:

- `node --check` on all six server/browser JavaScript files.
- Isolated temporary-file checks: empty initialization, read/write, modification timestamp.
- Mocked service checks: queries leave the document unchanged; modifications replace the full document; malformed JSON/action/document is rejected; the queue recovers after rejection.
- Isolated Express smoke checks: startup, home/chat/state HTML and three CSS/JavaScript routes return 200; state API returns initialized Markdown; blank chat returns 400; an intentionally unreachable Ollama endpoint returns 503.
- Core service, file-store, Ollama client, browser scripts and CSS match the original commit byte-for-byte. Only application branding changed in server/HTML, plus package metadata and new documentation/ignore/sample files.

Checks used Node.js v24.21.0 and the existing source checkout's Express dependencies via `NODE_PATH`, without installing packages or modifying that checkout. Test writes and the smoke-test app used temporary copies, not real inventory.

Not verified:

- Actual model inference: the existing local Ollama HTTP endpoint was not reachable. No model was downloaded or service installed.
- Clean `npm install`: no software installation was performed. The original Express dependency range is preserved and no lockfile is claimed.
- Visual browser interaction and model arithmetic/reliability.

No CI workflow was added. Remote commit/privacy and any existing exact-commit checks are verified separately after the push.

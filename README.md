# fridgeWatcher

A small first experiment integrating a local LLM into an application: ask a freezer guardian about inventory, or tell it what you added or used. The original Korean interface and assistant are preserved.

Extracted from `JacksonLee2285/HomeAi`, commit `12f4e857ffe342ffa8d297783dbea2e437f8a9e1`, September 4, 2026, **Complete local Freezer Gatekeeper V1**. This is the original local Qwen + Markdown version, before the later intent-extraction redesign or Notion integration. This repository starts with fresh history.

## Setup

Requires Node.js with npm, local Ollama, and the exact model **`qwen3.5:2b-q4_K_M`**. No paid API or API key is used by default. Model installation is a separate manual step if it is not already available; it is not performed by this project.

```sh
ollama list
# Only if needed, explicitly download the original model:
ollama pull qwen3.5:2b-q4_K_M
# If Ollama is not already running:
ollama serve
```

In another terminal, from this repository:

```sh
npm install
# Optional: start with clearly synthetic example inventory.
cp data/freezer.example.md data/freezer.md
npm start
```

Without the optional copy, the server creates an empty `data/freezer.md`. Open http://localhost:3000, then the freezer chat or state viewer. The server uses port 3000. Run from the repository root because static assets use a relative directory.

The default Ollama URL is `http://127.0.0.1:11434`. `OLLAMA_URL` and `OLLAMA_MODEL` are the original environment overrides. The original model above is recommended for reproducing this experiment. Environment files are not loaded automatically.

## How it works

- Vanilla HTML/CSS/JavaScript presents the chat and raw Markdown state viewer.
- Express exposes `GET /api/freezer/state` and `POST /api/freezer/chat` with `{ "message": "..." }`.
- Each chat request sends the complete inventory document and the user request to local Ollama. There is no persistent conversation history.
- Qwen returns JSON with `action`, `answer`, and `document`. A query answers from the inventory. A modification returns a complete replacement Markdown document.
- The service serializes requests within one process and checks JSON, action, answer, and the replacement heading. The file store writes through a temporary file and rename.

Runtime source and prompts retain the original design. Packaging changes are repository branding, this README, a synthetic example, and ignoring runtime inventory and local files. Original personal inventory and unrelated history are excluded.

## Known limitations of the original experiment

The small model can misinterpret quantities, invent or remove items, or corrupt unrelated inventory during a full-document rewrite. Validation only checks basic response structure and the heading; it does not verify arithmetic, completeness, or preservation of other items. A plausible but incorrect document can therefore overwrite the inventory. There is no undo or backup feature.

The 1,024-token output limit can truncate larger replacement documents. Each turn includes the full inventory, and the in-process queue can make later requests wait for a slow model call. Multiple server processes or external edits are not coordinated. The state viewer refreshes on page load; chat history disappears on reload.

The original server has no authentication and `app.listen(3000)` does not restrict binding to loopback. This is a local experiment; avoid exposing it to an untrusted network. Runtime inventory is git-ignored to reduce accidental publication. Keep your own backup if you use real inventory.

These shortcomings are intentionally preserved. No Notion integration, model upgrade, deterministic inventory engine, or additional features were added.

## Verification

See `VERIFICATION.md` for the actual checks performed when this extraction was created. Model behavior is only verified when the original model is available locally; passing a mocked response check does not establish model reliability.

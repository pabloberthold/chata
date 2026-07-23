# AI Workspace / Chata

Static SPA (Astro + Svelte 5) for chatting with LLMs via OpenRouter. All persistence is client-side in IndexedDB. No backend.

**Live**: https://pabloberthold.github.io/chata/

## Architecture

```
Astro pages (static SSG)
  └─ Svelte 5 components (hydrated via client:load / client:only)
       ├─ ChatView          — main chat interface
       ├─ SettingsView      — settings (API key, theme, aliases, masks)
       ├─ HistoryView       — conversation list
       ├─ AgentsView        — agent browser
       ├─ ModelsView        — model list from OpenRouter
       ├─ PromptsView       — saved prompts
       ├─ AboutView         — about page
       ├─ Sidebar           — navigation (client:only)
       ├─ Message           — individual chat bubble
       ├─ MessageInput      — text input + send
       ├─ AliasManager      — alias CRUD
       └─ MaskManager       — mask CRUD + test

Services
  ├─ chatService.ts         — send/receive/regenerate messages via pipeline
  ├─ modelService.ts        — fetch & cache model list (3h TTL)
  └─ exportService.ts       — export/import conversations (JSON/MD)

Pipeline (plugin system)
  ├─ Pipeline.ts            — orchestrates plugins by phase (input/output)
  ├─ AliasPlugin.ts         — replace shorthand → real value (input)
  ├─ VariablesPlugin.ts     — template variable substitution (input)
  ├─ MaskPlugin.ts          — hide sensitive data → LLM, restore ← LLM (input+output)
  ├─ PromptPlugin.ts        — inject system prompt + initial prompt (input)
  ├─ MemoryPlugin.ts        — conversation memory management (input)
  ├─ MarkdownPlugin.ts      — markdown rendering (input)
  └─ HighlightPlugin.ts     — syntax highlighting (input)

Providers
  ├─ OpenRouterProvider.ts  — OpenRouter API (chat, listModels, validateKey)
  └─ types.ts               — LLMProvider interface

Storage (IndexedDB via raw API)
  ├─ db.ts                  — generic get/put/del/getAll wrapper
  ├─ conversationStore.ts   — conversations CRUD
  ├─ settingsStore.ts       — app settings (key, theme, model, font, enterToSend)
  ├─ agentStore.ts          — user agents + built-in agent loader
  ├─ aliasStore.ts          — aliases + masks (same file, separate stores)
  └─ promptStore.ts         — saved prompts

Agents
  ├─ definitions/*.json     — 8 built-in agents (linux, devops, openshift, etc.)
  ├─ registry.ts            — in-memory agent registry
  └─ loader.ts              — loads built-in agents on first access
```

## Critical Svelte 5 Constraint

**Svelte 5 `client:load` hydration is fundamentally broken for event handlers.** Native Svelte directives (`onclick`, `onkeydown`, `oninput`, `bind:value`, `onmouseenter`) do **not** work when a component is hydrated via `client:load` in Astro + Svelte 5. This is a known incompatibility.

**All interactive components must use native DOM APIs** in `onMount`:

- `document.getElementById("...")?.addEventListener(...)` — for static elements
- `document.addEventListener("click", (e) => { const btn = e.target.closest("[data-ca]"); ... })` — for dynamic/conditional elements (via `data-ca` attributes)

Exception: `Sidebar.svelte` uses `client:only="svelte"` (fresh mount, no hydration) — event handlers work normally there.

## Data Flow

1. User types message → `MessageInput` dispatches to `ChatView.handleSend()`
2. `chatService.sendMessage()`:
   a. Saves user message to IndexedDB immediately
   b. Runs input through Pipeline (Alias → Variables → Mask → Prompt → Memory)
   c. Sends processed message to OpenRouter API (streaming)
   d. On response, runs output through Pipeline (Mask reverse: masked → original)
   e. Saves assistant message to IndexedDB
   f. Calls onDone with processed content
3. `ChatView` re-renders with new messages

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/*.astro` | Static routes; each embeds a Svelte component |
| `src/components/ChatView.svelte` | Full chat app — conv management, model/agent selection, streaming display |
| `src/services/chatService.ts` | Core send/receive logic, pipeline orchestration |
| `src/plugins/Pipeline.ts` | Plugin registry + ordered execution by phase |
| `src/storage/db.ts` | IndexedDB wrapper (6 stores: conversations, settings, prompts, aliases, masks, agents) |
| `src/providers/OpenRouterProvider.ts` | OpenRouter HTTP streaming client |
| `src/agents/definitions/*.json` | Agent definitions (systemPrompt, initialPrompt, plugins, model) |

## Configuration

- **Astro**: static output, base `/chata`, deployed to GitHub Pages
- **GitHub Actions**: builds `dist/`, deploys via `actions/deploy-pages`
- **Tailwind**: custom design system (`.btn-primary`, `.card`, `.input-field`, `.sidebar-item`, `.prose-custom`)
- **Hot module replacements**: katex, marked, dompurify, highlight.js (inlined via vite `noExternal`)

## Routes

| Route | Component | Page |
|-------|-----------|------|
| `/chata/` | ChatView | Chat (uses `?chat=XXX` query param for conversation) |
| `/chata/settings` | SettingsView | OpenRouter key, theme, aliases, masks |
| `/chata/history` | HistoryView | Past conversations |
| `/chata/agents` | AgentsView | Agent browser |
| `/chata/models` | ModelsView | OpenRouter model list |
| `/chata/prompts` | PromptsView | Saved prompts |
| `/chata/about` | AboutView | About page |

## Message Flow Detail

1. **User message** saved to IndexedDB
2. **Pipeline.processInput** runs plugins with `phase: "input"` in order:
   - Alias (10): `\b${alias}\b` → value
   - Variables (20): `{{var}}` → substitution
   - Mask (30): `original` → `masked` (hide sensitive info)
   - Prompt (5): prepend `initialPrompt` if conversation ≤ 2 messages; set `systemPrompt`
   - Memory (40): context window management
   - Markdown (50): render markdown
   - Highlight (60): apply syntax highlighting
3. **API request** built: system prompt + last 10 messages + processed user input
4. **Streaming response** from OpenRouter
5. **Pipeline.processOutput** runs plugins with `phase: "output"`:
   - Mask (30): `masked` → `original` (restore sensitive info in response)
6. **Assistant message** saved to IndexedDB

## Events (data-ca delegation)

`ChatView` uses document-level event delegation for all interactive elements:

```html
<button data-ca="comenzar">Comenzar</button>
<button data-ca="toggle-model">Model</button>
<button data-ca="select-model" data-model="...">Model option</button>
```

See `onMount` in `ChatView.svelte` for the full switch-case handler.

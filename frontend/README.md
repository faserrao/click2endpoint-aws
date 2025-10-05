# Click2Endpoint Wizard

A prototype wizard-style UI for recommending the correct Click2Mail API endpoint based on a use case.
Built with **React, Vite, TailwindCSS**, and designed for extension with LLM/MCP integrations.

## 🚀 Features
- Dark theme modern UI
- Step-by-step wizard with progress bar
- Animated transitions between steps
- Endpoint recommendation result card
- JWT example snippet + expandable JSON payload example
- SDK code generation (Python, JavaScript, cURL)
- **Live code execution** - run generated code directly in the browser
- Configurable endpoint map (`src/data/endpointMap.ts`)

## 🛠️ Setup

### Install dependencies
```bash
npm install
```

### Run development servers
```bash
# Run both frontend and backend
npm run dev:all

# Or run separately:
npm run dev     # Frontend on http://localhost:5173
npm run server  # Backend on http://localhost:3001
```

Visit 👉 http://localhost:5173

## 📖 For AI Assistants (Claude Code, ChatGPT, etc.)
- Specs → `docs/UI_SPEC.md`
- Endpoint examples → `docs/ENDPOINT_SAMPLES.md`
- Entry point → `src/App.tsx`

👉 Always check the spec docs first before editing components.

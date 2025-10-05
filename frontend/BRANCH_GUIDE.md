# Click2Endpoint React - Branch Guide

## Branch Structure

### `phase1-ux-only` Branch ✅
**Purpose**: Clean version with ONLY Phase 1 UX improvements (no NLP/AI)

**What's Included:**
- Original wizard functionality
- Mock server configuration
- Client credentials authentication
- Three-panel result layout
- Parameter collection forms
- Code generation (Python/JS/cURL)
- Execution capability

**What's NOT Included:**
- No AI-assisted mode
- No NLP service
- No OpenAI integration
- No audit logging
- No AI suggestion badges

**Use This Branch When:**
- You want the stable, working version without AI features
- Testing basic endpoint discovery functionality
- Demonstrating the core wizard flow

**GitHub**: https://github.com/faserrao/click2endpoint-react/tree/phase1-ux-only

---

### `feature/nlp-ai-integration` Branch 🚧
**Purpose**: Active development of NLP/AI features (Phase 1 of NLP implementation)

**What's Included (or will be):**
- Everything from `phase1-ux-only` branch
- AI-assisted mode with natural language input
- OpenAI GPT-4 integration for endpoint suggestion
- AI suggestion badges (🤖) in wizard
- Confidence scores and reasoning display
- Local audit logging (accuracy tracking)
- Audit statistics dashboard
- Export functionality

**Current Status**: In development (80% complete)

**Remaining Tasks:**
- Complete audit stats integration
- Final testing
- Documentation

---

### `main` Branch
**Purpose**: Latest stable release

**Current State**: Same as `phase1-ux-only` (pre-NLP)

**Next Merge**: Once `feature/nlp-ai-integration` is complete and tested

---

## How to Switch Branches

### Get Phase 1 Only (No AI):
```bash
git checkout phase1-ux-only
npm install
npm run dev:all
```

### Get NLP/AI Development Version:
```bash
git checkout feature/nlp-ai-integration
npm install
npm run dev:all
```

### Get Latest Stable:
```bash
git checkout main
npm install
npm run dev:all
```

---

## Feature Comparison

| Feature | phase1-ux-only | feature/nlp-ai-integration | main |
|---------|---------------|---------------------------|------|
| Wizard Q&A | ✅ | ✅ | ✅ |
| Endpoint Discovery | ✅ | ✅ | ✅ |
| Code Generation | ✅ | ✅ | ✅ |
| Mock Server Integration | ✅ | ✅ | ✅ |
| Parameter Forms | ✅ | ✅ | ✅ |
| AI-Assisted Mode | ❌ | ✅ | ❌ |
| OpenAI Integration | ❌ | ✅ | ❌ |
| NLP Use Case Parsing | ❌ | ✅ | ❌ |
| AI Suggestion Badges | ❌ | ✅ | ❌ |
| Audit Logging | ❌ | ✅ | ❌ |
| Accuracy Tracking | ❌ | ✅ | ❌ |

---

## Development Workflow

1. **Phase 1 Only Changes** → Make changes in `phase1-ux-only`
2. **NLP/AI Features** → Make changes in `feature/nlp-ai-integration`
3. **Testing** → Test both branches independently
4. **Merge to Main** → When stable, merge to `main`

---

**Last Updated**: 2025-10-03
**Maintained By**: Frank Serrao + Claude Code

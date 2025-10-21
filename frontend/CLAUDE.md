# Click2Endpoint React - Project Context

## Project Overview
Interactive wizard that helps technical users (developers, integration engineers) find the perfect C2M API endpoint for their document submission needs. Migrated from Streamlit to React for better UX and deployment flexibility.

**Target Audience:** Developers and integration engineers who need to understand API endpoints and generate production-ready code.

**Repository:** https://github.com/faserrao/click2endpoint-react
**Deployed:** https://click2endpoint-react.vercel.app (phase1-ux-improvements branch)
**Location:** `~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/click2endpoint/click2endpoint-react/`

**Note:** A separate AI-powered app for business users may be developed in the future with natural language input and simplified UX.

---

## Branch Strategy

### Current Branches

1. **`original`** - Initial Streamlit migration
   - Base React/TypeScript/Vite setup
   - 8 endpoint mappings
   - Basic wizard flow
   - Code generation (Python/JS/cURL)
   - Local Express server for execution

2. **`phase1-ux-improvements`** - UX enhancements (DEPLOYED TO VERCEL)
   - Next/Back navigation buttons
   - Settings modal for credentials
   - Brighter credentials reminder card (yellow/orange gradient)
   - Mock server integration
   - Parameter collection forms
   - Three-panel layout (Result, Code Generator, Execution Output)

3. **`phase2-nlp-ai`** - AI/NLP features (DEVELOPMENT ONLY)
   - OpenAI GPT-4o-mini integration
   - Natural language use case parsing
   - AI suggestion badges in wizard
   - Feedback collection system
   - Audit logging (localStorage)
   - **Not for production deployment** - just R&D

4. **`phase3-aws-backend`** - AWS integration (PLANNED)
   - Reuse c2m-api-v2-security authentication service
   - Vercel serverless functions (replace local Express server)
   - Real AWS Cognito authentication
   - Production-ready security
   - Will replace phase1 when complete
   - See: `PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md`

---

## Key Architecture

### Current (Phase 1 - Deployed)
```
User → React Frontend (Vercel) → Local Express Server → Mock Server
                                   (localhost:3001)
```

### Target (Phase 3 - Production Architecture)
```
User Login → Cognito (per-user account) → JWT Token
                                              ↓
User → React Frontend (S3 + CloudFront) → C2M API (API Gateway + Lambda)
       (static site, no backend)            (direct browser call with user JWT)
```

**Key Points:**
- **No Click2Endpoint backend** - Pure static site (S3 + CloudFront only)
- **User authentication** - Each user has their own Cognito account (not shared credentials)
- **Direct API calls** - Browser calls C2M API directly with user's JWT token
- **No double-hopping** - Avoids unnecessary Lambda → Lambda calls
- **Mock server note** - Mock server doesn't require authentication, but production API will

---

## Test Credentials

### Phase 1 (Current - Mock Server)
- **Client ID:** `test-client-123`
- **Client Secret:** `super-secret-password-123` (WRONG for AWS)
- **Mock Server:** `https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io`
- **Note:** Auth endpoints return 401 (mock doesn't have auth implementation)

### Phase 3 (AWS - Correct Credentials)
- **Client ID:** `test-client-123`
- **Client Secret:** `test-secret-456` (CORRECT for AWS Cognito)
- **Auth URL:** `https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/`
- **Source:** c2m-api-v2-security repo `.env` file

---

## Environment Variables

### Development (`.env.local`)
```bash
# Mock Server
VITE_DEFAULT_MOCK_URL=https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io

# Postman API (optional - for mock server discovery)
VITE_POSTMAN_API_KEY_PERSONAL=
VITE_POSTMAN_API_KEY_TEAM=

# OpenAI (phase2 only)
VITE_OPENAI_API_KEY=sk-proj-...
```

### Vercel (Production - Phase 1)
- `VITE_POSTMAN_API_KEY_PERSONAL` - Set to your Postman personal API key
- `VITE_POSTMAN_API_KEY_TEAM` - Set to your Postman team API key (optional)
- No OpenAI key needed (phase2 not deployed)

### AWS (Production - Phase 3)
- `VITE_AUTH_BASE_URL` - AWS auth endpoint
- `VITE_API_BASE_URL` - Production API URL (when available)
- No client credentials (handled server-side in Lambda functions)
- Hosted on S3 + CloudFront (not Vercel)

---

## Port Allocation

- **5173** - Vite dev server (React frontend)
- **3001** - Express server (code execution)
- **3002** - Reserved for future backend services

Registered in: `/Users/frankserrao/Dropbox/Customers/stellario/projects/services`

---

## Key Files & Locations

### Configuration
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript settings
- `package.json` - Dependencies and scripts
- `.env.local` - Local environment variables (gitignored)

### Core Components
- `src/App.tsx` - Main application, routing, state management
- `src/components/QuestionCard.tsx` - Wizard question UI
- `src/components/ResultCard.tsx` - Endpoint recommendation display
- `src/components/CodeGenerator.tsx` - Python/JS/cURL code generation
- `src/components/ExecutionOutput.tsx` - Code execution results
- `src/components/ParameterCollector.tsx` - Dynamic parameter forms
- `src/components/SettingsModal.tsx` - Configuration UI (phase1+)
- `src/components/AIInput.tsx` - Natural language input (phase2 only)
- `src/components/AIFeedback.tsx` - AI feedback collection (phase2 only)

### Services
- `src/services/authService.ts` - AWS Cognito authentication (phase3)
- `src/services/postmanApi.ts` - Mock server discovery
- `src/services/nlpService.ts` - OpenAI integration (phase2 only)
- `src/utils/settings.ts` - localStorage settings management
- `src/utils/codeGenerators.ts` - Code template generation

### Data
- `src/data/questions.ts` - Wizard questions and decision tree
- `src/data/endpointMap.ts` - 8 endpoint configurations
- `src/data/ebnfSchemas.ts` - Parameter schemas for forms

### Backend
- `server.js` - Express server for code execution (phase1 only - temporary)
- `lambda/execute-code.ts` - AWS Lambda function (phase3 - planned)

### Documentation
- `ARCHITECTURE_DECISIONS.md` - Key architectural decisions and rationale (NEW)
- `PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md` - Phase 3 implementation guide
- `PHASE3_SETUP_GUIDE.md` - Step-by-step setup instructions for Phase 3
- `TEMPLATE_CONTENT_BUSINESS_RULE.md` - Template content business rule documentation
- `C2M_API_V2_REPOSITORY_ARCHITECTURE.md` - Comprehensive 5-repository architecture guide
- `README.md` - Project overview and setup
- `click2endpoint-react-claude.log` - Session log

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start dev server (Vite + Express)
npm run dev:all

# Or run separately
npm run dev        # Vite only (port 5173)
node server.js     # Express only (port 3001)
```

### Build & Deploy
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
git push origin phase1-ux-improvements  # Auto-deploys
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check
```

---

## Recent Changes

### 2025-10-11 - Authentication Consolidation Decision - MAJOR ARCHITECTURE CHANGE ✅

**BREAKING CHANGE: Local Cognito Will Be Removed**

Decision made to consolidate ALL authentication into c2m-api-v2-security as the unified auth service. This will significantly change how click2endpoint-aws authenticates users.

#### What's Changing
- ❌ **Remove**: Local Cognito User Pool (currently: us-east-1_4fNSSRaag)
- ❌ **Remove**: AWS Amplify authentication
- ❌ **Remove**: Hardcoded credentials (test-client-123 / test-secret-456)
- ✅ **Add**: Call c2m-api-v2-security API for user login
- ✅ **Add**: Auto-fetch user credentials after login
- ✅ **Add**: Per-user credential isolation (each user gets unique clientId/clientSecret)

#### New Authentication Flow (After Consolidation)
```
1. User enters username/password
   ↓
2. Frontend calls: POST https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/user/login
   ↓
3. Receives JWT user token
   ↓
4. Frontend calls: GET /auth/user/credentials (with JWT)
   ↓
5. Receives user's unique clientId/clientSecret
   ↓
6. Auto-populate Settings modal (no manual entry)
   ↓
7. Code generation uses user's credentials
```

#### Implementation Timeline
- **Phase 1** (Week 1): c2m-api-v2-security infrastructure setup
  - Add Cognito User Pool for humans
  - Add UserCredentials DynamoDB table
  - Add Lambda functions: user-login, get-credentials
  - Add API endpoints: /auth/user/login, /auth/user/credentials

- **Phase 2** (Week 2): User migration
  - Export users from local Cognito
  - Create in security repo Cognito
  - Generate unique credentials per user

- **Phase 3** (Week 3): **click2endpoint-aws integration** ← THIS REPO
  - Remove CognitoStack from CDK
  - Replace authService.ts (remove Amplify, use fetch)
  - Update SettingsModal (read-only credentials display)
  - Remove hardcoded DEFAULT_CLIENT_ID/SECRET
  - Update environment variables

- **Phase 4** (Week 4): Testing & documentation
- **Phase 5** (Week 5): Production deployment

#### Files That Will Change (Phase 3)
1. `cdk/lib/cognito-stack.ts` - DELETE (remove entire stack)
2. `cdk/lib/cdk-stack.ts` - Remove Cognito stack reference
3. `frontend/src/services/amplifyAuth.ts` - Complete rewrite (use fetch, not Amplify)
4. `frontend/src/components/SettingsModal.tsx` - Show fetched credentials (read-only)
5. `frontend/src/utils/codeGenerators.ts` - Remove DEFAULT_CLIENT_ID/SECRET constants
6. `frontend/.env.local` - Remove VITE_COGNITO_* vars, add VITE_AUTH_SERVICE_URL

#### Benefits After Consolidation
- ✅ No more hardcoded credentials
- ✅ Each user gets unique clientId/clientSecret
- ✅ Credentials auto-fetched after login
- ✅ Single authentication service for entire ecosystem
- ✅ Easy credential rotation per user
- ✅ Production-ready security architecture

#### Related Documents
- `AUTHENTICATION_CONSOLIDATION_PLAN.md` - Complete 5-week implementation plan
- `CURRENT_AUTHENTICATION_FLOW_DIAGRAM.md` - AS-IS state with diagrams
- `AUTHENTICATION_INFRASTRUCTURE_COMPARISON.md` - Detailed comparison

#### Status
- ⏳ **Planning complete** - Awaiting approval to start Phase 1
- ⏳ **Phase 3 work** (this repo) - Estimated 1 week after Phase 2 completes
- ⏳ **No code changes yet** - Current authentication still works

---

### 2025-10-05 - Phase 3 Continuation: Business Rules & Architecture Documentation
- ✅ Implemented template content business rule (mutually exclusive constraint)
  - Added `templateContent` question to decision tree (addressList/document/neither)
  - Modified `ParameterCollector.tsx` to accept `wizardAnswers` prop
  - Implemented parameter filtering logic (hide addressListId or documentSourceIdentifier)
  - Updated `ResultCard.tsx` to pass wizard answers down to ParameterCollector
  - Created `TEMPLATE_CONTENT_BUSINESS_RULE.md` comprehensive documentation
- ✅ Created repository architecture documentation
  - Created `C2M_API_V2_REPOSITORY_ARCHITECTURE.md` (50+ page comprehensive guide)
  - Documented all 5 repositories (c2m-api-repo, c2m-api-artifacts, c2m-api-v2-security, click2endpoint-react, find-objects-in-scenarios)
  - Included integration points, data flow diagrams, deployment architecture
  - Added c2m-api-artifacts details (GitHub-only, CI/CD output storage)
- ✅ Created setup guide
  - Created `PHASE3_SETUP_GUIDE.md` with step-by-step instructions
  - Documented current blockers, testing checklists, architecture diagrams
- ✅ Updated mock server URL
  - Changed default to `https://a0711c27-f596-4e45-91bb-2a7a7a16c957.mock.pstmn.io`
  - Updated both `.env.example` and `.env.local`
- ✅ Committed and pushed all Phase 3 changes to GitHub (phase3-aws-backend branch)
  - 12 files changed, 2,068 insertions, 22 deletions
  - Comprehensive commit message describing all Phase 3 work

### 2025-10-04 (Evening) - Phase 3 AWS Backend Implementation Started
- ✅ Created `src/services/authService.ts` with AWS Cognito integration
  - Two-token flow (long-term 30-90 days → short-term 15 min)
  - sessionStorage for token caching (more secure than localStorage)
  - Automatic token refresh with expiry checking
  - Test connection functionality
- ✅ Updated `src/utils/codeGenerators.ts`
  - Fixed AUTH_BASE_URL to include `/auth` suffix
  - Updated default credentials: `test-secret-456` (AWS correct)
- ✅ Updated `src/components/AuthCredentials.tsx`
  - Changed default secret to `test-secret-456`
- ✅ Enhanced `src/components/SettingsModal.tsx`
  - Added "Test Connection" button with loading/success/error states
  - Status indicator with color-coded messages
  - Icon indicators (CheckCircle/XCircle/Loader)
- ✅ Updated environment variables
  - `.env.example` - Added VITE_DEFAULT_CLIENT_ID/SECRET
  - `.env.local` - Updated AUTH_BASE_URL with `/auth` suffix

### 2025-10-04 (Afternoon) - Phase 2 NLP/AI & Phase 3 Planning
- ✅ Created `nlpService.ts` with OpenAI GPT-4o-mini integration
- ✅ Created `AIInput.tsx` for natural language use case parsing
- ✅ Added AI suggestion badges to wizard (sparkle icons)
- ✅ Created `AIFeedback.tsx` for thumbs up/down feedback
- ✅ Implemented audit logging in localStorage
- ✅ Fixed import path bugs, model name, handleComplete crash
- ✅ Environment variable auto-loading from `.env.local`
- ✅ Made credentials reminder card more noticeable (yellow/orange gradient)
- ✅ Changed icon from gear to ⚠️ for urgency
- ✅ Added glowing border and high-contrast button
- ✅ Pushed phase1-ux-improvements to Vercel
- ✅ Created `PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md`
- ✅ Decided to reuse c2m-api-v2-security service
- ✅ Discovered correct AWS test credentials
- ✅ Planned 3-week implementation timeline

---

## Known Issues

### Phase 1 (Deployed)
- ❌ Deployed app has wrong credentials in localStorage (user must clear/update manually)
- ❌ Mock server auth endpoints return 401 (expected - no auth implementation)
- ⚠️ Postman API keys exposed in frontend (acceptable for demo, not for production)
- ⚠️ Local Express server required for code execution (not cloud-based)

### Phase 2 (Development)
- ⚠️ OpenAI API key exposed in frontend (not secure for production)
- ⚠️ AI suggestion badges sometimes don't show (timing issue with state)
- ⏳ Need to validate AI accuracy with more test cases

### Phase 3 (Planned)
- ⏳ Not implemented yet
- ⏳ Need to create Vercel serverless functions
- ⏳ Need to implement secure token storage
- ⏳ Need to sandbox code execution

---

## Next Steps

### Immediate (Optional)
- [ ] Test Phase 2 AI features with more use cases
- [ ] Improve AI prompt for better accuracy
- [ ] Add rate limiting to OpenAI calls

### Phase 3 Implementation (In Progress)
- [✅] Create `authService.ts` with AWS Cognito integration
- [✅] Fix credential defaults to use `test-secret-456`
- [✅] Add Test Connection UI to Settings modal
- [✅] Update environment variables configuration
- [✅] Implement template content business rule (mutually exclusive addresses/documents)
- [✅] Create comprehensive setup and architecture documentation
- [✅] Update mock server URL to new default
- [✅] Commit and push Phase 3 changes to GitHub
- [✅] Document architecture decisions (ARCHITECTURE_DECISIONS.md)
- [ ] Add Cognito Hosted UI login integration
- [ ] Replace hardcoded credentials with Cognito user authentication
- [ ] Remove server.js - implement direct browser API calls
- [ ] Update ExecutionOutput component to call C2M API directly
- [ ] Set up S3 + CloudFront for static frontend hosting
- [ ] Configure custom domain (optional)
- [ ] Test with real Cognito user accounts
- [ ] Deploy to AWS and sunset Phase 1 (Vercel)

**Note:** No Lambda/API Gateway needed for Click2Endpoint - pure static site

---

## Related Projects

### c2m-api-v2-security
- **Purpose:** AWS Cognito authentication service
- **Location:** `~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-v2-security/`
- **Auth URL:** `https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/`
- **Stack:** C2MCognitoAuthStack-dev
- **Credentials:** test-client-123 / test-secret-456

### c2m-api-repo
- **Purpose:** Main C2M API specification and Postman collections
- **Location:** `~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-repo/`
- **Mock Server:** `https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io`
- **Reference:** JWT authentication script at `postman/scripts/jwt-pre-request.js`

---

## Deployment Strategy

### Phase 1 (Current - Temporary)
- Deployed to Vercel from `phase1-ux-improvements` branch
- Auto-deploys on push to this branch
- **Temporary demo only** - will be discontinued once Phase 3 is ready

### Phase 2 (Never Deploy)
- Development/research only
- Contains OpenAI integration (not production-ready)
- Security concerns with API key exposure

### Phase 3 (Future Production)
- Will replace Phase 1 deployment
- **NOT hosted on Vercel** - will be hosted on AWS infrastructure
- **Frontend:** S3 + CloudFront (static React app - NO backend needed)
- **Auth:** Cognito user accounts (each user has their own login)
- **API Calls:** Direct from browser to C2M API (no Click2Endpoint backend)
- **Code Execution:** Browser makes API calls directly with user's JWT
- Production-ready security (user-specific credentials, not shared)

**Phase 2 NLP/AI Features:**
- Not included in Phase 3 (Click2Endpoint remains manual wizard)
- May become separate app for business users in the future
- If deployed, would require: API Gateway + Lambda + OpenAI integration

---

## Important Notes

1. **Branch Independence:** All three feature branches (phase1, phase2, phase3) are independent
2. **Credentials Mismatch:** Phase 1 uses wrong secret (`super-secret-password-123` vs `test-secret-456`)
3. **Production Timeline:** Phase 3 estimated at 3 weeks when implementation starts
4. **Security:** Phase 1 and 2 are NOT production-ready security-wise
5. **User Storage:** localStorage used for settings (clear if credentials wrong on deployed app)
6. **Hosting Change:** Phase 3 will NOT use Vercel - moving to AWS (S3 + CloudFront only)
7. **No Backend Needed:** Phase 3 is pure static site (no API Gateway or Lambda for Click2Endpoint)
8. **User Authentication:** Production uses per-user Cognito accounts (not shared credentials)
9. **Mock Server:** Doesn't require authentication (production API will)
10. **AI Features:** Phase 2 NLP/AI may become separate app for business users (future)

---

## Contact & Resources

- **GitHub:** https://github.com/faserrao/click2endpoint-react
- **Vercel:** https://click2endpoint-react.vercel.app
- **AWS Auth Service:** https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/
- **Documentation:** See `PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md` for Phase 3 details

---

**Last Updated:** 2025-10-05
**Current Branch:** phase3-aws-backend (implementation in progress)
**Status:** Phase 1 deployed on Vercel (temporary), Phase 2 complete (not deployed), Phase 3 architecture finalized (S3/CloudFront only - no backend)
**Hosting:** Phase 1 = Vercel (temporary), Phase 3 = AWS S3 + CloudFront (production)
**Architecture:** Pure static site with Cognito user authentication and direct browser API calls

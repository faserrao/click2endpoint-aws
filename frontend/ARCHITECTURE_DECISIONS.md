# Click2Endpoint Architecture Decisions

## Overview
This document captures key architectural decisions made during the development of Click2Endpoint React application.

**Last Updated:** 2025-10-05

---

## Decision 1: Phase 3 - No Backend for Click2Endpoint

### Context
Initially planned to use API Gateway + Lambda for Click2Endpoint backend to proxy API calls and hide credentials.

### Investigation
- Tested mock server - **does NOT require authentication**
- Discovered production will use **per-user Cognito accounts** (not shared credentials)
- Realized browser can call C2M API directly with user's JWT token

### Decision
**Phase 3 will be pure static site (S3 + CloudFront only) with NO backend**

### Rationale
1. **No secrets to hide** - Users authenticate with their own Cognito accounts
2. **Avoid double-hopping** - Browser → Lambda #1 → Lambda #2 is wasteful
3. **Lower latency** - Direct browser calls are faster
4. **Lower cost** - No Lambda invocations for Click2Endpoint
5. **Simpler architecture** - Fewer moving parts, easier to maintain
6. **Standard pattern** - How Cognito SPAs normally work

### Implementation
```
User Login → Cognito → User JWT Token
                          ↓
Browser (S3 + CloudFront) → C2M API (with user JWT)
```

**What gets removed:**
- ❌ API Gateway for Click2Endpoint
- ❌ Lambda functions for Click2Endpoint
- ❌ server.js Express server
- ❌ Hardcoded shared credentials

**What gets added:**
- ✅ Cognito login UI
- ✅ User account management
- ✅ Direct browser API calls with user JWT

---

## Decision 2: Two-App Strategy (Click2Endpoint vs AI Assistant)

### Context
Phase 2 implemented NLP/AI features for natural language use case parsing. Question arose: should this be in Phase 3?

### Decision
**Keep Click2Endpoint as manual wizard. Create separate AI app for business users if/when needed.**

### Rationale

#### Click2Endpoint (Technical Users)
- **Audience:** Developers, integration engineers
- **Need:** Understand API structure, generate production code
- **Features:** Manual Q&A wizard, parameter forms, code generation
- **Architecture:** S3 + CloudFront only (no backend)
- **Complexity:** Low
- **Cost:** Minimal (just static hosting)

#### AI Assistant (Business Users) - Future App
- **Audience:** Non-technical business users
- **Need:** Simple natural language → automatic API calls
- **Features:** NLP parsing, AI suggestions, simplified UX
- **Architecture:** S3 + CloudFront + API Gateway + Lambda + OpenAI
- **Complexity:** High
- **Cost:** Higher (OpenAI API calls, Lambda invocations)

### Benefits of Separation
1. **Targeted UX** - Different interfaces optimized for different audiences
2. **Independent deployment** - Can iterate on each app separately
3. **Cost optimization** - Only pay for AI when business users need it
4. **Simpler Click2Endpoint** - Faster to deploy Phase 3
5. **Clear separation of concerns** - Technical tool vs business tool

---

## Decision 3: Authentication Architecture

### Context
Multiple authentication patterns were considered:
1. Hardcoded shared credentials (Phase 1 demo)
2. User-provided credentials in UI (insecure)
3. Backend proxy to hide credentials
4. Direct Cognito user authentication

### Decision
**Production will use direct Cognito user authentication (standard OAuth/OIDC flow)**

### Rationale
1. **Industry standard** - How web apps normally authenticate with Cognito
2. **Secure** - Each user has their own credentials (not shared)
3. **No secrets in frontend** - User logs in, gets JWT, uses it
4. **No backend needed** - Standard browser OAuth flow
5. **Scalable** - Works for any number of users

### Authentication Flow
```
1. User visits Click2Endpoint
2. Redirected to Cognito login page
3. User authenticates with their credentials
4. Cognito returns JWT token to browser
5. Browser stores token (sessionStorage)
6. Browser uses token for all C2M API calls
7. Token expires → automatic refresh or re-login
```

### Phase 1 (Current)
- **Hardcoded credentials** - test-client-123 / super-secret-password-123
- **Purpose:** Demo/testing only
- **Security:** NOT production-ready
- **Will be removed** in Phase 3

### Phase 3 (Production)
- **Per-user Cognito accounts** - Each user registers/logs in
- **User-specific JWTs** - Tokens tied to individual users
- **Security:** Production-ready
- **Standard OAuth flow** - Industry best practice

---

## Decision 4: Mock Server Authentication

### Context
Code generators include full JWT authentication flow. Question: does mock server require auth?

### Investigation
Tested mock server directly:
```bash
curl -X POST "https://a0711c27-f596-4e45-91bb-2a7a7a16c957.mock.pstmn.io/jobs/single-doc-job-template" \
  -H "Content-Type: application/json" \
  -d '{...payload...}'
```

**Result:** ✅ Success - returns mock response **without any authentication**

### Decision
**Mock server does NOT require authentication. Production API will.**

### Implications
1. **Development/testing** - Can test endpoints without auth complexity
2. **Code generation** - Include auth by default (for production readiness)
3. **UI option** - Could add toggle: "Include authentication" (default: yes)
4. **Documentation** - Clarify that mock = no auth, production = auth required

### Generated Code Behavior
- **Default:** Includes full JWT auth flow (production-ready)
- **Mock server:** Works anyway (ignores auth headers)
- **Production API:** Requires auth (will fail without JWT)

---

## Decision 5: Code Execution Location

### Context
Three options for where to execute generated code:
1. Local Express server (current Phase 1)
2. Lambda backend proxy
3. Direct from browser

### Decision
**Phase 3: Execute directly from browser (remove server.js)**

### Rationale
1. **User has JWT** - Already authenticated via Cognito
2. **No secrets to hide** - User's token is already in browser
3. **CORS enabled** - C2M API allows browser requests
4. **Simpler** - No backend to maintain
5. **Faster** - No server round-trip

### Implementation
```typescript
// In browser - no backend needed
const executeCode = async (endpoint: string, payload: any, userJwt: string) => {
  const response = await fetch(`${C2M_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userJwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
};
```

**What changes:**
- ✅ Remove server.js Express server
- ✅ Remove /api/execute endpoint
- ✅ Add direct fetch() calls from React components
- ✅ Use user's JWT from Cognito login

---

## Decision 6: Template Content Business Rule

### Context
Discovered business rule: Templates can contain EITHER address list OR document, but NOT both.

### Decision
**Implement parameter filtering based on template content selection**

### Implementation
1. Added `templateContent` question to wizard (addressList/document/neither)
2. Modified `ParameterCollector` to accept `wizardAnswers` prop
3. Implemented filtering logic:
   - If template contains address list → hide `addressListId` parameter
   - If template contains document → hide `documentSourceIdentifier` parameter
4. Updated `ResultCard` to pass wizard answers to ParameterCollector

### Documentation
Created `TEMPLATE_CONTENT_BUSINESS_RULE.md` with comprehensive details.

---

## Future Considerations

### AI Assistant App (If Built)
If AI features are deployed as separate app:

**Architecture:**
```
Browser → API Gateway → Lambda → OpenAI API
                      → Lambda → DynamoDB (audit logs)

Browser (with AI suggestions) → C2M API (direct call with user JWT)
```

**Requirements:**
- API Gateway + Lambda (for OpenAI calls)
- Secrets Manager (OpenAI API key)
- DynamoDB (audit logs, feedback data)
- S3 + CloudFront (static frontend)

**Cost Considerations:**
- OpenAI API usage (per request)
- Lambda invocations (AI processing)
- DynamoDB storage (audit logs)

### Production API Deployment
When C2M production API is deployed:

**Updates needed:**
- Environment variable: `VITE_C2M_API_URL` (production endpoint)
- Update endpoint paths if different from mock
- Test CORS configuration
- Verify JWT validation works

### Multi-tenancy
If supporting multiple organizations:

**Considerations:**
- Organization-specific Cognito user pools?
- Organization ID in JWT claims?
- Rate limiting per organization?
- Audit logging with org context?

---

## Architecture Comparison

### Phase 1 (Current - Vercel Demo)
```
Browser → Vercel Frontend → Local Express Server → Mock Server
          (hardcoded creds)  (localhost:3001)       (no auth)
```
- ✅ Quick demo
- ❌ Not production-ready
- ❌ Insecure credentials
- ❌ Requires local server

### Phase 3 (Production - AWS)
```
Browser → Cognito Login → JWT Token
              ↓
Browser → S3 + CloudFront → C2M API
          (static only)     (direct call with JWT)
```
- ✅ Production-ready security
- ✅ Scalable (static site)
- ✅ Low cost (no backend)
- ✅ Low latency (direct calls)
- ✅ Industry standard pattern

### Future: AI Assistant (Separate App)
```
Browser → Cognito Login → JWT Token
              ↓
Browser → S3 + CloudFront
              ↓
Browser → API Gateway → Lambda → OpenAI (AI features)
                              → DynamoDB (audit logs)
              ↓
Browser → C2M API (direct call with JWT)
```
- ✅ Natural language input
- ✅ Business user friendly
- ✅ Learning feedback loop
- ❌ Higher complexity
- ❌ Higher cost (AI calls)

---

## Key Takeaways

1. **Click2Endpoint = Static Site** - No backend needed for Phase 3
2. **Per-User Authentication** - Cognito accounts (not shared credentials)
3. **Direct API Calls** - Browser → C2M API (no proxy)
4. **Mock Server** - Doesn't require auth (production will)
5. **AI Features** - Separate app for business users (future)
6. **Simple Architecture** - S3 + CloudFront + Cognito only

---

## References

- **c2m-api-v2-security:** Cognito auth service (shared across apps)
- **PHASE3_SETUP_GUIDE.md:** Phase 3 implementation steps
- **TEMPLATE_CONTENT_BUSINESS_RULE.md:** Parameter filtering logic
- **C2M_API_V2_REPOSITORY_ARCHITECTURE.md:** Full repository overview

---

**Status:** Architecture decisions finalized for Phase 3
**Next Steps:** Implement Cognito login UI, remove server.js, deploy to S3+CloudFront

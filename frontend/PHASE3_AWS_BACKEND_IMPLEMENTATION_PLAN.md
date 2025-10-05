# Phase 3: AWS Backend Implementation Plan
**Branch:** `phase3-aws-backend`
**Date:** 2025-10-04
**Objective:** Integrate Click2Endpoint React app with existing C2M API v2 Security infrastructure

---

## Executive Summary

This document outlines the changes needed to migrate Click2Endpoint from using a local Express.js server for code execution to using the existing AWS-based C2M API v2 Security infrastructure for authentication and authorization.

**Key Decision:** Reuse existing `c2m-api-v2-security` authentication service rather than building a duplicate system.

---

## Current Architecture (Phase 1)

```
┌─────────────────────────────────────────────────────────┐
│ Click2Endpoint React Frontend (Vercel)                 │
│ - Wizard UI                                              │
│ - Code generation                                        │
│ - Client-side parameter forms                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ Local Express Server (server.js)                       │
│ - Python/JavaScript/Bash code execution                │
│ - File system operations                                │
│ - Direct API calls to mock server                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ Postman Mock Server                                     │
│ https://cd140b74-ed23-4980-834b-a966ac3393c1           │
│     .mock.pstmn.io                                      │
└─────────────────────────────────────────────────────────┘
```

### Current Files Structure
```
click2endpoint-react/
├── server.js                    # Express server for code execution
├── src/
│   ├── components/
│   │   ├── CodeGenerator.tsx    # Generates Python/JS/cURL code
│   │   ├── ExecutionOutput.tsx  # Displays execution results
│   │   └── SettingsModal.tsx    # Client ID/Secret config
│   └── services/
│       └── postmanApi.ts        # Mock server discovery
```

### Current Auth Flow
1. User enters `clientId` and `clientSecret` in Settings (stored in localStorage)
2. Generated code includes hardcoded auth flow:
   - POST to `/auth/tokens/long` with credentials
   - POST to `/auth/tokens/short` with long-term token
   - Use short-term token for API calls
3. Code is executed locally via Express server
4. Results displayed in ExecutionOutput panel

**Problem:** Auth endpoints don't actually exist on mock server - calls fail with 401

---

## Target Architecture (Phase 3)

```
┌─────────────────────────────────────────────────────────┐
│ Click2Endpoint React Frontend (Vercel)                 │
│ - Wizard UI                                              │
│ - Code generation                                        │
│ - Client-side parameter forms                           │
│ - Auth service integration                              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ AWS Lambda Functions (Vercel Serverless)               │
│ - Code execution proxy (Python/JS/Bash)                │
│ - Security sandbox                                      │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────────┐    ┌──────────────────────────────┐
│ C2M Auth Service  │    │ Postman Mock Server          │
│ AWS API Gateway   │    │ (or future production API)   │
│ + Lambda          │    │                              │
│ + Cognito         │    │                              │
└───────────────────┘    └──────────────────────────────┘
   Auth Endpoints             API Endpoints
```

### Integration Points

**C2M API v2 Security Service:**
- **Deployed URL:** `https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/`
- **Repository:** `~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-v2-security/`
- **Stack Name:** `C2MCognitoAuthStack-dev`
- **Region:** `us-east-1`

**Available Endpoints:**
- `POST /auth/tokens/long` - Get long-term token (30-90 days)
- `POST /auth/tokens/short` - Exchange for short-term token (15 min)
- `POST /auth/tokens/{tokenId}/revoke` - Revoke token
- `GET /auth/tokens/{tokenId}` - Get token info

---

## Required Changes

### 1. Update Auth Service Configuration

**File:** `src/services/authService.ts` (NEW)

Create a new service to handle AWS Cognito authentication:

```typescript
// Auth service configuration
export const AUTH_CONFIG = {
  authBaseUrl: 'https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth',
  tokenEndpoints: {
    long: '/tokens/long',
    short: '/tokens/short',
    revoke: '/tokens/{tokenId}/revoke',
    info: '/tokens/{tokenId}'
  },
  tokenStorage: {
    longTerm: 'c2e_long_token',
    shortTerm: 'c2e_short_token',
    expiry: 'c2e_token_expiry',
    tokenId: 'c2e_token_id'
  }
};

interface TokenResponse {
  access_token: string;
  token_id: string;
  expires_at: string;
  token_type: 'Bearer';
}

export class AuthService {
  async getLongTermToken(
    clientId: string,
    clientSecret: string
  ): Promise<TokenResponse>

  async getShortTermToken(
    longTermToken: string
  ): Promise<TokenResponse>

  async revokeToken(
    tokenId: string,
    token: string
  ): Promise<void>

  isTokenExpired(expiryTime: string): boolean

  async authenticate(
    clientId: string,
    clientSecret: string
  ): Promise<string> // Returns short-term token
}
```

**Key Features:**
- Token caching in sessionStorage (not localStorage for security)
- Automatic token refresh when expired
- Mock server detection (skip auth for mock.pstmn.io URLs)
- Error handling with clear error messages

---

### 2. Replace Local Server with Vercel Serverless Functions

**Current:** `server.js` (Express server on localhost:3001)

**New:** `api/execute-code.ts` (Vercel serverless function)

```typescript
// api/execute-code.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { language, code, clientId, clientSecret } = req.body;

  // Validate inputs
  if (!language || !code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Execute code in secure sandbox
    // For Python: Use @vercel/python or AWS Lambda
    // For JavaScript: Use Node.js child_process
    // For Bash: Use child_process with restricted permissions

    const result = await executeCode(language, code);

    return res.status(200).json({
      success: true,
      output: result.stdout,
      error: result.stderr,
      exitCode: result.exitCode
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

**Security Considerations:**
- Timeout limit (10 seconds max)
- Memory limit (1024 MB max)
- No file system write access
- Restricted network access (whitelist C2M API domains)
- Rate limiting per IP

---

### 3. Update Code Generation

**File:** `src/components/CodeGenerator.tsx`

**Changes:**
1. Update auth URL from mock server to AWS endpoint
2. Fix client credentials order (currently swapped in some places)
3. Add better error messages for auth failures
4. Update example code templates

**Before:**
```typescript
AUTH_BASE_URL="https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io"
CLIENT_ID="super-secret-password-123"  // WRONG - this is the secret!
CLIENT_SECRET="supersecret123"         // WRONG - doesn't match
```

**After:**
```typescript
AUTH_BASE_URL="https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth"
CLIENT_ID="test-client-123"
CLIENT_SECRET="super-secret-password-123"
```

---

### 4. Update Settings Management

**File:** `src/utils/settings.ts`

**Changes:**
1. Add auth URL configuration option
2. Validate credentials format
3. Add "Test Connection" button to verify credentials

**New Settings Interface:**
```typescript
export interface Settings {
  clientId: string;
  clientSecret: string;
  mockServerUrl: string;
  authUrl: string;  // NEW: Allow custom auth URL
  environment: 'development' | 'production';  // NEW
}

export const DEFAULT_SETTINGS: Settings = {
  clientId: '',
  clientSecret: '',
  mockServerUrl: 'https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io',
  authUrl: 'https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth',
  environment: 'development'
};
```

---

### 5. Update AuthCredentials Component

**File:** `src/components/AuthCredentials.tsx`

**Changes:**
1. Add "Test Connection" button
2. Show connection status indicator
3. Display token expiry time
4. Add "Refresh Tokens" button

**New Features:**
```typescript
const handleTestConnection = async () => {
  try {
    const authService = new AuthService();
    const token = await authService.authenticate(clientId, clientSecret);
    setConnectionStatus('success');
    setStatusMessage('✓ Connected successfully');
  } catch (error) {
    setConnectionStatus('error');
    setStatusMessage(`✗ ${error.message}`);
  }
};
```

---

### 6. Environment Variables

**File:** `.env.local` (for development)

```bash
# C2M API Configuration
VITE_AUTH_BASE_URL=https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth
VITE_API_BASE_URL=https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io
VITE_ENVIRONMENT=development

# Test Credentials (for development only)
VITE_TEST_CLIENT_ID=test-client-123
VITE_TEST_CLIENT_SECRET=super-secret-password-123

# Postman API (for mock server discovery - optional)
VITE_POSTMAN_API_KEY_PERSONAL=
VITE_POSTMAN_API_KEY_TEAM=
```

**Vercel Environment Variables:**
- `VITE_AUTH_BASE_URL` - Production auth URL
- `VITE_API_BASE_URL` - Production API URL (when available)
- `VITE_ENVIRONMENT` - Set to `production`

---

### 7. Update Package Dependencies

**File:** `package.json`

Add Vercel serverless support:

```json
{
  "dependencies": {
    "@vercel/node": "^3.0.0"
  },
  "devDependencies": {
    "vercel": "^32.0.0"
  }
}
```

---

## Implementation Phases

### Phase 3A: Auth Service Integration (Week 1)
- [ ] Create `authService.ts` with AWS Cognito integration
- [ ] Update `CodeGenerator.tsx` to use correct auth URLs
- [ ] Fix credential swap bug in generated code
- [ ] Add auth testing to `SettingsModal.tsx`
- [ ] Test auth flow with deployed AWS endpoints

### Phase 3B: Serverless Migration (Week 2)
- [ ] Create `api/execute-code.ts` Vercel function
- [ ] Implement secure code execution sandbox
- [ ] Update `CodeGenerator.tsx` to call serverless function
- [ ] Remove local `server.js` dependency
- [ ] Test code execution from deployed Vercel app

### Phase 3C: Production Readiness (Week 3)
- [ ] Add comprehensive error handling
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation updates

---

## Testing Strategy

### Unit Tests
- [ ] `authService.ts` - Token acquisition and refresh
- [ ] `CodeGenerator.tsx` - Code template generation
- [ ] `SettingsModal.tsx` - Credential validation

### Integration Tests
- [ ] Auth flow end-to-end (long-term → short-term → API call)
- [ ] Code execution via Vercel function
- [ ] Error handling (invalid credentials, expired tokens)

### Manual Testing Checklist
- [ ] Test with valid credentials
- [ ] Test with invalid credentials
- [ ] Test token expiry and refresh
- [ ] Test code execution for Python/JavaScript/cURL
- [ ] Test on deployed Vercel instance
- [ ] Test with production API (when available)

---

## Migration Path

### Development Environment
1. Keep local `server.js` running for development
2. Add feature flag to switch between local/serverless execution
3. Test both modes in parallel

### Staging/Production
1. Deploy to Vercel with serverless functions
2. Use AWS auth endpoints
3. Monitor for errors and performance issues

---

## Rollback Plan

If AWS integration fails:
1. Revert to `phase1-ux-improvements` branch
2. Deploy to Vercel (already working)
3. Continue using mock server without auth

**Rollback triggers:**
- Auth success rate < 95%
- Code execution failure rate > 5%
- Response time > 5 seconds
- Critical security vulnerability discovered

---

## Security Considerations

### Credentials Storage
- ✅ **Production:** Environment variables (Vercel)
- ✅ **Client:** sessionStorage (cleared on browser close)
- ❌ **Never:** localStorage (persistent, vulnerable to XSS)

### API Key Exposure
- Auth endpoints are public (protected by credentials)
- No API keys in frontend code
- All secrets managed server-side

### Code Execution Safety
- Sandboxed execution environment
- Timeout limits (10 seconds)
- Memory limits (1024 MB)
- No file system write access
- Network whitelist (C2M API domains only)

---

## Success Criteria

### Functional Requirements
- [ ] Users can authenticate with valid credentials
- [ ] Generated code executes successfully
- [ ] Auth tokens refresh automatically
- [ ] Error messages are clear and actionable

### Performance Requirements
- [ ] Token acquisition < 2 seconds
- [ ] Code execution < 5 seconds
- [ ] Page load time < 3 seconds

### Security Requirements
- [ ] No credentials in frontend bundle
- [ ] Tokens stored securely
- [ ] Code execution sandboxed
- [ ] Rate limiting active

---

## Open Questions

1. **Production API Endpoint:** When will the production C2M API be deployed?
2. **User Management:** Do we need to support user registration, or only test credentials?
3. **Billing:** Should we track API usage per user?
4. **Monitoring:** What metrics should we track (Datadog, CloudWatch)?
5. **Multi-region:** Should we support multiple AWS regions?

---

## Dependencies

### External Services
- AWS API Gateway (C2M Auth service)
- AWS Lambda (C2M Auth functions)
- AWS Cognito (User authentication)
- Vercel (Hosting + Serverless functions)
- Postman Mock Server (Development/testing)

### Internal Repositories
- `c2m-api-v2-security` - Authentication service (reused)
- `click2endpoint-react` - This application

---

## Resources

### Documentation
- [C2M Authentication Guide](/Users/frankserrao/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-repo/user-guides/authentication/AUTHENTICATION_GUIDE.md)
- [Postman JWT Pre-request Script](/Users/frankserrao/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-repo/postman/scripts/jwt-pre-request.js)
- [C2M API Ecosystem Overview](/Users/frankserrao/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-repo/user-guides/C2M_API_ECOSYSTEM_OVERVIEW.md)

### AWS Resources
- Auth Service URL: https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/
- CloudFormation Stack: C2MCognitoAuthStack-dev
- AWS Console: https://console.aws.amazon.com/

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| 3A: Auth Integration | 3-5 days | Auth service, credential fixes, testing |
| 3B: Serverless Migration | 5-7 days | Vercel functions, code execution, testing |
| 3C: Production Readiness | 3-5 days | Security, monitoring, documentation |
| **Total** | **11-17 days** | **3 weeks** |

---

## Next Steps

1. **Review this document** with stakeholders
2. **Create GitHub issues** for each task
3. **Set up development environment** with AWS credentials
4. **Begin Phase 3A implementation** - Auth service integration
5. **Schedule checkpoint reviews** (weekly)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-04
**Author:** Claude Code
**Status:** Draft - Awaiting Approval

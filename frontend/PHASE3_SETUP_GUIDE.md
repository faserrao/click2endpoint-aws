# Phase 3 AWS Backend - Setup Guide

## Overview

This document outlines the steps required to complete the Phase 3 AWS backend integration for Click2Endpoint React. The frontend integration is complete, but several backend configuration steps are needed to make authentication functional.

---

## Current Status

### ✅ Completed
- **authService.ts** - Complete AWS Cognito integration service
- **Settings Modal** - Test Connection UI with visual feedback
- **Code Generators** - Updated with correct AWS URLs and credentials
- **Environment Variables** - Configured for AWS backend (.env.example, .env.local)
- **Documentation** - Project CLAUDE.md, system CLAUDE.md, session log

### ⏳ Pending
- AWS Cognito test credentials configuration
- Vercel serverless functions creation
- Production deployment to Vercel

---

## Required Steps to Make Phase 3 Work

### 1. Configure Test Credentials in AWS Cognito ⚠️ CRITICAL

**Status**: 🚫 BLOCKER - Currently preventing authentication from working

**Problem**: The test credentials (`test-client-123` / `test-secret-456`) are not registered in the deployed AWS Cognito User Pool. When the Test Connection button is clicked, AWS returns:
```json
{"code":"invalid_grant","message":"Invalid client credentials"}
```

**Solution Options**:

#### Option A: Register Test User via AWS Console (Quickest)
1. Log into AWS Console
2. Navigate to Cognito → User Pools
3. Find the C2M Auth Stack user pool (C2MCognitoAuthStack-dev)
4. Create new app client with:
   - Client ID: `test-client-123`
   - Client Secret: `test-secret-456`
   - Enabled flows: Client credentials
   - Allowed scopes: jobs:submit, templates:read, tokens:revoke

#### Option B: Update CDK Stack (Recommended for Automation)
1. Navigate to c2m-api-v2-security repository:
   ```bash
   cd ~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-v2-security/cognito-auth-app
   ```

2. Update CDK stack to create test users on deployment
   - Edit `lib/constructs/cognito-pool.ts`
   - Add app client with test credentials
   - Redeploy: `npx cdk deploy`

3. Test credentials are working when:
   ```bash
   curl -X POST https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth/tokens/long \
     -H "Content-Type: application/json" \
     -H "X-Client-Id: test-client-123" \
     -d '{
       "grant_type": "client_credentials",
       "client_id": "test-client-123",
       "client_secret": "test-secret-456",
       "scopes": ["jobs:submit", "templates:read", "tokens:revoke"],
       "ttl_seconds": 2592000
     }'
   ```
   Returns a valid token instead of `invalid_grant` error.

#### Option C: Use Existing Production Credentials
1. Check AWS Secrets Manager for existing credentials
2. Update .env.local with actual credentials
3. Update default values in AuthCredentials.tsx and codeGenerators.ts

---

### 2. Start Backend Server (Local Development)

**Status**: ⚠️ Required for local development

**Current State**: Only Vite frontend is running (port 5173)

**Required**: Express backend server (port 3001) for code execution

**Solution**:

```bash
# Option A: Start both together (recommended)
npm run dev:all

# Option B: Start separately
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
node server.js
```

**Verification**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001 (health check)

---

### 3. Test the Settings Modal Test Connection

**Prerequisites**:
- AWS Cognito credentials configured (Step 1)
- Dev servers running (Step 2)

**Testing Steps**:

1. Open http://localhost:5173 in browser

2. Click Settings icon (⚙️ gear in top-right)

3. Enter test credentials:
   - Client ID: `test-client-123`
   - Client Secret: `test-secret-456`

4. Click "Test Connection" button

5. **Expected Results**:
   - Button shows "Testing..." with spinner
   - After 1-2 seconds, shows green success message:
     ```
     ✓ Successfully authenticated (Token: xxx-xxx-xxx)
     ```

6. **If it fails**:
   - Red error message appears
   - Check browser console for detailed error
   - Verify AWS Cognito credentials are configured (Step 1)

---

### 4. Create Vercel Serverless Functions (Production)

**Status**: 📋 TODO - Required for production deployment

**Why Needed**: Replace local Express server (server.js) with cloud-based Vercel functions

**Files to Create**:

#### `api/execute-code.ts` (Primary Function)

Replace the local Express server's code execution endpoint.

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { language, code } = req.body;

  // Implement sandboxed code execution
  // Similar to server.js but with security sandboxing

  // TODO: Add security measures:
  // - Timeout limits
  // - Memory limits
  // - Sandbox environment
  // - Input validation

  try {
    // Execute code based on language
    // Return results
    return res.status(200).json({ output: 'Execution results...' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

#### `api/auth-proxy.ts` (Optional - Enhanced Security)

Proxy authentication requests to hide credentials from frontend.

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, clientSecret } = req.body;

  // Proxy request to AWS Cognito
  const authUrl = process.env.AUTH_BASE_URL;

  try {
    const response = await fetch(`${authUrl}/tokens/long`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scopes: ['jobs:submit', 'templates:read', 'tokens:revoke'],
        ttl_seconds: 2592000
      })
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

**Directory Structure**:
```
click2endpoint-react/
├── api/
│   ├── execute-code.ts      # Code execution endpoint
│   └── auth-proxy.ts         # Auth proxy (optional)
├── src/
├── package.json
└── vercel.json              # Vercel configuration
```

**Update Frontend**:

After creating serverless functions, update:
- `src/services/authService.ts` - Use `/api/auth-proxy` instead of direct AWS calls (if using proxy)
- `src/components/ExecutionOutput.tsx` - Call `/api/execute-code` instead of `http://localhost:3001`

---

### 5. Deploy to Vercel

**Status**: 📋 TODO - Final step for production

**Prerequisites**:
- AWS Cognito credentials configured
- Vercel serverless functions created (Step 4)
- Code tested locally

**Deployment Steps**:

#### A. Push to GitHub

```bash
# Ensure all changes are committed
git status

# Commit any pending changes
git add .
git commit -m "Complete Phase 3 AWS backend integration"

# Push phase3-aws-backend branch
git push origin phase3-aws-backend
```

#### B. Configure Vercel Project

1. Go to https://vercel.com/dashboard
2. Import GitHub repository: `faserrao/click2endpoint-react`
3. Select branch: `phase3-aws-backend`
4. Configure project:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### C. Configure Environment Variables

In Vercel project settings → Environment Variables, add:

```bash
# Required
VITE_AUTH_BASE_URL=https://j0dos52r5e.execute-api.us-east-1.amazonaws.com/dev/auth

# Optional (if using mock server)
VITE_DEFAULT_MOCK_URL=https://cd140b74-ed23-4980-834b-a966ac3393c1.mock.pstmn.io

# Optional (for default credentials - development only)
VITE_DEFAULT_CLIENT_ID=test-client-123
VITE_DEFAULT_CLIENT_SECRET=test-secret-456
```

**Security Note**: Do NOT include actual client secrets in environment variables for production. Use Vercel serverless function proxy instead.

#### D. Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for build to complete (2-3 minutes)
3. Test deployment URL (e.g., `https://click2endpoint-react-phase3.vercel.app`)

#### E. Test Production Deployment

1. Open deployed URL
2. Click Settings → Enter credentials
3. Click Test Connection
4. Verify authentication works
5. Test wizard flow
6. Test code execution

---

## Current Blockers (Priority Order)

### 🚫 BLOCKER 1: AWS Cognito Test Credentials Not Registered

**Impact**: Authentication will not work at all (Test Connection always fails)

**Fix Required**: Register `test-client-123` / `test-secret-456` in AWS Cognito User Pool

**Estimated Time**: 15-30 minutes (AWS Console) or 1-2 hours (CDK update + redeploy)

**Who Can Fix**: Anyone with AWS Console access to C2M account

---

### ⚠️ BLOCKER 2: Backend Server Not Running (Local Dev Only)

**Impact**: Code execution feature won't work locally

**Fix Required**: Run `npm run dev:all` or `node server.js`

**Estimated Time**: 1 minute

**Who Can Fix**: Any developer working locally

---

### 📋 TODO 3: Vercel Serverless Functions Not Created

**Impact**: Cannot deploy to production (Vercel deployment will work but code execution will fail)

**Fix Required**: Create `api/execute-code.ts` and optionally `api/auth-proxy.ts`

**Estimated Time**: 2-4 hours (includes security sandboxing implementation)

**Who Can Fix**: Backend developer familiar with Vercel serverless functions

---

## Quick Start for Local Testing

### Minimal Setup (Frontend Only)

```bash
# 1. Start Vite dev server
npm run dev

# 2. Open browser
open http://localhost:5173

# 3. Test wizard flow (no auth or code execution)
```

**Works**: Wizard UI, parameter collection, code generation
**Doesn't Work**: Test Connection, code execution

---

### Full Setup (Frontend + Backend)

```bash
# 1. Start both servers
npm run dev:all

# 2. Open browser
open http://localhost:5173

# 3. Test everything (auth will fail until AWS credentials configured)
```

**Works**: Wizard UI, parameter collection, code generation, code execution
**Doesn't Work**: Test Connection (AWS credentials needed)

---

## Architecture Overview

### Current State (Phase 3A - Auth Integration Complete)

```
┌─────────────────────────────────────────────────────────────┐
│  User Browser                                               │
│  http://localhost:5173                                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Vite)                                      │
│  - Settings Modal with Test Connection UI                  │
│  - authService.ts (two-token flow logic)                   │
│  - Code Generators                                          │
└───────┬────────────────────────────┬────────────────────────┘
        │                            │
        │ Auth Requests              │ Code Execution
        │ (currently fails)          │ (works locally)
        ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│  AWS API Gateway     │    │  Express Server      │
│  /dev/auth/...       │    │  localhost:3001      │
└──────┬───────────────┘    └──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  AWS Cognito         │
│  User Pool           │
│  ⚠️ Missing test     │
│     credentials      │
└──────────────────────┘
```

### Target State (Phase 3 Complete)

```
┌─────────────────────────────────────────────────────────────┐
│  User Browser                                               │
│  https://click2endpoint-react.vercel.app                    │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Vercel CDN)                                │
│  - Settings Modal with Test Connection UI                  │
│  - authService.ts (two-token flow logic)                   │
│  - Code Generators                                          │
└───────┬────────────────────────────┬────────────────────────┘
        │                            │
        │ Auth Requests              │ Code Execution
        ▼                            ▼
┌──────────────────────┐    ┌──────────────────────┐
│  AWS API Gateway     │    │  Vercel Serverless   │
│  /dev/auth/...       │    │  /api/execute-code   │
└──────┬───────────────┘    └──────────────────────┘
       │
       ▼
┌──────────────────────┐
│  AWS Cognito         │
│  User Pool           │
│  ✅ Test credentials │
│     configured       │
└──────────────────────┘
```

---

## Files Modified in Phase 3

### Created
- `src/services/authService.ts` (258 lines)
- `PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md` (550+ lines)
- `PHASE3_SETUP_GUIDE.md` (this file)

### Modified
- `src/utils/codeGenerators.ts` - Updated AUTH_BASE_URL and credentials
- `src/components/AuthCredentials.tsx` - Updated default secret
- `src/components/SettingsModal.tsx` - Added Test Connection UI
- `.env.example` - Added AUTH_BASE_URL and default credentials
- `.env.local` - Added AUTH_BASE_URL and default credentials
- `CLAUDE.md` - Updated with Phase 3 progress
- `click2endpoint-react-claude.log` - Session log entries

---

## Testing Checklist

### Local Testing (Before AWS Credentials)
- [ ] Dev server starts: `npm run dev:all`
- [ ] Frontend loads: http://localhost:5173
- [ ] Wizard flow works (answer questions)
- [ ] Parameter collection shows correct fields
- [ ] Code generation produces Python/JavaScript/cURL
- [ ] Copy to clipboard works
- [ ] Download code works
- [ ] Code execution works (if backend running)

### Local Testing (After AWS Credentials)
- [ ] Settings modal opens
- [ ] Test Connection button works
- [ ] Shows "Testing..." state
- [ ] Returns success with token ID
- [ ] Credentials saved to Settings
- [ ] Code generators use saved credentials

### Production Testing (After Vercel Deployment)
- [ ] Deployed URL loads
- [ ] All local tests pass
- [ ] Code execution uses Vercel function (not localhost)
- [ ] Auth works without exposing credentials
- [ ] Performance is acceptable
- [ ] Error handling works correctly

---

## Next Steps

### Immediate (This Week)
1. **Configure AWS Cognito test credentials** (blocks everything else)
2. **Test local auth flow** (verify credentials work)
3. **Create Vercel serverless functions** (2-4 hours)

### Short Term (Next Week)
4. **Test Vercel deployment** (end-to-end testing)
5. **Security review** (sandboxing, rate limiting)
6. **Documentation updates** (user guide, API docs)

### Medium Term (Following Week)
7. **Replace Phase 1 deployment** (sunset old version)
8. **Monitoring setup** (CloudWatch, Vercel Analytics)
9. **Performance optimization** (caching, CDN)

---

## Support & Resources

### Documentation
- **Implementation Plan**: `PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md`
- **Project Context**: `CLAUDE.md`
- **Session Log**: `click2endpoint-react-claude.log`

### Related Repositories
- **Security Stack**: `~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-v2-security/`
- **Main API**: `~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/c2m-api-repo/`

### External Resources
- AWS Cognito: https://console.aws.amazon.com/cognito
- Vercel Dashboard: https://vercel.com/dashboard
- Deployed Phase 1: https://click2endpoint-react.vercel.app
- GitHub Repository: https://github.com/faserrao/click2endpoint-react

---

## FAQ

### Q: Can I test Phase 3 without AWS credentials?

**A**: Yes, partially. The wizard flow, parameter collection, and code generation will all work. Only the Test Connection feature requires AWS credentials.

### Q: Why not use the old credentials (super-secret-password-123)?

**A**: Those credentials were for mock testing in Phase 1. Phase 3 uses the real AWS Cognito system, which requires properly registered credentials.

### Q: Can I use production credentials instead of test credentials?

**A**: Yes, if you have access to production credentials from AWS Secrets Manager. Update .env.local with the real values.

### Q: Do I need to configure AWS credentials to deploy to Vercel?

**A**: No, you can deploy without credentials, but the Test Connection feature won't work in production. Users would need to manually enter valid credentials.

### Q: What happens if Test Connection fails?

**A**: Users can still use the app - they just won't see the green success message. The generated code will include the credentials they entered, whether or not they tested them.

---

**Last Updated**: 2025-10-04
**Branch**: phase3-aws-backend
**Status**: Auth integration complete, AWS credentials configuration pending

# Click2Endpoint AWS - Production Deployment

Interactive wizard for discovering and testing C2M API endpoints, deployed on AWS with Cognito authentication.

## Overview

Click2Endpoint helps developers and integration engineers find the perfect C2M API endpoint for their document submission needs through a guided Q&A wizard.

**Live App:** (pending deployment)
**Architecture:** React SPA (S3 + CloudFront) + Cognito Authentication
**Related Repos:**
- Development: [click2endpoint-react](https://github.com/faserrao/click2endpoint-react)
- Auth Service: [c2m-api-v2-security](https://github.com/faserrao/c2m-api-v2-security)

## Architecture

```
User → Cognito (login) → JWT Token
          ↓
React App (S3 + CloudFront) → C2M API (direct calls with user JWT)
```

**Key Points:**
- **No backend** - Pure static site (S3 + CloudFront only)
- **Per-user authentication** - Each user has their own Cognito account
- **Direct API calls** - Browser calls C2M API with user's JWT token
- **Custom login UI** - Dark theme matching Click2Endpoint design

## Repository Structure

```
click2endpoint-aws/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API services (Cognito, Postman)
│   │   ├── data/               # Endpoint mappings, questions, schemas
│   │   └── utils/              # Code generators, settings
│   ├── public/                 # Static assets
│   └── package.json
│
├── cdk/                        # AWS CDK infrastructure
│   ├── lib/
│   │   ├── cognito-stack.ts   # User Pool + App Client
│   │   └── hosting-stack.ts   # S3 + CloudFront + Deployment
│   ├── bin/cdk.ts             # Main CDK app
│   └── package.json
│
├── README.md                   # This file
└── DEPLOYMENT.md              # Deployment guide
```

## Features

### Phase 1: Q&A Wizard
- 8 endpoint mappings (single/multi document, templates, PDF splitting)
- Dynamic parameter collection based on EBNF schemas
- Code generation (Python, JavaScript, cURL)
- Mock server integration for testing

### Phase 2: Authentication
- Custom Cognito login UI (dark theme)
- Per-user authentication (no shared credentials)
- Session management with token refresh
- Settings modal with credential testing

### Phase 3: Business Rules
- Template content constraint (mutually exclusive address list/document)
- Dynamic parameter hiding based on wizard answers
- Comprehensive parameter validation

## Technology Stack

### Frontend
- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (with dark theme)
- **Lucide React** - Icons
- **amazon-cognito-identity-js** - Cognito SDK

### Infrastructure (AWS CDK)
- **S3** - Static website hosting
- **CloudFront** - CDN with HTTPS
- **Cognito** - User authentication
- **AWS CDK** - Infrastructure as Code (TypeScript)

## Local Development

### Prerequisites
- Node.js 18+ and npm
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)

### Setup

```bash
# Clone repository
git clone <repository-url>
cd click2endpoint-aws

# Install frontend dependencies
cd frontend
npm install

# Install CDK dependencies
cd ../cdk
npm install
```

### Run Locally

```bash
# From frontend/ directory
npm run dev

# Access at http://localhost:5173
```

**Note:** Local development uses mock servers (no authentication required). Production uses Cognito.

### Environment Variables

Create `frontend/.env.local`:

```bash
# Mock Server (for development)
VITE_DEFAULT_MOCK_URL=https://a0711c27-f596-4e45-91bb-2a7a7a16c957.mock.pstmn.io

# Cognito (from CDK outputs after deployment)
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-app-client-id

# Optional: Postman API (for dynamic mock server discovery)
VITE_POSTMAN_API_KEY_PERSONAL=your-key
VITE_POSTMAN_API_KEY_TEAM=your-key
```

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment instructions.

### Quick Deploy

```bash
# Build frontend
cd frontend
npm run build

# Deploy infrastructure (from cdk/ directory)
cd ../cdk
npx cdk deploy --all

# Get outputs (includes Cognito IDs and CloudFront URL)
npx cdk deploy --all --outputs-file outputs.json
```

### Environments

- **dev** (default): Auto-delete resources on stack destroy
- **staging**: Auto-delete resources
- **prod**: Retain resources, enable S3 versioning

```bash
# Deploy to specific environment
npx cdk deploy --all -c environment=prod
```

## User Management

Cognito is configured with **self-signup disabled**. Admins must create users:

```bash
# Create user via AWS Console
# Cognito → User Pools → Click2Endpoint-users-{env} → Create user

# Or via AWS CLI
aws cognito-idp admin-create-user \
  --user-pool-id <pool-id> \
  --username <username> \
  --user-attributes Name=email,Value=<email> \
  --temporary-password <temp-password>
```

## CDK Stacks

### CognitoStack
- **User Pool** - Username/email sign-in, email verification
- **App Client** - Browser-based (no secret), 1hr tokens, 30-day refresh
- **Password Policy** - 8 chars, upper/lower/digits required

### HostingStack
- **S3 Bucket** - Private, CloudFront OAI access only
- **CloudFront** - HTTPS, SPA routing (404→index.html), cache optimization
- **BucketDeployment** - Auto-deploy from `frontend/dist/`, invalidate cache

## Key Decisions

1. **No Backend Needed** - User has JWT in browser, calls C2M API directly
2. **Custom Login UI** - Matches dark theme, better UX than AWS Hosted UI
3. **Per-User Authentication** - Each user has Cognito account (not shared credentials)
4. **Static Site Only** - S3 + CloudFront (no Lambda/API Gateway for Click2Endpoint)
5. **Environment-Based Config** - Different policies for dev/staging/prod

## Related Documentation

- **DEPLOYMENT.md** - Step-by-step deployment guide
- **frontend/ARCHITECTURE_DECISIONS.md** - Detailed architecture rationale
- **frontend/PHASE3_AWS_BACKEND_IMPLEMENTATION_PLAN.md** - Implementation plan

## Support & Troubleshooting

### Common Issues

**Q: Login fails with "User does not exist"**
A: Admin must create user in Cognito (self-signup is disabled)

**Q: CloudFront shows 404 for routes**
A: SPA routing configured - 404/403 errors return index.html (this is expected)

**Q: Frontend build fails**
A: Ensure Node.js 18+ and run `npm install` in frontend/ directory

**Q: CDK deploy fails with "frontend/dist not found"**
A: Run `npm run build` in frontend/ directory first

## License

Proprietary - Click2Mail/C2M API Project

## Contact

For questions or issues, contact the C2M API team.

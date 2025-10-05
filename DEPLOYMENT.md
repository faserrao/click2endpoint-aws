# Click2Endpoint AWS - Deployment Guide

Complete step-by-step guide for deploying Click2Endpoint to AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Frontend Build](#frontend-build)
4. [CDK Deployment](#cdk-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [User Management](#user-management)
7. [Testing](#testing)
8. [Updating the Application](#updating-the-application)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** - Included with Node.js
- **AWS CLI** - [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK CLI** - Install globally: `npm install -g aws-cdk`
- **Git** - [Download](https://git-scm.com/)

### AWS Requirements

- AWS account with appropriate permissions
- AWS CLI configured with credentials
- Permissions needed:
  - CloudFormation (create/update stacks)
  - S3 (create buckets, upload objects)
  - CloudFront (create distributions)
  - Cognito (create user pools)
  - IAM (create roles for CloudFront OAI)

### Verify AWS CLI Configuration

```bash
# Check AWS CLI is configured
aws sts get-caller-identity

# Expected output shows your AWS account ID and user
{
  "UserId": "...",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/your-user"
}
```

## Initial Setup

### 1. Clone Repository

```bash
cd ~/Dropbox/Customers/c2m/projects/c2m-api/C2M_API_v2/
# Repository already created locally
cd click2endpoint-aws
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install CDK dependencies
cd ../cdk
npm install
```

### 3. Bootstrap CDK (First Time Only)

If you've never used CDK in your AWS account/region:

```bash
cd cdk
npx cdk bootstrap

# Or specify region explicitly
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

This creates the CDKToolkit stack with S3 bucket for CDK assets.

## Frontend Build

### 1. Build Production Bundle

```bash
cd frontend
npm run build
```

This creates the `frontend/dist/` directory with optimized production files.

### 2. Verify Build

```bash
ls -la dist/
# Should show: index.html, assets/, vite.svg, etc.
```

**Important:** The CDK HostingStack deploys from `frontend/dist/`. Build must succeed before CDK deployment.

## CDK Deployment

### 1. Synthesize CloudFormation Templates

```bash
cd cdk
npx cdk synth
```

This generates CloudFormation templates and validates your CDK code. Review the output for any errors.

### 2. Review Changes (Optional)

```bash
npx cdk diff
```

Shows what resources will be created/modified.

### 3. Deploy to Dev Environment (Default)

```bash
npx cdk deploy --all
```

This deploys both stacks:
- `Click2Endpoint-Cognito-dev` - Cognito User Pool
- `Click2Endpoint-Hosting-dev` - S3 + CloudFront

**Expected Duration:** 10-15 minutes (CloudFront distribution creation is slow)

### 4. Deploy to Production Environment

```bash
npx cdk deploy --all -c environment=prod
```

Production differences:
- Stack names: `Click2Endpoint-Cognito-prod`, `Click2Endpoint-Hosting-prod`
- Removal policy: RETAIN (resources not deleted on stack destroy)
- S3 versioning: ENABLED

### 5. Save Outputs

```bash
npx cdk deploy --all --outputs-file outputs.json
```

Creates `outputs.json` with important values:
- Cognito User Pool ID
- Cognito App Client ID
- CloudFront Distribution ID
- CloudFront Domain Name (website URL)

## Post-Deployment Configuration

### 1. Extract Cognito Configuration

After deployment, CDK outputs the Cognito configuration:

```bash
# View outputs
cat outputs.json

# Look for EnvConfig output (contains JSON for .env.local)
```

### 2. Update Frontend Environment Variables

Create/update `frontend/.env.local`:

```bash
cd frontend
cat > .env.local << 'EOF'
# Cognito Configuration (from CDK outputs)
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=your-app-client-id

# Mock Server (for development/testing)
VITE_DEFAULT_MOCK_URL=https://a0711c27-f596-4e45-91bb-2a7a7a16c957.mock.pstmn.io

# Optional: Postman API Keys
VITE_POSTMAN_API_KEY_PERSONAL=your-key
VITE_POSTMAN_API_KEY_TEAM=your-key
EOF
```

**Note:** These environment variables are only for local development. Production frontend is already deployed to CloudFront.

### 3. Get CloudFront URL

```bash
# From outputs.json
cat outputs.json | grep -A 1 "WebsiteUrl"

# Or from AWS Console
# CloudFront → Distributions → Click2Endpoint-dev → Domain name
```

Your application is now live at: `https://dXXXXXXXXXXXX.cloudfront.net`

## User Management

Cognito is configured with **self-signup disabled**. You must manually create users.

### Create User (AWS Console)

1. Open AWS Console → Cognito
2. Select User Pool: `click2endpoint-users-dev` (or `prod`)
3. Click "Create user"
4. Fill in:
   - Username: `developer@example.com`
   - Email: `developer@example.com`
   - Temporary password: (auto-generated or custom)
5. Uncheck "Send invitation email" if testing
6. Click "Create user"

### Create User (AWS CLI)

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username developer@example.com \
  --user-attributes Name=email,Value=developer@example.com \
  --temporary-password TempPass123!
```

### First Login Flow

1. User visits CloudFront URL
2. Custom login page appears
3. User enters username and temporary password
4. Cognito prompts for new password
5. User sets permanent password
6. User is logged in (JWT tokens stored in sessionStorage)

## Testing

### 1. Test Login

1. Open CloudFront URL in browser
2. Should see custom dark-themed login page
3. Enter credentials for created user
4. Verify successful login → main wizard appears

### 2. Test Wizard Flow

1. Click "Manual Wizard Mode"
2. Answer questions (e.g., "Send individual documents")
3. Verify endpoint recommendation appears
4. Test code generation (Python/JavaScript/cURL)

### 3. Test Mock Server Integration

1. Open Settings (gear icon)
2. Verify mock server URL is set
3. Return to wizard and complete flow
4. Click "Execute Code" to test against mock server
5. Verify response appears in Execution Output panel

### 4. Test Cognito Token Refresh

1. Login and wait 1 hour (access token expires)
2. Navigate to different wizard screens
3. Verify automatic token refresh works (no logout)

## Updating the Application

### Update Frontend Code

```bash
# Make code changes in frontend/src/

# Rebuild
cd frontend
npm run build

# Redeploy
cd ../cdk
npx cdk deploy Click2Endpoint-Hosting-dev

# This triggers:
# - Upload new dist/ files to S3
# - Invalidate CloudFront cache (/* paths)
# - New version live in ~5 minutes
```

### Update CDK Infrastructure

```bash
# Make changes to cdk/lib/*.ts

# Review changes
cd cdk
npx cdk diff

# Deploy
npx cdk deploy --all
```

### Update Single Stack

```bash
# Deploy only Cognito changes
npx cdk deploy Click2Endpoint-Cognito-dev

# Deploy only Hosting changes
npx cdk deploy Click2Endpoint-Hosting-dev
```

## Environment Management

### List Deployed Stacks

```bash
cd cdk
npx cdk list
```

### Destroy Environment (Development Only)

```bash
# CAUTION: This deletes all resources (dev/staging only)
npx cdk destroy --all

# Production has RETAIN policy - S3/Cognito won't delete
```

### Switch Environments

```bash
# Deploy to staging
npx cdk deploy --all -c environment=staging

# Deploy to prod
npx cdk deploy --all -c environment=prod
```

## Troubleshooting

### Frontend Build Fails

**Error:** `MODULE_NOT_FOUND` or TypeScript errors

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CDK Deploy Fails: "frontend/dist not found"

**Error:** `Cannot read asset from frontend/dist/`

**Solution:**
```bash
cd frontend
npm run build
cd ../cdk
npx cdk deploy --all
```

### CloudFront Shows 404 for All Routes

**Check 1:** Verify S3 bucket has files
```bash
aws s3 ls s3://click2endpoint-dev-ACCOUNT-ID/
```

**Check 2:** Verify CloudFront error responses configured
- Should return `index.html` for 404/403 errors (SPA routing)

### Cognito Login Fails

**Error:** "User does not exist"

**Solution:** Admin must create user (self-signup disabled)

**Error:** "Incorrect username or password"

**Solution:**
- Verify user exists in Cognito User Pool
- Check username is email (not display name)
- Try resetting password via AWS Console

### CloudFront Distribution Takes Long Time

**Expected:** CloudFront distribution creation takes 10-15 minutes

**Progress:** Check AWS Console → CloudFront → Distributions → Status should show "In Progress" then "Deployed"

### Token Refresh Not Working

**Check:** Browser console for errors

**Fix:** Verify `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` match deployed values from `outputs.json`

## Best Practices

### Development Workflow

1. Make changes in `click2endpoint-react` repo (phase3-aws-backend branch)
2. Test locally with `npm run dev`
3. Copy changes to `click2endpoint-aws/frontend/`
4. Build and deploy to dev environment
5. Test on CloudFront URL
6. Deploy to prod when stable

### Security

- Never commit `.env.local` files
- Rotate Postman API keys periodically
- Use least-privilege IAM roles for deployments
- Enable CloudTrail for audit logging
- Review Cognito user list periodically

### Cost Optimization

- Use dev environment for testing (auto-delete when done)
- Delete unused CloudFront distributions
- Enable S3 lifecycle policies for old versions (prod)
- Monitor AWS Cost Explorer for unexpected charges

## Additional Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)

## Support

For issues or questions:
1. Check this troubleshooting guide
2. Review CDK synthesis output for errors
3. Check AWS CloudFormation console for stack events
4. Contact C2M API team

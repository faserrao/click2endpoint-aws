#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { HostingStack } from '../lib/hosting-stack';
import { ExecutionStack } from '../lib/execution-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

// AWS environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Cognito Stack - User authentication
const cognitoStack = new CognitoStack(app, `Click2Endpoint-Cognito-${environment}`, {
  env,
  environment,
  description: `Click2Endpoint Cognito User Pool (${environment})`,
});

// Execution Stack - Lambda for code execution
const executionStack = new ExecutionStack(app, `Click2Endpoint-Execution-${environment}`, {
  env,
  environment,
  description: `Click2Endpoint Code Execution Lambda (${environment})`,
});

// Hosting Stack - S3 + CloudFront
const hostingStack = new HostingStack(app, `Click2Endpoint-Hosting-${environment}`, {
  env,
  environment,
  description: `Click2Endpoint Frontend Hosting (${environment})`,
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'Click2Endpoint');
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

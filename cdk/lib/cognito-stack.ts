import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface CognitoStackProps extends cdk.StackProps {
  environment: string; // dev, staging, prod
}

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Create Cognito User Pool
    this.userPool = new cognito.UserPool(this, 'Click2EndpointUserPool', {
      userPoolName: `click2endpoint-users-${environment}`,
      selfSignUpEnabled: false, // Admin creates users
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Create App Client (for React app)
    this.userPoolClient = new cognito.UserPoolClient(this, 'Click2EndpointWebClient', {
      userPool: this.userPool,
      userPoolClientName: `click2endpoint-web-${environment}`,
      authFlows: {
        userPassword: true, // For username/password auth
        userSrp: true, // For SRP (Secure Remote Password) auth
      },
      generateSecret: false, // Public client (browser app)
      preventUserExistenceErrors: true,
      // Token validity
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `Click2Endpoint-UserPoolId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
    });

    new cdk.CfnOutput(this, 'WebClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID for Web',
      exportName: `Click2Endpoint-WebClientId-${environment}`,
    });

    // Output for .env.local file
    new cdk.CfnOutput(this, 'EnvConfig', {
      value: JSON.stringify({
        VITE_COGNITO_USER_POOL_ID: this.userPool.userPoolId,
        VITE_COGNITO_CLIENT_ID: this.userPoolClient.userPoolClientId,
      }, null, 2),
      description: 'Environment variables for .env.local',
    });
  }
}

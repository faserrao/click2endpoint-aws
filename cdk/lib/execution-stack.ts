import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ExecutionStackProps extends cdk.StackProps {
  environment: string; // dev, staging, prod
}

export class ExecutionStack extends cdk.Stack {
  public readonly functionUrl: string;

  constructor(scope: Construct, id: string, props: ExecutionStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Lambda function for code execution
    const codeExecutorFunction = new lambda.Function(this, 'CodeExecutorFunction', {
      functionName: `click2endpoint-executor-${environment}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/code-executor')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        NODE_ENV: environment,
      },
    });

    // Create Function URL (public access)
    const functionUrl = codeExecutorFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // Public access
      cors: {
        allowedOrigins: ['*'], // Allow all origins (or specify CloudFront domain)
        allowedMethods: [lambda.HttpMethod.POST], // OPTIONS is handled automatically
        allowedHeaders: ['Content-Type'],
      },
    });

    this.functionUrl = functionUrl.url;

    // Outputs
    new cdk.CfnOutput(this, 'FunctionUrl', {
      value: this.functionUrl,
      description: 'Code Executor Lambda Function URL',
      exportName: `Click2Endpoint-ExecutorUrl-${environment}`,
    });

    new cdk.CfnOutput(this, 'FunctionName', {
      value: codeExecutorFunction.functionName,
      description: 'Code Executor Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'FunctionArn', {
      value: codeExecutorFunction.functionArn,
      description: 'Code Executor Lambda Function ARN',
    });
  }
}

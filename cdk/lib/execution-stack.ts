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
    // Using Python runtime so we can execute Python, JavaScript (via Node), and bash
    const codeExecutorFunction = new lambda.Function(this, 'CodeExecutorFunction', {
      functionName: `click2endpoint-executor-${environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
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
        allowedOrigins: ['*'], // Allow all origins
        allowedMethods: [lambda.HttpMethod.POST], // OPTIONS is handled automatically
        allowedHeaders: ['*'], // Allow all headers
        maxAge: cdk.Duration.seconds(300),
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

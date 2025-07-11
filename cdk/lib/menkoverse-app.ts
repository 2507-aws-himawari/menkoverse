import * as cdk from 'aws-cdk-lib';
import { CoreStack } from './core-stack';
import { AuthStack } from './auth-stack';
import { DataStack } from './data-stack';
import { AppStack } from './app-stack';
import { RealtimeStack } from './realtime-stack';

export interface MenkoverseStackProps extends cdk.StackProps {
  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  readonly environment?: string;
  /**
   * Callback URL for OAuth
   * @default 'http://localhost:3000/api/auth/callback/cognito'
   */
  readonly callbackUrl?: string;
  /**
   * Domain prefix for Cognito hosted UI
   * @default 'menkoverse-dev'
   */
  readonly domainPrefix?: string;
  /**
   * GitHub repository URL for App Runner
   * @default 'https://github.com/2507-aws-himawari/menkoverse'
   */
  readonly repositoryUrl?: string;
  /**
   * GitHub branch for App Runner
   * @default 'main'
   */
  readonly branch?: string;
  /**
   * Optional connection ARN for App Runner
   */
  readonly connectionArn?: string;
  /**
   * Database name
   * @default 'menkoverse'
   */
  readonly databaseName?: string;
  /**
   * Monthly budget limit in USD
   * @default 50 for dev, 200 for prod
   */
  readonly monthlyBudgetLimit?: number;
}

export class MenkoverseApp extends cdk.Stack {
  public readonly coreStack: CoreStack;
  public readonly authStack: AuthStack;
  public readonly dataStack: DataStack;
  public readonly appStack: AppStack;
  public readonly realtimeStack: RealtimeStack;

  public constructor(scope: cdk.App, id: string, props: MenkoverseStackProps = {}) {
    super(scope, id, props);

    const envName = props.environment ?? 'dev';
    const stackNamePrefix = envName === 'prod' ? 'Menkoverse' : `Menkoverse-${envName}`;

    // 1. Core Stack (VPC, Security Groups)
    this.coreStack = new CoreStack(scope, `${stackNamePrefix}-Core`, {
      ...props,
      environment: envName,
    });

    // 2. Auth Stack (Cognito) - Can be deployed in parallel with DataStack
    this.authStack = new AuthStack(scope, `${stackNamePrefix}-Auth`, {
      ...props,
      environment: envName,
    });

    // 3. Data Stack (RDS) - Depends on CoreStack
    this.dataStack = new DataStack(scope, `${stackNamePrefix}-Data`, {
      ...props,
      vpc: this.coreStack.vpc,
      rdsSecurityGroup: this.coreStack.rdsSecurityGroup,
      environment: envName,
      databaseName: props.databaseName,
    });

    // 4. Realtime Stack (DynamoDB + WebSocket) - Independent
    this.realtimeStack = new RealtimeStack(scope, `${stackNamePrefix}-Realtime`, {
      ...props,
      environment: envName,
    });

    // 5. App Stack (App Runner) - Depends on all other stacks
    this.appStack = new AppStack(scope, `${stackNamePrefix}-App`, {
      ...props,
      vpc: this.coreStack.vpc,
      appRunnerSecurityGroup: this.coreStack.appRunnerSecurityGroup,
      dbCredentialsSecret: this.dataStack.dbCredentialsSecret,
      databaseClusterEndpoint: this.dataStack.databaseCluster.clusterEndpoint.hostname,
      databaseClusterPort: this.dataStack.databaseCluster.clusterEndpoint.port.toString(),
      databaseName: props.databaseName ?? 'menkoverse',
      userPoolClientId: this.authStack.userPoolClientId,
      cognitoIssuer: this.authStack.cognitoIssuer,
      environment: envName,
      monthlyBudgetLimit: props.monthlyBudgetLimit,
    });

    // Dependencies
    this.dataStack.addDependency(this.coreStack);
    this.appStack.addDependency(this.coreStack);
    this.appStack.addDependency(this.authStack);
    this.appStack.addDependency(this.dataStack);

    // Cross-stack outputs (for debugging and external reference)
    new cdk.CfnOutput(this, 'ApplicationUrl', {
      key: 'ApplicationUrl',
      description: 'Main application URL',
      value: `https://${this.appStack.appRunnerService.attrServiceUrl}`,
    });

    new cdk.CfnOutput(this, 'HostedUIUrl', {
      key: 'HostedUIUrl',
      description: 'Cognito Hosted UI URL',
      value: this.authStack.hostedUiUrl,
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      key: 'WebSocketUrl',
      description: 'WebSocket API URL for real-time communication',
      value: `${this.realtimeStack.webSocketApi.apiEndpoint}/${envName}`,
    });
  }
}

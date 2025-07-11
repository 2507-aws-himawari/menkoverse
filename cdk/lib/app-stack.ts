import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface AppStackProps extends cdk.StackProps {
  /**
   * VPC for App Runner VPC Connector
   */
  readonly vpc: ec2.Vpc;
  /**
   * Security Group for App Runner
   */
  readonly appRunnerSecurityGroup: ec2.SecurityGroup;
  /**
   * Database credentials secret
   */
  readonly dbCredentialsSecret: secretsmanager.Secret;
  /**
   * Database cluster endpoint
   */
  readonly databaseClusterEndpoint: string;
  /**
   * Database cluster port
   */
  readonly databaseClusterPort: string;
  /**
   * Database name
   */
  readonly databaseName: string;
  /**
   * Cognito User Pool Client ID
   */
  readonly userPoolClientId: string;
  /**
   * Cognito Issuer URL
   */
  readonly cognitoIssuer: string;
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
   * Connection ARN for App Runner
   */
  readonly connectionArn?: string;
  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  readonly environment?: string;
  /**
   * Monthly budget limit in USD
   * @default 50
   */
  readonly monthlyBudgetLimit?: number;
}

export class AppStack extends cdk.Stack {
  /**
   * App Runner Service
   */
  public readonly appRunnerService: apprunner.CfnService;

  public constructor(scope: cdk.App, id: string, props: AppStackProps) {
    super(scope, id, props);

    const envName = props.environment ?? 'dev';
    const repositoryUrl = props.repositoryUrl ?? 'https://github.com/2507-aws-himawari/menkoverse';
    const branch = props.branch ?? 'main';
    const connectionArn = props.connectionArn ?? "arn:aws:apprunner:ap-northeast-1:073825268718:connection/himawari/9372ad1b3cba4a7d84c6798e4450df0f";
    const monthlyBudgetLimit = props.monthlyBudgetLimit ?? (envName === 'prod' ? 200 : 50);

    // VPC Connector for App Runner
    const vpcConnector = new apprunner.CfnVpcConnector(this, 'VpcConnector', {
      subnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      securityGroups: [props.appRunnerSecurityGroup.securityGroupId],
      vpcConnectorName: `menkoverse-vpc-connector-${envName}`,
    });

    // App Runner Instance Role
    const appRunnerInstanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // Grant App Runner access to secrets
    props.dbCredentialsSecret.grantRead(appRunnerInstanceRole);

    // App Runner Service
    this.appRunnerService = new apprunner.CfnService(this, 'AppRunnerService', {
      serviceName: `menkoverse-app-${envName}`,
      sourceConfiguration: {
        authenticationConfiguration: {
          connectionArn: connectionArn,
        },
        autoDeploymentsEnabled: true,
        codeRepository: {
          repositoryUrl: repositoryUrl,
          sourceCodeVersion: {
            type: 'BRANCH',
            value: branch,
          },
          sourceDirectory: 'frontend',
          codeConfiguration: {
            configurationSource: 'API',
            codeConfigurationValues: {
              runtime: 'NODEJS_18',
              buildCommand: "export AUTH_SECRET='dummy' && export DATABASE_URL='postgresql://dummy:dummy@dummy:5432/dummy' && export AUTH_COGNITO_CLIENT_ID='dummy' && export AUTH_COGNITO_CLIENT_SECRET='dummy' && export AUTH_COGNITO_ISSUER='dummy' && npm ci && npm run build",
              startCommand: 'npm start',
              port: '3000',
              runtimeEnvironmentVariables: [
                {
                  name: 'NODE_ENV',
                  value: 'production',
                },
                {
                  name: 'SKIP_ENV_VALIDATION',
                  value: 'true',
                },
                {
                  name: 'DB_HOST',
                  value: props.databaseClusterEndpoint,
                },
                {
                  name: 'DB_PORT',
                  value: props.databaseClusterPort,
                },
                {
                  name: 'DB_USER',
                  value: 'postgres',
                },
                {
                  name: 'DB_NAME',
                  value: props.databaseName,
                },
                {
                  name: 'DB_CREDENTIALS_SECRET_ARN',
                  value: props.dbCredentialsSecret.secretArn,
                },
                {
                  name: 'AUTH_COGNITO_ISSUER',
                  value: props.cognitoIssuer,
                },
                {
                  name: 'AUTH_COGNITO_CLIENT_ID',
                  value: props.userPoolClientId,
                },
              ],
            },
          },
        },
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: appRunnerInstanceRole.roleArn,
        cpu: envName === 'prod' ? '1024' : '512',
        memory: envName === 'prod' ? '2048' : '1024',
      },
    });

    // Make sure VPC connector is created before App Runner service
    this.appRunnerService.addDependency(vpcConnector);

    // Cost monitoring budget
    const costBudget = new budgets.CfnBudget(this, 'MenkoverseCostBudget', {
      budget: {
        budgetName: `Menkoverse-${envName}-Monthly-Budget`,
        budgetLimit: {
          amount: monthlyBudgetLimit,
          unit: 'USD',
        },
        timeUnit: 'MONTHLY',
        budgetType: 'COST',
        costFilters: {
          'TagKeyValue': [`aws:cloudformation:stack-name$${this.stackName}`],
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 80,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'ulxsth@gmail.com',
            },
          ],
        },
        {
          notification: {
            notificationType: 'FORECASTED',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: [
            {
              subscriptionType: 'EMAIL',
              address: 'ulxsth@gmail.com',
            },
          ],
        },
      ],
    });

    // CloudWatch Logs for App Runner monitoring
    new logs.LogGroup(this, 'AppRunnerLogsGroup', {
      logGroupName: `/aws/apprunner/${envName}/menkoverse-app`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Outputs
    new cdk.CfnOutput(this, 'CfnOutputAppRunnerServiceUrl', {
      key: 'AppRunnerServiceUrl',
      description: 'App Runner Service URL',
      exportName: `${this.stackName}-AppRunnerServiceUrl`,
      value: `https://${this.appRunnerService.attrServiceUrl}`,
    });

    new cdk.CfnOutput(this, 'CfnOutputAppRunnerServiceId', {
      key: 'AppRunnerServiceId',
      description: 'App Runner Service ID',
      exportName: `${this.stackName}-AppRunnerServiceId`,
      value: this.appRunnerService.attrServiceId,
    });
  }
}

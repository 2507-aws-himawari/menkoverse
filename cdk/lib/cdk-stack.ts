import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as budgets from 'aws-cdk-lib/aws-budgets';

export interface CdkStackProps extends cdk.StackProps {
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
}

export class CdkStack extends cdk.Stack {
  /**
   * Cognito User Pool ID
   */
  public readonly userPoolId;
  /**
   * Cognito User Pool Client ID
   */
  public readonly userPoolClientId;
  /**
   * Cognito Identity Pool ID
   */
  public readonly identityPoolId;
  /**
   * Cognito Issuer URL for auth.js
   */
  public readonly cognitoIssuer;
  /**
   * Cognito User Pool Domain
   */
  public readonly userPoolDomain;
  /**
   * Cognito Hosted UI URL
   */
  public readonly hostedUiUrl;
  /**
   * RDS Database Cluster
   */
  public readonly databaseCluster: rds.DatabaseCluster;
  /**
   * App Runner Service
   */
  public readonly appRunnerService: apprunner.CfnService;
  /**
   * VPC
   */
  public readonly vpc: ec2.Vpc;

  public constructor(scope: cdk.App, id: string, props: CdkStackProps = {}) {
    super(scope, id, props);

    // Applying default props
    props = {
      ...props,
      callbackUrl: props.callbackUrl ?? 'http://localhost:3000/api/auth/callback/cognito',
      domainPrefix: props.domainPrefix ?? 'menkoverse-dev',
      repositoryUrl: props.repositoryUrl ?? 'https://github.com/2507-aws-himawari/menkoverse',
      branch: props.branch ?? 'main',
      connectionArn: props.connectionArn ?? "arn:aws:apprunner:ap-northeast-1:073825268718:connection/himawari/9372ad1b3cba4a7d84c6798e4450df0f",
    };

    // Resources
    const dummyParameter = new ssm.CfnParameter(this, 'DummyParameter', {
      name: '/dummy/placeholder',
      value: 'placeholder',
      type: 'String',
    });

    const userPool = new cognito.CfnUserPool(this, 'UserPool', {
      userPoolName: 'MenkoverseUserPool',
      autoVerifiedAttributes: [
        'email',
      ],
      aliasAttributes: [
        'email',
        'preferred_username',
      ],
      schema: [
        {
          name: 'email',
          attributeDataType: 'String',
          required: true,
          mutable: true,
        },
        {
          name: 'preferred_username',
          attributeDataType: 'String',
          required: false,
          mutable: true,
        },
      ],
      verificationMessageTemplate: {
        defaultEmailOption: 'CONFIRM_WITH_CODE',
        emailMessage: 'Your Menkoverse verification code is {####}',
        emailSubject: 'Verify your Menkoverse account',
      },
      emailConfiguration: {
        emailSendingAccount: 'COGNITO_DEFAULT',
      },
      policies: {
        passwordPolicy: {
          minimumLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false,
        },
      },
    });

    const userPoolClient = new cognito.CfnUserPoolClient(this, 'UserPoolClient', {
      clientName: 'MenkoverseUserPoolClient',
      userPoolId: userPool.ref,
      generateSecret: true,
      allowedOAuthFlows: [
        'code',
      ],
      allowedOAuthScopes: [
        'email',
        'openid',
        'profile',
      ],
      allowedOAuthFlowsUserPoolClient: true,
      callbackUrLs: [
        props.callbackUrl!,
        `https://${props.domainPrefix!}.auth.${this.region}.amazoncognito.com/oauth2/idpresponse`,
      ],
      supportedIdentityProviders: [
        'COGNITO',
      ],
    });

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      identityPoolName: 'MenkoverseIdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.ref,
          providerName: userPool.attrProviderName,
        },
      ],
    });

    const userPoolDomain = new cognito.CfnUserPoolDomain(this, 'UserPoolDomain', {
      domain: props.domainPrefix!,
      userPoolId: userPool.ref,
    });
    userPoolDomain.addDependency(userPoolClient);

    const cognitoAuthenticatedRole = new iam.CfnRole(this, 'CognitoAuthenticatedRole', {
      roleName: 'Cognito_MenkoverseAuth_Role',
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                'cognito-identity.amazonaws.com:aud': identityPool.ref,
              },
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated',
              },
            },
          },
        ],
      },
      policies: [
        {
          policyName: 'CognitoAuthenticatedPolicy',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'mobileanalytics:PutEvents',
                  'cognito-sync:*',
                  'cognito-identity:*',
                ],
                Resource: '*',
              },
            ],
          },
        },
      ],
    });

    const identityPoolRoleAttachment = new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: identityPool.ref,
      roles: {
        authenticated: cognitoAuthenticatedRole.attrArn,
      },
    });

    // VPC for RDS and App Runner
    this.vpc = new ec2.Vpc(this, 'MenkoverseVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    // Security Group for App Runner VPC Connector
    const appRunnerSecurityGroup = new ec2.SecurityGroup(this, 'AppRunnerSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for App Runner VPC Connector',
      allowAllOutbound: true,
    });

    // Allow App Runner to connect to RDS
    rdsSecurityGroup.addIngressRule(
      appRunnerSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow App Runner to connect to PostgreSQL'
    );

    // Database credentials secret
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DbCredentials', {
      description: 'RDS PostgreSQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // RDS Aurora PostgreSQL Cluster
    this.databaseCluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      serverlessV2MinCapacity: 0.5, // 最小ACU（開発環境用）
      serverlessV2MaxCapacity: 2,   // 最大ACU（トラフィック増加時）
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      vpc: this.vpc,
      securityGroups: [rdsSecurityGroup],
      defaultDatabaseName: 'menkoverse',
      backup: {
        retention: cdk.Duration.days(7),
      },
    });

    // VPC Connector for App Runner
    const vpcConnector = new apprunner.CfnVpcConnector(this, 'VpcConnector', {
      subnets: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      securityGroups: [appRunnerSecurityGroup.securityGroupId],
      vpcConnectorName: 'menkoverse-vpc-connector',
    });

    // App Runner Instance Role
    const appRunnerInstanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // Grant App Runner access to secrets
    dbCredentialsSecret.grantRead(appRunnerInstanceRole);

    // App Runner Service
    this.appRunnerService = new apprunner.CfnService(this, 'AppRunnerService', {
      serviceName: 'menkoverse-app',
      sourceConfiguration: {
        authenticationConfiguration: {
          connectionArn: props.connectionArn!,
        },
        autoDeploymentsEnabled: true,
        codeRepository: {
          repositoryUrl: props.repositoryUrl!,
          sourceCodeVersion: {
            type: 'BRANCH',
            value: props.branch!,
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
        cpu: '512',
        memory: '1024',
      },
    });

    // Make sure VPC connector is created before App Runner service
    this.appRunnerService.addDependency(vpcConnector);

    // Cost monitoring budget
    const costBudget = new budgets.CfnBudget(this, 'MenkoverseCostBudget', {
      budget: {
        budgetName: `Menkoverse-${this.stackName}-Monthly-Budget`,
        budgetLimit: {
          amount: 50, // $50/month budget (optimized)
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
            threshold: 80, // Alert at 80% of budget
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
            threshold: 100, // Alert when forecasted to exceed budget
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

    // Outputs
    this.userPoolId = userPool.ref;
    new cdk.CfnOutput(this, 'CfnOutputUserPoolId', {
      key: 'UserPoolId',
      description: 'Cognito User Pool ID',
      exportName: `${this.stackName}-UserPoolId`,
      value: this.userPoolId!.toString(),
    });
    this.userPoolClientId = userPoolClient.ref;
    new cdk.CfnOutput(this, 'CfnOutputUserPoolClientId', {
      key: 'UserPoolClientId',
      description: 'Cognito User Pool Client ID',
      exportName: `${this.stackName}-UserPoolClientId`,
      value: this.userPoolClientId!.toString(),
    });
    this.identityPoolId = identityPool.ref;
    new cdk.CfnOutput(this, 'CfnOutputIdentityPoolId', {
      key: 'IdentityPoolId',
      description: 'Cognito Identity Pool ID',
      exportName: `${this.stackName}-IdentityPoolId`,
      value: this.identityPoolId!.toString(),
    });
    this.cognitoIssuer = `https://cognito-idp.${this.region}.amazonaws.com/${userPool.ref}`;
    new cdk.CfnOutput(this, 'CfnOutputCognitoIssuer', {
      key: 'CognitoIssuer',
      description: 'Cognito Issuer URL for auth.js',
      exportName: `${this.stackName}-CognitoIssuer`,
      value: this.cognitoIssuer!.toString(),
    });
    this.userPoolDomain = userPoolDomain.ref;
    new cdk.CfnOutput(this, 'CfnOutputUserPoolDomain', {
      key: 'UserPoolDomain',
      description: 'Cognito User Pool Domain',
      exportName: `${this.stackName}-UserPoolDomain`,
      value: this.userPoolDomain!.toString(),
    });
    this.hostedUiUrl = `https://${props.domainPrefix!}.auth.${this.region}.amazoncognito.com`;
    new cdk.CfnOutput(this, 'CfnOutputHostedUIUrl', {
      key: 'HostedUIUrl',
      description: 'Cognito Hosted UI URL',
      exportName: `${this.stackName}-HostedUIUrl`,
      value: this.hostedUiUrl!.toString(),
    });

    // Database outputs
    new cdk.CfnOutput(this, 'CfnOutputDatabaseClusterEndpoint', {
      key: 'DatabaseClusterEndpoint',
      description: 'RDS Aurora PostgreSQL Cluster Endpoint',
      exportName: `${this.stackName}-DatabaseClusterEndpoint`,
      value: this.databaseCluster.clusterEndpoint.hostname,
    });

    new cdk.CfnOutput(this, 'CfnOutputDatabaseClusterPort', {
      key: 'DatabaseClusterPort',
      description: 'RDS Aurora PostgreSQL Cluster Port',
      exportName: `${this.stackName}-DatabaseClusterPort`,
      value: this.databaseCluster.clusterEndpoint.port.toString(),
    });

    new cdk.CfnOutput(this, 'CfnOutputDatabaseName', {
      key: 'DatabaseName',
      description: 'RDS Aurora PostgreSQL Database Name',
      exportName: `${this.stackName}-DatabaseName`,
      value: 'menkoverse',
    });

    new cdk.CfnOutput(this, 'CfnOutputDatabaseCredentialsSecret', {
      key: 'DatabaseCredentialsSecret',
      description: 'RDS Database Credentials Secret ARN',
      exportName: `${this.stackName}-DatabaseCredentialsSecret`,
      value: dbCredentialsSecret.secretArn,
    });

    // App Runner outputs
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

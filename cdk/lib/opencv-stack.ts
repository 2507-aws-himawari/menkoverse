import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface OpenCVStackProps extends cdk.StackProps {
  /**
   * VPC Connector ARN from App Stack
   */
  readonly vpcConnectorArn: string;
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
   * Frontend App Runner Service URL for CORS
   */
  readonly frontendUrl?: string;
}

export class OpenCVStack extends cdk.Stack {
  /**
   * OpenCV App Runner Service
   */
  public readonly appRunnerService: apprunner.CfnService;

  public constructor(scope: cdk.App, id: string, props: OpenCVStackProps) {
    super(scope, id, props);

    const envName = props.environment ?? 'dev';
    const repositoryUrl = props.repositoryUrl ?? 'https://github.com/2507-aws-himawari/menkoverse';
    const branch = props.branch ?? 'main';
    const connectionArn = props.connectionArn ?? "arn:aws:apprunner:ap-northeast-1:073825268718:connection/himawari/9372ad1b3cba4a7d84c6798e4450df0f";

    // App Runner Instance Role
    const appRunnerInstanceRole = new iam.Role(this, 'OpenCVAppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // App Runner Service
    this.appRunnerService = new apprunner.CfnService(this, 'OpenCVAppRunnerService', {
      serviceName: `opencv-api-${envName}`,
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
          sourceDirectory: 'opencv',
          codeConfiguration: {
            configurationSource: 'REPOSITORY',
          },
        },
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: 'VPC',
          vpcConnectorArn: props.vpcConnectorArn,
        },
      },
      instanceConfiguration: {
        instanceRoleArn: appRunnerInstanceRole.roleArn,
        cpu: envName === 'prod' ? '1024' : '512',
        memory: envName === 'prod' ? '2048' : '1024',
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/health',
        interval: 20,
        timeout: 10,
        healthyThreshold: 2,
        unhealthyThreshold: 5,
      },
    });

    // CloudWatch Logs for App Runner monitoring
    new logs.LogGroup(this, 'OpenCVAppRunnerLogsGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Outputs
    new cdk.CfnOutput(this, 'CfnOutputOpenCVAppRunnerServiceUrl', {
      key: 'OpenCVAppRunnerServiceUrl',
      description: 'OpenCV App Runner Service URL',
      exportName: `${this.stackName}-OpenCVAppRunnerServiceUrl`,
      value: `https://${this.appRunnerService.attrServiceUrl}`,
    });

    new cdk.CfnOutput(this, 'CfnOutputOpenCVAppRunnerServiceId', {
      key: 'OpenCVAppRunnerServiceId',
      description: 'OpenCV App Runner Service ID',
      exportName: `${this.stackName}-OpenCVAppRunnerServiceId`,
      value: this.appRunnerService.attrServiceId,
    });
  }
}

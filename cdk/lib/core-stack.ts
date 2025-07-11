import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface CoreStackProps extends cdk.StackProps {
  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  readonly environment?: string;
}

export class CoreStack extends cdk.Stack {
  /**
   * VPC for all resources
   */
  public readonly vpc: ec2.Vpc;

  /**
   * Security Group for RDS
   */
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  /**
   * Security Group for App Runner
   */
  public readonly appRunnerSecurityGroup: ec2.SecurityGroup;

  public constructor(scope: cdk.App, id: string, props: CoreStackProps = {}) {
    super(scope, id, props);

    const envName = props.environment ?? 'dev';

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
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    // Security Group for App Runner VPC Connector
    this.appRunnerSecurityGroup = new ec2.SecurityGroup(this, 'AppRunnerSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for App Runner VPC Connector',
      allowAllOutbound: true,
    });

    // Allow App Runner to connect to RDS
    this.rdsSecurityGroup.addIngressRule(
      this.appRunnerSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow App Runner to connect to PostgreSQL'
    );

    // VPC Flow Logs for monitoring
    const vpcFlowLogsGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${envName}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    new ec2.FlowLog(this, 'VpcFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogsGroup),
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      key: 'VpcId',
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
      value: this.vpc.vpcId,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      key: 'PrivateSubnetIds',
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
      value: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds.join(','),
    });

    new cdk.CfnOutput(this, 'RdsSecurityGroupId', {
      key: 'RdsSecurityGroupId',
      description: 'RDS Security Group ID',
      exportName: `${this.stackName}-RdsSecurityGroupId`,
      value: this.rdsSecurityGroup.securityGroupId,
    });

    new cdk.CfnOutput(this, 'AppRunnerSecurityGroupId', {
      key: 'AppRunnerSecurityGroupId',
      description: 'App Runner Security Group ID',
      exportName: `${this.stackName}-AppRunnerSecurityGroupId`,
      value: this.appRunnerSecurityGroup.securityGroupId,
    });
  }
}

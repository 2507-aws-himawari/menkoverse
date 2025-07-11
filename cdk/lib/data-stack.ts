import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface DataStackProps extends cdk.StackProps {
  /**
   * VPC to deploy RDS in
   */
  readonly vpc: ec2.Vpc;
  /**
   * Security Group for RDS
   */
  readonly rdsSecurityGroup: ec2.SecurityGroup;
  /**
   * Environment name for resource naming
   * @default 'dev'
   */
  readonly environment?: string;
  /**
   * Database name
   * @default 'menkoverse'
   */
  readonly databaseName?: string;
}

export class DataStack extends cdk.Stack {
  /**
   * RDS Database Cluster
   */
  public readonly databaseCluster: rds.DatabaseCluster;

  /**
   * Database credentials secret
   */
  public readonly dbCredentialsSecret: secretsmanager.Secret;

  public constructor(scope: cdk.App, id: string, props: DataStackProps) {
    super(scope, id, props);

    const envName = props.environment ?? 'dev';
    const databaseName = props.databaseName ?? 'menkoverse';

    // Database credentials secret
    this.dbCredentialsSecret = new secretsmanager.Secret(this, 'DbCredentials', {
      description: `RDS PostgreSQL credentials for ${envName}`,
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
      credentials: rds.Credentials.fromSecret(this.dbCredentialsSecret),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      serverlessV2MinCapacity: envName === 'prod' ? 1 : 0.5,
      serverlessV2MaxCapacity: envName === 'prod' ? 8 : 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      vpc: props.vpc,
      securityGroups: [props.rdsSecurityGroup],
      defaultDatabaseName: databaseName,
      backup: {
        retention: envName === 'prod' ? cdk.Duration.days(30) : cdk.Duration.days(7),
      },
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Enhanced monitoring for production
    if (envName === 'prod') {
      // Performance Insights is automatically enabled in newer versions
      // Additional CloudWatch alarms for production
      new logs.LogGroup(this, 'DatabaseSlowQueryLogs', {
        logGroupName: `/aws/rds/cluster/${this.databaseCluster.clusterIdentifier}/slowquery`,
        retention: logs.RetentionDays.ONE_WEEK,
      });
    }

    // Outputs
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
      value: databaseName,
    });

    new cdk.CfnOutput(this, 'CfnOutputDatabaseCredentialsSecret', {
      key: 'DatabaseCredentialsSecret',
      description: 'RDS Database Credentials Secret ARN',
      exportName: `${this.stackName}-DatabaseCredentialsSecret`,
      value: this.dbCredentialsSecret.secretArn,
    });
  }
}

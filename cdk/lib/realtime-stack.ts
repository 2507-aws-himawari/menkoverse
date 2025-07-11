import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';

export interface RealtimeStackProps extends cdk.StackProps {
  /**
   * Environment name (dev, staging, prod)
   * @default 'dev'
   */
  readonly environment?: string;
}

export class RealtimeStack extends cdk.Stack {
  /**
   * DynamoDB Game Table
   */
  public readonly gameTable: dynamodb.Table;
  
  /**
   * WebSocket API
   */
  public readonly webSocketApi: apigatewayv2.WebSocketApi;
  
  /**
   * WebSocket API Stage
   */
  public readonly webSocketStage: apigatewayv2.WebSocketStage;
  
  /**
   * WebSocket Handler Lambda
   */
  public readonly webSocketHandler: lambda.Function;
  
  /**
   * Stream Processor Lambda
   */
  public readonly streamProcessor: lambda.Function;

  constructor(scope: cdk.App, id: string, props: RealtimeStackProps = {}) {
    super(scope, id, props);

    // Apply default props
    const environment = props.environment ?? 'dev';

    // ============================================
    // DynamoDB Game Table
    // ============================================
    
    this.gameTable = new dynamodb.Table(this, 'GameTable', {
      tableName: `menkoverse-game-${environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      pointInTimeRecovery: true,
      removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY
    });

    // GSI for connection management
    this.gameTable.addGlobalSecondaryIndex({
      indexName: 'GSI1-PlayerIndex',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING
      }
    });

    // ============================================
    // WebSocket API
    // ============================================
    
    this.webSocketApi = new apigatewayv2.WebSocketApi(this, 'GameWebSocketApi', {
      apiName: `menkoverse-game-websocket-${environment}`,
      description: `Menkoverse Game WebSocket API (${environment})`
    });

    this.webSocketStage = new apigatewayv2.WebSocketStage(this, 'GameWebSocketStage', {
      webSocketApi: this.webSocketApi,
      stageName: environment,
      autoDeploy: true
    });

    // ============================================
    // Lambda Functions
    // ============================================
    
    // WebSocket Handler Lambda
    this.webSocketHandler = new lambda.Function(this, 'WebSocketHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/websocket-handler'),
      environment: {
        GAME_TABLE_NAME: this.gameTable.tableName,
        ENVIRONMENT: environment
      },
      timeout: cdk.Duration.seconds(30)
    });

    // Stream Processor Lambda
    this.streamProcessor = new lambda.Function(this, 'StreamProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/stream-processor'),
      environment: {
        WEBSOCKET_API_ENDPOINT: `${this.webSocketApi.apiEndpoint}/${this.webSocketStage.stageName}`,
        GAME_TABLE_NAME: this.gameTable.tableName,
        ENVIRONMENT: environment
      },
      timeout: cdk.Duration.seconds(30)
    });

    // ============================================
    // Permissions
    // ============================================
    
    this.gameTable.grantReadWriteData(this.webSocketHandler);
    this.gameTable.grantReadData(this.streamProcessor);
    this.webSocketApi.grantManageConnections(this.streamProcessor);

    // ============================================
    // Event Sources
    // ============================================
    
    // DynamoDB Stream Event Source
    this.streamProcessor.addEventSource(
      new eventsources.DynamoEventSource(this.gameTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5)
      })
    );

    // ============================================
    // WebSocket API Routes
    // ============================================
    
    const connectIntegration = new WebSocketLambdaIntegration(
      'ConnectIntegration',
      this.webSocketHandler
    );

    const disconnectIntegration = new WebSocketLambdaIntegration(
      'DisconnectIntegration',
      this.webSocketHandler
    );

    const defaultIntegration = new WebSocketLambdaIntegration(
      'DefaultIntegration',
      this.webSocketHandler
    );

    this.webSocketApi.addRoute('$connect', { integration: connectIntegration });
    this.webSocketApi.addRoute('$disconnect', { integration: disconnectIntegration });
    this.webSocketApi.addRoute('$default', { integration: defaultIntegration });

    // ============================================
    // Outputs
    // ============================================
    
    new cdk.CfnOutput(this, 'CfnOutputGameTableName', {
      key: 'GameTableName',
      description: 'DynamoDB Game Table Name',
      exportName: `${this.stackName}-GameTableName`,
      value: this.gameTable.tableName,
    });

    new cdk.CfnOutput(this, 'CfnOutputGameTableArn', {
      key: 'GameTableArn',
      description: 'DynamoDB Game Table ARN',
      exportName: `${this.stackName}-GameTableArn`,
      value: this.gameTable.tableArn,
    });

    new cdk.CfnOutput(this, 'CfnOutputWebSocketApiEndpoint', {
      key: 'WebSocketApiEndpoint',
      description: 'WebSocket API Endpoint',
      exportName: `${this.stackName}-WebSocketApiEndpoint`,
      value: this.webSocketApi.apiEndpoint,
    });

    new cdk.CfnOutput(this, 'CfnOutputWebSocketApiId', {
      key: 'WebSocketApiId',
      description: 'WebSocket API ID',
      exportName: `${this.stackName}-WebSocketApiId`,
      value: this.webSocketApi.apiId,
    });

    new cdk.CfnOutput(this, 'CfnOutputWebSocketUrl', {
      key: 'WebSocketUrl',
      description: 'WebSocket Connection URL',
      exportName: `${this.stackName}-WebSocketUrl`,
      value: `${this.webSocketApi.apiEndpoint}/${this.webSocketStage.stageName}`,
    });

    // ============================================
    // Tags
    // ============================================
    
    cdk.Tags.of(this).add('Project', 'Menkoverse');
    cdk.Tags.of(this).add('Component', 'Realtime');
    cdk.Tags.of(this).add('Environment', environment);
  }
}

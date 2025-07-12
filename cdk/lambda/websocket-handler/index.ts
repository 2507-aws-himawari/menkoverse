import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamodb = new DynamoDB.DocumentClient();

// websocket の接続処理
export const handler: APIGatewayProxyHandler = async (event) => {
  const { requestContext } = event;
  const { connectionId, routeKey } = requestContext;

  if (!connectionId || !routeKey) {
    console.error('Missing connectionId or routeKey in request context');
    return { statusCode: 400, body: 'Bad Request' };
  }
  
  console.log('WebSocket event received:', {
    connectionId,
    routeKey,
    queryStringParameters: event.queryStringParameters
  });
  
  try {
    switch (routeKey) {
      case '$connect':
        await handleConnect(connectionId, event);
        break;
      case '$disconnect':
        await handleDisconnect(connectionId);
        break;
      default:
        await handleMessage(connectionId, event);
        break;
    }
    
    return { statusCode: 200, body: 'Success' };
  } catch (error) {
    console.error('WebSocket error:', error);
    return { statusCode: 500, body: 'Internal server error' };
  }
};

async function handleConnect(connectionId: string, event: any) {
  const { roomId, playerId } = event.queryStringParameters || {};
  
  console.log('Handling connection:', { connectionId, roomId, playerId });
  
  if (!roomId || !playerId) {
    console.error('roomId and playerId are required');
    throw new Error('roomId and playerId are required');
  }
  
  // Save connection info
  await dynamodb.put({
    TableName: process.env.GAME_TABLE_NAME!,
    Item: {
      PK: `ROOM#${roomId}`,
      SK: `CONNECTION#${connectionId}`,
      GSI1PK: `PLAYER#${playerId}`,
      GSI1SK: `CONNECTION#${connectionId}`,
      entityType: 'connection',
      connectionId,
      roomId,
      playerId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      isActive: true
    }
  }).promise();
  
  console.log(`Connection established: ${connectionId} for player ${playerId} in room ${roomId}`);
}

async function handleDisconnect(connectionId: string) {
  console.log('Handling disconnection:', { connectionId });
  
  try {
    // Find connection by scanning (simplified for minimal implementation)
    const scanResult = await dynamodb.scan({
      TableName: process.env.GAME_TABLE_NAME!,
      FilterExpression: '#sk = :sk',
      ExpressionAttributeNames: {
        '#sk': 'SK'
      },
      ExpressionAttributeValues: {
        ':sk': `CONNECTION#${connectionId}`
      }
    }).promise();
    
    // Delete found connections
    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await dynamodb.delete({
          TableName: process.env.GAME_TABLE_NAME!,
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }).promise();
        
        console.log(`Connection deleted: ${connectionId} from room ${item.roomId}`);
      }
    }
    
  } catch (error) {
    console.error('Error handling disconnection:', error);
  }
  
  console.log(`Connection disconnected: ${connectionId}`);
}

async function handleMessage(connectionId: string, event: any) {
  const body = JSON.parse(event.body || '{}');
  console.log('Message received:', { connectionId, body });
  
  // Handle different message types
  switch (body.action) {
    case 'ping':
      console.log('Ping received from:', connectionId);
      // Update last activity
      // TODO: Implement ping response
      break;
    case 'joinRoom':
      console.log('Join room request:', body);
      await handleJoinRoomMessage(connectionId, body);
      break;
    default:
      console.log('Unknown action:', body.action);
  }
}

async function handleJoinRoomMessage(connectionId: string, body: any) {
  const { roomId, playerId, userId } = body;
  
  if (!roomId || !playerId || !userId) {
    console.error('Missing required fields for joinRoom:', { roomId, playerId, userId });
    return;
  }
  
  try {
    // Create player record in DynamoDB
    const timestamp = Date.now();
    await dynamodb.put({
      TableName: process.env.GAME_TABLE_NAME!,
      Item: {
        PK: `ROOM#${roomId}`,
        SK: `PLAYER#${playerId}`,
        entityType: 'player',
        playerId,
        userId,
        roomId,
        joinedAt: timestamp,
        isActive: true
      }
    }).promise();
    
    console.log(`Player ${playerId} joined room ${roomId} via WebSocket`);
  } catch (error) {
    console.error('Error handling join room message:', error);
  }
}

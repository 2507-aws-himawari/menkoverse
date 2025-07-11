import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { ApiGatewayManagementApi, DynamoDB } from 'aws-sdk';

const apiGateway = new ApiGatewayManagementApi({
  endpoint: process.env.WEBSOCKET_API_ENDPOINT
});
const dynamodb = new DynamoDB.DocumentClient();

// DynamoDB変更の検知と配信
export const handler = async (event: DynamoDBStreamEvent) => {
  console.log('DynamoDB Stream event received:', JSON.stringify(event, null, 2));
  
  const promises = event.Records.map(processRecord);
  const results = await Promise.allSettled(promises);
  
  // Log results
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Record ${index} processing failed:`, result.reason);
    }
  });
  
  console.log(`Processed ${event.Records.length} records`);
};

async function processRecord(record: DynamoDBRecord) {
  try {
    console.log('Processing record:', {
      eventName: record.eventName,
      pk: record.dynamodb?.Keys?.PK?.S,
      sk: record.dynamodb?.Keys?.SK?.S
    });
    
    // Skip connection management records
    if (record.dynamodb?.Keys?.SK?.S?.startsWith('CONNECTION#')) {
      console.log('Skipping connection record');
      return;
    }
    
    const gameEvent = parseGameEvent(record);
    if (!gameEvent) {
      console.log('No game event parsed from record');
      return;
    }
    
    console.log('Game event parsed:', gameEvent);
    
    // Get active connections for the room
    const connections = await getActiveConnections(gameEvent.roomId);
    console.log(`Found ${connections.length} active connections for room ${gameEvent.roomId}`);
    
    // Send to all connected players
    const sendPromises = connections.map(conn => 
      sendToConnection(conn.connectionId, gameEvent)
    );
    
    const sendResults = await Promise.allSettled(sendPromises);
    
    // Log send results
    sendResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send to connection ${connections[index].connectionId}:`, result.reason);
      } else {
        console.log(`Successfully sent to connection ${connections[index].connectionId}`);
      }
    });
    
  } catch (error) {
    console.error('Stream processing error:', error);
  }
}

function parseGameEvent(record: DynamoDBRecord): any {
  const { eventName, dynamodb: db } = record;
  
  if (!db?.Keys?.PK?.S || !db?.Keys?.SK?.S) {
    console.log('Missing PK or SK in record');
    return null;
  }
  
  const pk = db.Keys.PK.S;
  const sk = db.Keys.SK.S;
  
  // Extract roomId from PK
  const roomIdMatch = pk.match(/^ROOM#(.+)$/);
  if (!roomIdMatch) {
    console.log('PK does not match ROOM pattern:', pk);
    return null;
  }
  
  const roomId = roomIdMatch[1];
  
  // Create event based on change type
  const event = {
    type: eventName, // INSERT, MODIFY, REMOVE
    roomId,
    timestamp: Date.now(),
    pk,
    sk,
    data: eventName === 'REMOVE' ? null : DynamoDB.Converter.unmarshall(db.NewImage || {})
  };
  
  console.log('Parsed game event:', event);
  return event;
}

async function getActiveConnections(roomId: string) {
  try {
    const result = await dynamodb.query({
      TableName: process.env.GAME_TABLE_NAME!,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'CONNECTION#'
      }
    }).promise();
    
    const connections = result.Items || [];
    console.log(`Retrieved ${connections.length} connections for room ${roomId}`);
    return connections;
  } catch (error) {
    console.error('Error getting active connections:', error);
    return [];
  }
}

async function sendToConnection(connectionId: string, data: any) {
  try {
    console.log(`Sending data to connection ${connectionId}:`, data);
    
    await apiGateway.postToConnection({
      ConnectionId: connectionId,
      Data: JSON.stringify(data)
    }).promise();
    
    console.log(`Successfully sent data to connection ${connectionId}`);
  } catch (error: any) {
    console.error(`Send error for connection ${connectionId}:`, error);
    
    // Handle stale connections
    if (error.statusCode === 410) {
      console.log(`Stale connection detected: ${connectionId}`);
      // TODO: Remove stale connection from database
      await removeStaleConnection(connectionId);
    } else {
      console.error(`Send error: ${connectionId}`, error);
    }
  }
}

async function removeStaleConnection(connectionId: string) {
  try {
    // Find and remove stale connection
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
    
    if (scanResult.Items && scanResult.Items.length > 0) {
      for (const item of scanResult.Items) {
        await dynamodb.delete({
          TableName: process.env.GAME_TABLE_NAME!,
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }).promise();
        
        console.log(`Removed stale connection: ${connectionId}`);
      }
    }
  } catch (error) {
    console.error('Error removing stale connection:', error);
  }
}

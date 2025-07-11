import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Mock data for testing when AWS is not available
const mockRooms = [
  {
    id: 'room_mock_1',
    name: 'テストルーム1',
    playerCount: 2,
    maxPlayers: 4,
    status: 'waiting',
    ownerId: 'player_mock_owner1',
    createdAt: Date.now() - 300000, // 5分前
    updatedAt: Date.now() - 60000,  // 1分前
  },
  {
    id: 'room_mock_2',
    name: 'テストルーム2',
    playerCount: 1,
    maxPlayers: 2,
    status: 'waiting',
    ownerId: 'player_mock_owner2',
    createdAt: Date.now() - 600000, // 10分前
    updatedAt: Date.now() - 300000, // 5分前
  },
];

// Check if AWS is available
export async function checkAWSAvailability(): Promise<boolean> {
  try {
    // Try to get table name - this will fail if env vars are not set
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    if (!tableName || tableName === 'menkoverse-game-dev') {
      return false;
    }
    
    // Try a simple operation to verify connectivity
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
    
    const docClient = DynamoDBDocumentClient.from(client);
    await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { PK: 'TEST', SK: 'TEST' },
    }));
    
    return true;
  } catch (error) {
    console.warn('AWS not available, using mock data:', error);
    return false;
  }
}

export { mockRooms };

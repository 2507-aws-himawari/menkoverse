import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';
import type { CreateRoomRequest, JoinRoomRequest, CreateRoomResponse, JoinRoomResponse } from '@/types/game';
import { checkAWSAvailability, mockRooms, addMockRoom, updateMockRoom, getMockRoom } from './mock-data';

// DynamoDB client configuration
// Use AWS profile if specified, otherwise use default credential chain
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: process.env.AWS_PROFILE 
    ? fromIni({ profile: process.env.AWS_PROFILE })
    : undefined, // Use default credential chain
});

const docClient = DynamoDBDocumentClient.from(client);

// Get table name from environment
const getTableName = () => {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE_NAME environment variable is not set');
  }
  return tableName;
};

// 部屋作成（最小限実装）
export async function createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
  const roomId = request.roomName; // あいことばをIDとして使用
  const timestamp = Date.now();

  // Check if AWS is available
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, simulating room creation');
    // Add to mock data for this session
    const newRoom = {
      id: roomId,
      name: request.roomName,
      ownerId: request.ownerId,
      status: 'waiting',
      currentUserId: null,
      turn: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    mockRooms.push(newRoom);
    return { roomId, roomName: request.roomName };
  }

  try {
    // Room metadata only (no player creation)
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        id: roomId,
        ownerId: request.ownerId,
        status: 'waiting',
        currentUserId: null,
        turn: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }));

    console.log(`Room created successfully: ${roomId}`);
    return { roomId, roomName: request.roomName };
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room');
  }
}

export { mockRooms };

// 部屋一覧取得（最小限実装）
export async function listRooms() {
  // Check if AWS is available
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, returning mock data');
    return mockRooms;
  }

  try {
    const response = await docClient.send(new ScanCommand({
      TableName: getTableName(),
    }));

    const rooms = (response.Items || []).map((item: any) => ({
      id: item.id,
      ownerId: item.ownerId,
      status: item.status,
      currentUserId: item.currentUserId,
      turn: item.turn,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    console.log(`Found ${rooms.length} rooms`);
    return rooms;
  } catch (error) {
    console.error('Error listing rooms:', error);
    console.log('Falling back to mock data');
    return mockRooms;
  }
}

// 個別ルーム取得（最小限実装）
export async function getRoomById(roomId: string) {
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, using mock data');
    const mockRoom = getMockRoom(roomId);
    if (!mockRoom) return null;
    
    return {
      id: mockRoom.id,
      ownerId: mockRoom.ownerId,
      status: mockRoom.status,
      currentUserId: mockRoom.currentUserId || null,
      turn: mockRoom.turn || 0,
      createdAt: mockRoom.createdAt,
      updatedAt: mockRoom.updatedAt,
    };
  }

  try {
    const response = await docClient.send(new GetCommand({
      TableName: getTableName(),
      Key: {
        id: roomId,
      },
    }));

    if (!response.Item) {
      return null;
    }

    return {
      id: response.Item.id,
      ownerId: response.Item.ownerId,
      status: response.Item.status,
      currentUserId: response.Item.currentUserId || null,
      turn: response.Item.turn || 0,
      createdAt: response.Item.createdAt,
      updatedAt: response.Item.updatedAt,
    };
  } catch (error) {
    console.error('Error getting room by ID:', error);
    return null;
  }
}

// ルーム状態更新（最小限実装）
export async function updateRoomStatus(roomId: string, status: 'waiting' | 'playing' | 'finished') {
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, updating mock data');
    const mockRoom = getMockRoom(roomId);
    if (!mockRoom) return null;
    
    updateMockRoom(roomId, { status });
    return {
      id: mockRoom.id,
      ownerId: mockRoom.ownerId,
      status,
      currentUserId: mockRoom.currentUserId || null,
      turn: mockRoom.turn || 0,
      createdAt: mockRoom.createdAt,
      updatedAt: Date.now(),
    };
  }

  try {
    const response = await docClient.send(new UpdateCommand({
      TableName: getTableName(),
      Key: {
        id: roomId,
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': Date.now(),
      },
      ReturnValues: 'ALL_NEW',
    }));

    if (!response.Attributes) {
      return null;
    }

    return {
      id: response.Attributes.id,
      ownerId: response.Attributes.ownerId,
      status: response.Attributes.status,
      currentUserId: response.Attributes.currentUserId || null,
      turn: response.Attributes.turn || 0,
      createdAt: response.Attributes.createdAt,
      updatedAt: response.Attributes.updatedAt,
    };
  } catch (error) {
    console.error('Error updating room status:', error);
    return null;
  }
}

// プレイヤー取得（詳細画面用）
export async function getRoomPlayers(roomId: string) {
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, using mock players');
    // Mock players for development
    return [
      {
        playerId: 'player1',
        playerName: 'Player 1',
        isOwner: true,
        joinedAt: new Date().toISOString(),
      },
      {
        playerId: 'player2',
        playerName: 'Player 2',
        isOwner: false,
        joinedAt: new Date().toISOString(),
      },
    ];
  }

  try {
    const response = await docClient.send(new QueryCommand({
      TableName: getTableName(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'PLAYER#',
      },
    }));

    return (response.Items || []).map(item => ({
      playerId: item.userId,
      playerName: item.playerName || `Player ${item.userId}`,
      isOwner: item.isOwner || false,
      joinedAt: item.createdAt,
    }));
  } catch (error) {
    console.error('Error getting room players:', error);
    return [];
  }
}

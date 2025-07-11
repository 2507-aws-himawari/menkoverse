import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { CreateRoomRequest, JoinRoomRequest, CreateRoomResponse, JoinRoomResponse } from '@/types/game';
import { checkAWSAvailability, mockRooms } from './mock-data';

// DynamoDB client configuration
// AWS SDK will automatically use credentials from:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. AWS credentials file (~/.aws/credentials)
// 3. IAM roles (when running on EC2/Lambda)
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
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

// 部屋作成
export async function createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();

  // Check if AWS is available
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, simulating room creation');
    // Add to mock data for this session
    const newRoom = {
      id: roomId,
      name: request.roomName,
      playerCount: 1,
      maxPlayers: request.maxPlayers || 4,
      status: 'waiting',
      ownerId: request.ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    mockRooms.push(newRoom);
    return { roomId, roomName: request.roomName };
  }

  try {
    // Room metadata
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        PK: `ROOM#${roomId}`,
        SK: 'METADATA',
        entityType: 'room',
        id: roomId,
        name: request.roomName,
        status: 'waiting',
        ownerId: request.ownerId,
        playerCount: 1,
        maxPlayers: request.maxPlayers || 4,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }));

    // Owner as first player
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        PK: `ROOM#${roomId}`,
        SK: `PLAYER#${request.ownerId}`,
        GSI1PK: `PLAYER#${request.ownerId}`,
        GSI1SK: `ROOM#${roomId}`,
        entityType: 'roomPlayer',
        id: request.ownerId,
        roomId: roomId,
        userId: request.ownerId,
        hp: 100,
        pp: 10,
        turn: 1,
        isActive: true,
        isOwner: true,
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

// 部屋参加
export async function joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
  const timestamp = Date.now();

  // Check if AWS is available
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, simulating room join');
    // Find room in mock data
    const room = mockRooms.find(r => r.id === request.roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.playerCount >= room.maxPlayers) {
      throw new Error('Room is full');
    }
    // Update mock data
    room.playerCount++;
    room.updatedAt = timestamp;
    return { success: true, roomId: request.roomId };
  }

  try {
    // Get room info
    const roomResponse = await docClient.send(new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: `ROOM#${request.roomId}`,
        SK: 'METADATA',
      },
    }));

    if (!roomResponse.Item) {
      throw new Error('Room not found');
    }

    const room = roomResponse.Item;
    if (room.status !== 'waiting') {
      throw new Error('Room is not accepting new players');
    }

    if (room.playerCount >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Check if player is already in the room
    const existingPlayerResponse = await docClient.send(new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: `ROOM#${request.roomId}`,
        SK: `PLAYER#${request.playerId}`,
      },
    }));

    if (existingPlayerResponse.Item) {
      // Player already in room, just return success
      return { success: true, roomId: request.roomId };
    }

    // Add player to room
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        PK: `ROOM#${request.roomId}`,
        SK: `PLAYER#${request.playerId}`,
        GSI1PK: `PLAYER#${request.playerId}`,
        GSI1SK: `ROOM#${request.roomId}`,
        entityType: 'roomPlayer',
        id: request.playerId,
        roomId: request.roomId,
        userId: request.userId,
        hp: 100,
        pp: 10,
        turn: 0,
        isActive: true,
        isOwner: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    }));

    // Update room player count
    await docClient.send(new UpdateCommand({
      TableName: getTableName(),
      Key: {
        PK: `ROOM#${request.roomId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'SET playerCount = playerCount + :inc, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':timestamp': timestamp,
      },
    }));

    console.log(`Player ${request.playerId} joined room ${request.roomId}`);
    return { success: true, roomId: request.roomId };
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
}

// 部屋一覧取得
export async function listRooms() {
  // Check if AWS is available
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, returning mock data');
    return mockRooms;
  }

  try {
    // Since we don't have GSI2-RoomStatusIndex yet, use scan with filter
    const response = await docClient.send(new ScanCommand({
      TableName: getTableName(),
      FilterExpression: '#sk = :metadata AND #status = :waiting',
      ExpressionAttributeNames: {
        '#sk': 'SK',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':metadata': 'METADATA',
        ':waiting': 'waiting',
      },
    }));

    const rooms = (response.Items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      playerCount: item.playerCount || 0,
      maxPlayers: item.maxPlayers || 4,
      status: item.status,
      ownerId: item.ownerId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    console.log(`Found ${rooms.length} waiting rooms`);
    return rooms;
  } catch (error) {
    console.error('Error listing rooms:', error);
    console.log('Falling back to mock data');
    return mockRooms;
  }
}

// 部屋情報取得
export async function getRoom(roomId: string) {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: `ROOM#${roomId}`,
        SK: 'METADATA',
      },
    }));

    return response.Item;
  } catch (error) {
    console.error('Error getting room:', error);
    throw new Error('Failed to get room');
  }
}

// 部屋のプレイヤー一覧取得
export async function getRoomPlayers(roomId: string) {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: getTableName(),
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `ROOM#${roomId}`,
        ':sk': 'PLAYER#',
      },
    }));

    return response.Items || [];
  } catch (error) {
    console.error('Error getting room players:', error);
    throw new Error('Failed to get room players');
  }
}

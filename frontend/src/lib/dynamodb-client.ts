import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { fromIni } from '@aws-sdk/credential-providers';
import type { CreateRoomRequest, CreateRoomResponse, JoinRoomRequest, JoinRoomResponse } from '@/types/game';
import { checkAWSAvailability, mockRooms, updateMockRoom, getMockRoom } from './mock-data';

// DynamoDB client configuration
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  credentials: process.env.AWS_PROFILE 
    ? fromIni({ profile: process.env.AWS_PROFILE })
    : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

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

  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, simulating room creation');
    const newRoom = {
      id: roomId,
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
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        PK: `ROOM#${roomId}`,
        SK: 'METADATA',
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

// 部屋一覧取得（最小限実装）
export async function listRooms() {
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, returning mock data');
    return mockRooms;
  }

  try {
    const response = await docClient.send(new ScanCommand({
      TableName: getTableName(),
      FilterExpression: '#sk = :metadata',
      ExpressionAttributeNames: {
        '#sk': 'SK',
      },
      ExpressionAttributeValues: {
        ':metadata': 'METADATA',
      },
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
        PK: `ROOM#${roomId}`,
        SK: 'METADATA',
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
        PK: `ROOM#${roomId}`,
        SK: 'METADATA',
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

// ルーム削除
export async function deleteRoom(roomId: string): Promise<void> {
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, deleting from mock data');
    const index = mockRooms.findIndex(room => room.id === roomId);
    if (index !== -1) {
      mockRooms.splice(index, 1);
      console.log(`Mock room ${roomId} deleted`);
    }
    return;
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: getTableName(),
      Key: {
        PK: `ROOM#${roomId}`,
        SK: 'METADATA'
      }
    }));
    console.log(`Room ${roomId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

// 部屋参加（最小限実装）
export async function joinRoom(roomId: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
  const awsAvailable = await checkAWSAvailability();
  if (!awsAvailable) {
    console.log('AWS not available, simulating room join');
    const mockRoom = getMockRoom(roomId);
    if (!mockRoom) {
      throw new Error(`部屋が見つかりません: ${roomId}`);
    }
    
    if (mockRoom.status !== 'waiting') {
      throw new Error(`この部屋は参加できません (状態: ${mockRoom.status})`);
    }

    // モックデータでは簡単な検証のみ実装
    return {
      success: true,
      roomId,
      playerId: request.playerId
    };
  }

  try {
    // 部屋の存在確認
    const room = await getRoomById(roomId);
    if (!room) {
      throw new Error(`部屋が見つかりません: ${roomId}`);
    }

    if (room.status !== 'waiting') {
      throw new Error(`この部屋は参加できません (状態: ${room.status})`);
    }

    // プレイヤー情報をDynamoDBに保存
    const timestamp = Date.now();
    await docClient.send(new PutCommand({
      TableName: getTableName(),
      Item: {
        PK: `ROOM#${roomId}`,
        SK: `PLAYER#${request.playerId}`,
        entityType: 'player',
        playerId: request.playerId,
        userId: request.userId,
        roomId,
        joinedAt: timestamp,
        isActive: true
      }
    }));

    console.log(`Player ${request.playerId} joined room ${roomId}`);
    return {
      success: true,
      roomId,
      playerId: request.playerId
    };
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
}

export { mockRooms };

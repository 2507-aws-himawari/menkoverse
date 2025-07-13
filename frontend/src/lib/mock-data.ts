import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Mock data for testing when AWS is not available
let mockRooms = [
  {
    id: 'room_mock_1',
    ownerId: 'admin',
    status: 'waiting',
    currentUserId: null,
    turn: 0,
    createdAt: Date.now() - 300000, // 5分前
    updatedAt: Date.now() - 60000,  // 1分前
  },
  {
    id: 'room_mock_2',
    ownerId: 'admin',
    status: 'waiting',
    currentUserId: null,
    turn: 0,
    createdAt: Date.now() - 600000, // 10分前
    updatedAt: Date.now() - 300000, // 5分前
  },
  {
    id: 'room_mock_3',
    ownerId: 'admin',
    status: 'playing',
    currentUserId: 'player1',
    turn: 3,
    createdAt: Date.now() - 120000, // 2分前
    updatedAt: Date.now() - 30000,  // 30秒前
  },
];

// Check if AWS is available
export async function checkAWSAvailability(): Promise<boolean> {
  try {
    // Check if table name is set
    const tableName = process.env.DYNAMODB_TABLE_NAME;
    if (!tableName) {
      console.warn('DYNAMODB_TABLE_NAME not set');
      return false;
    }
    
    console.log('Testing AWS connectivity with profile:', process.env.AWS_PROFILE || 'default');
    
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });
    
    const docClient = DynamoDBDocumentClient.from(client);
    
    // Try to access a non-existent item (this will verify table access without affecting data)
    await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { PK: 'TEST_CONNECTION', SK: 'TEST_CONNECTION' },
    }));
    
    console.log('✓ AWS connectivity test passed');
    return true;
  } catch (error) {
    console.warn('AWS not available, using mock data. Error:', error);
    return false;
  }
}

export { mockRooms };

// Helper function to add a room to mock data
export function addMockRoom(room: any) {
  mockRooms.push(room);
}

// Helper function to update room in mock data
export function updateMockRoom(roomId: string, updates: any) {
  const index = mockRooms.findIndex(r => r.id === roomId);
  if (index !== -1) {
    mockRooms[index] = { ...mockRooms[index], ...updates };
  }
}

// Helper function to get mock room
export function getMockRoom(roomId: string) {
  return mockRooms.find(r => r.id === roomId);
}

// 部屋の参加者データをモックで管理
let mockRoomMembers: any[] = [];

// モック環境での参加者取得
export function getMockRoomMembers(roomId: string) {
  return mockRoomMembers.filter(member => member.roomId === roomId && member.isActive);
}

// モック環境での参加者追加
export function addMockRoomMember(member: any) {
  // 既存の参加者をチェック
  const existingIndex = mockRoomMembers.findIndex(
    m => m.roomId === member.roomId && m.userId === member.userId
  );
  
  if (existingIndex !== -1) {
    // 既存の参加者を更新
    mockRoomMembers[existingIndex] = { ...mockRoomMembers[existingIndex], ...member };
  } else {
    // 新しい参加者を追加
    mockRoomMembers.push(member);
  }
}

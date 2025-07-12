// 最小限のテーブル構造に基づく型定義
export interface Room {
  id: string;                    // あいことば
  ownerId: string;              // 部屋を立てた admin ユーザーの識別子
  status: 'waiting' | 'playing' | 'finished';  // 部屋状況
  currentUserId: string | null; // ターンを持っているユーザーのid
  turn: number;                 // 現在のターン数
  createdAt: number;
  updatedAt: number;
}

// API Request/Response types
export interface CreateRoomRequest {
  roomName: string;    // あいことば
  ownerId: string;     // 管理者ID
}

export interface CreateRoomResponse {
  roomId: string;
  roomName: string;
}

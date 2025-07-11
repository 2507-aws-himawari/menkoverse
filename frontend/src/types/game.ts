// Game entities based on DynamoDB Single Table Design

export interface GameRoom {
  entityType: 'room';
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  currentRoundId?: string;
  playerCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface RoomPlayer {
  entityType: 'roomPlayer';
  id: string;
  roomId: string;
  userId: string;
  hp: number;
  pp: number;
  turn: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerHand {
  entityType: 'hand';
  id: string;
  roomPlayerId: string;
  cardId: string;
  cost: number;
  attack: number;
  hp: number;
  position: number;
}

export interface PlayerBoard {
  entityType: 'board';
  id: string;
  roomPlayerId: string;
  cardId: string;
  cost: number;
  attack: number;
  hp: number;
  position: number;
}

export interface PlayerDeck {
  entityType: 'deck';
  id: string;
  roomPlayerId: string;
  cardId: string;
  cost: number;
  attack: number;
  hp: number;
  position: number;
}

export interface ThrowMenkoEvent {
  entityType: 'throwMenkoEvent';
  id: string;
  roomId: string;
  playerId: string;
  beforeHp: number;
  afterHp: number;
  timestamp: number;
  eventType: 'throw' | 'draw' | 'play' | 'attack';
}

export interface WebSocketConnection {
  entityType: 'connection';
  connectionId: string;
  roomId: string;
  playerId: string;
  userId: string;
  connectedAt: number;
  lastActivity: number;
  isActive: boolean;
}

// WebSocket message types
export interface GameEvent {
  type: 'INSERT' | 'MODIFY' | 'REMOVE';
  roomId: string;
  timestamp: number;
  pk: string;
  sk: string;
  data: any;
}

export interface WebSocketMessage {
  action: 'ping' | 'joinRoom' | 'leaveRoom' | 'gameAction';
  data?: any;
}

// DynamoDB key patterns
export type GameEntityKey = {
  PK: string;  // ROOM#{roomId}
  SK: string;  // METADATA | PLAYER#{playerId} | PLAYER#{playerId}#HAND#{cardId} | etc.
  GSI1PK?: string;  // PLAYER#{playerId}
  GSI1SK?: string;  // CONNECTION#{connectionId}
};

// Helper types for game state
export interface GameState {
  room: GameRoom;
  players: RoomPlayer[];
  hands: { [playerId: string]: PlayerHand[] };
  boards: { [playerId: string]: PlayerBoard[] };
  decks: { [playerId: string]: PlayerDeck[] };
  events: ThrowMenkoEvent[];
  connections: WebSocketConnection[];
}

export interface GameAction {
  type: 'JOIN_ROOM' | 'LEAVE_ROOM' | 'THROW_MENKO' | 'DRAW_CARD' | 'PLAY_CARD' | 'ATTACK';
  playerId: string;
  roomId: string;
  data?: any;
}

// API Request/Response types
export interface CreateRoomRequest {
  roomName: string;
  ownerId: string;
  maxPlayers?: number;
}

export interface CreateRoomResponse {
  roomId: string;
  roomName: string;
}

export interface JoinRoomRequest {
  roomId: string;
  playerId: string;
  userId: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId: string;
}

export interface RoomListResponse {
  rooms: GameRoom[];
}

// UI state types
export interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

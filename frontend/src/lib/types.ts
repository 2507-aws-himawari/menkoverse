export interface MockUser {
    id: string;
    name: string;
    isAdmin: boolean;
}

export interface MockDeck {
    id: string;
    name: string;
    userId: string;
}

export interface MockRoomPlayer {
    id: string;
    roomId: string;
    userId: string;
    hp: number;
    pp: number;
    turn: number;
    turnStatus: 'active' | 'ended';
    selectedDeckId?: string;
}

export interface MockRoom {
    id: string;
    ownerId: string;
    status: 'waiting' | 'playing' | 'finish';
}

// API関連の型定義
export interface CreateRoomInput {
    roomId?: string;
    currentUser: MockUser;
}

export interface JoinRoomInput {
    roomId: string;
    currentUser: MockUser;
}

export interface GetRoomInput {
    roomId: string;
}

export interface StartGameInput {
    roomId: string;
    currentUser: MockUser;
    // デモ用フラグ
    isDemo?: boolean;
}

export interface SelectDeckInput {
    roomId: string;
    currentUser: MockUser;
    deckId: string;
}

export interface GetDecksInput {
    currentUser: MockUser;
}

export interface UpdatePlayerStatusInput {
    roomId: string;
    currentUser: MockUser;
    hp?: number;
    pp?: number;
    turn?: number;
}

export interface StartTurnInput {
    roomId: string;
    currentUser: MockUser;
}

export interface EndTurnInput {
    roomId: string;
    currentUser: MockUser;
}

export interface ConsumePPInput {
    roomId: string;
    currentUser: MockUser;
    ppCost: number;
}

export interface ForceEndOpponentTurnInput {
    roomId: string;
    currentUser: MockUser;
}

export interface DamagePlayerInput {
    roomId: string;
    targetUserId: string;
    damage: number;
    currentUser: MockUser;
}

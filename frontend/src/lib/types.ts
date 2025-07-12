export interface MockUser {
    id: string;
    name: string;
    isAdmin: boolean;
}

export interface MockFollower {
    id: string;
    name: string;
    cost: number;
    attack: number;
    hp: number;
}

export interface MockDeck {
    id: string;
    userId: string;
    name: string;
}

export interface MockDeckCard {
    id: string;
    followerId: string;
    deckId: string;
}

export interface MockHand {
    id: string;
    roomPlayerId: string;
    cardId: string;
    cost: number;
    attack: number;
    hp: number;
}

export interface MockBoardCard {
    id: string;
    roomPlayerId: string;
    cardId: string;
    cost: number;
    attack: number;
    hp: number;
    position: number;
    canAttack: boolean;
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

export interface DrawCardsInput {
    roomId: string;
    currentUser: MockUser;
    count?: number; // デフォルトは5枚
}

export interface GetHandInput {
    roomId: string;
    currentUser: MockUser;
}

export interface SummonFollowerInput {
    roomId: string;
    currentUser: MockUser;
    handCardId: string;
}

export interface SummonFollowerResult {
    success: boolean;
    boardCard?: MockBoardCard;
    message?: string;
    reason?: 'board_full' | 'insufficient_pp' | 'invalid_card' | 'not_your_turn' | 'unknown';
}

export interface AttackInput {
    roomId: string;
    currentUser: MockUser;
    attackerBoardCardId: string;
    targetType: 'follower' | 'player';
    targetId: string;
}

export interface AttackResult {
    success: boolean;
    message?: string;
    reason?: 'not_your_turn' | 'cannot_attack' | 'invalid_target' | 'attacker_not_found' | 'target_not_found' | 'unknown';
    destroyedFollowers?: string[];
}

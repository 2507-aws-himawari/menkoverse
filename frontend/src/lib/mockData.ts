import { GAME_CONSTANTS } from './constants';
import type { MockUser, MockRoom, MockRoomPlayer, MockDeck } from './types';

// ユーザー
export const mockUsers: MockUser[] = [
    { id: 'user1', name: 'ふがふが', isAdmin: true },
    { id: 'user2', name: 'ぴよぴよ', isAdmin: false },
    { id: 'user3', name: 'わんわん', isAdmin: false },
];

// 部屋
export let mockRooms: MockRoom[] = [
    {
        id: 'あいおうえお',
        ownerId: 'user1',
        status: 'waiting',
    },
    {
        id: 'かきくけこ',
        ownerId: 'user2',
        status: 'playing',
    },
];

// プレイヤー
export let mockRoomPlayers: MockRoomPlayer[] = [
    {
        id: 'player1',
        roomId: 'あいおうえお',
        userId: 'user1',
        hp: GAME_CONSTANTS.INITIAL_HP,
        pp: 1,
        turn: 1,
        turnStatus: 'active',
        selectedDeckId: 'deck3'
    },
    {
        id: 'player2',
        roomId: 'かきくけこ',
        userId: 'user2',
        hp: 18,
        pp: 1,
        turn: 1,
        turnStatus: 'active',
        selectedDeckId: 'undefined',
    },
    {
        id: 'player3',
        roomId: 'かきくけこ',
        userId: 'user1',
        hp: 18,
        pp: 0,
        turn: 1,
        turnStatus: 'ended',
        selectedDeckId: 'deck1',
    },
];

// デッキ
export let mockDecks: MockDeck[] = [
    {
        id: 'deck1',
        name: '攻撃型デッキ',
        userId: 'user1',
    },
    {
        id: 'deck2',
        name: '防御型デッキ',
        userId: 'user1',
    },
    {
        id: 'deck3',
        name: 'バランス型デッキ',
        userId: 'user2',
    },
    {
        id: 'deck4',
        name: '実験デッキ',
        userId: 'user2',
    },
    {
        id: 'deck5',
        name: 'コントロールデッキ',
        userId: 'user3',
    },
];

// プレイヤーデータを更新する関数
export const updateMockRoomPlayers = (newPlayers: MockRoomPlayer[]) => {
    mockRoomPlayers = newPlayers;
};

// モックデータから部屋を検索する関数
export const getRoomById = (roomId: string): MockRoom | undefined => {
    return mockRooms.find(r => r.id === roomId);
};

// 部屋のプレイヤーを取得する関数
export const getPlayersByRoomId = (roomId: string): MockRoomPlayer[] => {
    return mockRoomPlayers.filter(p => p.roomId === roomId);
};

// 特定のプレイヤーを取得する関数
export const getPlayerByUserIdAndRoomId = (userId: string, roomId: string): MockRoomPlayer | undefined => {
    return mockRoomPlayers.find(p => p.userId === userId && p.roomId === roomId);
};

// ユーザーのデッキを取得する関数
export const getDecksByUserId = (userId: string): MockDeck[] => {
    return mockDecks.filter(deck => deck.userId === userId);
};

// デッキIDでデッキを取得する関数
export const getDeckById = (deckId: string): MockDeck | undefined => {
    return mockDecks.find(deck => deck.id === deckId);
};

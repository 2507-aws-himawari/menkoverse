import { GAME_CONSTANTS } from './constants';
import type { MockUser, MockRoom, MockRoomPlayer } from './types';

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
        owner: mockUsers[0]!,
        players: [
            {
                id: 'player1',
                roomId: 'あいおうえお',
                userId: 'user1',
                hp: GAME_CONSTANTS.INITIAL_HP,
                pp: 1,
                turn: 1,
                turnStatus: 'active',
            },
        ],
    },
    {
        id: 'かきくけこ',
        ownerId: 'user2',
        status: 'playing',
        owner: mockUsers[1]!,
        players: [
            {
                id: 'player2',
                roomId: 'かきくけこ',
                userId: 'user2',
                hp: 18,
                pp: 1,
                turn: 1,
                turnStatus: 'active',
            }, {
                id: 'player1',
                roomId: 'かきくけこ',
                userId: 'user1',
                hp: 18,
                pp: 0,
                turn: 1,
                turnStatus: 'ended',
            },
        ],
    },
];

// モックデータを更新する関数
export const updateMockRooms = (newRooms: MockRoom[]) => {
    mockRooms = newRooms;
};

// モックデータを取得する関数
export const getMockRooms = (): MockRoom[] => {
    return mockRooms;
};

// モックデータから部屋を検索する関数
export const findMockRoomById = (roomId: string): MockRoom | undefined => {
    return mockRooms.find(r => r.id === roomId);
};

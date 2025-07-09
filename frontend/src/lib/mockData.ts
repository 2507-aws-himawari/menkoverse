// モックデータ定義

import { GAME_CONSTANTS } from './constants';
import type { MockUser, MockRoom, MockRoomPlayer } from './types';

// モックユーザーデータ
export const mockUsers: MockUser[] = [
    { id: 'user1', name: 'ふがふが', isAdmin: true },
    { id: 'user2', name: 'ぴよぴよ', isAdmin: false },
    { id: 'user3', name: 'わんわん', isAdmin: false },
];

// モックルームデータ
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
                pp: 1, // ターン1なのでPP上限1
                turn: 1,
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
                pp: 1, // 先攻ターン1
                turn: 1,
            }, {
                id: 'player1',
                roomId: 'かきくけこ',
                userId: 'user1',
                hp: 18,
                pp: 0, // 後攻ターン1（待機状態）
                turn: 1,
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

// モックデータに部屋を追加する関数
export const addMockRoom = (room: MockRoom): void => {
    mockRooms.push(room);
};

// モックデータから部屋を検索する関数
export const findMockRoomById = (roomId: string): MockRoom | undefined => {
    return mockRooms.find(r => r.id === roomId);
};

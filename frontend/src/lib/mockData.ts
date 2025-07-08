export interface MockUser {
    id: string;
    name: string;
    isAdmin: boolean;
}

export interface MockRoomPlayer {
    id: string;
    roomId: string;
    userId: string;
    hp: number;
    pp: number;
    turn: number;
    user: MockUser;
}

export interface MockRoom {
    id: string;
    ownerId: string;
    status: 'waiting' | 'playing' | 'finish';
    players: MockRoomPlayer[];
    owner: MockUser;
}

// モックユーザーデータ
export const mockUsers: MockUser[] = [
    { id: 'user1', name: 'ふがふが', isAdmin: true },
    { id: 'user2', name: 'ぴよぴよ', isAdmin: false },
    { id: 'user3', name: 'わんわん', isAdmin: false },
];

// モックルームデータ
let mockRooms: MockRoom[] = [
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
                hp: 100,
                pp: 0,
                turn: 1,
                user: mockUsers[0]!,
            },
        ],
    },
    {
        id: 'かきくけこ',
        ownerId: 'user1',
        status: 'waiting',
        owner: mockUsers[1]!,
        players: [
            {
                id: 'player2',
                roomId: 'かきくけこ',
                userId: 'user1',
                hp: 85,
                pp: 15,
                turn: 2,
                user: mockUsers[1]!,
            },
        ],
    },
];

export const mockApi = {
    createRoom: async (input: { roomId?: string; currentUser: MockUser }): Promise<MockRoom> => {
        const roomId = input.roomId || `room${Date.now()}`;
        const newRoom: MockRoom = {
            id: roomId,
            ownerId: input.currentUser.id,
            status: 'waiting',
            owner: input.currentUser,
            players: [
                {
                    id: `player${Date.now()}`,
                    roomId: roomId,
                    userId: input.currentUser.id,
                    hp: 100,
                    pp: 0,
                    turn: 1,
                    user: input.currentUser,
                },
            ],
        };
        mockRooms.push(newRoom);
        return newRoom;
    },
    joinRoom: async (input: { roomId: string; currentUser: MockUser }): Promise<MockRoomPlayer> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) {
            throw new Error(`部屋が見つかりません: ${input.roomId}`);
        }

        if (room.status !== 'waiting') {
            throw new Error(`この部屋は参加できません (状態: ${room.status})`);
        }
        if (room.players.length >= 2) {
            throw new Error('部屋が満員です');
        }

        const existingPlayer = room.players.find(p => p.userId === input.currentUser.id);

        if (existingPlayer) {
            return existingPlayer;
        }

        const newPlayer: MockRoomPlayer = {
            id: `player${Date.now()}`,
            roomId: input.roomId,
            userId: input.currentUser.id,
            hp: 100,
            pp: 0,
            turn: 1,
            user: input.currentUser,
        };

        room.players.push(newPlayer);

        return newPlayer;
    },

    // 部屋の情報を取得
    getRoom: async (input: { roomId: string }): Promise<MockRoom | null> => {
        return mockRooms.find(r => r.id === input.roomId) || null;
    },

    // 利用可能な部屋一覧を取得
    getRooms: async (): Promise<MockRoom[]> => {
        return mockRooms;
    },

    // プレイヤーの状態を更新
    updatePlayerStatus: async (input: {
        roomId: string;
        currentUser: MockUser;
        hp?: number;
        pp?: number;
        turn?: number;
    }): Promise<MockRoomPlayer | null> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) return null;

        const player = room.players.find(p => p.userId === input.currentUser.id);
        if (!player) return null;

        if (input.hp !== undefined) player.hp = input.hp;
        if (input.pp !== undefined) player.pp = input.pp;
        if (input.turn !== undefined) player.turn = input.turn;

        return player;
    },
};

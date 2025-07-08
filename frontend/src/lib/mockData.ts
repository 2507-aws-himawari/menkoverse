export const GAME_CONSTANTS = {
    MAX_HP: 20,
    MAX_PP: 10,
    INITIAL_HP: 20,
    INITIAL_PP: 0,
    PP_PER_TURN: 1,
};

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

// ユーザーIDからユーザー情報を取得する関数
export const getUserById = (userId: string): MockUser | undefined => {
    return mockUsers.find(user => user.id === userId);
};

// ターン管理の関数
export const getActivePlayer = (room: MockRoom): MockRoomPlayer | null => {
    if (room.players.length !== 2) return null;

    // 全プレイヤーのターン数の合計を計算
    const totalTurns = room.players.reduce((sum, player) => sum + player.turn, 0);

    // 奇数ターンは先攻（インデックス0）、偶数ターンは後攻（インデックス1）
    const activePlayerIndex = (totalTurns - 2) % 2;

    return room.players[activePlayerIndex] || null;
};

// プレイヤーが先攻かどうかを判定
export const isFirstPlayer = (room: MockRoom, userId: string): boolean => {
    return room.players[0]?.userId === userId;
};

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
                hp: GAME_CONSTANTS.INITIAL_HP,
                pp: GAME_CONSTANTS.INITIAL_PP,
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
                pp: 2,
                turn: 2,
            }, {
                id: 'player1',
                roomId: 'かきくけこ',
                userId: 'user1',
                hp: 18,
                pp: 2,
                turn: 2,
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
                    hp: GAME_CONSTANTS.INITIAL_HP,
                    pp: GAME_CONSTANTS.INITIAL_PP,
                    turn: 1,
                },
            ],
        };
        mockRooms.push(newRoom);
        return newRoom;
    }, joinRoom: async (input: { roomId: string; currentUser: MockUser }): Promise<MockRoomPlayer> => {
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
            hp: GAME_CONSTANTS.INITIAL_HP,
            pp: GAME_CONSTANTS.INITIAL_PP,
            turn: 1,
        };
        // 先行/後攻をランダムに決定
        const shouldShuffle = Math.random() < 0.5;

        if (shouldShuffle) {
            // 新参加プレイヤーを先攻（インデックス0）にする
            room.players.unshift(newPlayer);
        } else {
            // 新参加プレイヤーを後攻（インデックス1）にする
            room.players.push(newPlayer);
        }

        // ゲーム開始
        if (room.players.length === 2) {
            room.status = 'playing';
        }

        return newPlayer;
    },

    // 部屋の情報を取得
    getRoom: async (input: { roomId: string }): Promise<MockRoom | null> => {
        const room = mockRooms.find(r => r.id === input.roomId) || null;
        return room;
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

        // HP/PPの上限チェック
        if (input.hp !== undefined) {
            player.hp = Math.max(0, Math.min(input.hp, GAME_CONSTANTS.MAX_HP));
        }
        if (input.pp !== undefined) {
            player.pp = Math.max(0, Math.min(input.pp, GAME_CONSTANTS.MAX_PP));
        }
        if (input.turn !== undefined) player.turn = input.turn;

        return player;
    },

    // ターン開始時のPP増加
    startTurn: async (input: {
        roomId: string;
        currentUser: MockUser;
    }): Promise<MockRoomPlayer | null> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) return null;

        const player = room.players.find(p => p.userId === input.currentUser.id);
        if (!player) return null;

        // PPを1増加（上限まで）
        player.pp = Math.min(player.pp + GAME_CONSTANTS.PP_PER_TURN, GAME_CONSTANTS.MAX_PP);
        player.turn += 1;

        return player;
    },

    // ターン終了
    endTurn: async (input: {
        roomId: string;
        currentUser: MockUser;
    }): Promise<MockRoom | null> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) return null;

        // アクティブプレイヤーかチェック
        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            throw new Error('あなたのターンではありません');
        }

        // 相手プレイヤーを見つける
        const otherPlayer = room.players.find(p => p.userId !== input.currentUser.id);
        if (otherPlayer) {
            // 相手プレイヤーのPPを増加してターンを進める
            otherPlayer.pp = Math.min(otherPlayer.pp + GAME_CONSTANTS.PP_PER_TURN, GAME_CONSTANTS.MAX_PP);
            otherPlayer.turn += 1;
        }

        return room;
    },

    // PP消費（デモ用）
    consumePP: async (input: {
        roomId: string;
        currentUser: MockUser;
        ppCost: number;
    }): Promise<MockRoomPlayer | null> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) return null;

        const player = room.players.find(p => p.userId === input.currentUser.id);
        if (!player) return null;

        // アクティブプレイヤーかチェック
        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            throw new Error('あなたのターンではありません');
        }

        // PP不足チェック
        if (player.pp < input.ppCost) {
            throw new Error(`PPが不足しています（必要: ${input.ppCost}, 現在: ${player.pp}）`);
        }

        // PP消費
        player.pp -= input.ppCost;

        return player;
    },

    // 相手ターンを強制終了（デモ用）
    forceEndOpponentTurn: async (input: {
        roomId: string;
        currentUser: MockUser;
    }): Promise<MockRoom | null> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) return null;

        // アクティブプレイヤーを取得
        const activePlayer = getActivePlayer(room);
        if (!activePlayer) return null;

        // 相手がアクティブでない場合はエラー
        if (activePlayer.userId === input.currentUser.id) {
            throw new Error('あなたがアクティブプレイヤーです。自分のターンを終了してください。');
        }

        // 現在のユーザー（非アクティブプレイヤー）のPPを増加してターンを進める
        const currentPlayer = room.players.find(p => p.userId === input.currentUser.id);
        if (currentPlayer) {
            currentPlayer.pp = Math.min(currentPlayer.pp + GAME_CONSTANTS.PP_PER_TURN, GAME_CONSTANTS.MAX_PP);
            currentPlayer.turn += 1;
        }

        return room;
    },
};

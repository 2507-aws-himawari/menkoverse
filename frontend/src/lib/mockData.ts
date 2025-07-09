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

// ターン数に応じたPP上限を計算する関数
export const calculatePPMax = (turn: number): number => {
    return Math.min(turn, GAME_CONSTANTS.MAX_PP);
};

// プレイヤーの個人ターン数を計算する関数
export const calculatePlayerTurn = (room: MockRoom, playerIndex: number): number => {
    // 各プレイヤーのターン数から、そのプレイヤーが何回ターンを実行したかを返す
    return room.players[playerIndex]?.turn || 1;
};

// ターン管理の関数
export const getActivePlayer = (room: MockRoom): MockRoomPlayer | null => {
    if (room.players.length !== 2) return null;

    const player1 = room.players[0]; // 先攻
    const player2 = room.players[1]; // 後攻

    if (!player1 || !player2) return null;

    // PP > 0のプレイヤーがアクティブ
    if (player1.pp > 0 && player2.pp === 0) {
        return player1; // 先攻がアクティブ
    } else if (player1.pp === 0 && player2.pp > 0) {
        return player2; // 後攻がアクティブ
    } else if (player1.pp > 0 && player2.pp > 0) {
        // 両方ともPP > 0の場合はターン数で判定
        if (player1.turn === player2.turn) {
            return player1; // 同じターンなら先攻がアクティブ
        } else if (player1.turn > player2.turn) {
            return player2; // 先攻のターンが多い場合は後攻がアクティブ
        } else {
            return player1; // 後攻のターンが多い場合は先攻がアクティブ
        }
    } else {
        // 両方ともPP = 0の場合はターン数で判定（PP=0でもターン終了は可能）
        if (player1.turn === player2.turn) {
            return player1; // 同じターンなら先攻がアクティブ
        } else if (player1.turn > player2.turn) {
            return player2; // 先攻のターンが多い場合は後攻がアクティブ
        } else {
            return player1; // 後攻のターンが多い場合は先攻がアクティブ
        }
    }
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
                    pp: 1, // ターン1なのでPP上限1
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
            pp: 1, // ターン1なのでPP上限1
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

            // 先攻はターン1でPP=1、後攻はターン1でPP=0（待機状態）
            room.players.forEach((player, index) => {
                player.turn = 1;
                if (index === 0) {
                    // 先攻: PP=1
                    player.pp = 1;
                } else {
                    // 後攻: PP=0（待機状態）
                    player.pp = 0;
                }
            });
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
            const ppMax = calculatePPMax(player.turn);
            player.pp = Math.max(0, Math.min(input.pp, ppMax));
        }
        if (input.turn !== undefined) player.turn = input.turn;

        return player;
    },

    // ターン開始時のPP回復
    startTurn: async (input: {
        roomId: string;
        currentUser: MockUser;
    }): Promise<MockRoomPlayer | null> => {
        const room = mockRooms.find(r => r.id === input.roomId);
        if (!room) return null;

        const player = room.players.find(p => p.userId === input.currentUser.id);
        if (!player) return null;

        // プレイヤーのインデックスを取得
        const playerIndex = room.players.findIndex(p => p.userId === input.currentUser.id);

        // 新しいターンでのPP上限まで回復
        const playerTurn = calculatePlayerTurn(room, playerIndex);
        player.turn = playerTurn;
        const ppMax = calculatePPMax(playerTurn);
        player.pp = ppMax;

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

        const player1 = room.players[0]; // 先攻
        const player2 = room.players[1]; // 後攻

        if (!player1 || !player2) return room;

        console.log('endTurn - 実行:', {
            activePlayer: activePlayer.userId,
            currentUser: input.currentUser.id,
            beforeState: {
                player1: { userId: player1.userId, pp: player1.pp, turn: player1.turn },
                player2: { userId: player2.userId, pp: player2.pp, turn: player2.turn }
            }
        });

        // 現在のアクティブプレイヤーのPPを0にする
        activePlayer.pp = 0;

        // 次のアクティブプレイヤーを決定してPPを設定
        if (activePlayer.userId === player1.userId) {
            // 先攻のターン終了 → 後攻のターン開始
            // 後攻のターン数は進めず、PP上限まで回復
            player2.pp = calculatePPMax(player2.turn);
            console.log('先攻のターン終了 → 後攻のターン開始', {
                player2NewPP: player2.pp,
                player2Turn: player2.turn,
                calculatedMax: calculatePPMax(player2.turn)
            });
        } else {
            // 後攻のターン終了 → 先攻の次のターン開始
            // 両方のターン数を進める
            player1.turn += 1;
            player2.turn += 1;
            player1.pp = calculatePPMax(player1.turn);
            console.log('後攻のターン終了 → 先攻の次のターン開始', {
                player1NewPP: player1.pp,
                player1NewTurn: player1.turn,
                player2NewTurn: player2.turn
            });
        }

        console.log('endTurn - 完了:', {
            afterState: {
                player1: { userId: player1.userId, pp: player1.pp, turn: player1.turn },
                player2: { userId: player2.userId, pp: player2.pp, turn: player2.turn }
            },
            newActivePlayer: getActivePlayer(room)?.userId
        });

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
        if (!activePlayer) {
            throw new Error('アクティブプレイヤーが見つかりません');
        }

        // 相手がアクティブでない場合はエラー
        if (activePlayer.userId === input.currentUser.id) {
            throw new Error('あなたがアクティブプレイヤーです。自分のターンを終了してください。');
        }

        const player1 = room.players[0]; // 先攻
        const player2 = room.players[1]; // 後攻

        if (!player1 || !player2) {
            throw new Error('プレイヤーが不足しています');
        }

        console.log('forceEndOpponentTurn - 実行:', {
            activePlayer: activePlayer.userId,
            currentUser: input.currentUser.id,
            beforeState: {
                player1: { userId: player1.userId, pp: player1.pp, turn: player1.turn },
                player2: { userId: player2.userId, pp: player2.pp, turn: player2.turn }
            }
        });

        // 現在のアクティブプレイヤーのPPを0にする
        activePlayer.pp = 0;

        // 次のアクティブプレイヤーを決定してPPを設定
        if (activePlayer.userId === player1.userId) {
            // 先攻のターン終了 → 後攻のターン開始
            // 後攻のターン数は進めず、PP上限まで回復
            player2.pp = calculatePPMax(player2.turn);
            console.log('先攻のターン終了 → 後攻のターン開始', {
                player2NewPP: player2.pp,
                player2Turn: player2.turn,
                calculatedMax: calculatePPMax(player2.turn)
            });
        } else {
            // 後攻のターン終了 → 先攻の次のターン開始
            // 両方のターン数を進める
            player1.turn += 1;
            player2.turn += 1;
            player1.pp = calculatePPMax(player1.turn);
            console.log('後攻のターン終了 → 先攻の次のターン開始', {
                player1NewPP: player1.pp,
                player1NewTurn: player1.turn,
                player2NewTurn: player2.turn
            });
        }

        console.log('forceEndOpponentTurn - 完了:', {
            afterState: {
                player1: { userId: player1.userId, pp: player1.pp, turn: player1.turn },
                player2: { userId: player2.userId, pp: player2.pp, turn: player2.turn }
            },
            newActivePlayer: getActivePlayer(room)?.userId
        });

        return room;
    },
};

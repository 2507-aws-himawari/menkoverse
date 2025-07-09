// モックAPI実装

import { GAME_CONSTANTS } from './constants';
import { calculatePPMax, calculatePlayerTurn, getActivePlayer } from './gameLogic';
import { mockUsers, mockRooms, addMockRoom, findMockRoomById } from './mockData';
import type {
    MockUser,
    MockRoom,
    MockRoomPlayer,
    CreateRoomInput,
    JoinRoomInput,
    GetRoomInput,
    UpdatePlayerStatusInput,
    StartTurnInput,
    EndTurnInput,
    ConsumePPInput,
    ForceEndOpponentTurnInput
} from './types';

export const mockApi = {
    createRoom: async (input: CreateRoomInput): Promise<MockRoom> => {
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
        addMockRoom(newRoom);
        return newRoom;
    },

    joinRoom: async (input: JoinRoomInput): Promise<MockRoomPlayer> => {
        const room = findMockRoomById(input.roomId);

        if (!room) {
            throw new Error(`部屋が見つかりません: ${input.roomId}`);
        }

        if (room.status !== 'waiting') {
            throw new Error(`この部屋は参加できません (状態: ${room.status})`);
        }
        if (room.players.length >= 2) {
            throw new Error('部屋が満員です');
        }

        const existingPlayer = room.players.find((p: MockRoomPlayer) => p.userId === input.currentUser.id);

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

            // 先攻はターン1（奇数）でPP=1、後攻はターン0で待機状態
            room.players.forEach((player: MockRoomPlayer, index: number) => {
                if (index === 0) {
                    // 先攻: ターン1（奇数）、PP=1
                    player.turn = 1;
                    player.pp = 1;
                } else {
                    // 後攻: ターン0（特殊な初期状態）、PP=0（待機状態）
                    // 先攻のターン1が終了すると後攻のターン2（偶数）になる
                    player.turn = 0;
                    player.pp = 0;
                }
            });
        }

        return newPlayer;
    },

    // 部屋の情報を取得
    getRoom: async (input: GetRoomInput): Promise<MockRoom | null> => {
        const room = findMockRoomById(input.roomId) || null;
        return room;
    },

    // 利用可能な部屋一覧を取得
    getRooms: async (): Promise<MockRoom[]> => {
        return mockRooms;
    },

    // プレイヤーの状態を更新
    updatePlayerStatus: async (input: UpdatePlayerStatusInput): Promise<MockRoomPlayer | null> => {
        const room = findMockRoomById(input.roomId);
        if (!room) return null;

        const player = room.players.find((p: MockRoomPlayer) => p.userId === input.currentUser.id);
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
    startTurn: async (input: StartTurnInput): Promise<MockRoomPlayer | null> => {
        const room = findMockRoomById(input.roomId);
        if (!room) return null;

        const player = room.players.find((p: MockRoomPlayer) => p.userId === input.currentUser.id);
        if (!player) return null;

        // プレイヤーのインデックスを取得
        const playerIndex = room.players.findIndex((p: MockRoomPlayer) => p.userId === input.currentUser.id);

        // 新しいターンでのPP上限まで回復
        const playerTurn = calculatePlayerTurn(room, playerIndex);
        player.turn = playerTurn;
        const ppMax = calculatePPMax(playerTurn);
        player.pp = ppMax;

        return player;
    },

    // ターン終了
    endTurn: async (input: EndTurnInput): Promise<MockRoom | null> => {
        const room = findMockRoomById(input.roomId);
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
    consumePP: async (input: ConsumePPInput): Promise<MockRoomPlayer | null> => {
        const room = findMockRoomById(input.roomId);
        if (!room) return null;

        const player = room.players.find((p: MockRoomPlayer) => p.userId === input.currentUser.id);
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
    forceEndOpponentTurn: async (input: ForceEndOpponentTurnInput): Promise<MockRoom | null> => {
        const room = findMockRoomById(input.roomId);
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

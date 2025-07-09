import { GAME_CONSTANTS } from './constants';
import { calculatePPMax, calculatePlayerTurn, getActivePlayer, recoverPlayerPP, switchTurns } from './gameLogic';
import {
    mockUsers,
    mockRooms,
    mockRoomPlayers,
    getRoomById,
    getPlayersByRoomId,
    getPlayerByUserIdAndRoomId,
    updateMockRoomPlayers
} from './mockData';
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
        };

        mockRooms.push(newRoom);

        const newPlayer: MockRoomPlayer = {
            id: `player${Date.now()}`,
            roomId: roomId,
            userId: input.currentUser.id,
            hp: GAME_CONSTANTS.INITIAL_HP,
            pp: 1,
            turn: 1,
            turnStatus: 'ended',
        };
        mockRoomPlayers.push(newPlayer);

        return newRoom;
    },

    joinRoom: async (input: JoinRoomInput): Promise<MockRoomPlayer> => {
        const room = getRoomById(input.roomId);

        if (!room) {
            throw new Error(`部屋が見つかりません: ${input.roomId}`);
        }

        if (room.status !== 'waiting') {
            throw new Error(`この部屋は参加できません (状態: ${room.status})`);
        }

        // 既存のプレイヤーを取得
        const roomPlayers = getPlayersByRoomId(input.roomId);

        if (roomPlayers.length >= 2) {
            throw new Error('部屋が満員です');
        }

        const existingPlayer = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);

        if (existingPlayer) {
            return existingPlayer;
        }

        const newPlayer: MockRoomPlayer = {
            id: `player${Date.now()}`,
            roomId: input.roomId,
            userId: input.currentUser.id,
            hp: GAME_CONSTANTS.INITIAL_HP,
            pp: 1,
            turn: 1,
            turnStatus: 'ended',
        };

        mockRoomPlayers.push(newPlayer);

        // ゲーム開始
        const updatedRoomPlayers = getPlayersByRoomId(input.roomId);
        if (updatedRoomPlayers.length === 2) {
            room.status = 'playing';

            const shouldShuffle = Math.random() < 0.5;
            const [player1, player2] = shouldShuffle ? [updatedRoomPlayers[1], updatedRoomPlayers[0]] : updatedRoomPlayers;

            // ターン状態を設定
            if (player1) {
                player1.turn = 1;
                player1.pp = 1;
                player1.turnStatus = 'active';
            }
            if (player2) {
                player2.turn = 1;
                player2.pp = 0;
                player2.turnStatus = 'ended';
            }
        }

        return newPlayer;
    },

    // 部屋の情報を取得
    getRoom: async (input: GetRoomInput): Promise<MockRoom | null> => {
        const room = getRoomById(input.roomId) || null;
        return room;
    },

    // 利用可能な部屋一覧を取得
    getRooms: async (): Promise<MockRoom[]> => {
        return mockRooms;
    },

    // プレイヤーの状態を更新
    updatePlayerStatus: async (input: UpdatePlayerStatusInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) return null;

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
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
        if (!player) return null;

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const playerIndex = roomPlayers.findIndex((p: MockRoomPlayer) => p.userId === input.currentUser.id);

        const playerTurn = calculatePlayerTurn(room, playerIndex);
        player.turn = playerTurn;
        recoverPlayerPP(player);

        return player;
    },

    // ターン終了
    endTurn: async (input: EndTurnInput): Promise<MockRoom | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const activePlayer = getActivePlayer(room);
        if (!activePlayer || activePlayer.userId !== input.currentUser.id) {
            throw new Error('あなたのターンではありません');
        }

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const player1 = roomPlayers[0];
        const player2 = roomPlayers[1];

        if (!player1 || !player2) return room;

        switchTurns(room, activePlayer);
        return room;
    },

    // PP消費（デモ用）
    consumePP: async (input: ConsumePPInput): Promise<MockRoomPlayer | null> => {
        const room = getRoomById(input.roomId);
        if (!room) return null;

        const player = getPlayerByUserIdAndRoomId(input.currentUser.id, input.roomId);
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
        const room = getRoomById(input.roomId);
        if (!room) return null;

        // アクティブプレイヤーを取得
        const activePlayer = getActivePlayer(room);
        if (!activePlayer) {
            throw new Error('アクティブプレイヤーが見つかりません');
        }

        if (activePlayer.userId === input.currentUser.id) {
            throw new Error('あなたがアクティブプレイヤーです。自分のターンを終了してください。');
        }

        const roomPlayers = getPlayersByRoomId(input.roomId);
        const player1 = roomPlayers[0]; // 先攻
        const player2 = roomPlayers[1]; // 後攻

        if (!player1 || !player2) {
            throw new Error('プレイヤーが不足しています');
        }

        switchTurns(room, activePlayer);
        return room;
    },
};

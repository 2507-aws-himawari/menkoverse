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
                    pp: 1,
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
            pp: 1,
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
            room.players.forEach((player: MockRoomPlayer, index: number) => {
                if (index === 0) {
                    // 先攻: ターン1、PP=1
                    player.turn = 1;
                    player.pp = 1;
                } else {
                    // 後攻: ターン1、PP=0（待機状態）
                    player.turn = 1;
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

        // デバッグログを追加
        console.log('ターン終了前の状態:');
        console.log(`先攻(${player1.userId}): turn=${player1.turn}, pp=${player1.pp}`);
        console.log(`後攻(${player2.userId}): turn=${player2.turn}, pp=${player2.pp}`);
        console.log(`アクティブプレイヤー: ${activePlayer.userId}`);

        // 現在のアクティブプレイヤーのPPを0にする
        activePlayer.pp = 0;

        // 新しいターンへ進める
        if (activePlayer.userId === player1.userId) {
            // 先攻のターン終了 → 後攻のターン開始
            console.log('先攻のターン終了 → 後攻のターン開始');
            // 後攻のターン数を進めてPPを回復
            player2.turn += 1;
            player2.pp = calculatePPMax(player2.turn);
        } else {
            // 後攻のターン終了 → 先攻の次のターン開始
            console.log('後攻のターン終了 → 先攻の次のターン開始');
            // 先攻のターン数を進めてPPを回復
            player1.turn += 1;
            player1.pp = calculatePPMax(player1.turn);
        }

        // デバッグログを追加
        console.log('ターン終了後の状態:');
        console.log(`先攻(${player1.userId}): turn=${player1.turn}, pp=${player1.pp}`);
        console.log(`後攻(${player2.userId}): turn=${player2.turn}, pp=${player2.pp}`);

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

        // デバッグログを追加
        console.log('相手ターン強制終了前の状態:');
        console.log(`先攻(${player1.userId}): turn=${player1.turn}, pp=${player1.pp}`);
        console.log(`後攻(${player2.userId}): turn=${player2.turn}, pp=${player2.pp}`);
        console.log(`アクティブプレイヤー: ${activePlayer.userId}`);

        // アクティブプレイヤーのPPを0にする
        activePlayer.pp = 0;

        // 次のアクティブプレイヤーを決定してPPを設定
        if (activePlayer.userId === player1.userId) {
            // 先攻のターン終了 → 後攻のターン開始
            console.log('先攻のターン終了 → 後攻のターン開始');
            // 後攻のターン数を進めてPPを回復
            player2.turn += 1;
            player2.pp = calculatePPMax(player2.turn);
        } else {
            // 後攻のターン終了 → 先攻の次のターン開始
            console.log('後攻のターン終了 → 先攻の次のターン開始');
            // 先攻のターン数を進めてPPを回復
            player1.turn += 1;
            player1.pp = calculatePPMax(player1.turn);
        }

        // デバッグログを追加
        console.log('相手ターン強制終了後の状態:');
        console.log(`先攻(${player1.userId}): turn=${player1.turn}, pp=${player1.pp}`);
        console.log(`後攻(${player2.userId}): turn=${player2.turn}, pp=${player2.pp}`);

        return room;
    },
};

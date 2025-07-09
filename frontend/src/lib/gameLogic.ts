import { GAME_CONSTANTS } from './constants';
import type { MockRoom, MockRoomPlayer, MockUser } from './types';

// ユーザー情報取得
export const getUserById = (userId: string, mockUsers: MockUser[]): MockUser | undefined => {
    return mockUsers.find(user => user.id === userId);
};

// PP上限計算
export const calculatePPMax = (turn: number): number => {
    return Math.min(turn, GAME_CONSTANTS.MAX_PP);
};

// プレイヤーターン計算
export const calculatePlayerTurn = (room: MockRoom, playerIndex: number): number => {
    return room.players[playerIndex]?.turn || 1;
};

// アクティブプレイヤー判定
export const getActivePlayer = (room: MockRoom): MockRoomPlayer | null => {
    if (room.players.length !== 2) return null;

    const player1 = room.players[0]; // 先攻
    const player2 = room.players[1]; // 後攻

    if (!player1 || !player2) return null;

    // ターン数優先判定
    if (player1.turn > player2.turn) {
        return player1;
    } else if (player2.turn > player1.turn) {
        return player2;
    } else {
        // 同ターンはPP判定
        if (player1.pp > 0 && player2.pp === 0) {
            return player1;
        } else if (player1.pp === 0 && player2.pp > 0) {
            return player2;
        } else {
            // 同状態なら先攻優先
            return player1;
        }
    }
};

// 先攻判定
export const isFirstPlayer = (room: MockRoom, userId: string): boolean => {
    return room.players[0]?.userId === userId;
};

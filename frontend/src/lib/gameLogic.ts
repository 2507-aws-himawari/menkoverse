import { GAME_CONSTANTS } from './constants';
import type { MockRoom, MockRoomPlayer, MockUser } from './types';

// ユーザーIDからユーザー情報を取得する関数
export const getUserById = (userId: string, mockUsers: MockUser[]): MockUser | undefined => {
    return mockUsers.find(user => user.id === userId);
};

// ターン数に応じたPP上限を計算する関数
export const calculatePPMax = (turn: number): number => {
    return Math.min(turn, GAME_CONSTANTS.MAX_PP);
};

// プレイヤーの個人ターン数を計算する関数
export const calculatePlayerTurn = (room: MockRoom, playerIndex: number): number => {
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

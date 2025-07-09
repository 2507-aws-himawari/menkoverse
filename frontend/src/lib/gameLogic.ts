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

// ターン管理の関数（ロジック修正版）
export const getActivePlayer = (room: MockRoom): MockRoomPlayer | null => {
    if (room.players.length !== 2) return null;

    const player1 = room.players[0]; // 先攻
    const player2 = room.players[1]; // 後攻

    if (!player1 || !player2) return null;

    // デバッグログを追加
    console.log('getActivePlayer デバッグ:');
    console.log(`先攻(${player1.userId}): turn=${player1.turn}, pp=${player1.pp}`);
    console.log(`後攻(${player2.userId}): turn=${player2.turn}, pp=${player2.pp}`);

    // ターン数を最優先で判定（修正版）
    if (player1.turn > player2.turn) {
        // 先攻のターン数が多い = 先攻のターン
        console.log('判定: 先攻がアクティブ (先攻のターンが進んでいる)');
        return player1;
    } else if (player2.turn > player1.turn) {
        // 後攻のターン数が多い = 後攻のターン
        console.log('判定: 後攻がアクティブ (後攻のターンが進んでいる)');
        return player2;
    } else {
        // 同じターン数の場合のみPPで判定
        if (player1.pp > 0 && player2.pp === 0) {
            console.log('判定: 先攻がアクティブ (同じターン、先攻PP>0)');
            return player1;
        } else if (player1.pp === 0 && player2.pp > 0) {
            console.log('判定: 後攻がアクティブ (同じターン、後攻PP>0)');
            return player2;
        } else {
            // 両方とも同じ状態なら先攻優先
            console.log('判定: 先攻がアクティブ (同じターン、同じPP状態)');
            return player1;
        }
    }
};

// プレイヤーが先攻かどうかを判定
export const isFirstPlayer = (room: MockRoom, userId: string): boolean => {
    return room.players[0]?.userId === userId;
};

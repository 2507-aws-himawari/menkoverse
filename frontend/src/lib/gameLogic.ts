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

// ターン管理の関数
export const getActivePlayer = (room: MockRoom): MockRoomPlayer | null => {
    if (room.players.length !== 2) return null;

    const player1 = room.players[0]; // 先攻
    const player2 = room.players[1]; // 後攻

    if (!player1 || !player2) return null;

    if (player1.turn > player2.turn) {
        return player1;
    } else if (player2.turn > player1.turn) {
        return player2;
    } else {
        if (player1.turnStatus === 'active') {
            return player1;
        } else if (player2.turnStatus === 'active') {
            return player2;
        } else {
            return player1;
        }
    }
};

// 先攻判定
export const isFirstPlayer = (room: MockRoom, userId: string): boolean => {
    return room.players[0]?.userId === userId;
};

// 先攻or後攻取得
export const getPlayerPosition = (room: MockRoom, userId: string): '先攻' | '後攻' | null => {
    const playerIndex = room.players.findIndex(player => player.userId === userId);
    if (playerIndex === -1) return null;
    return playerIndex === 0 ? '先攻' : '後攻';
};

// PP回復
export const recoverPlayerPP = (player: MockRoomPlayer): void => {
    player.pp = calculatePPMax(player.turn);
};

// ターン遷移
export const switchTurns = (room: MockRoom, currentActivePlayer: MockRoomPlayer): void => {
    const [player1, player2] = room.players;

    if (!player1 || !player2) return;

    currentActivePlayer.turnStatus = 'ended';

    if (currentActivePlayer.userId === player1.userId) {
        // 先攻のターンが終了 → 後攻のターンに移行
        player2.turnStatus = 'active';
        recoverPlayerPP(player2);
    } else {
        // 後攻のターンが終了 → 新しいターンラウンドの開始
        player1.turn += 1;
        player2.turn += 1;
        player1.turnStatus = 'active';
        player2.turnStatus = 'ended';
        recoverPlayerPP(player1);
    }
};

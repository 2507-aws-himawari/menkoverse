import { GAME_CONSTANTS } from './constants';
import type { MockRoom, MockRoomPlayer, MockRoomPlayerWithStatus, MockUser, MockBoardCard } from './types';
import { getPlayersByRoomId, getBoardByRoomPlayerId, attackedFollowersThisTurn } from './mockData';

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
    const roomPlayers = getPlayersByRoomId(room.id);
    return roomPlayers[playerIndex]?.turn || 1;
};

// ターン管理の関数
export const getActivePlayer = (room: MockRoom): MockRoomPlayerWithStatus | null => {
    const roomPlayers = getPlayersByRoomId(room.id);
    if (roomPlayers.length !== 2) return null;

    const playersWithStatus = addTurnStatusToPlayers(roomPlayers, room);
    return playersWithStatus.find(player => player.turnStatus === 'active') || null;
};

// 先攻判定
export const isFirstPlayer = (room: MockRoom, userId: string): boolean => {
    const roomPlayers = getPlayersByRoomId(room.id);
    return roomPlayers[0]?.userId === userId;
};

// 先攻or後攻取得
export const getPlayerPosition = (room: MockRoom, userId: string): '先攻' | '後攻' | null => {
    const roomPlayers = getPlayersByRoomId(room.id);
    const playerIndex = roomPlayers.findIndex(player => player.userId === userId);
    if (playerIndex === -1) return null;
    return playerIndex === 0 ? '先攻' : '後攻';
};

// PP回復
export const recoverPlayerPP = (player: MockRoomPlayer): void => {
    player.pp = calculatePPMax(player.turn);
};

// ターン遷移
export const switchTurns = (room: MockRoom, currentActivePlayer: MockRoomPlayer): void => {
    const roomPlayers = getPlayersByRoomId(room.id);
    const [player1, player2] = roomPlayers;

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

// ターン開始時にフォロワーの攻撃状態をリセット
export const resetFollowerAttackStatus = (roomPlayerId: string): void => {
    // 攻撃済みフォロワーのリストをクリア
    attackedFollowersThisTurn.clear();
};

// フォロワーが攻撃可能かどうかを判定
export const canFollowerAttack = (boardCard: MockBoardCard, currentTurn: number): boolean => {
    // 召喚酔い
    if (boardCard.summonedTurn === currentTurn) {
        return false;
    }

    // 攻撃済み
    if (attackedFollowersThisTurn.has(boardCard.id)) {
        return false;
    }

    return true;
};

// フォロワーを攻撃済みにマーク
export const markFollowerAsAttacked = (boardCardId: string): void => {
    attackedFollowersThisTurn.add(boardCardId);
};

// フォロワーが攻撃済みかどうかを判定
export const hasFollowerAttackedThisTurn = (boardCardId: string): boolean => {
    return attackedFollowersThisTurn.has(boardCardId);
};

// turnStatusを計算して付与する関数
export const addTurnStatusToPlayer = (player: MockRoomPlayer, room: MockRoom): MockRoomPlayerWithStatus => {
    const roomPlayers = getPlayersByRoomId(room.id);
    if (roomPlayers.length !== 2) {
        return { ...player, turnStatus: 'ended' };
    }

    const player1 = roomPlayers[0];
    const player2 = roomPlayers[1];

    if (!player1 || !player2) {
        return { ...player, turnStatus: 'ended' };
    }

    // ターン数による判定
    if (player1.turn > player2.turn) {
        return { ...player, turnStatus: player.id === player1.id ? 'active' : 'ended' };
    } else if (player2.turn > player1.turn) {
        return { ...player, turnStatus: player.id === player2.id ? 'active' : 'ended' };
    } else {
        // 同じターン数の場合は先攻プレイヤー（player1）がアクティブ
        return { ...player, turnStatus: player.id === player1.id ? 'active' : 'ended' };
    }
};

// プレイヤー配列にturnStatusを付与する関数
export const addTurnStatusToPlayers = (players: MockRoomPlayer[], room: MockRoom): MockRoomPlayerWithStatus[] => {
    return players.map(player => addTurnStatusToPlayer(player, room));
};

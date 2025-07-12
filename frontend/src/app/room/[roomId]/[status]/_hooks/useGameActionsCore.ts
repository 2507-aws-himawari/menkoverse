import { useSWRConfig } from 'swr';
import { mockApi } from '@/lib/mockApi';
import type { MockUser } from '@/lib/types';

export function useGameActionsCore(roomId: string | null) {
    const { mutate } = useSWRConfig();

    const updateRoomCache = async (roomId: string) => {
        const key = `/api/rooms/${roomId}`;
        await mutate(key);
    };

    const handleStartTurn = async (currentUser: MockUser): Promise<void> => {
        if (!roomId) return;

        try {
            await mockApi.startTurn({
                roomId,
                currentUser
            }); await updateRoomCache(roomId);

            // ターン開始イベントを発火して HandDisplay に手札更新を促す
            window.dispatchEvent(new CustomEvent('turnStarted'));
        } catch (error) {
            throw error;
        }
    };

    const handleEndTurn = async (currentUser: MockUser): Promise<void> => {
        if (!roomId) return;

        try {
            await mockApi.endTurn({
                roomId,
                currentUser
            });
            await updateRoomCache(roomId);
        } catch (error) {
            throw error;
        }
    };

    const handleForceEndOpponentTurn = async (currentUser: MockUser): Promise<void> => {
        if (!roomId) return;

        try {
            await mockApi.forceEndOpponentTurn({
                roomId,
                currentUser
            });
            await updateRoomCache(roomId);
        } catch (error) {
            throw error;
        }
    };

    const handleConsumePP = async (currentUser: MockUser, ppCost: number): Promise<void> => {
        if (!roomId) return;

        try {
            await mockApi.consumePP({
                roomId,
                currentUser,
                ppCost
            });
            await updateRoomCache(roomId);
        } catch (error) {
            throw error;
        }
    };

    // プレイヤーIDを指定してダメージ
    const handleDamagePlayer = async (currentUser: MockUser, targetUserId: string, damage: number): Promise<void> => {
        if (!roomId) return;
        try {
            await mockApi.damagePlayer({
                roomId,
                currentUser,
                targetUserId,
                damage
            });
            await updateRoomCache(roomId);
        } catch (error) {
            throw error;
        }
    };

    // 自分にダメージ
    const handleDamageToSelf = async (currentUser: MockUser, damage: number): Promise<void> => {
        await handleDamagePlayer(currentUser, currentUser.id, damage);
    };

    // 相手にダメージ
    const handleDamageToOpponent = async (currentUser: MockUser, opponentUserId: string, damage: number): Promise<void> => {
        await handleDamagePlayer(currentUser, opponentUserId, damage);
    };

    // フォロワーを召喚
    const handleSummonFollower = async (currentUser: MockUser, handCardId: string): Promise<string | null> => {
        if (!roomId) return '部屋が見つかりません';

        try {
            const result = await mockApi.summonFollower({
                roomId,
                currentUser,
                handCardId
            });

            if (result.success) {
                await updateRoomCache(roomId);
                return null; // 成功の場合はnullを返す
            } else {
                return result.message || '召喚に失敗しました'; // エラーメッセージを返す
            }
        } catch (error) {
            return error instanceof Error ? error.message : '召喚に失敗しました';
        }
    };

    // フォロワーで攻撃
    const handleAttackWithFollower = async (
        currentUser: MockUser,
        attackerBoardCardId: string,
        targetType: 'follower' | 'player',
        targetId: string
    ): Promise<string | null> => {
        if (!roomId) return '部屋が見つかりません';

        try {
            const result = await mockApi.attackWithFollower({
                roomId,
                currentUser,
                attackerBoardCardId,
                targetType,
                targetId
            });

            if (result.success) {
                await updateRoomCache(roomId);
                return null;
            } else {
                return result.message || '攻撃に失敗しました';
            }
        } catch (error) {
            return error instanceof Error ? error.message : '攻撃に失敗しました';
        }
    };

    // 相手フィールドにフォロワーを召喚（デモ機能）
    const handleSummonFollowerToOpponent = async (
        currentUser: MockUser,
        targetUserId: string,
        followerId: string
    ): Promise<string | null> => {
        if (!roomId) return '部屋が見つかりません';

        try {
            const result = await mockApi.summonFollowerToOpponent({
                roomId,
                currentUser,
                targetUserId,
                followerId
            });

            if (result.success) {
                await updateRoomCache(roomId);
                return null;
            } else {
                return result.message || '相手フィールドへの召喚に失敗しました';
            }
        } catch (error) {
            return error instanceof Error ? error.message : '相手フィールドへの召喚に失敗しました';
        }
    };

    return {
        handleStartTurn,
        handleEndTurn,
        handleForceEndOpponentTurn,
        handleConsumePP,
        handleDamagePlayer,
        handleDamageToSelf,
        handleDamageToOpponent,
        handleSummonFollower,
        handleAttackWithFollower,
        handleSummonFollowerToOpponent,
    };
}

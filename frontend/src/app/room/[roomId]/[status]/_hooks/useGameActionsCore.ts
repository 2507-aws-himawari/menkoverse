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
    const handleSummonFollower = async (currentUser: MockUser, handCardId: string): Promise<void> => {
        if (!roomId) return;

        try {
            await mockApi.summonFollower({
                roomId,
                currentUser,
                handCardId
            });
            await updateRoomCache(roomId);
        } catch (error) {
            throw error;
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
    };
}

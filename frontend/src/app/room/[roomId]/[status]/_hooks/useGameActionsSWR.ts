import { useSWRConfig } from 'swr';
import { mockApi } from '@/lib/mockApi';
import type { MockUser } from '@/lib/types';

/**
 * ゲームアクションを実行するSWRカスタムフック
 */
export function useGameActionsSWR(roomId: string | null) {
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
            });
            await updateRoomCache(roomId);
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

    return {
        handleStartTurn,
        handleEndTurn,
        handleForceEndOpponentTurn,
        handleConsumePP,
    };
}

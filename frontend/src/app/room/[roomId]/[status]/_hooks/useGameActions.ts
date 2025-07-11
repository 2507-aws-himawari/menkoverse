import { useAtom, useSetAtom } from 'jotai';
import { mockApi } from '@/lib/mockApi';
import {
    currentRoomAtom,
    currentUserAtom,
    startLoadingAtom,
    endLoadingAtom,
    setErrorAndEndLoadingAtom,
    setRoomAtom
} from '@/lib/atoms';

export function useGameActions() {
    const [room] = useAtom(currentRoomAtom);
    const [currentUser] = useAtom(currentUserAtom);

    const startLoading = useSetAtom(startLoadingAtom);
    const endLoading = useSetAtom(endLoadingAtom);
    const setErrorAndEndLoading = useSetAtom(setErrorAndEndLoadingAtom);
    const setRoom = useSetAtom(setRoomAtom);

    const updateRoom = async () => {
        if (!room) return;
        const updatedRoom = await mockApi.getRoom({ roomId: room.id });
        if (updatedRoom) {
            setRoom(updatedRoom);
        }
    };

    const handleStartTurn = async () => {
        if (!room) return;

        try {
            startLoading();
            await mockApi.startTurn({
                roomId: room.id,
                currentUser
            });
            await updateRoom();
            endLoading();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'ターン開始に失敗しました';
            setErrorAndEndLoading(errorMessage);
        }
    };

    const handleEndTurn = async () => {
        if (!room) return;

        try {
            startLoading();
            await mockApi.endTurn({
                roomId: room.id,
                currentUser
            });
            await updateRoom();
            endLoading();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'ターン終了に失敗しました';
            setErrorAndEndLoading(errorMessage);
        }
    };

    const handleForceEndOpponentTurn = async () => {
        if (!room) return;

        try {
            startLoading();
            await mockApi.forceEndOpponentTurn({
                roomId: room.id,
                currentUser
            });
            await updateRoom();
            endLoading();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '相手ターン終了に失敗しました';
            setErrorAndEndLoading(errorMessage);
        }
    };

    const handleConsumePP = async (ppCost: number) => {
        if (!room) return;

        try {
            startLoading();
            await mockApi.consumePP({
                roomId: room.id,
                currentUser,
                ppCost
            });
            await updateRoom();
            endLoading();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'PP消費に失敗しました';
            setErrorAndEndLoading(errorMessage);
            console.error('PP消費エラー:', err);
        }
    };

    return {
        handleStartTurn,
        handleEndTurn,
        handleForceEndOpponentTurn,
        handleConsumePP
    };
}

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom, useSetAtom } from 'jotai';
import { mockApi } from '../../../../../lib/mockApi';
import {
    currentRoomAtom,
    loadingAtom,
    errorAtom,
    currentUserAtom,
    startLoadingAtom,
    endLoadingAtom,
    setErrorAndEndLoadingAtom,
    setRoomAtom
} from '../../../../../lib/atoms';

export function useRoomData() {
    const params = useParams();
    const router = useRouter();
    const rawRoomId = params?.roomId as string;
    const status = params?.status as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';

    // 読み取り専用のstate
    const [room] = useAtom(currentRoomAtom);
    const [loading] = useAtom(loadingAtom);
    const [error] = useAtom(errorAtom);
    const [currentUser] = useAtom(currentUserAtom);

    // アクション関数
    const startLoading = useSetAtom(startLoadingAtom);
    const endLoading = useSetAtom(endLoadingAtom);
    const setErrorAndEndLoading = useSetAtom(setErrorAndEndLoadingAtom);
    const setRoom = useSetAtom(setRoomAtom);
    const clearError = useSetAtom(errorAtom);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                startLoading();
                const roomData = await mockApi.getRoom({ roomId });
                setRoom(roomData);
                if (roomData && roomData.status !== status) {
                    router.replace(`/room/${encodeURIComponent(roomId)}/${roomData.status}`);
                }
                endLoading();
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '部屋の取得に失敗しました';
                setErrorAndEndLoading(errorMessage);
                setRoom(null);
            }
        };

        if (roomId && status) {
            fetchRoom();
            const interval = setInterval(fetchRoom, 2000);
            return () => clearInterval(interval);
        }
    }, [roomId, status, router, startLoading, endLoading, setErrorAndEndLoading, setRoom]);

    return {
        room,
        loading,
        error,
        currentUser,
        clearError: () => clearError(null)
    };
}

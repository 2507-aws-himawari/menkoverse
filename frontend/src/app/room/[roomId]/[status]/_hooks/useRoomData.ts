import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { useRoom } from './useRoom';
import { currentUserAtom, errorAtom, } from '@/lib/atoms';

export function useRoomData() {
    const params = useParams();
    const router = useRouter();
    const rawRoomId = params?.roomId as string;
    const status = params?.status as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';

    // room情報を取得
    const { room, isLoading, error: roomError } = useRoom(roomId || null);

    const [currentUser] = useAtom(currentUserAtom);
    const [, setError] = useAtom(errorAtom);

    useEffect(() => {
        if (room && room.status !== status) {
            const newUrl = `/room/${encodeURIComponent(roomId)}/${room.status}`;
            router.replace(newUrl);
        }
    }, [room, status, roomId, router]);

    useEffect(() => {
        if (roomError) {
            setError(roomError.message);
        }
    }, [roomError, setError]);

    return {
        room,
        loading: isLoading,
        error: roomError?.message || null,
        currentUser,
        clearError: () => setError(null)
    };
}

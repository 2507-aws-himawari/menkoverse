import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { useRoomSWR } from './useRoomSWR';
import { currentUserAtom, errorAtom, } from '@/lib/atoms';

export function useRoomData() {
    const params = useParams();
    const router = useRouter();
    const rawRoomId = params?.roomId as string;
    const status = params?.status as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';

    // room情報を取得
    const { room, isLoading, error: roomError } = useRoomSWR(roomId || null);

    const [currentUser] = useAtom(currentUserAtom);
    const [, setError] = useAtom(errorAtom);

    if (room && room.status !== status) {
        const newUrl = `/room/${encodeURIComponent(roomId)}/${room.status}`;
        router.replace(newUrl);
    }

    // エラーハンドリング
    if (roomError) {
        setError(roomError.message);
    }

    return {
        room,
        loading: isLoading,
        error: roomError?.message || null,
        currentUser,
        clearError: () => setError(null)
    };
}

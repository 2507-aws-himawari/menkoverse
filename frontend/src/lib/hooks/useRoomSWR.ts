import useSWR from 'swr';
import { mockApi } from '@/lib/mockApi';
import type { MockRoom } from '@/lib/types';

export function useRoomSWR(roomId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<MockRoom | null, Error>(
        roomId ? `/api/rooms/${roomId}` : null,
        () => roomId ? mockApi.getRoom({ roomId }) : null,
        {
            refreshInterval: 2000,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 1000,
        }
    );

    return {
        room: data,
        isLoading,
        error,
        mutate,
    };
}

import useSWR from 'swr';
import { mockApi } from '@/lib/mockApi';
import type { MockRoom } from '@/lib/types';

/**
 * 特定の部屋の情報を取得するSWRカスタムフック
 */
export function useRoomSWR(roomId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<MockRoom | null, Error>(
        roomId ? `/api/rooms/${roomId}` : null,
        () => roomId ? mockApi.getRoom({ roomId }) : null,
        {
            refreshInterval: 2000, // 2秒間隔で更新（既存と同じ）
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

import useSWR from 'swr';
import { mockApi } from '@/lib/mockApi';
import type { MockRoom } from '@/lib/types';


//部屋一覧を取得するSWR
export function useRooms() {
    const { data, error, isLoading, mutate } = useSWR<MockRoom[], Error>(
        '/api/rooms',
        () => mockApi.getRooms(),
        {
            refreshInterval: 5000,
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 2000,
        }
    );

    return {
        rooms: data || [],
        isLoading,
        error,
        mutate,
    };
}

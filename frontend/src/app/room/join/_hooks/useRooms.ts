import useSWR from 'swr';
import type { MockRoom } from '@/lib/types';

// APIエンドポイントから部屋一覧を取得するfetcher関数
const fetcher = async (url: string): Promise<MockRoom[]> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('部屋一覧の取得に失敗しました');
    }
    return response.json();
};

//部屋一覧を取得するSWR
export function useRooms() {
    const { data, error, isLoading, mutate } = useSWR<MockRoom[], Error>(
        '/api/rooms',
        fetcher,
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

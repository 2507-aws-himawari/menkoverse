import useSWR from 'swr';
import type { MockRoom } from '@/lib/types';

// APIエンドポイントから部屋情報を取得するfetcher関数
const fetcher = async (url: string): Promise<MockRoom | null> => {
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error('部屋情報の取得に失敗しました');
    }
    return response.json();
};

//特定の部屋の情報を取得するSWR
export function useRoom(roomId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<MockRoom | null, Error>(
        roomId ? `/api/rooms/${roomId}` : null,
        fetcher,
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

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
            refreshInterval: 15000, // 15秒に延長
            revalidateOnFocus: false, // フォーカス時の再検証を無効化
            revalidateOnReconnect: true,
            dedupingInterval: 5000, // 重複リクエスト防止を5秒に延長
        }
    );

    return {
        rooms: data || [],
        isLoading,
        error,
        mutate,
    };
}

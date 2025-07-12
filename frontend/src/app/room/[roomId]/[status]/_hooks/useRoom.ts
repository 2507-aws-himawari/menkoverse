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

//特定の部屋の情報を取得する
export function useRoom(roomId: string | null) {
    const { data, error, isLoading, mutate } = useSWR<MockRoom | null, Error>(
        roomId ? `/api/rooms/${roomId}` : null,
        fetcher,
        {
            refreshInterval: 30000, // 30秒に延長（WebSocket通知があるため）
            revalidateOnFocus: false, // フォーカス時の再検証を無効化
            revalidateOnReconnect: true,
            dedupingInterval: 5000, // 重複リクエスト防止を5秒に延長
        }
    );

    return {
        room: data,
        isLoading,
        error,
        mutate,
    };
}

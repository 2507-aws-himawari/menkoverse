import useSWR from 'swr';
import { mockApi } from '@/lib/mockApi';
import type { MockRoom } from '@/lib/types';

/**
 * 部屋一覧を取得するSWRカスタムフック
 */
export function useRoomsSWR() {
    const { data, error, isLoading, mutate } = useSWR<MockRoom[], Error>(
        '/api/rooms',
        () => mockApi.getRooms(),
        {
            refreshInterval: 5000, // 5秒間隔で更新（部屋一覧は頻繁に変更されないため）
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

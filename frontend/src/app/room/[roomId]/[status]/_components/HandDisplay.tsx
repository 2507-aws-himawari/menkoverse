'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mockApi';
import { getFollowerById } from '@/lib/mockData';
import type { MockUser, MockRoom, MockHand } from '@/lib/types';

interface HandDisplayProps {
    room: MockRoom;
    currentUser: MockUser;
}

export function HandDisplay({ room, currentUser }: HandDisplayProps) {
    const [hand, setHand] = useState<MockHand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 手札を取得
    const loadHand = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const handCards = await mockApi.getHand({
                roomId: room.id,
                currentUser
            });
            setHand(handCards);
        } catch (err) {
            setError(err instanceof Error ? err.message : '手札の取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHand();

        // 定期的に手札を更新
        const interval = setInterval(() => {
            loadHand();
        }, 1000);

        // ターン開始イベントリスナーを追加
        const handleTurnStart = () => {
            loadHand();
        };

        window.addEventListener('turnStarted', handleTurnStart);

        return () => {
            clearInterval(interval);
            window.removeEventListener('turnStarted', handleTurnStart);
        };
    }, [room.id, currentUser.id]);

    if (isLoading) {
        return <div>手札を読み込み中...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>手札の取得に失敗しました: {error}</div>;
    }

    return (
        <div style={{
            border: '1px solid #ccc',
            padding: '10px',
            margin: '10px 0',
            borderRadius: '5px'
        }}>
            <h4>手札 ({hand.length}枚)</h4>

            {hand.length === 0 ? (
                <p>手札にカードがありません</p>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {hand.map((card) => {
                        const follower = getFollowerById(card.cardId);
                        return (
                            <div
                                key={card.id}
                                style={{
                                    border: '1px solid #666',
                                    borderRadius: '5px',
                                    padding: '8px',
                                    minWidth: '100px',
                                    backgroundColor: '#f9f9f9'
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>
                                    {follower ? follower.name : `カード ${card.cardId}`}
                                </div>
                                <div>コスト: {card.cost}</div>
                                <div>攻撃: {card.attack}</div>
                                <div>体力: {card.hp}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

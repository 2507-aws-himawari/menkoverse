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
    const [isDrawing, setIsDrawing] = useState(false);

    // 手札を取得
    const loadHand = async () => {
        try {
            setIsLoading(true);
            setError(null);
            console.log(`★ HandDisplay: Loading hand for user ${currentUser.name} in room ${room.id}`);
            const handCards = await mockApi.getHand({
                roomId: room.id,
                currentUser
            });
            console.log(`★ HandDisplay: Received ${handCards.length} cards:`, handCards);
            setHand(handCards);
        } catch (err) {
            setError(err instanceof Error ? err.message : '手札の取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHand();

        // 定期的に手札を更新（デバッグ用）
        const interval = setInterval(() => {
            loadHand();
        }, 500); // 0.5秒ごとに更新（ターン開始時の即座の反映のため）

        // ターン開始イベントリスナーを追加
        const handleTurnStart = () => {
            console.log('★ HandDisplay: Received turn start event, reloading hand');
            loadHand();
        };

        window.addEventListener('turnStarted', handleTurnStart);

        return () => {
            clearInterval(interval);
            window.removeEventListener('turnStarted', handleTurnStart);
        };
    }, [room.id, currentUser.id]);

    // デバッグ用: 手動でドロー
    const handleDrawCards = async () => {
        setIsDrawing(true);
        try {
            console.log(`★ HandDisplay: Manual draw for user ${currentUser.name} in room ${room.id}`);
            await mockApi.drawCards({
                roomId: room.id,
                currentUser,
                count: 1
            });
            // 手札を再取得
            await loadHand();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'ドローに失敗しました');
        } finally {
            setIsDrawing(false);
        }
    };

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

            {/* 手札リロードボタン */}
            <button
                onClick={loadHand}
                disabled={isLoading}
                style={{
                    marginRight: '10px',
                    marginBottom: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
            >
                {isLoading ? '更新中...' : '手札を更新'}
            </button>

            {/* デバッグ用ドローボタン */}
            <button
                onClick={handleDrawCards}
                disabled={isDrawing}
                style={{
                    marginBottom: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: isDrawing ? 'not-allowed' : 'pointer'
                }}
            >
                {isDrawing ? 'ドロー中...' : 'カードをドロー (デバッグ)'}
            </button>

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

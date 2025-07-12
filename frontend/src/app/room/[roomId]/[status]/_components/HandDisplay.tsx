'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mockApi';
import { getFollowerById, getPlayerByUserIdAndRoomId, getPlayersByRoomId } from '@/lib/mockData';
import { getActivePlayer } from '@/lib/gameLogic';
import type { MockUser, MockRoom, MockHand } from '@/lib/types';

interface HandDisplayProps {
    room: MockRoom;
    currentUser: MockUser;
    onSummonFollower?: (handCardId: string) => Promise<void>;
}

export function HandDisplay({ room, currentUser, onSummonFollower }: HandDisplayProps) {
    const [hand, setHand] = useState<MockHand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [summoning, setSummoning] = useState<string | null>(null);

    // 現在のプレイヤー情報を取得
    const currentPlayer = getPlayerByUserIdAndRoomId(currentUser.id, room.id);
    const activePlayer = getActivePlayer(room);
    const isActiveUser = activePlayer?.userId === currentUser.id;

    // フォロワー召喚処理
    const handleSummon = async (handCardId: string) => {
        if (!onSummonFollower) return;

        try {
            setSummoning(handCardId);
            await onSummonFollower(handCardId);
            await loadHand(); // 手札を再読み込み
        } catch (error) {
            console.error('Summon failed:', error);
            setError(error instanceof Error ? error.message : '召喚に失敗しました');
        } finally {
            setSummoning(null);
        }
    };

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

        const interval = setInterval(() => {
            loadHand();
        }, 5000);

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
                        const canSummon = isActiveUser && currentPlayer && currentPlayer.pp >= card.cost;
                        const isSummoning = summoning === card.id;

                        return (
                            <div
                                key={card.id}
                                style={{
                                    border: '1px solid #666',
                                    borderRadius: '5px',
                                    padding: '8px',
                                    minWidth: '100px',
                                    backgroundColor: canSummon ? '#f0f8ff' : '#f9f9f9',
                                    opacity: canSummon ? 1 : 0.7
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>
                                    {follower ? follower.name : `カード ${card.cardId}`}
                                </div>
                                <div>コスト: {card.cost}</div>
                                <div>攻撃: {card.attack}</div>
                                <div>体力: {card.hp}</div>

                                {onSummonFollower && isActiveUser && (
                                    <button
                                        onClick={() => handleSummon(card.id)}
                                        disabled={!canSummon || isSummoning}
                                        style={{
                                            marginTop: '8px',
                                            width: '100%',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            backgroundColor: canSummon ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: canSummon ? 'pointer' : 'not-allowed',
                                            opacity: isSummoning ? 0.6 : 1
                                        }}
                                    >
                                        {isSummoning ? '召喚中...' :
                                            !canSummon ? `PP不足(${card.cost})` : '召喚'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

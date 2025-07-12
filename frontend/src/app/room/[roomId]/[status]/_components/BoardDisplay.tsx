'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mockApi';
import { getPlayersByRoomId, getFollowerById } from '@/lib/mockData';
import type { MockRoom, MockUser, MockBoardCard } from '@/lib/types';

interface BoardDisplayProps {
    room: MockRoom;
    currentUser: MockUser;
    refreshTrigger?: number; // ボードを強制的に更新するためのトリガー
}

export function BoardDisplay({ room, currentUser, refreshTrigger }: BoardDisplayProps) {
    const [boards, setBoards] = useState<{ [playerId: string]: MockBoardCard[] }>({});
    const [loading, setLoading] = useState(true);

    const roomPlayers = getPlayersByRoomId(room.id);

    // ボードデータを取得
    useEffect(() => {
        const loadBoards = async () => {
            try {
                setLoading(true);
                const boardData: { [playerId: string]: MockBoardCard[] } = {};

                for (const player of roomPlayers) {
                    const playerBoard = await mockApi.getBoard({ roomPlayerId: player.id });
                    boardData[player.id] = playerBoard || [];
                }

                setBoards(boardData);
            } catch (error) {
                console.error('Failed to load boards:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBoards();
    }, [room.id, refreshTrigger]); // refreshTriggerを依存配列に追加

    if (loading) {
        return <div>ボードを読み込み中...</div>;
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <h3>バトルフィールド</h3>

            {roomPlayers.map((player) => {
                const playerBoard = boards[player.id] || [];
                const isCurrentPlayer = player.userId === currentUser.id;

                return (
                    <div key={player.id} style={{
                        marginBottom: '20px',
                        border: isCurrentPlayer ? '2px solid #007bff' : '1px solid #ccc',
                        padding: '15px',
                        borderRadius: '8px',
                        backgroundColor: isCurrentPlayer ? '#f8f9fa' : '#ffffff'
                    }}>
                        <h4>{isCurrentPlayer ? 'あなたのボード' : '相手のボード'}</h4>

                        {playerBoard.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>
                                フォロワーはいません
                            </p>
                        ) : (
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap',
                                minHeight: '120px',
                                alignItems: 'center'
                            }}>
                                {playerBoard
                                    .sort((a, b) => a.position - b.position)
                                    .map((boardCard) => {
                                        const follower = getFollowerById(boardCard.cardId);
                                        if (!follower) return null;

                                        return (
                                            <div
                                                key={boardCard.id}
                                                style={{
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    padding: '10px',
                                                    backgroundColor: '#fff',
                                                    minWidth: '120px',
                                                    textAlign: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                                    {follower.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    コスト: {boardCard.cost}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginTop: '8px',
                                                    fontSize: '14px'
                                                }}>
                                                    <span style={{ color: '#d32f2f' }}>
                                                        攻撃: {boardCard.attack}
                                                    </span>
                                                    <span style={{ color: '#388e3c' }}>
                                                        HP: {boardCard.hp}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

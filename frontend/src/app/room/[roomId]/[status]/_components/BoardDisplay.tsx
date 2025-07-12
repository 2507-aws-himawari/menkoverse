'use client';

import { useState, useEffect } from 'react';
import { mockApi } from '@/lib/mockApi';
import { getPlayersByRoomId, getFollowerById } from '@/lib/mockData';
import { getActivePlayer } from '@/lib/gameLogic';
import type { MockRoom, MockUser, MockBoardCard } from '@/lib/types';

interface BoardDisplayProps {
    room: MockRoom;
    currentUser: MockUser;
    refreshTrigger?: number;
    onAttackWithFollower?: (
        attackerBoardCardId: string,
        targetType: 'follower' | 'player',
        targetId: string
    ) => Promise<void>;
}

export function BoardDisplay({ room, currentUser, refreshTrigger, onAttackWithFollower }: BoardDisplayProps) {
    const [boards, setBoards] = useState<{ [playerId: string]: MockBoardCard[] }>({});
    const [loading, setLoading] = useState(true);
    const [attackingFollowerId, setAttackingFollowerId] = useState<string | null>(null);
    const [selectingTarget, setSelectingTarget] = useState(false);

    const roomPlayers = getPlayersByRoomId(room.id);
    const activePlayer = getActivePlayer(room);
    const isActiveUser = activePlayer?.userId === currentUser.id;

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
    }, [room.id, refreshTrigger]);

    // 攻撃処理関数
    const handleStartAttack = (attackerCardId: string) => {
        setAttackingFollowerId(attackerCardId);
        setSelectingTarget(true);
    };

    const handleCancelAttack = () => {
        setAttackingFollowerId(null);
        setSelectingTarget(false);
    };

    const handleAttackTarget = async (targetType: 'follower' | 'player', targetId: string) => {
        if (!attackingFollowerId || !onAttackWithFollower) return;

        try {
            await onAttackWithFollower(attackingFollowerId, targetType, targetId);
            handleCancelAttack();
        } catch (error) {
            console.error('Attack failed:', error);
            handleCancelAttack();
        }
    };

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

                                        const canAttack = isCurrentPlayer && isActiveUser && boardCard.canAttack;
                                        const isAttacking = attackingFollowerId === boardCard.id;
                                        const isTargetable = selectingTarget && !isCurrentPlayer;

                                        return (
                                            <div
                                                key={boardCard.id}
                                                style={{
                                                    border: isAttacking ? '3px solid #ff9800' : isTargetable ? '2px solid #f44336' : '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    padding: '10px',
                                                    backgroundColor: isTargetable ? '#ffebee' : '#fff',
                                                    minWidth: '120px',
                                                    textAlign: 'center',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    cursor: isTargetable ? 'pointer' : 'default'
                                                }}
                                                onClick={() => {
                                                    if (isTargetable) {
                                                        handleAttackTarget('follower', boardCard.id);
                                                    }
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

                                                {/* 攻撃可能状態の表示 */}
                                                {canAttack && !selectingTarget && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <button
                                                            onClick={() => handleStartAttack(boardCard.id)}
                                                            style={{
                                                                backgroundColor: '#4caf50',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            攻撃
                                                        </button>
                                                    </div>
                                                )}

                                                {/* 攻撃中の表示 */}
                                                {isAttacking && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <div style={{ fontSize: '12px', color: '#ff9800', marginBottom: '4px' }}>
                                                            ターゲットを選択
                                                        </div>
                                                        <button
                                                            onClick={handleCancelAttack}
                                                            style={{
                                                                backgroundColor: '#f44336',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                fontSize: '12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            キャンセル
                                                        </button>
                                                    </div>
                                                )}

                                                {/* 攻撃不可能状態の表示 */}
                                                {isCurrentPlayer && isActiveUser && !boardCard.canAttack && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        fontSize: '10px',
                                                        color: '#999'
                                                    }}>
                                                        攻撃済み
                                                    </div>
                                                )}

                                                {/* ターゲット可能状態の表示 */}
                                                {isTargetable && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        fontSize: '12px',
                                                        color: '#f44336',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        クリックして攻撃
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 攻撃対象選択時の追加UI */}
            {selectingTarget && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#fff3e0',
                    border: '2px solid #ff9800',
                    borderRadius: '8px'
                }}>
                    <h4 style={{ color: '#e65100', marginBottom: '10px' }}>
                        攻撃対象を選択してください
                    </h4>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {roomPlayers
                            .filter(player => player.userId !== currentUser.id)
                            .map((player) => (
                                <button
                                    key={`player-${player.id}`}
                                    onClick={() => handleAttackTarget('player', player.userId)}
                                    style={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '10px 15px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    相手プレイヤーを攻撃 (HP: {player.hp})
                                </button>
                            ))}
                        <button
                            onClick={handleCancelAttack}
                            style={{
                                backgroundColor: '#9e9e9e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 15px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            キャンセル
                        </button>
                    </div>
                    <p style={{
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#666'
                    }}>
                        相手のフォロワーをクリックするか、上のボタンで相手プレイヤーを直接攻撃できます。
                    </p>
                </div>
            )}
        </div>
    );
}

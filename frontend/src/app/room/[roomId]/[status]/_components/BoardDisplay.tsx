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
                const currentRoomPlayers = getPlayersByRoomId(room.id);

                for (const player of currentRoomPlayers) {
                    const board = await mockApi.getBoard({ roomPlayerId: player.id });
                    boardData[player.id] = board;
                }

                setBoards(boardData);
            } catch (error) {
                console.error('ボードデータの取得に失敗しました:', error);
            } finally {
                setLoading(false);
            }
        };

        loadBoards();
    }, [room.id, refreshTrigger]);

    // 攻撃処理
    const handleAttackClick = (attackerBoardCardId: string) => {
        setAttackingFollowerId(attackerBoardCardId);
        setSelectingTarget(true);
    };

    const handleTargetSelect = async (targetType: 'follower' | 'player', targetId: string) => {
        if (!attackingFollowerId || !onAttackWithFollower) return;

        try {
            await onAttackWithFollower(attackingFollowerId, targetType, targetId);
            setAttackingFollowerId(null);
            setSelectingTarget(false);
        } catch (error) {
            console.error('攻撃に失敗しました:', error);
        }
    };

    const handleCancelAttack = () => {
        setAttackingFollowerId(null);
        setSelectingTarget(false);
    };

    if (loading) {
        return <div>ボード情報を読み込み中...</div>;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            minHeight: '300px'
        }}>
            {roomPlayers.map((player) => {
                const playerBoard = boards[player.id] || [];
                const isCurrentPlayer = player.userId === currentUser.id;

                return (
                    <div key={player.id} style={{
                        border: isCurrentPlayer ? '2px solid #4CAF50' : '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '15px',
                        backgroundColor: isCurrentPlayer ? '#f9fff9' : '#f5f5f5'
                    }}>
                        <h4 style={{
                            margin: '0 0 10px 0',
                            color: isCurrentPlayer ? '#4CAF50' : '#333'
                        }}>
                            {isCurrentPlayer ? 'あなた' : '相手'} のボード
                            {activePlayer?.userId === player.userId && (
                                <span style={{ marginLeft: '10px', color: '#ff9800' }}>
                                    (アクティブ)
                                </span>
                            )}
                        </h4>

                        {selectingTarget && !isCurrentPlayer && (
                            <div style={{
                                padding: '10px',
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '4px',
                                marginBottom: '10px',
                                fontSize: '14px',
                                color: '#856404'
                            }}>
                                攻撃対象を選択してください。プレイヤーを攻撃するには下のボタンをクリック
                                <button
                                    onClick={() => handleTargetSelect('player', player.userId)}
                                    style={{
                                        marginLeft: '10px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    プレイヤーを攻撃
                                </button>
                            </div>
                        )}

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

                                        const canAttack = isCurrentPlayer && isActiveUser &&
                                            boardCard.summonedTurn !== activePlayer?.turn &&
                                            !boardCard.hasAttackedThisTurn;
                                        const isAttacking = attackingFollowerId === boardCard.id;
                                        const isTargetable = selectingTarget && !isCurrentPlayer;

                                        return (
                                            <div
                                                key={boardCard.id}
                                                style={{
                                                    border: isAttacking ? '3px solid #ff9800' :
                                                        isTargetable ? '2px solid #4CAF50' :
                                                            '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    padding: '10px',
                                                    backgroundColor: isAttacking ? '#fff3e0' :
                                                        isTargetable ? '#f1f8e9' : 'white',
                                                    minWidth: '120px',
                                                    textAlign: 'center',
                                                    cursor: isTargetable ? 'pointer' : 'default',
                                                    boxShadow: isAttacking || isTargetable ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                                                }}
                                                onClick={() => {
                                                    if (isTargetable) {
                                                        handleTargetSelect('follower', boardCard.id);
                                                    }
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: 'bold',
                                                    marginBottom: '5px'
                                                }}>
                                                    {follower.name}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#666',
                                                    marginBottom: '5px'
                                                }}>
                                                    コスト: {boardCard.cost}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    <span style={{ color: '#f44336' }}>
                                                        攻撃: {boardCard.attack}
                                                    </span>
                                                    <span style={{ color: '#4CAF50' }}>
                                                        HP: {boardCard.hp}
                                                    </span>
                                                </div>
                                                {/* 攻撃ボタン */}
                                                {canAttack && !selectingTarget && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <button
                                                            onClick={() => handleAttackClick(boardCard.id)}
                                                            style={{
                                                                backgroundColor: '#ff9800',
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
                                                        <div style={{
                                                            fontSize: '12px',
                                                            color: '#ff9800',
                                                            marginBottom: '4px'
                                                        }}>
                                                            攻撃中...
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
                                                {isCurrentPlayer && isActiveUser && (
                                                    boardCard.summonedTurn === activePlayer?.turn ||
                                                    boardCard.hasAttackedThisTurn
                                                ) && (
                                                        <div style={{
                                                            marginTop: '8px',
                                                            fontSize: '10px',
                                                            color: '#999'
                                                        }}>
                                                            {boardCard.summonedTurn === activePlayer?.turn ? '召喚酔い' : '攻撃済み'}
                                                        </div>
                                                    )}
                                                {/* ターゲット選択中の表示 */}
                                                {isTargetable && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        fontSize: '10px',
                                                        color: '#4CAF50'
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
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAtom } from 'jotai';
import { mockApi } from '../../../../lib/mockApi';
import { getUserById } from '../../../../lib/gameLogic';
import { GAME_CONSTANTS } from '../../../../lib/constants';
import { getActivePlayer, isFirstPlayer, calculatePPMax, calculatePlayerTurn } from '../../../../lib/gameLogic';
import { mockUsers } from '../../../../lib/mockData';
import { currentRoomAtom, loadingAtom, errorAtom, currentUserAtom } from '../../../../lib/atoms';
import type { MockRoomPlayer } from '../../../../lib/types';

export default function RoomStatusPage() {
    const params = useParams();
    const router = useRouter();
    const rawRoomId = params?.roomId as string;
    const status = params?.status as string;
    const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : '';
    const [room, setRoom] = useAtom(currentRoomAtom);
    const [loading, setLoading] = useAtom(loadingAtom);
    const [error, setError] = useAtom(errorAtom);
    const [currentUser] = useAtom(currentUserAtom);

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                setLoading(true);
                setError(null);
                const roomData = await mockApi.getRoom({ roomId });
                setRoom(roomData);
                if (roomData && roomData.status !== status) {
                    router.replace(`/room/${encodeURIComponent(roomId)}/${roomData.status}`);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : '部屋の取得に失敗しました');
                setRoom(null);
            } finally {
                setLoading(false);
            }
        };

        if (roomId && status) {
            fetchRoom();
            const interval = setInterval(fetchRoom, 2000);
            return () => clearInterval(interval);
        }
    }, [roomId, status, router, setRoom, setLoading, setError]);

    const handleStartTurn = async () => {
        if (!room) return;

        try {
            setLoading(true);
            setError(null);
            await mockApi.startTurn({
                roomId: room.id,
                currentUser
            });
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            if (updatedRoom) {
                setRoom(updatedRoom);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ターン開始に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleEndTurn = async () => {
        if (!room) return;

        try {
            setLoading(true);
            setError(null);
            await mockApi.endTurn({
                roomId: room.id,
                currentUser
            });

            // ターン終了が成功した場合のみ部屋情報を再取得
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            if (updatedRoom) {
                setRoom(updatedRoom);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'ターン終了に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleForceEndOpponentTurn = async () => {
        if (!room) return;

        try {
            setLoading(true);
            setError(null);
            await mockApi.forceEndOpponentTurn({
                roomId: room.id,
                currentUser
            });

            // 相手ターン終了が成功した場合のみ部屋情報を再取得
            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            if (updatedRoom) {
                setRoom(updatedRoom);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '相手ターン終了に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleConsumePP = async (ppCost: number) => {
        if (!room) return;

        try {
            setLoading(true);
            setError(null); // エラーをクリア
            await mockApi.consumePP({
                roomId: room.id,
                currentUser,
                ppCost
            });

            const updatedRoom = await mockApi.getRoom({ roomId: room.id });
            if (updatedRoom) {
                setRoom(updatedRoom);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'PP消費に失敗しました';
            setError(errorMessage);
            console.error('PP消費エラー:', err);
        } finally {
            setLoading(false);
        }
    };

    if (error && !room) {
        return (
            <div>
                <div>
                    <h1>エラーが発生しました</h1>
                    <p>{error}</p>
                    <button onClick={() => {
                        setError(null);
                        window.location.reload();
                    }}>
                        再読み込み
                    </button>
                </div>
            </div>
        );
    }

    if (loading && !room) {
        return (
            <div>
                <div>ロード中...</div>
            </div>
        );
    }

    if (!room) {
        return (
            <div>
                <div>部屋が見つかりません</div>
            </div>
        );
    }
    if (room.status !== status) {
        return (
            <div>
                <div>リダイレクト中...</div>
            </div>
        );
    }
    return (
        <div>
            <div>
                <div>
                    {/* エラー表示 */}
                    {error && (
                        <div style={{
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            border: '1px solid #e57373'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>エラー: {error}</span>
                                <button
                                    onClick={() => setError(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#c62828',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        padding: '0 4px'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <h1>ゲームルーム</h1>
                        <p>あいことば: {room.id}</p>
                        <p>ステータス: {
                            room.status === 'waiting' ? '待機中' :
                                room.status === 'playing' ? 'プレイ中' :
                                    room.status === 'finish' ? '終了' : room.status
                        }</p>
                    </div>

                    <div>
                        {room.players.map((player: MockRoomPlayer, index: number) => {
                            const user = getUserById(player.userId, mockUsers);
                            if (!user) return null;

                            const activePlayer = getActivePlayer(room);
                            const isActivePlayer = activePlayer?.userId === player.userId;
                            const playerPosition = index === 0 ? '先攻' : '後攻';

                            return (
                                <div key={player.id}>
                                    <div>
                                        <div>
                                            <span>
                                                {user.name.charAt(0)}
                                            </span>
                                        </div>
                                        <h3>
                                            {user.name}
                                            {room.status === 'playing' && (
                                                <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                                                    ({playerPosition})
                                                    {isActivePlayer && <span style={{ color: 'green' }}> 【アクティブ】</span>}
                                                </span>
                                            )}
                                        </h3>
                                        {player.userId === room.ownerId && (
                                            <span>
                                                ホスト
                                            </span>
                                        )}                        <div>
                                            <p>HP: {player.hp}/{GAME_CONSTANTS.MAX_HP}</p>
                                            <p>PP: {player.pp}/{calculatePPMax(player.turn)}</p>
                                            <p>ターン: {player.turn}</p>
                                        </div>
                                        <p>
                                            {room.status === 'waiting' ? '待機中...' :
                                                room.status === 'playing' ? 'プレイ中' :
                                                    room.status === 'finish' ? 'ゲーム終了' : '状態不明'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {room.players.length < 2 && (
                            <div>
                                <div>
                                    <div></div>
                                    <p>プレイヤーを待機中...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {room.status === 'waiting' && (
                        <div>
                            <h2>
                                プレイヤー待機中
                            </h2>
                            <div>
                                <p>
                                    参加者: {room.players.length}/2
                                </p>
                                {room.players.length < 2 && (
                                    <p>もう1人のプレイヤーを待っています...</p>
                                )}
                            </div>
                        </div>
                    )}

                    {room.status === 'playing' && (
                        <div>
                            <h2>
                                ゲーム進行中
                            </h2>
                            <div>
                                <p>
                                    参加者: {room.players.length}/2
                                </p>

                                {/* 現在のターン情報 */}
                                {(() => {
                                    const activePlayer = getActivePlayer(room);
                                    const activeUser = activePlayer ? getUserById(activePlayer.userId, mockUsers) : null;
                                    return activeUser && (
                                        <p style={{ fontWeight: 'bold', color: 'blue' }}>
                                            現在のターン: {activeUser.name}
                                        </p>
                                    );
                                })()}

                                {/* アクティブプレイヤーのみに表示されるボタン */}
                                {(() => {
                                    const activePlayer = getActivePlayer(room);
                                    return activePlayer?.userId === currentUser.id && (
                                        <div style={{ marginTop: '16px' }}>
                                            <h3>あなたのターンです</h3>

                                            {/* PP消費デモボタン */}
                                            <div style={{ marginBottom: '12px' }}>
                                                <h4>アクション（PP消費）</h4>
                                                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>
                                                    ターン{(() => {
                                                        const currentPlayer = room.players.find((p: MockRoomPlayer) => p.userId === currentUser.id);
                                                        return currentPlayer?.turn || 1;
                                                    })()}のPP上限: {(() => {
                                                        const currentPlayer = room.players.find((p: MockRoomPlayer) => p.userId === currentUser.id);
                                                        return calculatePPMax(currentPlayer?.turn || 1);
                                                    })()}
                                                </p>
                                                {(() => {
                                                    const currentPlayer = room.players.find((p: MockRoomPlayer) => p.userId === currentUser.id);
                                                    const currentPP = currentPlayer?.pp || 0;

                                                    return (
                                                        <>
                                                            {currentPP === 0 && (
                                                                <p style={{
                                                                    fontSize: '14px',
                                                                    color: '#ff6b6b',
                                                                    margin: '0 0 8px 0',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    PPが0になりました。「ターン終了」ボタンを押してください。
                                                                </p>
                                                            )}
                                                            <button
                                                                onClick={() => handleConsumePP(1)}
                                                                disabled={loading || currentPP < 1}
                                                                style={{
                                                                    marginRight: '8px',
                                                                    opacity: currentPP < 1 ? 0.5 : 1
                                                                }}
                                                            >
                                                                PP-1消費 {currentPP < 1 && '(不足)'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleConsumePP(2)}
                                                                disabled={loading || currentPP < 2}
                                                                style={{
                                                                    marginRight: '8px',
                                                                    opacity: currentPP < 2 ? 0.5 : 1
                                                                }}
                                                            >
                                                                PP-2消費 {currentPP < 2 && '(不足)'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleConsumePP(3)}
                                                                disabled={loading || currentPP < 3}
                                                                style={{
                                                                    opacity: currentPP < 3 ? 0.5 : 1
                                                                }}
                                                            >
                                                                PP-3消費 {currentPP < 3 && '(不足)'}
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* ターン終了ボタン */}
                                            <button
                                                onClick={handleEndTurn}
                                                disabled={loading}
                                                style={{
                                                    backgroundColor: (() => {
                                                        const currentPlayer = room.players.find((p: MockRoomPlayer) => p.userId === currentUser.id);
                                                        const currentPP = currentPlayer?.pp || 0;
                                                        return currentPP === 0 ? '#ff4444' : 'red';
                                                    })(),
                                                    color: 'white',
                                                    padding: '8px 16px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontWeight: (() => {
                                                        const currentPlayer = room.players.find((p: MockRoomPlayer) => p.userId === currentUser.id);
                                                        const currentPP = currentPlayer?.pp || 0;
                                                        return currentPP === 0 ? 'bold' : 'normal';
                                                    })()
                                                }}
                                            >
                                                {loading ? 'ターン終了中...' : ((() => {
                                                    const currentPlayer = room.players.find((p: MockRoomPlayer) => p.userId === currentUser.id);
                                                    const currentPP = currentPlayer?.pp || 0;
                                                    return currentPP === 0 ? 'ターン終了（PP=0）' : 'ターン終了';
                                                })())}
                                            </button>
                                        </div>
                                    );
                                })()}

                                {/* 非アクティブプレイヤーへのメッセージと操作 */}
                                {(() => {
                                    const activePlayer = getActivePlayer(room);
                                    const isActiveUser = activePlayer?.userId === currentUser.id;

                                    return !isActiveUser && (
                                        <div style={{ marginTop: '16px' }}>
                                            <p>相手のターンです。待機してください。</p>
                                            <p style={{ fontSize: '12px', color: '#666' }}>
                                                デバッグ: アクティブプレイヤー = {activePlayer?.userId || 'なし'}
                                            </p>

                                            {/* デモ用：相手ターン終了ボタン */}
                                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>デモ用操作</h4>
                                                <button
                                                    onClick={handleForceEndOpponentTurn}
                                                    disabled={loading}
                                                    style={{
                                                        backgroundColor: '#orange',
                                                        color: 'white',
                                                        padding: '6px 12px',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {loading ? '相手ターン終了中...' : '相手ターンを終了（デモ用）'}
                                                </button>
                                                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#666' }}>
                                                    ※ 実際のゲームでは相手が操作します
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* デバッグ用のターン開始ボタン（残しておく） */}
                                <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '16px' }}>
                                    <button
                                        onClick={handleStartTurn}
                                        disabled={loading}
                                    >
                                        {loading ? 'ターン開始中...' : 'ターン開始（PP全回復）'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {room.status === 'finish' && (
                        <div>
                            <h2>
                                ゲーム終了
                            </h2>
                            <div>
                                <p>
                                    参加者: {room.players.length}/2
                                </p>
                                <p>ゲームが終了しました</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
